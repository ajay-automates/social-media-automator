const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials for business service');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get business profile for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Business profile or null
 */
async function getBusinessProfile(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error getting business profile:', error);
    throw error;
  }
}

/**
 * Create or update business profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Business profile data
 * @returns {Promise<Object>} Created/updated profile
 */
async function upsertBusinessProfile(userId, profileData) {
  try {
    // Validate required fields
    if (!profileData.business_name || profileData.business_name.trim() === '') {
      throw new Error('Business name is required');
    }

    // Prepare data for upsert
    const dataToUpsert = {
      user_id: userId,
      business_name: profileData.business_name.trim(),
      business_type: profileData.business_type || null,
      industry: profileData.industry || null,
      description: profileData.description || null,
      website_url: profileData.website_url || null,
      email: profileData.email || null,
      phone: profileData.phone || null,
      linkedin_url: profileData.linkedin_url || null,
      twitter_handle: profileData.twitter_handle || null,
      instagram_handle: profileData.instagram_handle || null,
      facebook_url: profileData.facebook_url || null,
      youtube_url: profileData.youtube_url || null,
      tiktok_handle: profileData.tiktok_handle || null,
      other_social_links: profileData.other_social_links || null,
      tagline: profileData.tagline || null,
      value_proposition: profileData.value_proposition || null,
      target_audience: profileData.target_audience || null,
      key_products_services: profileData.key_products_services || null,
      key_features_benefits: profileData.key_features_benefits || null,
      content_themes: profileData.content_themes || null,
      brand_voice: profileData.brand_voice || null,
      tone_description: profileData.tone_description || null,
      logo_url: profileData.logo_url || null,
      brand_colors: profileData.brand_colors || null,
      brand_fonts: profileData.brand_fonts || null,
      auto_include_cta: profileData.auto_include_cta !== undefined ? profileData.auto_include_cta : true,
      cta_text: profileData.cta_text || 'Learn more',
      preferred_hashtags: profileData.preferred_hashtags || null,
      avoid_words: profileData.avoid_words || null,
      is_active: profileData.is_active !== undefined ? profileData.is_active : true,
      updated_at: new Date().toISOString()
    };

    // Use upsert with conflict resolution on user_id
    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .upsert(dataToUpsert, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`✅ Business profile ${data.id ? 'updated' : 'created'} for user ${userId}`);
    return data;
  } catch (error) {
    console.error('❌ Error upserting business profile:', error);
    throw error;
  }
}

/**
 * Delete business profile (soft delete by setting is_active = false)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteBusinessProfile(userId) {
  try {
    const { error } = await supabaseAdmin
      .from('business_profiles')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    console.log(`✅ Business profile deleted (soft) for user ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting business profile:', error);
    throw error;
  }
}

/**
 * Check if user has a business profile
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if profile exists
 */
async function hasBusinessProfile(userId) {
  try {
    const profile = await getBusinessProfile(userId);
    return profile !== null;
  } catch (error) {
    console.error('❌ Error checking business profile:', error);
    return false;
  }
}

module.exports = {
  getBusinessProfile,
  upsertBusinessProfile,
  deleteBusinessProfile,
  hasBusinessProfile
};

