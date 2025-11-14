/**
 * supabase-token-bridge.js
 * Bridges Supabase tokens from dashboard to extension storage
 * Run this from content-script.js on dashboard pages
 */

const TokenBridge = {
  // Get Supabase session from window
  getSupabaseToken() {
    try {
      // Check if we're on Supabase-authenticated page
      // Supabase stores session in localStorage under key pattern: sb-*-auth-token
      const keys = Object.keys(localStorage);
      const authKey = keys.find(key => key.endsWith('-auth-token'));
      
      if (authKey) {
        const sessionData = localStorage.getItem(authKey);
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            // Supabase stores access_token in session.access_token
            if (parsed.access_token) {
              return parsed.access_token;
            }
          } catch (e) {
            console.error('Failed to parse auth token:', e);
          }
        }
      }

      // Fallback: check for generic 'token' in localStorage
      const token = localStorage.getItem('token');
      if (token) {
        return token;
      }

      return null;
    } catch (err) {
      console.error('Error getting Supabase token:', err);
      return null;
    }
  },

  // Get user ID from Supabase session
  getUserId() {
    try {
      const keys = Object.keys(localStorage);
      const authKey = keys.find(key => key.endsWith('-auth-token'));
      
      if (authKey) {
        const sessionData = localStorage.getItem(authKey);
        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            if (parsed.user && parsed.user.id) {
              return parsed.user.id;
            }
          } catch (e) {
            console.error('Failed to parse user ID:', e);
          }
        }
      }

      return null;
    } catch (err) {
      console.error('Error getting user ID:', err);
      return null;
    }
  },

  // Sync token to extension storage
  async syncToExtension() {
    try {
      const token = this.getSupabaseToken();
      const userId = this.getUserId();

      if (token && userId) {
        // Send message to background script
        chrome.runtime.sendMessage({
          action: 'saveAuthToken',
          token: token,
          userId: userId
        }, response => {
          if (chrome.runtime.lastError) {
            console.warn('⚠️ Could not sync token to extension:', chrome.runtime.lastError);
          } else {
            console.log('✅ Token synced to extension');
          }
        });

        return true;
      }

      return false;
    } catch (err) {
      console.error('Error syncing to extension:', err);
      return false;
    }
  },

  // Watch for auth changes and sync
  watchAndSync() {
    try {
      // Listen for storage changes
      window.addEventListener('storage', async (event) => {
        if (event.key && event.key.endsWith('-auth-token')) {
          console.log('🔄 Auth token changed, syncing...');
          await this.syncToExtension();
        }
      });

      // Initial sync
      this.syncToExtension();
    } catch (err) {
      console.error('Error watching auth:', err);
    }
  }
};

// Export for use in content scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TokenBridge;
}
