const crypto = require('crypto');

/**
 * Encrypt user ID for OAuth state parameter
 * Uses AES-256-GCM for authenticated encryption
 * @param {string} userId - User ID to encrypt
 * @returns {string} Base64url encoded encrypted state
 */
function encryptState(userId) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(process.env.OAUTH_STATE_SECRET, 'hex'),
    iv
  );
  const encrypted = Buffer.concat([
    cipher.update(userId, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  
  // Format: iv + encrypted + authTag (all base64url encoded together)
  return Buffer.concat([iv, encrypted, authTag]).toString('base64url');
}

/**
 * Decrypt OAuth state parameter to get user ID
 * @param {string} encryptedState - Base64url encoded encrypted state
 * @returns {string} User ID
 */
function decryptState(encryptedState) {
  const buffer = Buffer.from(encryptedState, 'base64url');
  const iv = buffer.slice(0, 16);
  const authTag = buffer.slice(-16);
  const encrypted = buffer.slice(16, -16);
  
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(process.env.OAUTH_STATE_SECRET, 'hex'),
    iv
  );
  decipher.setAuthTag(authTag);
  
  return decipher.update(encrypted) + decipher.final('utf8');
}

module.exports = { encryptState, decryptState };

