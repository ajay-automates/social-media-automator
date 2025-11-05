/**
 * Complete setup for public template library
 * Runs migration and marks templates as public
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runCompleteSetup() {
  try {
    console.log('🚀 PUBLIC TEMPLATE LIBRARY SETUP\n');
    console.log('='.repeat(60) + '\n');

    // Step 1: Try to add is_public column
    console.log('📝 Step 1: Adding is_public column...');
    try {
      // Try direct query approach
      const { error: colError } = await supabase
        .from('post_templates')
        .select('is_public')
        .limit(1);
      
      if (colError && colError.message.includes('column') && colError.message.includes('does not exist')) {
        console.log('   ⚠️  Column does not exist yet');
        console.log('   📋 Please run this SQL in Supabase SQL Editor:');
        console.log('   ----------------------------------------');
        console.log('   ALTER TABLE post_templates ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;');
        console.log('   ----------------------------------------\n');
        console.log('   Then run this script again!\n');
        process.exit(1);
      } else {
        console.log('   ✅ Column exists!\n');
      }
    } catch (err) {
      console.log('   ⚠️  Could not check column');
    }

    // Step 2: Get templates
    console.log('📚 Step 2: Finding starter templates...');
    const { data: templates, error: fetchError } = await supabase
      .from('post_templates')
      .select('id, name, is_public')
      .order('created_at', { ascending: true })
      .limit(15);

    if (fetchError) {
      console.error('   ❌ Error:', fetchError.message);
      throw fetchError;
    }

    if (!templates || templates.length === 0) {
      console.log('   ⚠️  No templates found!');
      console.log('   Run: node scripts/seed-templates.js first\n');
      process.exit(1);
    }

    console.log(`   ✅ Found ${templates.length} templates\n`);

    // Check if already public
    const alreadyPublic = templates.filter(t => t.is_public === true);
    if (alreadyPublic.length === templates.length) {
      console.log('   ℹ️  All templates are already public!');
      console.log('   Nothing to do.\n');
      
      templates.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.name} 🌐`);
      });
      
      console.log('\n✅ PUBLIC TEMPLATE LIBRARY IS READY!\n');
      return;
    }

    // Step 3: Mark as public
    console.log('🌐 Step 3: Marking templates as public...');
    
    const templateIds = templates.map(t => t.id);
    
    const { data: updated, error: updateError } = await supabase
      .from('post_templates')
      .update({ is_public: true })
      .in('id', templateIds)
      .select();

    if (updateError) {
      console.error('   ❌ Error:', updateError.message);
      
      if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
        console.log('\n   💡 Solution:');
        console.log('   1. Go to Supabase Dashboard > SQL Editor');
        console.log('   2. Run: migrations/012_add_public_templates.sql');
        console.log('   3. Run this script again\n');
      }
      
      throw updateError;
    }

    console.log(`   ✅ Updated ${updated.length} templates!\n`);

    // Step 4: Verify
    console.log('✅ Step 4: Verification...');
    const { data: verified } = await supabase
      .from('post_templates')
      .select('id, name, is_public')
      .eq('is_public', true)
      .limit(20);

    console.log(`   ✅ ${verified.length} public templates in database\n`);

    // Success!
    console.log('='.repeat(60));
    console.log('🎉 PUBLIC TEMPLATE LIBRARY IS LIVE!');
    console.log('='.repeat(60));
    console.log('\n📚 Public Templates:\n');
    
    verified.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.name} 🌐`);
    });

    console.log('\n✨ What this means:');
    console.log('   ✓ ALL users can now see these templates');
    console.log('   ✓ Templates show 🌐 "Public Template" badge');
    console.log('   ✓ Users can clone templates to customize');
    console.log('   ✓ Original templates are read-only');
    console.log('\n🚀 Production deployment complete!');
    console.log('   Check: https://socialmediaautomator.com/templates\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n📝 Manual steps:');
    console.log('   1. Open: https://supabase.com/dashboard');
    console.log('   2. Go to: SQL Editor');
    console.log('   3. Run: migrations/012_add_public_templates.sql');
    console.log('   4. Run this script again\n');
    process.exit(1);
  }
}

runCompleteSetup();

