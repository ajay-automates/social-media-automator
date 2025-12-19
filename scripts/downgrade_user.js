
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function downgradeUser(email) {
    console.log(`Downgrading user ${email} to FREE plan...`);

    // 1. Get User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log(`Found user: ${user.id}`);

    // 2. Update Subscription to FREE
    const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
            user_id: user.id,
            plan: 'free',
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

    if (subError) {
        console.error('Error updating subscription:', subError);
        return;
    }

    // 3. Reset Usage to simulate limit reached (optional, lets set it to 10 for testing limit)
    // Check usage first
    const { data: usage } = await supabase
        .from('usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (usage) {
        console.log('Current usage:', usage);
        // Let's set posts to 10 to test limit immediately
        const { error: usageError } = await supabase
            .from('usage')
            .update({ posts_count: 10 })
            .eq('user_id', user.id);

        if (usageError) console.error('Error setting usage:', usageError);
        else console.log('Set posts usage to 10 for testing.');
    }

    console.log('User downgraded to FREE plan successfully and usage maxed out!');
}

downgradeUser('ajay4640@gmail.com');
