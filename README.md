# Zenodo to Commons

A simple web tool to help upload open-access files from Zenodo to Wikimedia Commons.

## What it does

This tool allows you to:
- Fetch metadata from Zenodo records using their ID
- View files associated with a Zenodo record
- Automatically generate Wikimedia Commons upload URLs with pre-filled metadata
- Only supports records with compatible Creative Commons licenses

## Usage

### Web Application

1. Visit the deployed site
2. Enter a Zenodo record ID (e.g., 17607828)
3. View the record details and files
4. Click "Upload to Commons" to upload files to Wikimedia Commons

### Browser Extension

For easier access, install the [browser extension](browser-extension/) for Firefox or Chrome! It adds a "Send to Commons" button directly on Zenodo pages.

**Quick install:**
- **Firefox**: Load the extension from `about:debugging` → Load Temporary Add-on
- **Chrome**: Load from `chrome://extensions/` → Load unpacked

See the [extension README](browser-extension/README.md) for detailed installation instructions.

## Development

### Prerequisites

- Node.js (v18 or higher)

### Setup

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview production build

```bash
npm run preview
```

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

## License

This project is open source.
