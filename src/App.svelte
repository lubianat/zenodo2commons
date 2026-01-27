<script>
  import { onMount } from "svelte";
  import { cleanDescription } from "./utils/htmlToWiki.js";

  let zenodoId = "17607828";
  let record = null;
  let error = null;
  let loading = false;

  const licenseMap = {
    "cc-by-4.0": "cc-by-4.0",
    "cc-by-sa-4.0": "cc-by-sa-4.0",
    "cc0-1.0": "Cc-zero",
    "cc-by": "cc-by-4.0", // Fallback/Generic
    "cc-by-sa": "cc-by-sa-4.0", // Fallback/Generic
    cc0: "Cc-zero", // Fallback/Generic
  };

  onMount(() => {
    const path = window.location.pathname;
    // Check if path contains a numeric ID (e.g. /17607828)
    const match = path.match(/\/(\d+)/);
    if (match) {
      zenodoId = match[1];
      fetchZenodoRecord();
    }
  });

  function getBasePath() {
    const baseUrl = import.meta.env.BASE_URL || "/";
    if (typeof window === "undefined") {
      return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    }
    const resolved = new URL(baseUrl, window.location.origin).pathname;
    return resolved.endsWith("/") ? resolved : `${resolved}/`;
  }

  async function fetchZenodoRecord() {
    loading = true;
    error = null;
    record = null;
    try {
      // Clean ID if it's a URL
      const id = zenodoId.replace(/.*\//, "").trim();
      // Update URL if not already there
      const nextPath = `${getBasePath()}${id}`;
      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, "", nextPath);
      }

      const res = await fetch(`https://zenodo.org/api/records/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch record: ${res.statusText}`);
      record = await res.json();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function getCommonsLicense(zenodoLicenseId) {
    // Zenodo license ID might be like "cc-by-4.0" or object
    const id = (zenodoLicenseId || "").toLowerCase();
    return licenseMap[id] || "";
  }

  function normalizeOrcid(orcid) {
    if (!orcid) return "";
    return orcid.replace(/^https?:\/\/orcid\.org\//i, "").trim();
  }

  function formatCreators(creators) {
    if (!Array.isArray(creators) || creators.length === 0) return "";
    return creators
      .map((creator) => {
        const name = creator.name || "";
        const orcid = normalizeOrcid(creator.orcid);
        return orcid ? `${name} (ORCID: ${orcid})` : name;
      })
      .filter((value) => value.length > 0)
      .join("; ");
  }

  function buildUploadUrl(file, record) {
    const metadata = record.metadata;
    const title = metadata.title;
    const description = cleanDescription(metadata.description);
    const date = metadata.publication_date;
    const authors = formatCreators(metadata.creators);
    const source = `https://zenodo.org/records/${record.id}`;
    const licenseId = metadata.license ? metadata.license.id : "";
    const commonsLicense = getCommonsLicense(licenseId);

    if (!commonsLicense) return null;

    // Truncate title for filename to avoid issues, but keep it descriptive
    const safeTitle = title.replace(/[:\/\\?*|"><]/g, "").substring(0, 80);
    const destFile = `${safeTitle} - ${file.key}`;

    // Construct the Information template
    const infoTemplate = `{{Information
|description=${title}:
${description}
|date=${date}
|source=${source}
|author=${authors}
|permission=
|other versions=
}}
{{Zenodo|${record.id}}}
[[Category:Media from Zenodo]]`;

    const params = new URLSearchParams({
      wpUploadDescription: infoTemplate,
      wpLicense: commonsLicense,
      wpDestFile: destFile,
      wpSourceType: "url",
      wpUploadFileURL: file.links.self,
    });

    return `https://commons.wikimedia.org/wiki/Special:Upload?${params.toString()}`;
  }
</script>

<main>
  <header>
    <h1>Zenodo to Commons</h1>
    <p class="subtitle">
      Easily upload open-access files from Zenodo to Wikimedia Commons.
    </p>
  </header>

  <div class="search-container">
    <div class="input-group">
      <input
        type="text"
        bind:value={zenodoId}
        placeholder="Enter Zenodo Record ID (e.g., 17607828)"
        on:keydown={(e) => e.key === "Enter" && fetchZenodoRecord()}
      />
      <button
        on:click={fetchZenodoRecord}
        disabled={loading}
        class="primary-btn"
      >
        {loading ? "Fetching..." : "Fetch Record"}
      </button>
    </div>
  </div>

  {#if error}
    <div class="error-message">
      <strong>Error:</strong>
      {error}
    </div>
  {/if}

  {#if record}
    <div class="record-card fade-in">
      <div class="record-header">
        <h2>{record.metadata.title}</h2>
        <a
          href={`https://zenodo.org/records/${record.id}`}
          target="_blank"
          class="zenodo-link"
        >
          View on Zenodo &nearr;
        </a>
      </div>

      <div class="record-meta">
        <div class="meta-item">
          <span class="label">Date:</span>
          <span class="value">{record.metadata.publication_date}</span>
        </div>
        <div class="meta-item">
          <span class="label">License:</span>
          <span
            class="value badge {record.metadata.license &&
            getCommonsLicense(record.metadata.license.id)
              ? 'green'
              : 'red'}"
          >
            {record.metadata.license ? record.metadata.license.id : "Unknown"}
          </span>
        </div>
        <div class="meta-item">
          <span class="label">Authors:</span>
          <span class="value">{formatCreators(record.metadata.creators)}</span>
        </div>
      </div>

      <h3>Files ({record.files.length})</h3>
      <div class="files-grid">
        {#each record.files as file}
          {@const uploadUrl = buildUploadUrl(file, record)}
          <div class="file-card">
            <div class="file-info">
              <div class="file-name" title={file.key}>{file.key}</div>
              <div class="file-size">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <div class="actions">
              {#if uploadUrl}
                <a href={uploadUrl} target="_blank" class="upload-btn">
                  Upload to Commons
                </a>
              {:else}
                <span
                  class="no-license"
                  title="License not supported or unknown"
                >
                  Not Uploadable
                </span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</main>

<footer>
  <p>
    Made by <a href="https://gerbi-gmb.de" target="_blank" rel="noopener noreferrer">German BioImaging</a> 
    for <a href="https://zenodo.org/communities/nfdi4bioimage/records" target="_blank" rel="noopener noreferrer">NFDI4BIOIMAGE</a>.
    Open source – <a href="https://github.com/lubianat/zenodo2commons" target="_blank" rel="noopener noreferrer">View source code</a>.
  </p>
</footer>

<style>
  :global(body) {
    margin: 0;
    background-color: #f5f7fa;
    color: #333;
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      "Open Sans",
      "Helvetica Neue",
      sans-serif;
  }

  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    text-align: center;
    margin-bottom: 3rem;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: #2c3e50;
  }

  .subtitle {
    color: #666;
    font-size: 1.1rem;
  }

  .search-container {
    max-width: 600px;
    margin: 0 auto 2rem;
  }

  .input-group {
    display: flex;
    gap: 0.5rem;
    background: white;
    padding: 0.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #e1e4e8;
  }

  input {
    flex: 1;
    padding: 0.8rem;
    font-size: 1rem;
    border: none;
    outline: none;
    background: transparent;
  }

  .primary-btn {
    background-color: #3366cc;
    color: white;
    border: none;
    padding: 0 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .primary-btn:hover {
    background-color: #254b99;
  }

  .primary-btn:disabled {
    background-color: #a0a0a0;
    cursor: not-allowed;
  }

  .error-message {
    background-color: #fee;
    color: #c00;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    text-align: center;
    border: 1px solid #fcc;
  }

  .record-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
  }

  .record-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #2c3e50;
    flex: 1;
    margin-right: 1rem;
  }

  .zenodo-link {
    color: #3366cc;
    text-decoration: none;
    font-weight: 500;
    white-space: nowrap;
  }

  .zenodo-link:hover {
    text-decoration: underline;
  }

  .record-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .label {
    font-size: 0.85rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .value {
    font-size: 1rem;
    color: #333;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .badge.green {
    background-color: #e6fffa;
    color: #047857;
  }

  .badge.red {
    background-color: #fef2f2;
    color: #b91c1c;
  }

  h3 {
    margin-bottom: 1rem;
    color: #4a5568;
  }

  .files-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .file-card {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
    background: white;
    display: flex;
    flex-direction: column;
  }

  .file-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }

  .file-info {
    padding: 1rem;
    flex: 1;
  }

  .file-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-size {
    font-size: 0.85rem;
    color: #64748b;
  }

  .actions {
    padding: 1rem;
    border-top: 1px solid #e2e8f0;
    text-align: center;
  }

  .upload-btn {
    display: block;
    background-color: #3366cc;
    color: white;
    padding: 0.6rem;
    text-decoration: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .upload-btn:hover {
    background-color: #254b99;
  }

  .no-license {
    color: #94a3b8;
    font-size: 0.9rem;
    font-style: italic;
    cursor: not-allowed;
  }

  .fade-in {
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  footer {
    margin-top: 3rem;
    padding: 2rem 0;
    text-align: center;
    border-top: 1px solid #e2e8f0;
    color: #64748b;
    font-size: 0.9rem;
  }

  footer p {
    margin: 0;
  }

  footer a {
    color: #3366cc;
    text-decoration: none;
  }

  footer a:hover {
    text-decoration: underline;
  }
</style>
