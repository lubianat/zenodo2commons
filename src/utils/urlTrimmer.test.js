import { describe, it, expect } from "vitest";
import {
  isUrlTooLong,
  truncateTables,
  truncateDescription,
  buildConstrainedUploadUrl,
  buildFullMetadata
} from "./urlTrimmer.js";

describe("urlTrimmer", () => {
  describe("isUrlTooLong", () => {
    it("returns false for short URLs", () => {
      const url = "https://commons.wikimedia.org/wiki/Special:Upload?test=short";
      expect(isUrlTooLong(url)).toBe(false);
    });

    it("returns true for very long URLs", () => {
      const url = "https://commons.wikimedia.org/wiki/Special:Upload?" + "x".repeat(5000);
      expect(isUrlTooLong(url)).toBe(true);
    });

    it("returns false for URLs near the limit", () => {
      const url = "https://commons.wikimedia.org/wiki/Special:Upload?" + "x".repeat(3900);
      expect(isUrlTooLong(url)).toBe(false);
    });
  });

  describe("truncateTables", () => {
    it("returns tables unchanged if under limit", () => {
      const tables = `{| class="wikitable"
! Header
|-
| Value
|}`;
      expect(truncateTables(tables, 1000)).toBe(tables);
    });

    it("truncates tables when they exceed the limit", () => {
      const longTables = `{| class="wikitable"\n` + 
        Array(50).fill(0).map((_, i) => `! Header ${i}\n|-\n| Value ${i}`).join('\n') + 
        '\n|}';
      
      const result = truncateTables(longTables, 200);
      expect(result.length).toBeLessThanOrEqual(300); // Allows for truncation notice
      expect(result).toContain("truncated");
    });

    it("removes entire tables from the end when multiple tables present", () => {
      const tables = `{| class="wikitable"
! Study
|-
| Value 1
|}

{| class="wikitable"
! Biosample
|-
| Value 2
|}

{| class="wikitable"
! Analysis
|-
| Value 3
|}`;
      const result = truncateTables(tables, 120);
      expect(result).toContain("Study");
      expect(result).toContain("truncated");
      expect(result).not.toContain("Analysis");
    });

    it("returns truncation notice for extremely short limits", () => {
      const tables = `{| class="wikitable"
! Header
|-
| Value
|}`;
      const result = truncateTables(tables, 10);
      expect(result).toContain("omitted");
      expect(result).toContain("See full metadata at source");
    });

    it("handles empty or null tables", () => {
      expect(truncateTables("", 100)).toBe("");
      expect(truncateTables(null, 100)).toBe(null);
      expect(truncateTables(undefined, 100)).toBe(undefined);
    });
  });

  describe("truncateDescription", () => {
    it("returns description unchanged if under limit", () => {
      const desc = "This is a short description.";
      expect(truncateDescription(desc, 1000)).toBe(desc);
    });

    it("truncates long descriptions", () => {
      const desc = "A".repeat(1000);
      const result = truncateDescription(desc, 100);
      expect(result).toContain("truncated");
      expect(result).toContain("See full description at source");
      expect(result.length).toBeLessThan(200);
    });

    it("handles empty or null descriptions", () => {
      expect(truncateDescription("", 100)).toBe("");
      expect(truncateDescription(null, 100)).toBe(null);
      expect(truncateDescription(undefined, 100)).toBe(undefined);
    });

    it("hard truncates if no good break points", () => {
      const desc = "X".repeat(1000);
      const result = truncateDescription(desc, 100);
      expect(result).toContain("...");
      expect(result.length).toBeLessThan(200);
    });
  });

  describe("buildConstrainedUploadUrl", () => {
    const baseParams = {
      title: "Test Record",
      description: "Test description",
      tables: "",
      date: "2025-01-15",
      source: "https://zenodo.org/records/12345",
      authors: "John Doe",
      recordId: "12345",
      commonsLicense: "cc-by-4.0",
      destFile: "test.png",
      fileUrl: "https://zenodo.org/records/12345/files/test.png"
    };

    it("returns URL with full content when not too long", () => {
      const result = buildConstrainedUploadUrl(baseParams);
      expect(result.url).toContain("https://commons.wikimedia.org/wiki/Special:Upload?");
      expect(result.url).toContain("wpUploadDescription");
      expect(result.url).toContain("Test+description"); // URLSearchParams uses + for spaces
      expect(result.wasTruncated).toBe(false);
      expect(isUrlTooLong(result.url)).toBe(false);
    });

    it("includes tables when URL is not too long", () => {
      const params = {
        ...baseParams,
        tables: `{| class="wikitable"
! Study
|-
| Test study
|}`
      };
      const result = buildConstrainedUploadUrl(params);
      expect(result.url).toContain("wikitable");
      expect(result.wasTruncated).toBe(false);
      expect(isUrlTooLong(result.url)).toBe(false);
    });

    it("includes notes when provided", () => {
      const params = {
        ...baseParams,
        notes: "Published as part of Example Publication, 2022"
      };
      const result = buildConstrainedUploadUrl(params);
      expect(result.url).toContain("Published+as+part+of");
      expect(result.wasTruncated).toBe(false);
      expect(isUrlTooLong(result.url)).toBe(false);
    });

    it("preserves notes when truncating tables", () => {
      const longTables = `{| class="wikitable"\n` + 
        Array(200).fill(0).map((_, i) => `! Header ${i}\n|-\n| Very long value ${i}`).join('\n') + 
        '\n|}';
      
      const params = {
        ...baseParams,
        notes: "Important note about this resource",
        tables: longTables
      };
      
      const result = buildConstrainedUploadUrl(params);
      expect(isUrlTooLong(result.url)).toBe(false);
      expect(result.wasTruncated).toBe(true);
      expect(result.url).toContain("Important+note");
    });

    it("truncates tables when URL becomes too long", () => {
      const longTables = `{| class="wikitable"\n` + 
        Array(200).fill(0).map((_, i) => `! Header ${i}\n|-\n| Very long value ${i}`).join('\n') + 
        '\n|}';
      
      const params = {
        ...baseParams,
        tables: longTables
      };
      
      const result = buildConstrainedUploadUrl(params);
      expect(isUrlTooLong(result.url)).toBe(false);
      expect(result.wasTruncated).toBe(true);
      // URL should either have truncated tables or no tables
      const hasFullTables = result.url.includes("Header 199");
      expect(hasFullTables).toBe(false);
    });

    it("removes tables entirely if truncation is not enough", () => {
      const veryLongDescription = "A".repeat(3000);
      const longTables = `{| class="wikitable"\n` + 
        Array(100).fill(0).map((_, i) => `! Header ${i}\n|-\n| Value ${i}`).join('\n') + 
        '\n|}';
      
      const params = {
        ...baseParams,
        description: veryLongDescription,
        tables: longTables
      };
      
      const result = buildConstrainedUploadUrl(params);
      expect(isUrlTooLong(result.url)).toBe(false);
      expect(result.wasTruncated).toBe(true);
    });

    it("truncates description when necessary", () => {
      const veryLongDescription = "X".repeat(5000);
      
      const params = {
        ...baseParams,
        description: veryLongDescription
      };
      
      const result = buildConstrainedUploadUrl(params);
      expect(isUrlTooLong(result.url)).toBe(false);
      expect(result.wasTruncated).toBe(true);
      expect(result.url).toContain("truncated");
    });

    it("handles extreme cases with both long description and tables", () => {
      const veryLongDescription = "Description paragraph. ".repeat(200);
      const longTables = `{| class="wikitable"\n` + 
        Array(150).fill(0).map((_, i) => `! Header ${i}\n|-\n| Value ${i}`).join('\n') + 
        '\n|}';
      
      const params = {
        ...baseParams,
        description: veryLongDescription,
        tables: longTables
      };
      
      const result = buildConstrainedUploadUrl(params);
      expect(isUrlTooLong(result.url)).toBe(false);
      expect(result.wasTruncated).toBe(true);
      // Should have some content, but truncated
      expect(result.url.length).toBeGreaterThan(500);
    });

    it("preserves essential information in all cases", () => {
      const veryLongDescription = "X".repeat(10000);
      const longTables = `{| class="wikitable"\n` + 
        Array(200).fill(0).map((_, i) => `! Header ${i}\n|-\n| Value ${i}`).join('\n') + 
        '\n|}';
      
      const params = {
        ...baseParams,
        description: veryLongDescription,
        tables: longTables
      };
      
      const result = buildConstrainedUploadUrl(params);
      
      // Essential information should still be present
      expect(result.url).toContain("wpUploadDescription");
      expect(result.url).toContain("wpLicense=cc-by-4.0");
      expect(result.url).toContain("wpDestFile=test.png");
      expect(result.url).toContain("Information");
      expect(result.url).toContain("Zenodo");
      expect(result.wasTruncated).toBe(true);
      expect(isUrlTooLong(result.url)).toBe(false);
    });

    it("handles real-world example structure", () => {
      const realWorldDesc = `NFDI4BIOIMAGE Calendar Cover 2025:
Image from the NFDI4BIOIMAGE Calendar Cover 2025.
The image is a visualization showing the integration of multimodal data including a spinning disk confocal image and gene expression data from a spatial transcriptomic experiment on a human medulloblastoma sample.`;

      const realWorldTables = `{| class="wikitable"
| '''Study'''
|-
| Study description
|-
| Comparison of spatial transcriptomics technologies for medulloblastoma cryosection
|-
| Study type
|-
| Spatial Transcriptomics (Xenium) on medulloblastoma cryosections
|-
| '''Study Component'''
|-
| Imaging method
|-
| Xenium and Spinning disk confocal microscopy
|}`;

      const params = {
        ...baseParams,
        title: "NFDI4BIOIMAGE Calendar Cover 2025",
        description: realWorldDesc,
        tables: realWorldTables
      };

      const result = buildConstrainedUploadUrl(params);
      expect(isUrlTooLong(result.url)).toBe(false);
      expect(result.url).toContain("NFDI4BIOIMAGE");
    });
  });

  describe("buildFullMetadata", () => {
    it("builds complete metadata without truncation", () => {
      const params = {
        title: "Test Record",
        description: "Test description with details",
        tables: `{| class="wikitable"
! Study
|-
| Test study
|}`,
        date: "2025-01-15",
        source: "https://zenodo.org/records/12345",
        authors: "John Doe",
        recordId: "12345"
      };

      const metadata = buildFullMetadata(params);
      expect(metadata).toContain("{{Information");
      expect(metadata).toContain("Test description with details");
      expect(metadata).toContain("wikitable");
      expect(metadata).toContain("{{Zenodo|12345}}");
      expect(metadata).toContain("[[Category:Media from Zenodo]]");
    });

    it("includes notes when provided", () => {
      const params = {
        title: "Test Record",
        description: "Test description",
        notes: "Published as part of ''Example Publication'', 2022",
        tables: "",
        date: "2025-01-15",
        source: "https://zenodo.org/records/12345",
        authors: "John Doe",
        recordId: "12345"
      };

      const metadata = buildFullMetadata(params);
      expect(metadata).toContain("Test description");
      expect(metadata).toContain("Published as part of ''Example Publication'', 2022");
    });

    it("works correctly without notes", () => {
      const params = {
        title: "Test Record",
        description: "Test description",
        notes: "",
        tables: "",
        date: "2025-01-15",
        source: "https://zenodo.org/records/12345",
        authors: "John Doe",
        recordId: "12345"
      };

      const metadata = buildFullMetadata(params);
      expect(metadata).toContain("Test description");
      expect(metadata).not.toContain("undefined");
    });

    it("includes all tables regardless of length", () => {
      const longTables = `{| class="wikitable"\n` + 
        Array(200).fill(0).map((_, i) => `! Header ${i}\n|-\n| Value ${i}`).join('\n') + 
        '\n|}';

      const params = {
        title: "Test",
        description: "Description",
        tables: longTables,
        date: "2025-01-15",
        source: "https://zenodo.org/records/12345",
        authors: "John Doe",
        recordId: "12345"
      };

      const metadata = buildFullMetadata(params);
      expect(metadata).toContain("Header 199"); // Last table header
      expect(metadata).toContain("Value 199"); // Last table value
    });
  });
});
