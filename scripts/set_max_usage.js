
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setMaxUsage(email) {
    console.log(`Setting max usage for ${email}...`);

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found!');
        return;
    }

    // Set posts to 10
    const { error } = await supabase
        .from('usage')
        .upsert({
            user_id: user.id,
            month: new Date().toISOString().slice(0, 8) + '01', // First day of current month
            posts_count: 10
        }, { onConflict: 'user_id, month' });

    if (error) console.error('Error setting usage:', error);
    else console.log('Usage set to 10 posts.');
}

setMaxUsage('antigravity_test@gmail.com');
