/**
 * Test Token Sync - Manual verification script
 * Run this in the dashboard console to manually test token sync
 */

console.clear();
console.log('🧪 Testing Token Sync...\n');

// Step 1: Check if we're on dashboard
console.log('1️⃣ Checking URL...');
if (window.location.href.includes('/dashboard')) {
  console.log('✅ On dashboard page:', window.location.href);
} else {
  console.error('❌ Not on dashboard page!');
}

// Step 2: Check localStorage
console.log('\n2️⃣ Checking localStorage...');
const keys = Object.keys(localStorage);
console.log('All keys:', keys);

const authKey = keys.find(key => key.endsWith('-auth-token'));
console.log('Auth key:', authKey);

if (!authKey) {
  console.error('❌ No auth key found! Are you logged in?');
} else {
  // Step 3: Parse token
  console.log('\n3️⃣ Parsing token...');
  const sessionData = localStorage.getItem(authKey);
  const parsed = JSON.parse(sessionData);

  console.log('Has access_token:', !!parsed.access_token);
  console.log('Has user:', !!parsed.user);
  console.log('Has user.id:', !!parsed.user?.id);
  console.log('User email:', parsed.user?.email);

  if (parsed.access_token && parsed.user && parsed.user.id) {
    console.log('\n✅ Valid session data found!');
    console.log('Token preview:', parsed.access_token.substring(0, 30) + '...');
    console.log('User ID:', parsed.user.id);

    // Step 4: Test save to extension storage
    console.log('\n4️⃣ Saving to extension storage...');
    chrome.storage.local.set({
      authToken: parsed.access_token,
      userId: parsed.user.id,
      tokenSyncedAt: new Date().toISOString()
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('❌ Failed to save:', chrome.runtime.lastError);
      } else {
        console.log('✅ Token saved successfully!');

        // Step 5: Verify it was saved
        console.log('\n5️⃣ Verifying save...');
        chrome.storage.local.get(['authToken', 'userId', 'tokenSyncedAt'], (data) => {
          console.log('Extension storage data:');
          console.log('- authToken:', data.authToken ? data.authToken.substring(0, 30) + '...' : 'NOT FOUND');
          console.log('- userId:', data.userId || 'NOT FOUND');
          console.log('- tokenSyncedAt:', data.tokenSyncedAt || 'NOT FOUND');

          if (data.authToken && data.userId) {
            console.log('\n🎉 SUCCESS! Token is saved to extension.');
            console.log('\n📋 Next step: Go back to the extension popup and click "Refresh After Login"');
          } else {
            console.error('\n❌ FAILED! Token not in extension storage.');
          }
        });
      }
    });
  } else {
    console.error('\n❌ Invalid session data!');
  }
}
