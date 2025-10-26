import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on auth failure
      window.location.href = '/auth.html';
    }
    return Promise.reject(error);
  }
);

export default api;

