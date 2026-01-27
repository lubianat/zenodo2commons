# Testing Guide for Zenodo to Commons Browser Extension

## Quick Test Checklist

### Installation Test
- [ ] Extension loads without errors in Firefox
- [ ] Extension loads without errors in Chrome
- [ ] Extension icon appears in browser toolbar
- [ ] Clicking extension icon shows popup

### Functionality Test - Record Page
1. Navigate to a Zenodo record (e.g., https://zenodo.org/records/17607828)
2. Look for the "Send to Commons" button near the top of the page
3. Button should appear in or near the Edit/New Version button area
4. Click the button - should open https://lubianat.github.io/zenodo2commons/17607828 in new tab

### Functionality Test - Search Results
1. Navigate to Zenodo search (e.g., https://zenodo.org/search?q=nfdi4bioimage)
2. Look for "Send to Commons" buttons next to search result titles
3. Click any button - should open the corresponding record in zenodo2commons

### Visual Verification
- [ ] Button uses Zenodo's Semantic UI styling
- [ ] Button color is blue (#3366cc)
- [ ] Button has upload icon
- [ ] Button text reads "Send to Commons"
- [ ] Button has hover effect (darker blue)

## Manual Testing Steps

### Firefox Testing

1. **Load Extension**
   ```
   1. Open Firefox
   2. Type about:debugging in address bar
   3. Click "This Firefox"
   4. Click "Load Temporary Add-on..."
   5. Navigate to browser-extension folder
   6. Select manifest.json
   ```

2. **Test on Zenodo**
   - Visit https://zenodo.org/records/17607828
   - Verify button appears
   - Click button and verify redirect

3. **Check Console**
   - Open Developer Tools (F12)
   - Check for any errors
   - Should see message: "Zenodo2Commons: Injected button on record page"

### Chrome/Edge Testing

1. **Load Extension**
   ```
   1. Open Chrome/Edge
   2. Type chrome://extensions/ in address bar
   3. Enable "Developer mode" (toggle top-right)
   4. Click "Load unpacked"
   5. Select the browser-extension folder
   ```

2. **Test on Zenodo**
   - Visit https://zenodo.org/records/17607828
   - Verify button appears
   - Click button and verify redirect

3. **Check Console**
   - Open Developer Tools (F12)
   - Check for any errors
   - Should see message: "Zenodo2Commons: Injected button on record page"

## Expected Behavior

### On Zenodo Record Pages
- Button should appear in the record header area
- Button should be styled to match Zenodo's UI
- Clicking opens zenodo2commons with the record ID pre-filled

### On Zenodo Search Pages
- Small buttons should appear next to each result title
- Each button links to the correct record ID

### Extension Popup
- Clean, informative interface
- Links to zenodo2commons web app
- Links to GitHub repository

## Common Issues

### Button Not Appearing
- Check browser console for errors
- Verify you're on a Zenodo record page (URL contains /records/NUMBER)
- Try refreshing the page
- Reload the extension

### Wrong Record ID
- Check the console for detected ID
- Verify URL pattern matches /records/NUMBER

### Styling Issues
- Zenodo may have updated their CSS
- Check if Semantic UI classes have changed
- Inspect element to see actual classes used

## Debugging

### Enable Verbose Logging
The extension logs to console:
- "Zenodo2Commons: Injected button on record page" - Success on record page
- "Zenodo2Commons: Injected buttons on search results" - Success on search
- "Zenodo2Commons: No suitable injection point found" - Failed to find insertion point

### Inspect Injected Elements
1. Open Developer Tools
2. Select the "Send to Commons" button
3. Verify it has class "zenodo2commons-button"
4. Check the href attribute points to correct URL

## Test URLs

### Individual Records
- https://zenodo.org/records/17607828
- https://zenodo.org/records/13116431
- https://zenodo.org/records/10183330

### Search Pages
- https://zenodo.org/search?q=nfdi4bioimage
- https://zenodo.org/search?q=bioimage
- https://zenodo.org/communities/nfdi4bioimage/records

## Performance

The extension should:
- Load instantly (< 100ms)
- Not slow down page loading
- Use minimal memory (< 1MB)
- Not make external network requests

## Security

Verify that:
- Extension only runs on zenodo.org domains
- No data is collected or transmitted
- No external scripts are loaded
- Extension doesn't modify form data or user input
