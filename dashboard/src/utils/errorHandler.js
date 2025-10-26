import { showError } from '../components/ui/Toast';

export const handleApiError = (error, customAction = null) => {
  console.error('API Error:', error);
  
  // Network errors
  if (!navigator.onLine) {
    showError('No internet connection', {
      label: 'Retry',
      onClick: () => window.location.reload(),
    });
    return 'NETWORK_ERROR';
  }
  
  // Rate limiting
  if (error.response?.status === 429) {
    showError('You've hit your rate limit. Please try again later.');
    return 'RATE_LIMIT';
  }
  
  // Authentication errors
  if (error.response?.status === 401) {
    showError('Session expired. Please log in again.', {
      label: 'Log In',
      onClick: () => window.location.href = '/auth',
    });
    return 'INVALID_CREDENTIALS';
  }
  
  // Platform-specific errors
  if (error.message?.includes('Twitter')) {
    showError('Twitter connection failed', customAction);
    return 'TWITTER_AUTH_FAILED';
  }
  
  // Generic error
  showError(error.message || 'Something went wrong', customAction);
  return 'GENERIC_ERROR';
};

