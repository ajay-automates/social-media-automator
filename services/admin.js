/**
 * Admin Service
 * Handles admin-only operations like fetching all users
 */

const { supabaseAdmin } = require('./database');

// The Master Admin Email
const ADMIN_EMAIL = 'ajaykumarreddynelavetla@gmail.com';

/**
 * Check if an email belongs to an admin
 * @param {string} email 
 * @returns {boolean}
 */
function isAdmin(email) {
    // Case-insensitive check and trim whitespace
    return email && email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Get all users from Supabase Auth
 * Uses supabaseAdmin to bypass RLS and access auth.users
 */
async function getAllUsers() {
    try {
        console.log('🔍 ADMIN SERVICE: Fetching all users...');

        // Fetch users from auth.users via supabaseAdmin
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
            console.error('❌ ADMIN SERVICE ERROR calling listUsers:', error);
            throw error;
        }

        const users = data.users || [];
        console.log(`✅ ADMIN SERVICE: Found ${users.length} users.`);

        // Map to a clean format for the dashboard
        return users.map(user => ({
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            confirmed_at: user.confirmed_at,
            provider: user.app_metadata.provider || 'email',
            is_confirmed: !!user.confirmed_at
        }));

    } catch (error) {
        console.error('❌ Admin Service Error (getAllUsers):', error.message);
        throw error;
    }
}

module.exports = {
    isAdmin,
    getAllUsers,
    ADMIN_EMAIL
};
