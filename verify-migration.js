/**
 * Verify Migration - Check all tables exist and test agent
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMigration() {
  console.log('\n🔍 VERIFYING CONTENT AGENT MIGRATION\n');
  console.log('━'.repeat(60));

  const tables = [
    'content_agent_posts',
    'brand_voice_profiles',
    'trend_alerts',
    'content_agent_settings',
    'content_generation_log'
  ];

  let allGood = true;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table.padEnd(30)} - NOT FOUND`);
        console.log(`   Error: ${error.message}`);
        allGood = false;
      } else {
        console.log(`✅ ${table.padEnd(30)} - EXISTS`);
      }
    } catch (err) {
      console.log(`❌ ${table.padEnd(30)} - ERROR`);
      console.log(`   ${err.message}`);
      allGood = false;
    }
  }

  console.log('━'.repeat(60));

  if (allGood) {
    console.log('\n🎉 ALL TABLES VERIFIED!\n');
    console.log('✅ Migration successful!');
    console.log('\n📋 Next step: Run the full test\n');
    console.log('   node test-content-agent.js\n');
    console.log('━'.repeat(60) + '\n');
  } else {
    console.log('\n❌ Some tables are missing.\n');
    console.log('Please run the migration in Supabase SQL Editor:');
    console.log('1. Open: https://supabase.com/dashboard');
    console.log('2. SQL Editor → New Query');
    console.log('3. Copy: migrations/021_add_content_agent.sql');
    console.log('4. Paste and Run\n');
  }

  return allGood;
}

verifyMigration()
  .then(success => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Verification error:', err);
    process.exit(1);
  });
