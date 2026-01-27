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

  // 1. Convert HTML tables to WikiMarkup tables
  let text = convertTablesToWikiMarkup(html);

  // 2. Convert other HTML to WikiMarkup formatting
  text = text
    // Convert bold tags to WikiMarkup
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "'''$1'''")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "'''$1'''")
    // Convert italic tags to WikiMarkup
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "''$1''")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "''$1''")
    // Structural replacements
    .replace(/<\/p>/gi, "\n\n") // Paragraphs to double newlines
    .replace(/<br\s*\/?>/gi, "\n") // Breaks to newlines
    .replace(/<li[^>]*>/gi, "\n* "); // List items

  // 3. Strip remaining tags (after WikiMarkup conversion)
  text = text.replace(/<[^>]+>/g, "");

  // 4. Remove empty wiki markup (multiple apostrophes with nothing between them)
  text = text.replace(/'{2,}/g, (match) => {
    // Keep valid wiki markup: '' (italic) or ''' (bold)
    // But remove invalid patterns like '''' or longer sequences
    if (match === "''" || match === "'''") return match;
    return ""; // Remove other apostrophe sequences
  });

  // 5. Decode HTML entities using DOMParser (browser environment)
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

  // 6. Cleanup whitespace
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0) // Remove empty lines
    .join("\n");
}

/**
 * Converts HTML tables to WikiMarkup table syntax.
 * 
 * @param {string} html - The HTML string containing tables
 * @returns {string} - The HTML with tables converted to WikiMarkup
 */
function convertTablesToWikiMarkup(html) {
  // Match complete table elements
  return html.replace(/<table[^>]*>(.*?)<\/table>/gis, (match, tableContent) => {
    let wikiTable = '\n{| class="wikitable"\n';
    
    // Process table rows
    const rows = tableContent.match(/<tr[^>]*>(.*?)<\/tr>/gis);
    if (!rows) return match; // Return original if no rows found
    
    rows.forEach((row, rowIndex) => {
      // Extract th cells
      const thCells = row.match(/<th[^>]*>.*?<\/th>/gis) || [];
      // Extract td cells
      const tdCells = row.match(/<td[^>]*>.*?<\/td>/gis) || [];
      
      if (thCells.length === 0 && tdCells.length === 0) return;
      
      // Add row separator (except for first row)
      if (rowIndex > 0) {
        wikiTable += '|-\n';
      }
      
      // Process header cells
      thCells.forEach(cell => {
        const content = cell.replace(/<th[^>]*>(.*?)<\/th>/is, '$1').trim();
        wikiTable += '! ' + content + '\n';
      });
      
      // Process data cells
      tdCells.forEach(cell => {
        const content = cell.replace(/<td[^>]*>(.*?)<\/td>/is, '$1').trim();
        wikiTable += '| ' + content + '\n';
      });
    });
    
    wikiTable += '|}\n';
    return wikiTable;
  });
}
