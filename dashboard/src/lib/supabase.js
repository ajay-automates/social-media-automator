import { createClient } from '@supabase/supabase-js';

// Get Supabase config from environment variables or localStorage (set by auth page)
const storedUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('sm_supabase_url') : null;
const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('sm_supabase_key') : null;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || storedUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || storedKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

console.log('🔌 Supabase Config:', {
  url: supabaseUrl,
  source: import.meta.env.VITE_SUPABASE_URL ? 'env' : (storedUrl ? 'localStorage' : 'MISSING')
});

// Create Supabase client with auth flow configuration
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
