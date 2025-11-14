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
