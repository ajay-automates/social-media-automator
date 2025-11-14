/**
 * content-script.js - Injects "Post This Now" button into webpages
 * Runs on every page to provide quick access button
 * Also syncs auth token from dashboard
 */

// ============================================================================
// TOKEN BRIDGE - Sync Supabase tokens from dashboard
// ============================================================================

// Only sync tokens on dashboard pages
if (window.location.href.includes('/dashboard')) {
  console.log('🔄 Dashboard detected, attempting token sync...');
  
  // Wait for localStorage to be populated
  const checkAndSyncToken = () => {
    try {
      const keys = Object.keys(localStorage);
      const authKey = keys.find(key => key.endsWith('-auth-token'));
      
      if (authKey) {
        const sessionData = localStorage.getItem(authKey);
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            if (parsed.access_token && parsed.user && parsed.user.id) {
              // Send to background script
              chrome.runtime.sendMessage({
                action: 'saveAuthToken',
                token: parsed.access_token,
                userId: parsed.user.id
              }, response => {
                if (!chrome.runtime.lastError) {
                  console.log('✅ Token synced from dashboard to extension');
                }
              });
              return true;
            }
          } catch (e) {
            // Silent fail
          }
        }
      }
    } catch (err) {
      // Silent fail
    }
    return false;
  };
  
  // Try immediately
  checkAndSyncToken();
  
  // Try again after delay (in case page is still loading)
  setTimeout(checkAndSyncToken, 2000);
  
  // Watch for storage changes
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.endsWith('-auth-token')) {
      checkAndSyncToken();
    }
  });
}

// ============================================================================
// BUTTON INJECTION
// ============================================================================

// Only inject on non-extension pages and valid URLs
if (!window.location.href.startsWith('chrome-extension://')) {
  injectButton();
}

function injectButton() {
  try {
    // Create button container
    const container = document.createElement('div');
    container.id = 'sma-button-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Create button
    const button = document.createElement('button');
    button.id = 'sma-post-button';
    button.title = 'Post to Social Media with Social Media Automator';
    button.innerHTML = '📱 Post';
    button.style.cssText = `
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 12px 18px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      transition: all 0.3s ease;
      font-family: inherit;
      letter-spacing: 0.5px;
    `;
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.08)';
      button.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
    });
    
    // Active state
    button.addEventListener('mousedown', () => {
      button.style.transform = 'scale(0.95)';
    });
    
    button.addEventListener('mouseup', () => {
      button.style.transform = 'scale(1.08)';
    });
    
    // Click handler - opens popup
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      chrome.runtime.sendMessage({ action: 'openPopup' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('⚠️ Extension context invalidated, reloading...');
        }
      });
    });
    
    container.appendChild(button);
    document.body.appendChild(container);
    
    console.log('✅ Social Media Automator button injected');
    
  } catch (error) {
    console.error('❌ Error injecting button:', error);
  }
}
