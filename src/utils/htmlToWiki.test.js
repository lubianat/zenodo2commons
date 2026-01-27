import { describe, it, expect } from "vitest";
import { cleanDescription } from "./htmlToWiki.js";

describe("cleanDescription", () => {
  describe("HTML to WikiMarkup conversion", () => {
    it("converts <strong> tags to bold WikiMarkup", () => {
      const input = "<p>This is <strong>bold</strong> text</p>";
      const expected = "This is '''bold''' text";
      expect(cleanDescription(input)).toBe(expected);
    });

    it("converts <b> tags to bold WikiMarkup", () => {
      const input = "<p>This is <b>bold</b> text</p>";
      const expected = "This is '''bold''' text";
      expect(cleanDescription(input)).toBe(expected);
    });

    it("converts <em> tags to italic WikiMarkup", () => {
      const input = "<p>This is <em>italic</em> text</p>";
      const expected = "This is ''italic'' text";
      expect(cleanDescription(input)).toBe(expected);
    });

    it("converts <i> tags to italic WikiMarkup", () => {
      const input = "<p>This is <i>italic</i> text</p>";
      const expected = "This is ''italic'' text";
      expect(cleanDescription(input)).toBe(expected);
    });

    it("converts both bold and italic tags", () => {
      const input = "<p>This has <strong>bold</strong> and <em>italic</em> text</p>";
      const expected = "This has '''bold''' and ''italic'' text";
      expect(cleanDescription(input)).toBe(expected);
    });

    it("handles nested formatting", () => {
      const input = "<strong>bold <em>and italic</em> text</strong>";
      const expected = "'''bold ''and italic'' text'''";
      expect(cleanDescription(input)).toBe(expected);
    });
  });

  describe("Structural HTML elements", () => {
    it("converts <p> tags to newlines", () => {
      const input = "<p>First paragraph</p><p>Second paragraph</p>";
      const expected = "First paragraph\nSecond paragraph";
      expect(cleanDescription(input)).toBe(expected);
    });

    it("converts <br> tags to newlines", () => {
      const input = "<p>Line one<br>Line two</p>";
      const expected = "Line one\nLine two";
      expect(cleanDescription(input)).toBe(expected);
    });

    it("converts <li> tags to bullet points", () => {
      const input = "<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>";
      const expected = "* First item\n* Second item\n* Third item";
      expect(cleanDescription(input)).toBe(expected);
    });

    it("converts list items with formatting", () => {
      const input = "<ul><li>First item</li><li>Second item with <strong>bold</strong></li><li>Third item with <em>italic</em></li></ul>";
      const expected = "* First item\n* Second item with '''bold'''\n* Third item with ''italic''";
      expect(cleanDescription(input)).toBe(expected);
    });
  });

  describe("HTML table to WikiMarkup conversion", () => {
    it("converts simple HTML table to WikiMarkup table", () => {
      const input = `<table>
        <tr><th>Header 1</th><th>Header 2</th></tr>
        <tr><td>Value 1</td><td>Value 2</td></tr>
      </table>`;
      
      const result = cleanDescription(input);
      
      expect(result).toContain("{| class=\"wikitable\"");
      expect(result).toContain("! Header 1");
      expect(result).toContain("! Header 2");
      expect(result).toContain("|-");
      expect(result).toContain("| Value 1");
      expect(result).toContain("| Value 2");
      expect(result).toContain("|}");
    });

    it("converts table with multiple rows", () => {
      const input = `<table>
        <tr><th>Column 1</th><th>Column 2</th></tr>
        <tr><td>Row 1 Col 1</td><td>Row 1 Col 2</td></tr>
        <tr><td>Row 2 Col 1</td><td>Row 2 Col 2</td></tr>
      </table>`;
      
      const result = cleanDescription(input);
      
      expect(result).toContain("! Column 1");
      expect(result).toContain("! Column 2");
      expect(result).toContain("| Row 1 Col 1");
      expect(result).toContain("| Row 2 Col 2");
    });

    it("converts table with formatting in cells", () => {
      const input = `<table>
        <tr><th>Study</th><th>Type</th></tr>
        <tr><td><strong>Biosample</strong></td><td><em>Homo sapiens</em></td></tr>
      </table>`;
      
      const result = cleanDescription(input);
      
      expect(result).toContain("! Study");
      expect(result).toContain("'''Biosample'''");
      expect(result).toContain("''Homo sapiens''");
    });

    it("converts table without headers", () => {
      const input = `<table>
        <tr><td>Cell 1</td><td>Cell 2</td></tr>
        <tr><td>Cell 3</td><td>Cell 4</td></tr>
      </table>`;
      
      const result = cleanDescription(input);
      
      expect(result).toContain("{| class=\"wikitable\"");
      expect(result).toContain("| Cell 1");
      expect(result).toContain("| Cell 2");
      expect(result).toContain("|-");
      expect(result).toContain("| Cell 3");
      expect(result).toContain("| Cell 4");
      expect(result).toContain("|}");
    });

    it("handles real-world Zenodo table example", () => {
      const input = `<table>
        <tr><th>Study</th></tr>
        <tr><td>Study description</td></tr>
        <tr><td>Ultrastructure of the immune synapse</td></tr>
        <tr><td>Study type</td></tr>
        <tr><td>Research project within DFG CRC 854</td></tr>
        <tr><th>Study Component</th></tr>
        <tr><td>Imaging method</td></tr>
        <tr><td>Scanning Electron Microscopy</td></tr>
        <tr><th>Biosample</th></tr>
        <tr><td>Biological entity</td></tr>
        <tr><td>Jurkat cell line E6.1 and Raji B cell lymphoma cell line</td></tr>
        <tr><td>Organism</td></tr>
        <tr><td><em>Homo sapiens</em></td></tr>
      </table>`;
      
      const result = cleanDescription(input);
      
      expect(result).toContain("{| class=\"wikitable\"");
      expect(result).toContain("! Study");
      expect(result).toContain("! Study Component");
      expect(result).toContain("! Biosample");
      expect(result).toContain("| Ultrastructure of the immune synapse");
      expect(result).toContain("| Scanning Electron Microscopy");
      expect(result).toContain("''Homo sapiens''");
      expect(result).toContain("|}");
    });
  });

  describe("HTML entities", () => {
    it("decodes common HTML entities", () => {
      const input = "<p>&amp; &lt; &gt; &quot;</p>";
      const expected = "& < > \"";
      expect(cleanDescription(input)).toBe(expected);
    });

    it("decodes Greek letter Delta", () => {
      const input = "<p>&Delta;&Delta;</p>";
      const expected = "ΔΔ";
      expect(cleanDescription(input)).toBe(expected);
    });

    it("handles entities with other text", () => {
      const input = "<p>Greek letters: &Delta;&Delta; and symbols: &amp; &lt; &gt;</p>";
      const expected = "Greek letters: ΔΔ and symbols: & < >";
      expect(cleanDescription(input)).toBe(expected);
    });
  });

  describe("Empty tags", () => {
    it("removes empty <em> tags", () => {
      const input = "<p>Text with <em></em> empty tags</p>";
      const expected = "Text with  empty tags";
      expect(cleanDescription(input)).toBe(expected);
    });

    it("removes empty <strong> tags", () => {
      const input = "<p>Text with <strong></strong> empty tags</p>";
      const expected = "Text with  empty tags";
      expect(cleanDescription(input)).toBe(expected);
    });

    it("removes empty tags next to entities", () => {
      const input = "<em></em>&Delta;&Delta;";
      const expected = "ΔΔ";
      expect(cleanDescription(input)).toBe(expected);
    });
  });

  describe("Real-world examples", () => {
    it("handles sample from Zenodo API (from issue)", () => {
      const input = `<p>Image from the NFDI4BIOIMAGE Calendar December 2025.</p>
<strong>Study</strong>
<p>Study type</p>
<strong>Study Component</strong>
<p>Imaging method</p>
<strong>Biosample</strong>
<p>Biological entity</p>
<em></em>
<p>Organism</p>
<em></em>&Delta;&Delta;`;
      
      const result = cleanDescription(input);
      
      expect(result).toContain("Image from the NFDI4BIOIMAGE Calendar December 2025.");
      expect(result).toContain("'''Study'''");
      expect(result).toContain("Study type");
      expect(result).toContain("'''Study Component'''");
      expect(result).toContain("'''Biosample'''");
      expect(result).toContain("ΔΔ");
    });

    it("handles complex real-world example", () => {
      const input = `<p><strong>Description:</strong> This dataset contains images from the experiment.</p>
<p>The study includes:</p>
<ul>
<li><strong>Imaging method:</strong> Fluorescence microscopy</li>
<li><strong>Sample type:</strong> <em>Drosophila melanogaster</em> cells</li>
<li><strong>Resolution:</strong> High resolution</li>
</ul>
<p>For more details, see the <strong>publication</strong>.</p>`;

      const result = cleanDescription(input);
      
      expect(result).toContain("'''Description:'''");
      expect(result).toContain("* '''Imaging method:''' Fluorescence microscopy");
      expect(result).toContain("''Drosophila melanogaster''");
      expect(result).toContain("'''publication'''");
    });

    it("handles mixed content with paragraphs and tables", () => {
      const input = `<p>Image from the NFDI4BIOIMAGE Calendar September 2025.</p>
<p>The scanning electron micrograph shows the approach of T-lymphocytes (Jurkat cells; cyan) to an antigen-presenting B cell (Raji cell; yellow) in the center.</p>
<p>Image Metadata (using REMBI template):</p>
<table>
  <tr><th>Study</th></tr>
  <tr><td>Study description</td></tr>
  <tr><td>Ultrastructure of the immune synapse</td></tr>
  <tr><th>Biosample</th></tr>
  <tr><td>Biological entity</td></tr>
  <tr><td>Jurkat cell line E6.1 and Raji B cell lymphoma cell line</td></tr>
  <tr><td>Organism</td></tr>
  <tr><td><em>Homo sapiens</em></td></tr>
</table>`;

      const result = cleanDescription(input);
      
      expect(result).toContain("Image from the NFDI4BIOIMAGE Calendar September 2025.");
      expect(result).toContain("The scanning electron micrograph");
      expect(result).toContain("Image Metadata (using REMBI template):");
      expect(result).toContain("{| class=\"wikitable\"");
      expect(result).toContain("! Study");
      expect(result).toContain("| Ultrastructure of the immune synapse");
      expect(result).toContain("! Biosample");
      expect(result).toContain("''Homo sapiens''");
      expect(result).toContain("|}");
    });
  });

  describe("Edge cases", () => {
    it("returns empty string for null input", () => {
      expect(cleanDescription(null)).toBe("");
    });

    it("returns empty string for undefined input", () => {
      expect(cleanDescription(undefined)).toBe("");
    });

    it("returns empty string for empty string input", () => {
      expect(cleanDescription("")).toBe("");
    });

    it("handles text without any HTML", () => {
      const input = "Plain text without HTML";
      expect(cleanDescription(input)).toBe(input);
    });

    it("removes extra whitespace", () => {
      const input = "<p>  Text with   extra   spaces  </p>";
      const expected = "Text with   extra   spaces";
      expect(cleanDescription(input)).toBe(expected);
    });
  });
});
