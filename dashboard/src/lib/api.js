import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: '/api', // Use relative URL for production compatibility
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
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
      console.error('❌ Auth failed - threshold 401 error');
      // Redirect to login on auth failure
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;

