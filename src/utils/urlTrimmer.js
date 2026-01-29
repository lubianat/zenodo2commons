/**
 * Utilities for managing URL length and trimming metadata when URLs are too long.
 * 
 * Wikimedia Commons Special:Upload has limitations on URL length.
 * Most web servers have a limit around 8KB, but we use a more conservative limit
 * to ensure compatibility across different servers and proxies.
 */

// Conservative URL length limit (4KB instead of typical 8KB server limit)
const MAX_URL_LENGTH = 4000;

/**
 * Checks if a URL exceeds the maximum allowed length.
 * 
 * @param {string} url - The URL to check
 * @returns {boolean} - True if URL is too long
 */
export function isUrlTooLong(url) {
  return url.length > MAX_URL_LENGTH;
}

/**
 * Truncates tables to fit within URL length constraints.
 * Removes rows from the end until the URL is short enough.
 * 
 * @param {string} tables - WikiMarkup tables string
 * @param {number} maxLength - Maximum allowed length for tables
 * @returns {string} - Truncated tables with ellipsis if truncated
 */
export function truncateTables(tables, maxLength) {
  if (!tables || tables.length <= maxLength) {
    return tables;
  }

  // Split by row separator and table end
  const lines = tables.split('\n');
  
  // Find all table start positions
  const tableStarts = [];
  lines.forEach((line, i) => {
    if (line.includes('{| class="wikitable"')) {
      tableStarts.push(i);
    }
  });
  
  // If we have multiple tables, try removing entire tables from the end
  if (tableStarts.length > 1) {
    for (let i = tableStarts.length - 1; i > 0; i--) {
      const truncatedLines = lines.slice(0, tableStarts[i]);
      const truncatedNote = '\n\n(Tables truncated due to length constraints. See full metadata at source.)';
      const truncated = truncatedLines.join('\n') + truncatedNote;
      
      if (truncated.length <= maxLength) {
        return truncated;
      }
    }
  }
  
  // If still too long, truncate rows from the single/remaining table
  const truncationNote = '\n|}\n\n(Table truncated due to length constraints. See full metadata at source.)';
  const noteLength = truncationNote.length;
  
  for (let i = lines.length - 2; i >= 0; i--) { // -2 to skip the closing |}
    if (lines[i] === '|-' || lines[i].startsWith('|') || lines[i].startsWith('!')) {
      const truncated = lines.slice(0, i).join('\n') + truncationNote;
      if (truncated.length <= maxLength) {
        return truncated;
      }
    }
  }
  
  // If we can at least keep the table header
  const minTable = lines.slice(0, 2).join('\n') + truncationNote;
  if (minTable.length <= maxLength) {
    return minTable;
  }
  
  // If still too long, return empty with note
  return '(Metadata tables omitted due to length constraints. See full metadata at source.)';
}

/**
 * Truncates description text to fit within length constraints.
 * Tries to break at sentence or paragraph boundaries when possible.
 * 
 * @param {string} description - The description text
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Truncated description with ellipsis if truncated
 */
export function truncateDescription(description, maxLength) {
  if (!description || description.length <= maxLength) {
    return description;
  }
  
  const truncationNote = '\n\n(Description truncated. See full description at source.)';
  const noteLength = truncationNote.length;
  
  // Try to break at paragraph boundary
  const paragraphs = description.split('\n\n');
  let truncated = '';
  
  for (const para of paragraphs) {
    const nextTruncated = truncated ? truncated + '\n\n' + para : para;
    if (nextTruncated.length + noteLength > maxLength) {
      break;
    }
    truncated = nextTruncated;
  }
  
  if (truncated) {
    return truncated + truncationNote;
  }
  
  // If no paragraphs fit, try sentence boundary
  const sentences = description.match(/[^.!?]+[.!?]+/g) || [description];
  truncated = '';
  const ellipsisNote = '... (Description truncated. See full description at source.)';
  
  for (const sentence of sentences) {
    if ((truncated + sentence).length + ellipsisNote.length > maxLength) {
      break;
    }
    truncated += sentence;
  }
  
  if (truncated) {
    return truncated.trim() + ellipsisNote;
  }
  
  // Last resort: hard truncate
  const hardTruncateLength = maxLength - ellipsisNote.length;
  if (hardTruncateLength > 0) {
    return description.substring(0, hardTruncateLength) + ellipsisNote;
  }
  
  return ellipsisNote;
}

/**
 * Builds metadata that fits within URL length constraints.
 * Progressively truncates tables and description as needed.
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.title - Record title
 * @param {string} params.description - Cleaned description text
 * @param {string} params.tables - WikiMarkup tables
 * @param {string} params.date - Publication date
 * @param {string} params.source - Source URL
 * @param {string} params.authors - Author string
 * @param {string} params.recordId - Zenodo record ID
 * @param {string} params.commonsLicense - Commons license identifier
 * @param {string} params.destFile - Destination filename
 * @param {string} params.fileUrl - File URL
 * @returns {string} - Upload URL
 */
export function buildConstrainedUploadUrl(params) {
  const {
    title,
    description,
    tables,
    date,
    source,
    authors,
    recordId,
    commonsLicense,
    destFile,
    fileUrl
  } = params;
  
  // Helper to build info template
  function buildInfoTemplate(desc, tbl) {
    let template = `{{Information
|description=${title}:
${desc}
|date=${date}
|source=${source}
|author=${authors}
|permission=
|other versions=
}}
{{Zenodo|${recordId}}}
[[Category:Media from Zenodo]]
[[Category:Uploaded with zenodo2commons]]`;
    
    if (tbl) {
      template += `\n\n${tbl}`;
    }
    
    return template;
  }
  
  // Helper to build full URL
  function buildUrl(infoTemplate) {
    const urlParams = new URLSearchParams({
      wpUploadDescription: infoTemplate,
      wpLicense: commonsLicense,
      wpDestFile: destFile,
      wpSourceType: "url",
      wpUploadFileURL: fileUrl,
    });
    
    return `https://commons.wikimedia.org/wiki/Special:Upload?${urlParams.toString()}`;
  }
  
  // Try with full content first
  let url = buildUrl(buildInfoTemplate(description, tables));
  
  if (!isUrlTooLong(url)) {
    return url;
  }
  
  // If URL is too long, progressively truncate
  // Strategy 1: Truncate tables significantly
  if (tables) {
    const baseUrl = `https://commons.wikimedia.org/wiki/Special:Upload?`;
    const baseTemplate = buildInfoTemplate(description, '');
    const baseParams = new URLSearchParams({
      wpUploadDescription: baseTemplate,
      wpLicense: commonsLicense,
      wpDestFile: destFile,
      wpSourceType: "url",
      wpUploadFileURL: fileUrl,
    });
    const baseLength = (baseUrl + baseParams.toString()).length;
    const remainingSpace = MAX_URL_LENGTH - baseLength;
    
    // Reserve at least half the space for description
    const maxTableLength = Math.min(tables.length, Math.floor(remainingSpace * 0.4));
    
    if (maxTableLength > 100) {
      const truncatedTables = truncateTables(tables, maxTableLength);
      url = buildUrl(buildInfoTemplate(description, truncatedTables));
      
      if (!isUrlTooLong(url)) {
        return url;
      }
    }
  }
  
  // Strategy 2: Remove tables entirely, keep full description
  url = buildUrl(buildInfoTemplate(description, ''));
  
  if (!isUrlTooLong(url)) {
    return url;
  }
  
  // Strategy 3: Truncate description too
  const baseUrl = `https://commons.wikimedia.org/wiki/Special:Upload?`;
  const minimalTemplate = buildInfoTemplate('', '');
  const minimalParams = new URLSearchParams({
    wpUploadDescription: minimalTemplate,
    wpLicense: commonsLicense,
    wpDestFile: destFile,
    wpSourceType: "url",
    wpUploadFileURL: fileUrl,
  });
  const minimalLength = (baseUrl + minimalParams.toString()).length;
  const maxDescLength = MAX_URL_LENGTH - minimalLength - 100; // Safety margin
  
  const truncatedDesc = truncateDescription(description, maxDescLength);
  return buildUrl(buildInfoTemplate(truncatedDesc, ''));
}
