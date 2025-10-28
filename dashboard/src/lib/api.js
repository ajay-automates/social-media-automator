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

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ Auth failed - 401 error');
      console.error('❌ Error details:', error.response?.data);
      // Only redirect if we're not already on auth page
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

