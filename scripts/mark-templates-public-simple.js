/**
 * Simple script to mark existing 15 templates as public
 * Run this AFTER running the SQL migration in Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function markTemplatesPublic() {
  try {
    console.log('🌐 Marking templates as public...\n');

    // Get the 15 starter templates
    const { data: templates, error: fetchError } = await supabase
      .from('post_templates')
      .select('id, name')
      .order('created_at', { ascending: true })
      .limit(15);

    if (fetchError) {
      console.error('❌ Error fetching templates:', fetchError);
      throw fetchError;
    }

    if (!templates || templates.length === 0) {
      console.log('⚠️  No templates found');
      return;
    }

    console.log(`Found ${templates.length} templates:\n`);
    templates.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.name} (ID: ${t.id})`);
    });

    // Mark them as public
    const templateIds = templates.map(t => t.id);
    
    const { data: updated, error: updateError } = await supabase
      .from('post_templates')
      .update({ is_public: true })
      .in('id', templateIds)
      .select();

    if (updateError) {
      console.error('\n❌ Error updating templates:', updateError);
      console.error('\n💡 Tip: Make sure you ran migrations/012_add_public_templates.sql first!');
      throw updateError;
    }

    console.log('\n✅ SUCCESS! All templates marked as public!');
    console.log(`\n📚 ${updated.length} templates are now available to ALL users\n`);

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    console.log('\n📝 Steps to fix:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Run the SQL from: migrations/012_add_public_templates.sql');
    console.log('   3. Then run this script again\n');
    process.exit(1);
  }
}

markTemplatesPublic();

