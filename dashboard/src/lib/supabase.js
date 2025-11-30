import { createClient } from '@supabase/supabase-js';

// Fallback values from auth.html (for production where env vars might be missing)
// This ensures the dashboard uses the same project as the auth page
const FALLBACK_URL = 'https://gzchblilbthkfuxqhoyo.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Y2hibGlsYnRoa2Z1eHFob3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDgzOTcsImV4cCI6MjA3Njg4NDM5N30.h85XUXsVvxYAdMA9odgO4W5RN1148MDOO86XhwgOnb8';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

console.log('🔌 Supabase Config:', {
  url: supabaseUrl,
  usingFallback: !import.meta.env.VITE_SUPABASE_URL
});

// Create Supabase client with auth flow configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto-refresh session when it's about to expire
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session changes from other tabs/windows
    detectSessionInUrl: true,
  },
});

