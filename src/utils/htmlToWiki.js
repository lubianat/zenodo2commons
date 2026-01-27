/**
 * Converts HTML content from Zenodo API to WikiMarkup format.
 * 
 * This function preserves semantic formatting by converting HTML tags
 * to their WikiMarkup equivalents instead of just stripping them.
 * 
 * @param {string} html - The HTML string to convert
 * @returns {string} - The converted WikiMarkup string
 * 
 * @example
 * cleanDescription('<p>This is <strong>bold</strong> text</p>')
 * // Returns: "This is '''bold''' text"
 */
export function cleanDescription(html) {
  if (!html) return "";

  // 1. Convert HTML to WikiMarkup formatting
  let text = html
    // Convert bold tags to WikiMarkup
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "'''$1'''")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "'''$1'''")
    // Convert italic tags to WikiMarkup
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "''$1''")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "''$1''")
    // Structural replacements
    .replace(/<\/td>\s*<td[^>]*>/gi, ": ") // Table cells to "Key: Value"
    .replace(/<\/tr>/gi, "\n") // Table rows to newlines
    .replace(/<\/p>/gi, "\n\n") // Paragraphs to double newlines
    .replace(/<br\s*\/?>/gi, "\n") // Breaks to newlines
    .replace(/<li[^>]*>/gi, "\n* "); // List items

  // 2. Strip remaining tags (after WikiMarkup conversion)
  text = text.replace(/<[^>]+>/g, "");

  // 3. Remove empty wiki markup (multiple apostrophes with nothing between them)
  text = text.replace(/'{2,}/g, (match) => {
    // Keep valid wiki markup: '' (italic) or ''' (bold)
    // But remove invalid patterns like '''' or longer sequences
    if (match === "''" || match === "'''") return match;
    return ""; // Remove other apostrophe sequences
  });

  // 4. Decode HTML entities using DOMParser (browser environment)
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(text, "text/html");
    text = doc.documentElement.textContent;
  } else {
    // Fallback for Node.js environment (testing)
    text = text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&Delta;/g, "Δ");
  }

  // 5. Cleanup whitespace
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0) // Remove empty lines
    .join("\n");
}
