import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: '/api', // Use relative URL for production compatibility
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔑 Auth session:', session ? 'exists' : 'missing');
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      console.error('❌ No access token - user not authenticated');
    }
  } catch (error) {
    console.error('Error getting session for API request:', error);
  }
  
  return config;
});

// Handle 401 and 503 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle service unavailable (network/timeout errors)
    if (error.response?.status === 503 || error.response?.data?.isNetworkError) {
      console.error('⚠️  Service temporarily unavailable:', error.response?.data?.error);
      // Don't redirect on network errors - just log and let components handle it
      // This prevents refresh loops
      return Promise.reject(error);
    }
    
    // Handle authentication errors (only redirect on actual auth failures, not network errors)
    if (error.response?.status === 401) {
      // Check if it's a network error masquerading as 401
      if (error.response?.data?.isNetworkError) {
        console.error('⚠️  Network error during auth check');
        return Promise.reject(error);
      }
      
      console.error('❌ Auth failed - 401 error');
      console.error('❌ Error details:', error.response?.data);
      // Only redirect if we're not already on auth page
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth.html';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

