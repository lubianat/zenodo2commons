/**
 * Utilities for managing URL length and trimming metadata when URLs are too long.
 * 
 * Wikimedia Commons Special:Upload has limitations on URL length.
 * Most web servers have a limit around 8KB, but we use a more conservative limit
 * to ensure compatibility across different servers and proxies.
 */

// Conservative URL length limit (4KB instead of typical 8KB server limit)
const MAX_URL_LENGTH = 4000;

// Minimum viable table length - below this, tables are omitted entirely
const MIN_TABLE_LENGTH = 100;

// Percentage of remaining URL space to allocate to tables (vs description)
const TABLE_SPACE_RATIO = 0.4;

// Safety margin to account for URL encoding overhead and other factors
const URL_ENCODING_MARGIN = 100;

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
  
  for (let i = lines.length - 2; i >= 0; i--) { // -2 to skip the closing |}
    if (lines[i] === '|-' || lines[i].startsWith('|') || lines[i].startsWith('!')) {
      const truncated = lines.slice(0, i).join('\n') + truncationNote;
      // Verify we have a valid table opening
      if (truncated.includes('{| class="wikitable"') && truncated.length <= maxLength) {
        return truncated;
      }
    }
  }
  
  // If we can at least keep the table header
  const minTable = lines.slice(0, 2).join('\n') + truncationNote;
  if (minTable.includes('{| class="wikitable"') && minTable.length <= maxLength) {
    return minTable;
  }
  
  // If still too long, return empty with note
  return '(Metadata tables omitted due to length constraints. See full metadata at source.)';
}

/**
 * Truncates description text to fit within length constraints.
 * Tries to break at sentence or paragraph boundaries when possible.
 * 
 * Note: Sentence detection uses a simple regex that may not handle
 * abbreviations (like "Dr.", "etc.") correctly. This is acceptable
 * since truncation is a fallback for extreme cases.
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
  
  // Try to break at paragraph boundary
  const paragraphs = description.split('\n\n');
  let truncated = '';
  
  for (const para of paragraphs) {
    const nextTruncated = truncated ? truncated + '\n\n' + para : para;
    if (nextTruncated.length + truncationNote.length > maxLength) {
      break;
    }
    truncated = nextTruncated;
  }
  
  if (truncated) {
    return truncated + truncationNote;
  }
  
  // If no paragraphs fit, try sentence boundary
  // Note: This regex doesn't handle abbreviations well, but is acceptable for truncation
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
 * Builds the full WikiMarkup metadata without URL length constraints.
 * This is the metadata that would be used if URL size limits were infinite.
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.title - Record title
 * @param {string} params.description - Cleaned description text
 * @param {string} params.notes - Cleaned notes text (optional)
 * @param {string} params.tables - WikiMarkup tables
 * @param {string} params.date - Publication date
 * @param {string} params.source - Source URL
 * @param {string} params.authors - Author string
 * @param {string} params.recordId - Zenodo record ID
 * @returns {string} - Full WikiMarkup metadata
 */
export function buildFullMetadata(params) {
  const {
    title,
    description,
    notes,
    tables,
    date,
    source,
    authors,
    recordId
  } = params;
  
  // Build description section with notes if present
  let descriptionSection = `${title}:
${description}`;
  
  if (notes) {
    descriptionSection += `

${notes}`;
  }
  
  let template = `{{Information
|description=${descriptionSection}
|date=${date}
|source=${source}
|author=${authors}
|permission=
|other versions=
}}
{{Zenodo|${recordId}}}
[[Category:Media from Zenodo]]
[[Category:Uploaded with zenodo2commons]]`;
  
  if (tables) {
    template += `\n\n${tables}`;
  }
  
  return template;
}

/**
 * Builds metadata that fits within URL length constraints.
 * Progressively truncates tables and description as needed.
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.title - Record title
 * @param {string} params.description - Cleaned description text
 * @param {string} params.notes - Cleaned notes text (optional)
 * @param {string} params.tables - WikiMarkup tables
 * @param {string} params.date - Publication date
 * @param {string} params.source - Source URL
 * @param {string} params.authors - Author string
 * @param {string} params.recordId - Zenodo record ID
 * @param {string} params.commonsLicense - Commons license identifier
 * @param {string} params.destFile - Destination filename
 * @param {string} params.fileUrl - File URL
 * @returns {{url: string, wasTruncated: boolean}} - Upload URL and truncation flag
 */
export function buildConstrainedUploadUrl(params) {
  const {
    title,
    description,
    notes,
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
  function buildInfoTemplate(desc, nts, tbl) {
    // Build description section with notes if present
    let descriptionSection = `${title}:
${desc}`;
    
    if (nts) {
      descriptionSection += `

${nts}`;
    }
    
    let template = `{{Information
|description=${descriptionSection}
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
  let url = buildUrl(buildInfoTemplate(description, notes, tables));
  
  if (!isUrlTooLong(url)) {
    return { url, wasTruncated: false };
  }
  
  // If URL is too long, progressively truncate
  // Strategy 1: Truncate tables significantly
  if (tables) {
    const baseUrl = `https://commons.wikimedia.org/wiki/Special:Upload?`;
    const baseTemplate = buildInfoTemplate(description, notes, '');
    const baseParams = new URLSearchParams({
      wpUploadDescription: baseTemplate,
      wpLicense: commonsLicense,
      wpDestFile: destFile,
      wpSourceType: "url",
      wpUploadFileURL: fileUrl,
    });
    const baseLength = (baseUrl + baseParams.toString()).length;
    const remainingSpace = MAX_URL_LENGTH - baseLength - URL_ENCODING_MARGIN;
    
    // Reserve space for tables (40% of remaining space)
    const maxTableLength = Math.min(tables.length, Math.floor(remainingSpace * TABLE_SPACE_RATIO));
    
    if (maxTableLength > MIN_TABLE_LENGTH) {
      const truncatedTables = truncateTables(tables, maxTableLength);
      url = buildUrl(buildInfoTemplate(description, notes, truncatedTables));
      
      if (!isUrlTooLong(url)) {
        return { url, wasTruncated: true };
      }
    }
  }
  
  // Strategy 2: Remove tables entirely, keep full description and notes
  url = buildUrl(buildInfoTemplate(description, notes, ''));
  
  if (!isUrlTooLong(url)) {
    return { url, wasTruncated: true };
  }
  
  // Strategy 3: Try without notes to see if description fits
  url = buildUrl(buildInfoTemplate(description, '', ''));
  
  if (!isUrlTooLong(url)) {
    return { url, wasTruncated: true };
  }
  
  // Strategy 4: Truncate description (notes already removed)
  const baseUrl = `https://commons.wikimedia.org/wiki/Special:Upload?`;
  const minimalTemplate = buildInfoTemplate('', '', '');
  const minimalParams = new URLSearchParams({
    wpUploadDescription: minimalTemplate,
    wpLicense: commonsLicense,
    wpDestFile: destFile,
    wpSourceType: "url",
    wpUploadFileURL: fileUrl,
  });
  const minimalLength = (baseUrl + minimalParams.toString()).length;
  const maxDescLength = MAX_URL_LENGTH - minimalLength - URL_ENCODING_MARGIN;
  
  const truncatedDesc = truncateDescription(description, maxDescLength);
  return { url: buildUrl(buildInfoTemplate(truncatedDesc, '', '')), wasTruncated: true };
}
