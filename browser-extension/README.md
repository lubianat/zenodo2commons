# Zenodo to Commons Browser Extension

A browser extension for Firefox and Chrome that adds a "Send to Commons" button to Zenodo pages, making it easy to upload open-access files to Wikimedia Commons.

## Features

- 🚀 **One-Click Access**: Adds a "Send to Commons" button directly on Zenodo record pages
- 🔍 **Search Results Integration**: Buttons appear on Zenodo search results for quick access
- 🎨 **Clean Design**: Seamlessly integrates with Zenodo's UI using Semantic UI styling
- 🔒 **Privacy-Focused**: No data collection, no tracking, no external requests
- ⚡ **Lightweight**: Minimal footprint with no heavy dependencies

## Installation

### Firefox

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on..."
5. Navigate to the `browser-extension` folder and select the `manifest.json` file
6. The extension is now installed!

**For permanent installation:**
1. You can package the extension as an XPI file or submit it to Mozilla Add-ons
2. For testing, temporary installation works great

### Chrome / Chromium / Edge

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked"
5. Select the `browser-extension` folder
6. The extension is now installed!

**For permanent installation:**
1. You can package the extension as a CRX file or submit it to Chrome Web Store
2. For testing, developer mode installation works great

## How to Use

1. **Visit any Zenodo page**: Navigate to https://zenodo.org
2. **On record pages**: Click the "Send to Commons" button near the top of the page
3. **On search results**: Click the "Send to Commons" button next to any search result title
4. **You'll be redirected** to the Zenodo2Commons web tool with the record ID pre-filled

## Development

### File Structure

```
browser-extension/
├── manifest.json       # Extension configuration
├── content.js          # Content script that injects the button
├── content.css         # Styling for the button
├── popup.html          # Extension popup interface
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

### Testing Locally

1. Make changes to any of the extension files
2. Reload the extension:
   - **Firefox**: Go to `about:debugging` → This Firefox → Click "Reload" next to the extension
   - **Chrome**: Go to `chrome://extensions/` → Click the reload icon on the extension card
3. Refresh any open Zenodo pages to see your changes

### How It Works

The extension uses a content script that:
1. Detects when you're on a Zenodo page
2. Extracts the record ID from the URL or page content
3. Injects a "Send to Commons" button in appropriate locations
4. Links the button to `https://lubianat.github.io/zenodo2commons/{recordId}`

## Permissions

This extension requires minimal permissions:
- **Host permissions for zenodo.org**: To inject the button on Zenodo pages
- No data collection, no analytics, no tracking

## Privacy

This extension:
- ✅ Does NOT collect any user data
- ✅ Does NOT track your browsing
- ✅ Does NOT send data to any external servers
- ✅ Only modifies Zenodo pages to add a helpful button
- ✅ Is completely open source

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests to the main repository at https://github.com/lubianat/zenodo2commons

## License

This project is open source and available under the same license as the main zenodo2commons project.

## Credits

Made by [German BioImaging](https://gerbi-gmb.de) for [NFDI4BIOIMAGE](https://zenodo.org/communities/nfdi4bioimage/records).
