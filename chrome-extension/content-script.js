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
  console.log('📍 Current URL:', window.location.href);

  // Wait for localStorage to be populated
  const checkAndSyncToken = () => {
    try {
      const keys = Object.keys(localStorage);
      console.log('🔑 LocalStorage keys:', keys);

      const authKey = keys.find(key => key.endsWith('-auth-token'));
      console.log('🎯 Auth key found:', authKey);

      if (authKey) {
        const sessionData = localStorage.getItem(authKey);
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            console.log('📦 Parsed session data:', {
              hasAccessToken: !!parsed.access_token,
              hasUser: !!parsed.user,
              hasUserId: !!parsed.user?.id,
              userEmail: parsed.user?.email
            });

            if (parsed.access_token && parsed.user && parsed.user.id) {
              console.log('✅ Valid token found, sending to background...');

              // Save directly to chrome.storage.local (bypasses service worker issue)
              chrome.storage.local.set({
                authToken: parsed.access_token,
                userId: parsed.user.id,
                tokenSyncedAt: new Date().toISOString()
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error('❌ Failed to save token:', chrome.runtime.lastError);
                } else {
                  console.log('✅ Token saved directly to extension storage');
                  console.log('📦 Token:', parsed.access_token.substring(0, 20) + '...');
                  console.log('👤 User ID:', parsed.user.id);

                  // Show a subtle notification to user
                  showSyncNotification();

                  // Also try to send to background (for badge update), but don't care if it fails
                  try {
                    chrome.runtime.sendMessage({
                      action: 'saveAuthToken',
                      token: parsed.access_token,
                      userId: parsed.user.id
                    }, () => {
                      // Ignore response
                    });
                  } catch (e) {
                    // Service worker might be inactive, that's OK
                  }
                }
              });
              return true;
            } else {
              console.warn('⚠️ Token or user data missing');
            }
          } catch (e) {
            console.error('❌ Failed to parse session data:', e);
          }
        } else {
          console.warn('⚠️ Session data is empty');
        }
      } else {
        console.warn('⚠️ No auth key found in localStorage');
      }
    } catch (err) {
      console.error('❌ Error in checkAndSyncToken:', err);
    }
    return false;
  };

  // Show sync notification
  const showSyncNotification = () => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = '✅ Extension authenticated successfully!';
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  // Try immediately
  console.log('🔄 Attempting immediate token sync...');
  checkAndSyncToken();

  // Try again after short delay
  setTimeout(() => {
    console.log('🔄 Attempting token sync after 1s delay...');
    checkAndSyncToken();
  }, 1000);

  // Try again after longer delay (in case page is still loading)
  setTimeout(() => {
    console.log('🔄 Attempting token sync after 3s delay...');
    checkAndSyncToken();
  }, 3000);

  // Watch for storage changes
  window.addEventListener('storage', (event) => {
    console.log('🔄 Storage event detected:', event.key);
    if (event.key && event.key.endsWith('-auth-token')) {
      console.log('🔄 Auth token changed, syncing...');
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
