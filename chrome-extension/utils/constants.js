/**
 * constants.js - Configuration and constants for the extension
 */

const CONSTANTS = {
  // Update these with your production URLs
  DASHBOARD_URL: 'https://your-domain.com/dashboard',
  API_BASE_URL: 'https://your-domain.com',
  
  // Storage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_ID: 'userId',
    ACCOUNTS: 'userAccounts'
  },
  
  // API endpoints
  API_ENDPOINTS: {
    ACCOUNTS: '/api/accounts/list',
    GENERATE_CAPTION: '/api/ai/generate-caption',
    POST_CREATE: '/api/posts/create',
    POST_SCHEDULE: '/api/posts/schedule',
    AUTHENTICATE: '/api/extension/authenticate'
  }
};
