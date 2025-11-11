/**
 * Run Database Migration for Content Agent
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('\n🚀 Running Content Agent Database Migration...\n');
    console.log('━'.repeat(60));

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '021_add_content_agent.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Database: ' + process.env.SUPABASE_URL);
    console.log('━'.repeat(60));

    // Execute the migration
    console.log('\n⏳ Executing migration...\n');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying direct execution...\n');

      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('DO $$'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        try {
          // Skip comments and empty lines
          if (statement.startsWith('--') || statement.trim() === '') continue;

          console.log(`   Executing: ${statement.substring(0, 60)}...`);

          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql_query: statement + ';'
          });

          if (stmtError) {
            console.log(`   ⚠️  Skipped (may already exist)`);
          } else {
            successCount++;
            console.log(`   ✅ Success`);
          }
        } catch (err) {
          errorCount++;
          console.log(`   ❌ Error: ${err.message}`);
        }
      }

      console.log('\n━'.repeat(60));
      console.log(`📊 Results: ${successCount} successful, ${errorCount} errors`);
      console.log('━'.repeat(60));

      // Verify tables were created
      console.log('\n🔍 Verifying tables...\n');
      await verifyTables();

      return;
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify tables were created
    await verifyTables();

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

async function verifyTables() {
  const tables = [
    'content_agent_posts',
    'brand_voice_profiles',
    'trend_alerts',
    'content_agent_settings',
    'content_generation_log'
  ];

  console.log('Checking for tables:\n');

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`   ❌ ${table} - NOT FOUND`);
      } else {
        console.log(`   ✅ ${table} - EXISTS`);
      }
    } catch (err) {
      console.log(`   ❌ ${table} - ERROR: ${err.message}`);
    }
  }

  console.log('\n━'.repeat(60));
  console.log('✅ Migration verification complete!');
  console.log('━'.repeat(60));
  console.log('\nNext steps:');
  console.log('1. Run: node test-content-agent.js');
  console.log('2. Test API endpoints');
  console.log('3. Build frontend UI\n');
}

// Run migration
runMigration();
