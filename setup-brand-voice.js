// SETUP: Add these two lines to server.js manually
// 1. After the brand-voice-analyzer import line (line ~143), add:
//    const brandVoiceBootstrapRoutes = require('./routes/brand-voice-bootstrap');
//
// 2. Before app.use(notFoundHandler), add:
//    brandVoiceBootstrapRoutes(app, verifyAuth);
//
// OR simply run: node setup-brand-voice.js

const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');

console.log('🔧 Patching server.js with brand voice bootstrap routes...\n');

let content = fs.readFileSync(serverPath, 'utf8');
let changed = false;

// Patch 1: Update import line
const oldImport = "const { analyzeBrandVoice, getBrandVoiceProfile } = require('./services/brand-voice-analyzer');";
const newImport = "const { analyzeBrandVoice, getBrandVoiceProfile, bootstrapBrandVoice, getSamplePosts, saveSamplePosts } = require('./services/brand-voice-analyzer');\nconst brandVoiceBootstrapRoutes = require('./routes/brand-voice-bootstrap');";

if (content.includes(oldImport)) {
  content = content.replace(oldImport, newImport);
  console.log('✅ Patch 1: Updated brand-voice-analyzer imports');
  changed = true;
} else if (content.includes('brandVoiceBootstrapRoutes')) {
  console.log('⏭️  Patch 1: Already applied (bootstrap imports exist)');
} else {
  console.log('⚠️  Patch 1: Could not find import line to patch');
}

// Patch 2: Register routes before notFoundHandler
const oldHandler = "app.use(notFoundHandler); // 404 handler for undefined routes";
const newHandler = "// Register brand voice bootstrap routes\nbrandVoiceBootstrapRoutes(app, verifyAuth);\n\napp.use(notFoundHandler); // 404 handler for undefined routes";

if (content.includes(oldHandler) && !content.includes('brandVoiceBootstrapRoutes(app, verifyAuth)')) {
  content = content.replace(oldHandler, newHandler);
  console.log('✅ Patch 2: Registered brand voice bootstrap routes');
  changed = true;
} else if (content.includes('brandVoiceBootstrapRoutes(app, verifyAuth)')) {
  console.log('⏭️  Patch 2: Already applied (routes registered)');
} else {
  console.log('⚠️  Patch 2: Could not find notFoundHandler line to patch');
}

if (changed) {
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('\n✅ server.js patched successfully!');
  console.log('   Restart the server for changes to take effect.\n');
} else {
  console.log('\n⏭️  No changes needed - patches already applied.\n');
}
