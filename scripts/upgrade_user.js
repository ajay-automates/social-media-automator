require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function upgradeUser() {
    const email = 'ajay4640@gmail.com';
    console.log(`Looking for user: ${email}`);

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
        console.error('Error listing users:', userError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log(`Found user ID: ${user.id}`);

    // 2. Upsert Subscription
    // Pro Plan: limits.posts = 100
    const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
            user_id: user.id,
            plan: 'pro',
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        }, {
            onConflict: 'user_id'
        });

    if (subError) {
        console.error('Error updating subscription:', subError);
        return;
    }

    console.log('✅ User upgraded to PRO plan successfully!');
}

upgradeUser();
