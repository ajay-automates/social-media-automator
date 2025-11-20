require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for auth verification
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );
    console.log('✅ Supabase Auth configured');
} else {
    console.warn('⚠️  Supabase Auth not configured - API protection disabled');
}

// Create admin client for server operations (bypasses RLS)
let supabaseAdmin = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
} else {
    console.warn('⚠️  Supabase Service Role Key not configured - Admin operations disabled');
}

module.exports = { supabase, supabaseAdmin };
