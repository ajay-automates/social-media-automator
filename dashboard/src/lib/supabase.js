import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

