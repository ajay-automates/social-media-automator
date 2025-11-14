/**
 * constants.js - Configuration and constants for the extension
 */

const CONSTANTS = {
  // Update these with your production URLs
  DASHBOARD_URL: 'https://capable-motivation-production-7a75.up.railway.app/dashboard',
  API_BASE_URL: 'https://capable-motivation-production-7a75.up.railway.app',
  
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
