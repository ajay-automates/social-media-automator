// This is a loader file - the actual patch is applied at startup
// See SETUP_INSTRUCTIONS.md for manual steps if auto-patch fails

const fs = require('fs');
const path = require('path');

/**
 * Apply brand voice bootstrap routes to the Express app
 * This is called from server.js
 */
module.exports = function applyBrandVoiceBootstrapPatch(app, verifyAuth) {
  // Import from the routes file
  const routes = require('./routes/brand-voice-bootstrap');
  routes(app, verifyAuth);
  console.log('✅ Brand voice bootstrap routes registered');
};
