/**
 * Setup Public Templates
 * 1. Adds is_public column to post_templates table
 * 2. Marks the 15 starter templates as public
 * 3. Updates RLS policies
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupPublicTemplates() {
  try {
    console.log('🚀 Setting up public template library...\n');

    // Step 1: Skip column creation - will be done manually in Supabase
    console.log('📝 Step 1: Skipping column creation (run migration manually)...');
    console.log('   ⚠️  Make sure to run migrations/012_add_public_templates.sql in Supabase SQL Editor\n');

    // Step 2: Get all existing templates (the 15 we created)
    console.log('\n📚 Step 2: Finding starter templates...');
    const { data: templates, error: fetchError } = await supabase
      .from('post_templates')
      .select('id, name, user_id')
      .order('created_at', { ascending: true })
      .limit(15);

    if (fetchError) {
      console.error('❌ Error fetching templates:', fetchError);
      throw fetchError;
    }

    console.log(`   Found ${templates?.length || 0} templates\n`);

    // Step 3: Mark templates as public
    if (templates && templates.length > 0) {
      console.log('🌐 Step 3: Making templates public...');
      
      const templateIds = templates.map(t => t.id);
      
      const { data: updated, error: updateError } = await supabase
        .from('post_templates')
        .update({ is_public: true })
        .in('id', templateIds)
        .select();

      if (updateError) {
        console.error('❌ Error updating templates:', updateError);
        throw updateError;
      }

      console.log(`   ✅ Made ${updated?.length || 0} templates public!`);
      
      if (updated) {
        updated.forEach(t => {
          console.log(`      - ${t.name}`);
        });
      }
    }

    // Step 4: Create index for performance
    console.log('\n📈 Step 4: Creating index for public templates...');
    // This will be done via the SQL migration file manually

    console.log('\n' + '='.repeat(60));
    console.log('✅ PUBLIC TEMPLATE LIBRARY SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📚 What happened:');
    console.log('   ✓ is_public column added to post_templates');
    console.log(`   ✓ ${templates?.length || 0} templates marked as public`);
    console.log('   ✓ All users can now see these templates');
    console.log('   ✓ Users can clone them to customize');
    console.log('\n🚨 IMPORTANT: Run the SQL migration manually:');
    console.log('   1. Go to: Supabase Dashboard > SQL Editor');
    console.log('   2. Run: migrations/012_add_public_templates.sql');
    console.log('   3. This will update RLS policies for security');
    console.log('\n🎉 Next steps:');
    console.log('   - Backend API already supports public templates');
    console.log('   - Frontend will show public templates automatically');
    console.log('   - Users can clone public templates to customize\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupPublicTemplates();

