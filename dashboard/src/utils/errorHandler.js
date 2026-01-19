import { showError } from '../components/ui/Toast';

export const handleApiError = (error, customAction = null) => {
  console.error('API Error:', error);
  
  // Service unavailable (network/timeout errors) - don't redirect, just show error
  if (error.response?.status === 503 || error.response?.data?.isNetworkError) {
    showError('Service temporarily unavailable. Please try again in a moment.', {
      label: 'Retry',
      onClick: () => window.location.reload(),
    });
    return 'SERVICE_UNAVAILABLE';
  }
  
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
  
  // Authentication errors (only redirect if it's a real auth failure, not network error)
  if (error.response?.status === 401) {
    // Don't redirect on network errors that return 401
    if (error.response?.data?.isNetworkError) {
      showError('Service temporarily unavailable. Please try again in a moment.');
      return 'SERVICE_UNAVAILABLE';
    }
    
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

