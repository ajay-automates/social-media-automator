require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDelete() {
    console.log('🔍 Fetching a queued post...');

    // Fetch one queued post
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'queued')
        .limit(1);

    if (error) {
        console.error('❌ Error fetching posts:', error);
        return;
    }

    if (!posts || posts.length === 0) {
        console.log('⚠️ No queued posts found to test.');
        return;
    }

    const post = posts[0];
    console.log('📄 Found post:', {
        id: post.id,
        type: typeof post.id,
        user_id: post.user_id,
        text: post.text?.substring(0, 50) + '...'
    });

    // Check if ID is integer or UUID
    const isInt = Number.isInteger(post.id);
    const isString = typeof post.id === 'string';
    console.log(`🆔 ID Type Check: Integer? ${isInt}, String? ${isString}`);

    // Try to delete it using the same logic as the server (but with admin client)
    console.log('🗑️ Attempting to delete this post...');

    const { error: deleteError, count } = await supabase
        .from('posts')
        .delete({ count: 'exact' }) // Request count of deleted rows
        .eq('id', post.id)
        .eq('user_id', post.user_id);

    if (deleteError) {
        console.error('❌ Delete failed:', deleteError);
    } else {
        console.log(`✅ Delete successful. Rows deleted: ${count}`);
        if (count === 0) {
            console.warn('⚠️ Delete returned success but 0 rows were deleted. This usually means the ID or User ID did not match.');
        }
    }
}

debugDelete();
