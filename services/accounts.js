/**
 * Multi-Account Management for 5 UGC Niches
 * 
 * Accounts are defined here with metadata (name, niche, emoji, color)
 * Credentials are stored in environment variables with numbered suffixes
 */

// Define 5 accounts with metadata
const ACCOUNTS = [
  { 
    id: 1, 
    name: 'Restaurant Tools', 
    niche: 'restaurant', 
    emoji: '🍔', 
    color: 'orange',
    description: 'Tools and automation for restaurants'
  },
  { 
    id: 2, 
    name: 'E-commerce Solutions', 
    niche: 'ecommerce', 
    emoji: '🛍️', 
    color: 'blue',
    description: 'E-commerce automation and tools'
  },
  { 
    id: 3, 
    name: 'Content Creation', 
    niche: 'content', 
    emoji: '🎥', 
    color: 'purple',
    description: 'Creator tools and content automation'
  },
  { 
    id: 4, 
    name: 'Cost-Saving Alternatives', 
    niche: 'savings', 
    emoji: '💰', 
    color: 'green',
    description: 'Budget-friendly software alternatives'
  },
  { 
    id: 5, 
    name: 'Real Estate Tech', 
    niche: 'realestate', 
    emoji: '🏠', 
    color: 'red',
    description: 'Real estate automation and tools'
  }
];

/**
 * Get account by ID
 * @param {number} id - Account ID (1-5)
 * @returns {Object} Account object
 */
function getAccount(id) {
  const account = ACCOUNTS.find(a => a.id === parseInt(id));
  return account || ACCOUNTS[0]; // Default to first account if not found
}

/**
 * Get all accounts
 * @returns {Array} Array of all account objects
 */
function getAllAccounts() {
  return ACCOUNTS;
}

/**
 * Get credentials for specific account and platform
 * @param {number} accountId - Account ID (1-5)
 * @param {string} platform - Platform name ('linkedin', 'twitter')
 * @returns {Object} Credentials object for the platform
 */
function getAccountCredentials(accountId, platform) {
  // Account 1 uses no suffix for backward compatibility
  const suffix = accountId > 1 ? `_${accountId}` : '';
  
  const credentials = {
    linkedin: {
      accessToken: process.env[`LINKEDIN_TOKEN${suffix}`],
      urn: process.env[`LINKEDIN_URN${suffix}`],
      type: process.env[`LINKEDIN_TYPE${suffix}`] || 'person'
    },
    twitter: {
      apiKey: process.env[`TWITTER_API_KEY${suffix}`],
      apiSecret: process.env[`TWITTER_API_SECRET${suffix}`],
      accessToken: process.env[`TWITTER_ACCESS_TOKEN${suffix}`],
      accessSecret: process.env[`TWITTER_ACCESS_SECRET${suffix}`]
    },
  };

  return credentials[platform];
}

/**
 * Get all credentials for an account (all platforms)
 * @param {number} accountId - Account ID (1-5)
 * @returns {Object} Object with credentials for all platforms
 */
function getAllCredentials(accountId) {
  return {
    linkedin: getAccountCredentials(accountId, 'linkedin'),
    twitter: getAccountCredentials(accountId, 'twitter')
  };
}

/**
 * Check if account has valid credentials for a platform
 * @param {number} accountId - Account ID (1-5)
 * @param {string} platform - Platform name
 * @returns {boolean} True if credentials exist
 */
function hasCredentials(accountId, platform) {
  const creds = getAccountCredentials(accountId, platform);
  
  if (platform === 'linkedin') {
    return !!(creds.accessToken);
  } else if (platform === 'twitter') {
    return !!(creds.apiKey && creds.apiSecret && creds.accessToken && creds.accessSecret);
  }

  return false;
}

/**
 * Get account status with available platforms
 * @param {number} accountId - Account ID (1-5)
 * @returns {Object} Account with platform availability
 */
function getAccountStatus(accountId) {
  const account = getAccount(accountId);
  
  return {
    ...account,
    platforms: {
      linkedin: hasCredentials(accountId, 'linkedin'),
      twitter: hasCredentials(accountId, 'twitter')
    }
  };
}

/**
 * Get all accounts with their status
 * @returns {Array} Array of accounts with platform availability
 */
function getAllAccountsWithStatus() {
  return ACCOUNTS.map(account => getAccountStatus(account.id));
}

module.exports = {
  getAccount,
  getAllAccounts,
  getAccountCredentials,
  getAllCredentials,
  hasCredentials,
  getAccountStatus,
  getAllAccountsWithStatus
};

