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
    // Validate recordId is numeric to prevent URL injection
    if (!/^\d+$/.test(recordId)) {
      console.warn('Zenodo2Commons: Invalid record ID format:', recordId);
      return null;
    }
    
    const button = document.createElement('a');
    button.href = `${ZENODO2COMMONS_URL}${recordId}`;
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
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

    // Primary target: hydrated record title section
    const titleSection = document.querySelector('#record-title-section');
    if (titleSection && !titleSection.querySelector('.zenodo2commons-button')) {
      const button = createCommonsButton(recordId);
      if (!button) return false;

      button.classList.add('tiny', 'compact');
      button.style.lineHeight = '1';
      button.style.padding = '0.45em 0.8em';

      let buttonGroup = titleSection.querySelector('.zenodo2commons-actions');
      if (!buttonGroup) {
        buttonGroup = document.createElement('div');
        buttonGroup.className = 'ui buttons zenodo2commons-actions';
        buttonGroup.style.marginTop = '10px';
        const title = titleSection.querySelector('#record-title, h1');
        if (title && title.parentNode) {
          title.parentNode.insertBefore(buttonGroup, title.nextSibling);
        } else {
          titleSection.appendChild(buttonGroup);
        }
      }

      buttonGroup.appendChild(button);
      return true;
    }

    // Fallback targets for older layouts
    const selectors = [
      'article.main-record-content',
      '.main-record-content',
      '#record-info',
      '.ui.container .record-header',
      '#record-header'
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container && !container.querySelector('.zenodo2commons-button')) {
        const button = createCommonsButton(recordId);
        if (!button) continue;

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'ui buttons zenodo2commons-actions';
        buttonGroup.style.marginTop = '10px';
        buttonGroup.appendChild(button);
        container.insertBefore(buttonGroup, container.firstChild);
        return true;
      }
    }

    return false;
  }
  
  // Function to inject button on search result items
  function injectOnSearchResults() {
    const resultItems = document.querySelectorAll(
      '.ui.divided.link.relaxed.items .item, .search-result-item, .result-item'
    );
    let injected = 0;

    resultItems.forEach(item => {
      // Skip if button already exists
      if (item.querySelector('.zenodo2commons-button')) return;

      // Try to find the record link
      const recordLink = item.querySelector('a[href^="/records/"], a[href*="/records/"]');
      if (!recordLink) return;

      const match = recordLink.href.match(/\/records?\/(\d+)/);
      if (!match) return;

      const recordId = match[1];
      const button = createCommonsButton(recordId);
      if (!button) return;

      // Find where to inject the button
      const header = item.querySelector('h2.header, h2, h3, h4, .title');
      if (header) {
        button.className = 'ui tiny compact button zenodo2commons-button';
        button.style.marginLeft = '8px';
        button.style.verticalAlign = 'middle';
        button.style.display = 'inline-flex';
        button.style.alignItems = 'center';
        button.style.lineHeight = '1';
        button.style.padding = '0.35em 0.6em';
        header.appendChild(button);
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
    
    // If the page is still hydrating, wait for anchors to appear without logging noise.
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
