/**
 * background.js - Service Worker for Manifest V3
 * Handles popup opening, messaging, and background tasks
 */

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    console.log('🎯 Opening popup from content script');
    chrome.action.openPopup();
    sendResponse({ success: true });
  }
  
  if (request.action === 'saveAuthToken') {
    console.log('💾 Saving auth token from dashboard');
    chrome.storage.local.set({
      authToken: request.token,
      userId: request.userId,
      tokenSyncedAt: new Date().toISOString()
    }, () => {
      console.log('✅ Token saved to extension storage');
      updateIconBadge();
      sendResponse({ success: true });
    });
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'openDashboard') {
    console.log('📖 Opening dashboard in new tab');
    chrome.tabs.create({ url: request.url }, (tab) => {
      console.log('✅ Dashboard tab opened:', tab.id);
      sendResponse({ success: true, tabId: tab.id });
    });
    return true; // Will respond asynchronously
  }
});

// Update icon badge on tab change
chrome.tabs.onActivated.addListener(async () => {
  updateIconBadge();
});

async function updateIconBadge() {
  const authToken = await chrome.storage.local.get('authToken');
  if (!authToken.authToken) {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    chrome.action.setTitle({ title: 'Click to log in' });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: 'Post This Now' });
  }
}

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('✅ Extension installed');
  updateIconBadge();
});
