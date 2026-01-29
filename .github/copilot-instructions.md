# Copilot Instructions for zenodo2commons

## Project Overview

zenodo2commons is a web application that helps users upload open-access files from Zenodo to Wikimedia Commons. It includes:
- A Svelte-based web application for fetching Zenodo metadata and generating Wikimedia Commons upload URLs
- A browser extension (Firefox/Chrome) that adds a "Send to Commons" button to Zenodo pages

## Tech Stack

- **Frontend Framework**: Svelte 5 (using the new runes API)
- **Build Tool**: Vite 7
- **Testing Framework**: Vitest (NOT Jest)
- **JavaScript**: ES modules (type: "module" in package.json)
- **Node.js**: v18 or higher required

## Development Workflow

### Setup and Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Testing
```bash
npm test           # Run all tests once
npm run test:watch # Run tests in watch mode
```

## Coding Standards

### JavaScript/Svelte Conventions
- Use ES6+ features and modern JavaScript syntax
- Prefer `const` by default; use `let` only when reassignment is needed
- Use arrow functions for callbacks and short functions
- Use template literals for string interpolation
- Follow existing code structure and naming patterns

### Svelte-Specific Guidelines
- This project uses Svelte 5 but follows traditional Svelte reactivity patterns
- Use `let` variables for reactive state (not runes)
- Use lifecycle functions like `onMount` from "svelte"
- Keep components focused and maintainable
- Follow the existing component structure in `src/App.svelte`

### Testing
- All tests should use Vitest syntax (NOT Jest)
- Test files should be named `*.test.js` (e.g., `htmlToWiki.test.js`)
- Use `describe`, `it`, and `expect` from Vitest
- Write comprehensive tests for utility functions
- Include edge cases and real-world examples in tests
- Follow the testing patterns in `src/utils/htmlToWiki.test.js`

### Code Organization
- Utility functions belong in `src/utils/`
- Each utility module should have a corresponding `.test.js` file
- Browser extension code is separate in the `browser-extension/` directory

## Project-Specific Context

### License Handling
The application only supports Creative Commons licenses compatible with Wikimedia Commons:
- cc-by-4.0, cc-by-sa-4.0, cc0-1.0
- See `licenseMap` in `App.svelte` for mappings

### HTML to WikiMarkup Conversion
- The `htmlToWiki.js` utility converts HTML from Zenodo to WikiMarkup for Wikimedia Commons
- Supports converting: bold, italic, paragraphs, lists, tables, and HTML entities
- Returns both `description` (text content) and `tables` (WikiMarkup tables) separately

### Base Path Handling
- The app is deployed to GitHub Pages under `/zenodo2commons/` path
- Use `getBasePath()` function for path resolution
- PR preview paths (e.g., `/pr_preview/17`) are handled specially to avoid conflicts

## Restrictions and Best Practices

### Do NOT Modify
- **Never** modify `node_modules/` or `dist/` directories
- **Never** modify `.vscode/` (except `extensions.json` if needed)
- **Never** commit build artifacts or dependencies

### Security
- Never commit secrets, API keys, or credentials
- Be mindful of XSS when handling HTML content from external sources

### GitHub Pages Deployment
- Production deploys automatically on push to `main` branch
- PR previews are created when the `preview` label is added
- Preview deployments are only for trusted collaborators

## Build and Deployment

### Production Build
The project uses Vite with the base path set to `/zenodo2commons/` for GitHub Pages deployment:
```javascript
// vite.config.js
base: '/zenodo2commons/'
```

### Browser Extension
The browser extension is in the `browser-extension/` directory and has separate documentation in `browser-extension/README.md`.

## Testing Guidelines

- Run tests before committing changes
- Ensure all tests pass with `npm test`
- Add tests for new utility functions
- Update existing tests if modifying utility functions
- Use descriptive test names that explain what is being tested

## File Structure

```
├── src/
│   ├── App.svelte           # Main application component
│   ├── app.css              # Global styles
│   ├── main.js              # Application entry point
│   └── utils/               # Utility functions
│       ├── htmlToWiki.js    # HTML to WikiMarkup converter
│       └── htmlToWiki.test.js
├── browser-extension/       # Browser extension code (separate)
├── public/                  # Static assets
├── .github/
│   └── workflows/           # GitHub Actions workflows
├── vite.config.js           # Vite configuration
├── vitest.config.js         # Vitest test configuration
└── package.json
```

## Common Tasks

### Adding a New Utility Function
1. Create the function in `src/utils/`
2. Create corresponding `.test.js` file
3. Write comprehensive tests
4. Import and use in components as needed

### Modifying HTML to WikiMarkup Conversion
1. Update `src/utils/htmlToWiki.js`
2. Add tests to `src/utils/htmlToWiki.test.js`
3. Run tests to ensure no regressions

### Working with Zenodo API
- Zenodo records are fetched from `https://zenodo.org/api/records/{id}`
- Handle loading states and errors appropriately
- Clean and validate license information before processing
