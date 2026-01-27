// Content script to inject "Send to Commons" button on Zenodo pages

(function() {
  'use strict';

  const ZENODO2COMMONS_URL = 'https://lubianat.github.io/zenodo2commons/';
  
  // Function to extract Zenodo record ID from the page
  function getZenodoRecordId() {
    // Try to get from URL first
    const urlMatch = window.location.pathname.match(/\/records?\/(\d+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    // Try to get from DOI badge
    const doiBadge = document.querySelector('a[href*="doi.org/10.5281/zenodo/"]');
    if (doiBadge) {
      const doiMatch = doiBadge.href.match(/zenodo[./](\d+)/);
      if (doiMatch) {
        return doiMatch[1];
      }
    }
    
    return null;
  }
  
  // Function to create the "Send to Commons" button
  function createCommonsButton(recordId) {
    const button = document.createElement('a');
    button.href = `${ZENODO2COMMONS_URL}${recordId}`;
    button.target = '_blank';
    button.className = 'ui button zenodo2commons-button';
    button.innerHTML = `
      <i class="upload icon"></i>
      Send to Commons
    `;
    button.title = 'Upload this record to Wikimedia Commons';
    return button;
  }
  
  // Function to inject button on individual record page
  function injectOnRecordPage() {
    const recordId = getZenodoRecordId();
    if (!recordId) return false;
    
    // Check if button already exists on the page
    if (document.querySelector('.zenodo2commons-button')) return true;
    
    // Look for the button container in the record header area
    // This targets the area near the Edit/New Version buttons
    const selectors = [
      '.ui.container .record-header .ui.buttons',
      '.ui.container .record-header',
      '#record-header .ui.buttons',
      '.preview-container .ui.buttons',
      'article .ui.buttons',
      '#record-title-section .ui.buttons'
    ];
    
    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container && !container.querySelector('.zenodo2commons-button')) {
        const button = createCommonsButton(recordId);
        
        // If it's a button group, add to it; otherwise create a new button group
        if (container.classList.contains('buttons')) {
          container.appendChild(button);
        } else {
          const buttonGroup = document.createElement('div');
          buttonGroup.className = 'ui buttons';
          buttonGroup.style.marginTop = '10px';
          buttonGroup.appendChild(button);
          container.appendChild(buttonGroup);
        }
        
        return true;
      }
    }
    
    return false;
  }
  
  // Function to inject button on search result items
  function injectOnSearchResults() {
    const resultItems = document.querySelectorAll('.search-result-item, .result-item');
    let injected = 0;
    
    resultItems.forEach(item => {
      // Skip if button already exists
      if (item.querySelector('.zenodo2commons-button')) return;
      
      // Try to find the record link
      const recordLink = item.querySelector('a[href*="/records/"]');
      if (!recordLink) return;
      
      const match = recordLink.href.match(/\/records?\/(\d+)/);
      if (!match) return;
      
      const recordId = match[1];
      
      // Find where to inject the button
      const titleElement = item.querySelector('h2, h3, h4, .title');
      if (titleElement) {
        const button = createCommonsButton(recordId);
        button.className = 'ui button mini zenodo2commons-button';
        button.style.marginLeft = '10px';
        button.style.verticalAlign = 'middle';
        titleElement.appendChild(button);
        injected++;
      }
    });
    
    return injected > 0;
  }
  
  // Main injection function
  function injectButtons() {
    // Try record page first
    if (injectOnRecordPage()) {
      console.log('Zenodo2Commons: Injected button on record page');
      return;
    }
    
    // Try search results
    if (injectOnSearchResults()) {
      console.log('Zenodo2Commons: Injected buttons on search results');
      return;
    }
    
    console.log('Zenodo2Commons: No suitable injection point found');
  }
  
  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButtons);
  } else {
    injectButtons();
  }
  
  // Watch for dynamic content changes (for SPA-like behavior)
  const observer = new MutationObserver((mutations) => {
    // Debounce to avoid excessive calls
    clearTimeout(observer.timeout);
    observer.timeout = setTimeout(injectButtons, 500);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
})();
