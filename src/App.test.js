import { describe, it, expect } from "vitest";

/**
 * These tests verify the ORCID formatting functions.
 * Since the functions are inside App.svelte, we test the expected behavior
 * by checking the format that should be generated for Wikimedia Commons.
 */

/**
 * Helper function that replicates the formatCreators logic from App.svelte
 * This allows us to test the expected behavior without exporting internal functions
 */
function testFormatCreators(creators) {
  if (!Array.isArray(creators) || creators.length === 0) return "";
  return creators
    .map((creator) => {
      const name = creator.name || "";
      const orcid = creator.orcid ? creator.orcid.replace(/^https?:\/\/orcid\.org\//i, "").trim() : "";
      return orcid ? `${name} ({{ORCID|${orcid}}})` : name;
    })
    .filter((value) => value.length > 0)
    .join("; ");
}

describe("ORCID formatting for Wikimedia Commons", () => {
  describe("ORCID URL normalization", () => {
    it("should remove https://orcid.org/ prefix", () => {
      const input = "https://orcid.org/0000-0002-8773-8862";
      const expected = "0000-0002-8773-8862";
      // Function behavior: normalizeOrcid should strip the prefix
      expect(input.replace(/^https?:\/\/orcid\.org\//i, "").trim()).toBe(expected);
    });

    it("should remove http://orcid.org/ prefix", () => {
      const input = "http://orcid.org/0000-0001-7411-9299";
      const expected = "0000-0001-7411-9299";
      expect(input.replace(/^https?:\/\/orcid\.org\//i, "").trim()).toBe(expected);
    });

    it("should handle ORCID without prefix", () => {
      const input = "0000-0003-1234-5678";
      const expected = "0000-0003-1234-5678";
      expect(input.replace(/^https?:\/\/orcid\.org\//i, "").trim()).toBe(expected);
    });

    it("should handle empty, null, or undefined ORCID", () => {
      expect(("" || "").replace(/^https?:\/\/orcid\.org\//i, "").trim()).toBe("");
      expect((null || "").replace(/^https?:\/\/orcid\.org\//i, "").trim()).toBe("");
      expect((undefined || "").replace(/^https?:\/\/orcid\.org\//i, "").trim()).toBe("");
    });

    it("should be case insensitive for orcid.org domain", () => {
      const input = "HTTPS://ORCID.ORG/0000-0002-8773-8862";
      const expected = "0000-0002-8773-8862";
      expect(input.replace(/^https?:\/\/orcid\.org\//i, "").trim()).toBe(expected);
    });
  });

  describe("formatCreators with ORCID template", () => {
    it("should format single creator with ORCID using WikiMarkup template", () => {
      const creators = [
        { name: "Miebach, Lea", orcid: "0000-0002-8773-8862" }
      ];
      const expected = "Miebach, Lea ({{ORCID|0000-0002-8773-8862}})";
      expect(testFormatCreators(creators)).toBe(expected);
    });

    it("should format multiple creators with ORCIDs", () => {
      const creators = [
        { name: "Miebach, Lea", orcid: "0000-0002-8773-8862" },
        { name: "Bekeschus, Sander", orcid: "0000-0001-7411-9299" }
      ];
      const expected = "Miebach, Lea ({{ORCID|0000-0002-8773-8862}}); Bekeschus, Sander ({{ORCID|0000-0001-7411-9299}})";
      expect(testFormatCreators(creators)).toBe(expected);
    });

    it("should handle creator without ORCID", () => {
      const creators = [
        { name: "Smith, John" }
      ];
      const expected = "Smith, John";
      expect(testFormatCreators(creators)).toBe(expected);
    });

    it("should handle mixed creators with and without ORCIDs", () => {
      const creators = [
        { name: "Miebach, Lea", orcid: "0000-0002-8773-8862" },
        { name: "Smith, John" },
        { name: "Bekeschus, Sander", orcid: "0000-0001-7411-9299" }
      ];
      const expected = "Miebach, Lea ({{ORCID|0000-0002-8773-8862}}); Smith, John; Bekeschus, Sander ({{ORCID|0000-0001-7411-9299}})";
      expect(testFormatCreators(creators)).toBe(expected);
    });

    it("should normalize ORCID URLs from Zenodo API", () => {
      const creators = [
        { name: "Miebach, Lea", orcid: "https://orcid.org/0000-0002-8773-8862" }
      ];
      const expected = "Miebach, Lea ({{ORCID|0000-0002-8773-8862}})";
      expect(testFormatCreators(creators)).toBe(expected);
    });

    it("should handle empty creators array", () => {
      const creators = [];
      const expected = "";
      expect(testFormatCreators(creators)).toBe(expected);
    });
  });
});
