/**
 * Converts HTML content from Zenodo API to WikiMarkup format.
 * 
 * This function preserves semantic formatting by converting HTML tags
 * to their WikiMarkup equivalents instead of just stripping them.
 * Tables are extracted and returned separately to avoid nesting issues
 * within MediaWiki templates.
 * 
 * @param {string} html - The HTML string to convert
 * @returns {{description: string, tables: string}} - Object with description text and extracted tables
 * 
 * @example
 * cleanDescription('<p>This is <strong>bold</strong> text</p>')
 * // Returns: { description: "This is '''bold''' text", tables: "" }
 */
export function cleanDescription(html) {
  if (!html) return { description: "", tables: "" };

  // 1. Extract and convert tables to WikiMarkup, then remove them from the HTML
  const extractedTables = [];
  const htmlWithoutTables = html.replace(/<table[^>]*>.*?<\/table>/gis, (match) => {
    extractedTables.push(match);
    return ""; // Remove table from the main content
  });

  // 2. Convert other HTML to WikiMarkup formatting
  let text = htmlWithoutTables
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
  const description = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0) // Remove empty lines
    .join("\n");

  // 7. Convert extracted tables to WikiMarkup
  const tables = extractedTables
    .map(tableHtml => convertTableToWikiMarkup(tableHtml))
    .join("\n\n");

  return { description, tables };
}

/**
 * Converts a single HTML table to WikiMarkup table syntax.
 * 
 * @param {string} tableHtml - The HTML table string
 * @returns {string} - The WikiMarkup table string
 */
function convertTableToWikiMarkup(tableHtml) {
  let wikiTable = '{| class="wikitable"\n';
  
  // Extract table content
  const tableContent = tableHtml.match(/<table[^>]*>(.*?)<\/table>/is);
  if (!tableContent) return "";
  
  // Process table rows
  const rows = tableContent[1].match(/<tr[^>]*>(.*?)<\/tr>/gis);
  if (!rows) return "";
  
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
      let content = cell.replace(/<th[^>]*>(.*?)<\/th>/is, '$1').trim();
      content = convertInlineFormatting(content);
      wikiTable += '! ' + content + '\n';
    });
    
    // Process data cells
    tdCells.forEach(cell => {
      let content = cell.replace(/<td[^>]*>(.*?)<\/td>/is, '$1').trim();
      content = convertInlineFormatting(content);
      wikiTable += '| ' + content + '\n';
    });
  });
  
  wikiTable += '|}';
  return wikiTable;
}

/**
 * Converts inline HTML formatting to WikiMarkup.
 * 
 * @param {string} html - HTML string with inline formatting
 * @returns {string} - String with WikiMarkup formatting
 */
function convertInlineFormatting(html) {
  return html
    // Convert bold tags to WikiMarkup
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "'''$1'''")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "'''$1'''")
    // Convert italic tags to WikiMarkup
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "''$1''")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "''$1''")
    // Strip any remaining tags
    .replace(/<[^>]+>/g, "");
}
