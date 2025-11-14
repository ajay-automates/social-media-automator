/**
 * popup.js - Main popup logic for Post This Now extension
 * Handles UI interactions, API calls, and state management
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
  currentUrl: '',
  pageMetadata: null,
  caption: '',
  selectedVariation: null,
  variations: [],
  selectedPlatforms: [],
  selectedAccounts: {},
  accounts: [],
  isAuthenticated: false,
  scheduleTime: null,
  isLoading: false
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  // Containers
  container: document.getElementById('popup-container'),
  loadingState: document.getElementById('loading-state'),
  authErrorState: document.getElementById('auth-error-state'),
  mainContent: document.getElementById('main-content'),
  closeBtn: document.getElementById('close-btn'),
  
  // URL Section
  urlTitle: document.getElementById('url-title'),
  urlDescription: document.getElementById('url-description'),
  urlLink: document.getElementById('url-link'),
  urlOgImage: document.getElementById('url-og-image'),
  
  // Caption Section
  captionInput: document.getElementById('caption-input'),
  charCount: document.getElementById('char-count'),
  aiGenerateBtn: document.getElementById('ai-generate-btn'),
  
  // Variations Section
  variationsSection: document.getElementById('variations-section'),
  variationsList: document.getElementById('variations-list'),
  
  // Platforms Section
  platformsList: document.getElementById('platforms-list'),
  
  // Accounts Section
  accountsSection: document.getElementById('accounts-section'),
  accountsList: document.getElementById('accounts-list'),
  
  // Actions
  postNowBtn: document.getElementById('post-now-btn'),
  scheduleBtn: document.getElementById('schedule-btn'),
  scheduleDatetime: document.getElementById('schedule-datetime'),
  
  // Messages
  messageBox: document.getElementById('message-box'),
  messageText: document.getElementById('message-text'),
  messageClose: document.querySelector('.message-close'),
  
  // Login button
  loginBtn: document.getElementById('login-btn')
};

// ============================================================================
// PLATFORMS CONFIGURATION
// ============================================================================

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'twitter', name: 'Twitter', icon: '𝕏' },
  { id: 'facebook', name: 'Facebook', icon: '👤' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'reddit', name: 'Reddit', icon: '🤖' },
  { id: 'telegram', name: 'Telegram', icon: '✈️' },
  { id: 'discord', name: 'Discord', icon: '💬' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' }
];

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎯 Popup loaded');
  
  // Show loading state
  showState('loading');
  
  try {
    // Check authentication
    const authToken = await StorageAPI.get('authToken');
    if (!authToken) {
      console.log('❌ No auth token found');
      showState('auth-error');
      return;
    }
    
    state.isAuthenticated = true;
    
    // Get current tab URL and metadata
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    state.currentUrl = currentTab.url;
    
    console.log('📍 Current URL:', state.currentUrl);
    
    // Extract metadata from page
    await extractPageMetadata();
    
    // Load user accounts
    await loadUserAccounts();
    
    // Render UI
    renderPlatforms();
    bindEvents();
    
    // Show main content
    showState('main');
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
    showMessage(`Error: ${error.message}`, 'error');
  }
});

// ============================================================================
// PAGE METADATA EXTRACTION
// ============================================================================

async function extractPageMetadata() {
  try {
    const [result] = await chrome.tabs.executeScript({
      func: () => {
        return {
          title: document.querySelector('meta[property="og:title"]')?.content || 
                 document.querySelector('title')?.textContent || 'Untitled',
          description: document.querySelector('meta[property="og:description"]')?.content ||
                      document.querySelector('meta[name="description"]')?.content || '',
          image: document.querySelector('meta[property="og:image"]')?.content ||
                document.querySelector('meta[name="twitter:image"]')?.content || ''
        };
      }
    });
    
    state.pageMetadata = result;
    renderUrlPreview();
    
  } catch (error) {
    console.error('❌ Metadata extraction error:', error);
    // Fallback
    state.pageMetadata = {
      title: new URL(state.currentUrl).hostname,
      description: '',
      image: ''
    };
    renderUrlPreview();
  }
}

function renderUrlPreview() {
  const { title, description, image } = state.pageMetadata || {};
  
  elements.urlTitle.textContent = title || 'Untitled Page';
  elements.urlDescription.textContent = description || 'No description available';
  elements.urlOgImage.src = image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="12" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E';
  
  try {
    elements.urlLink.href = state.currentUrl;
    elements.urlLink.textContent = new URL(state.currentUrl).hostname;
  } catch {
    elements.urlLink.textContent = state.currentUrl;
  }
}

// ============================================================================
// ACCOUNT LOADING
// ============================================================================

async function loadUserAccounts() {
  try {
    const response = await APIClient.get('/api/accounts/list');
    if (response.success && response.accounts) {
      state.accounts = response.accounts;
      console.log('✅ Loaded accounts:', state.accounts.length);
    }
  } catch (error) {
    console.error('❌ Failed to load accounts:', error);
    showMessage('⚠️ Failed to load accounts', 'error');
  }
}

// ============================================================================
// PLATFORM RENDERING
// ============================================================================

function renderPlatforms() {
  elements.platformsList.innerHTML = '';
  
  PLATFORMS.forEach(platform => {
    const label = document.createElement('label');
    label.className = 'platform-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = platform.id;
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!state.selectedPlatforms.includes(platform.id)) {
          state.selectedPlatforms.push(platform.id);
        }
      } else {
        state.selectedPlatforms = state.selectedPlatforms.filter(p => p !== platform.id);
      }
      updateAccountsSection();
    });
    
    const text = document.createElement('span');
    text.className = 'platform-label';
    text.textContent = `${platform.icon} ${platform.name}`;
    
    label.appendChild(checkbox);
    label.appendChild(text);
    elements.platformsList.appendChild(label);
  });
}

// ============================================================================
// ACCOUNTS SECTION
// ============================================================================

function updateAccountsSection() {
  if (state.selectedPlatforms.length === 0) {
    elements.accountsSection.classList.add('hidden');
    return;
  }
  
  elements.accountsSection.classList.remove('hidden');
  elements.accountsList.innerHTML = '';
  
  state.selectedPlatforms.forEach(platformId => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    const accounts = state.accounts.filter(a => a.platform === platformId);
    
    if (accounts.length === 0) {
      const noAccount = document.createElement('div');
      noAccount.className = 'account-warning';
      noAccount.innerHTML = `⚠️ No ${platform.name} accounts connected. <a href="${CONSTANTS.DASHBOARD_URL}/settings?tab=accounts" target="_blank">Connect account →</a>`;
      elements.accountsList.appendChild(noAccount);
      return;
    }
    
    const label = document.createElement('label');
    label.className = 'account-item';
    label.textContent = `${platform.icon} `;
    
    const select = document.createElement('select');
    select.className = 'account-select';
    select.addEventListener('change', (e) => {
      state.selectedAccounts[platformId] = e.target.value;
    });
    
    accounts.forEach(account => {
      const option = document.createElement('option');
      option.value = account.id;
      option.textContent = account.platform_username || account.username || `Account ${account.id}`;
      
      if (!state.selectedAccounts[platformId]) {
        state.selectedAccounts[platformId] = account.id;
        option.selected = true;
      } else if (account.id === state.selectedAccounts[platformId]) {
        option.selected = true;
      }
      
      select.appendChild(option);
    });
    
    label.appendChild(select);
    elements.accountsList.appendChild(label);
  });
}

// ============================================================================
// AI CAPTION GENERATION
// ============================================================================

async function generateAICaption() {
  if (!state.selectedPlatforms.length) {
    showMessage('⚠️ Select at least one platform', 'error');
    return;
  }
  
  try {
    elements.aiGenerateBtn.disabled = true;
    elements.aiGenerateBtn.textContent = '⏳ Generating...';
    
    const response = await APIClient.post('/api/ai/generate-caption', {
      url: state.currentUrl,
      pageTitle: state.pageMetadata?.title,
      pageDescription: state.pageMetadata?.description,
      platform: state.selectedPlatforms[0],
      instructions: 'Generate compelling social media captions. Include relevant hashtags and emojis.'
    });
    
    if (response.success && response.variations) {
      state.variations = response.variations;
      renderVariations();
      elements.variationsSection.classList.remove('hidden');
      
      // Auto-select first variation
      selectVariation(0);
      showMessage('✅ AI captions generated!', 'success');
    } else {
      showMessage('❌ Failed to generate captions', 'error');
    }
  } catch (error) {
    console.error('❌ AI generation error:', error);
    showMessage(`❌ ${error.message}`, 'error');
  } finally {
    elements.aiGenerateBtn.disabled = false;
    elements.aiGenerateBtn.textContent = '✨ Generate AI';
  }
}

function renderVariations() {
  elements.variationsList.innerHTML = '';
  
  state.variations.forEach((variation, index) => {
    const item = document.createElement('div');
    item.className = 'variation-item';
    if (index === 0) item.classList.add('selected');
    item.textContent = variation;
    item.addEventListener('click', () => selectVariation(index));
    elements.variationsList.appendChild(item);
  });
}

function selectVariation(index) {
  // Update UI
  document.querySelectorAll('.variation-item').forEach((el, i) => {
    if (i === index) {
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }
  });
  
  // Update state and caption
  state.selectedVariation = index;
  state.caption = state.variations[index];
  elements.captionInput.value = state.caption;
  updateCharCount();
}

// ============================================================================
// CAPTION INPUT HANDLING
// ============================================================================

function updateCharCount() {
  const caption = elements.captionInput.value;
  const count = caption.length;
  elements.charCount.textContent = `${count}/280`;
  
  // Change color based on length
  if (count > 280) {
    elements.charCount.style.color = 'var(--danger)';
  } else if (count > 200) {
    elements.charCount.style.color = '#f59e0b';
  } else {
    elements.charCount.style.color = 'var(--text-secondary)';
  }
}

// ============================================================================
// POST/SCHEDULE ACTIONS
// ============================================================================

async function postNow() {
  if (!validateBeforePost()) return;
  
  try {
    elements.postNowBtn.disabled = true;
    elements.postNowBtn.textContent = '⏳ Posting...';
    
    const response = await APIClient.post('/api/posts/create', {
      text: state.caption,
      platforms: state.selectedPlatforms,
      imageUrl: state.pageMetadata?.image || null,
      accountIds: state.selectedAccounts,
      postMetadata: {
        sourceUrl: state.currentUrl,
        sourceTitle: state.pageMetadata?.title,
        fromExtension: true,
        timestamp: new Date().toISOString()
      }
    });
    
    if (response.success) {
      showMessage('✅ Posted successfully!', 'success');
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      showMessage(`❌ ${response.error || 'Posting failed'}`, 'error');
    }
  } catch (error) {
    console.error('❌ Post error:', error);
    showMessage(`❌ ${error.message}`, 'error');
  } finally {
    elements.postNowBtn.disabled = false;
    elements.postNowBtn.textContent = 'Post Now';
  }
}

async function schedulePost() {
  if (!validateBeforePost()) return;
  
  if (!elements.scheduleDatetime.value) {
    showMessage('⚠️ Please select a schedule time', 'error');
    return;
  }
  
  try {
    elements.scheduleBtn.disabled = true;
    elements.scheduleBtn.textContent = '⏳ Scheduling...';
    
    const response = await APIClient.post('/api/posts/schedule', {
      text: state.caption,
      platforms: state.selectedPlatforms,
      imageUrl: state.pageMetadata?.image || null,
      accountIds: state.selectedAccounts,
      scheduledTime: new Date(elements.scheduleDatetime.value).toISOString(),
      postMetadata: {
        sourceUrl: state.currentUrl,
        sourceTitle: state.pageMetadata?.title,
        fromExtension: true,
        timestamp: new Date().toISOString()
      }
    });
    
    if (response.success) {
      showMessage('✅ Post scheduled!', 'success');
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      showMessage(`❌ ${response.error || 'Scheduling failed'}`, 'error');
    }
  } catch (error) {
    console.error('❌ Schedule error:', error);
    showMessage(`❌ ${error.message}`, 'error');
  } finally {
    elements.scheduleBtn.disabled = false;
    elements.scheduleBtn.textContent = 'Schedule';
  }
}

function validateBeforePost() {
  if (!state.caption.trim()) {
    showMessage('⚠️ Please enter a caption', 'error');
    return false;
  }
  
  if (state.selectedPlatforms.length === 0) {
    showMessage('⚠️ Select at least one platform', 'error');
    return false;
  }
  
  // Check if all selected platforms have accounts
  const missingAccounts = state.selectedPlatforms.filter(p => !state.selectedAccounts[p]);
  if (missingAccounts.length > 0) {
    showMessage('⚠️ Please select an account for each platform', 'error');
    return false;
  }
  
  return true;
}

// ============================================================================
// EVENT BINDING
// ============================================================================

function bindEvents() {
  elements.closeBtn.addEventListener('click', () => window.close());
  elements.captionInput.addEventListener('input', updateCharCount);
  elements.aiGenerateBtn.addEventListener('click', generateAICaption);
  elements.postNowBtn.addEventListener('click', postNow);
  elements.messageClose.addEventListener('click', () => {
    elements.messageBox.classList.add('hidden');
  });
  
  // Schedule toggle
  elements.scheduleBtn.addEventListener('click', () => {
    elements.scheduleDatetime.classList.toggle('hidden');
    if (!elements.scheduleDatetime.classList.contains('hidden')) {
      elements.scheduleDatetime.focus();
    }
  });
  
  // Login button
  if (elements.loginBtn) {
    elements.loginBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: CONSTANTS.DASHBOARD_URL });
    });
  }
}

// ============================================================================
// UI UTILITIES
// ============================================================================

function showMessage(text, type = 'info') {
  elements.messageBox.className = `message-box ${type}`;
  elements.messageText.textContent = text;
  elements.messageBox.classList.remove('hidden');
}

function showState(state) {
  // Hide all states
  elements.loadingState.classList.add('hidden');
  elements.authErrorState.classList.add('hidden');
  elements.mainContent.classList.add('hidden');
  
  // Show selected state
  if (state === 'loading') {
    elements.loadingState.classList.remove('hidden');
  } else if (state === 'auth-error') {
    elements.authErrorState.classList.remove('hidden');
  } else if (state === 'main') {
    elements.mainContent.classList.remove('hidden');
  }
}
