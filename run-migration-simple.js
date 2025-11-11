/**
 * Simple Migration Runner - Creates tables one by one
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  console.log('\n🚀 Creating Content Agent Tables...\n');
  console.log('━'.repeat(60));

  // Table 1: content_agent_posts
  console.log('\n1️⃣  Creating content_agent_posts table...');
  try {
    const { error } = await supabase
      .from('content_agent_posts')
      .select('id')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log('   ⚠️  Table does not exist. Please run migration in Supabase SQL Editor.');
      console.log('   📄 File: migrations/021_add_content_agent.sql\n');
    } else {
      console.log('   ✅ Table already exists');
    }
  } catch (err) {
    console.log('   ⚠️  Could not verify table');
  }

  // Check if we can create a simple test table
  console.log('\n2️⃣  Testing database connection...');
  try {
    // Test if we can query any existing table
    const { data, error } = await supabase
      .from('posts')
      .select('id')
      .limit(1);

    if (!error) {
      console.log('   ✅ Database connection working');
      console.log('   ℹ️  Found existing posts table');
    }
  } catch (err) {
    console.log('   ❌ Database connection issue');
  }

  console.log('\n━'.repeat(60));
  console.log('📋 NEXT STEPS:\n');
  console.log('Since we cannot run DDL statements via the REST API,');
  console.log('you need to run the migration in Supabase Dashboard:\n');
  console.log('1. Open: https://supabase.com/dashboard');
  console.log('2. Go to: SQL Editor');
  console.log('3. Copy: migrations/021_add_content_agent.sql');
  console.log('4. Paste and click "RUN"');
  console.log('5. Then run: node test-content-agent.js\n');
  console.log('━'.repeat(60));
}

createTables();
