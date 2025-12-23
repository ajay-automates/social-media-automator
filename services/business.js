const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const { scrapeWebContent } = require('./web-scraper-light');
const cheerio = require('cheerio');
const axios = require('axios');

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials for business service');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

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

/**
 * Extract business information from website URL using AI
 * @param {string} websiteUrl - Website URL to analyze
 * @returns {Promise<Object>} Extracted business profile data
 */
async function extractBusinessDataFromWebsite(websiteUrl) {
  try {
    console.log(`🔍 Extracting business data from: ${websiteUrl}`);

    // Validate URL
    if (!websiteUrl || !websiteUrl.trim()) {
      throw new Error('Website URL is required');
    }

    // Ensure URL has protocol
    let url = websiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Scrape website content
    const scrapedContent = await scrapeWebContent(url);

    // Also extract meta tags and structured data
    let metaData = {};
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SocialMediaAutomatorBot/1.0)',
        },
        timeout: 15000
      });
      const $ = cheerio.load(response.data);
      
      // Extract meta tags
      metaData = {
        title: $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '',
        description: $('meta[name="description"]').attr('content') || 
                     $('meta[property="og:description"]').attr('content') || '',
        logo: $('meta[property="og:image"]').attr('content') || 
              $('link[rel="icon"]').attr('href') ||
              $('link[rel="apple-touch-icon"]').attr('href') || '',
        email: $('a[href^="mailto:"]').first().attr('href')?.replace('mailto:', '') || '',
        phone: $('a[href^="tel:"]').first().attr('href')?.replace('tel:', '') || '',
        linkedin: $('a[href*="linkedin.com"]').first().attr('href') || '',
        twitter: $('a[href*="twitter.com"], a[href*="x.com"]').first().attr('href') || '',
        instagram: $('a[href*="instagram.com"]').first().attr('href') || '',
        facebook: $('a[href*="facebook.com"]').first().attr('href') || '',
        youtube: $('a[href*="youtube.com"]').first().attr('href') || ''
      };

      // Make logo URL absolute if relative
      if (metaData.logo && !metaData.logo.startsWith('http')) {
        const urlObj = new URL(url);
        metaData.logo = metaData.logo.startsWith('/') 
          ? `${urlObj.protocol}//${urlObj.host}${metaData.logo}`
          : `${urlObj.protocol}//${urlObj.host}/${metaData.logo}`;
      }
    } catch (metaError) {
      console.warn('⚠️ Could not extract meta tags:', metaError.message);
    }

    // Use AI to extract structured business data
    const prompt = `You are a business data extraction expert. Analyze the following website content and extract structured business information.

WEBSITE URL: ${url}

SCRAPED CONTENT:
${scrapedContent}

META DATA:
${JSON.stringify(metaData, null, 2)}

TASK: Extract all available business information and return it as JSON. Fill in as many fields as possible based on the content.

Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "business_name": "Company name (required, extract from title/heading)",
  "business_type": "company|personal_brand|agency|nonprofit|other",
  "industry": "saas|ecommerce|services|consulting|retail|healthcare|education|technology|finance|real_estate|other",
  "description": "Detailed description of what the business does (2-4 sentences)",
  "tagline": "Short tagline or slogan if found",
  "value_proposition": "What makes this business unique (1-2 sentences)",
  "target_audience": "Who they serve (e.g., Small business owners, Tech startups)",
  "key_products_services": ["Product 1", "Product 2", "..."],
  "key_features_benefits": ["Feature/Benefit 1", "Feature/Benefit 2", "..."],
  "email": "contact email if found",
  "phone": "phone number if found",
  "linkedin_url": "LinkedIn URL if found",
  "twitter_handle": "Twitter handle (without @) if found",
  "instagram_handle": "Instagram handle (without @) if found",
  "facebook_url": "Facebook URL if found",
  "youtube_url": "YouTube URL if found",
  "logo_url": "Logo image URL if found",
  "brand_voice": "professional|casual|friendly|technical|inspirational|humorous (infer from content tone)",
  "content_themes": ["product_updates", "industry_news", "tips", "behind_scenes", "customer_stories", "team_spotlight"]
}

IMPORTANT RULES:
1. Extract business_name from page title, h1, or meta tags (REQUIRED)
2. Infer industry from content and business description
3. Extract products/services from content (look for "products", "services", "solutions", "offerings")
4. Extract features/benefits from content (look for "features", "benefits", "why choose us")
5. Extract social media links from meta tags or links
6. If logo_url is found in meta tags, use it
7. Infer brand_voice from content tone (professional, casual, etc.)
8. Suggest content_themes based on what the business likely posts about
9. Only include fields where you found actual data (don't make up values)
10. Return ONLY valid JSON, nothing else`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.3, // Lower temperature for more accurate extraction
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
    const extractedData = JSON.parse(jsonText);

    // Merge with meta data (meta data takes precedence for URLs)
    const result = {
      ...extractedData,
      website_url: url,
      // Use meta data if available and not in extracted data
      email: extractedData.email || metaData.email || null,
      phone: extractedData.phone || metaData.phone || null,
      logo_url: extractedData.logo_url || metaData.logo || null,
      linkedin_url: extractedData.linkedin_url || metaData.linkedin || null,
      twitter_handle: extractedData.twitter_handle || (metaData.twitter ? metaData.twitter.replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//, '').replace(/^@/, '') : null),
      instagram_handle: extractedData.instagram_handle || (metaData.instagram ? metaData.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/^@/, '') : null),
      facebook_url: extractedData.facebook_url || metaData.facebook || null,
      youtube_url: extractedData.youtube_url || metaData.youtube || null
    };

    // Clean up social handles (remove @ and URLs)
    if (result.twitter_handle && result.twitter_handle.includes('twitter.com')) {
      result.twitter_handle = result.twitter_handle.replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//, '').replace(/^@/, '');
    }
    if (result.instagram_handle && result.instagram_handle.includes('instagram.com')) {
      result.instagram_handle = result.instagram_handle.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/^@/, '');
    }

    console.log(`✅ Successfully extracted business data from ${url}`);
    return {
      success: true,
      data: result,
      extractedFields: Object.keys(result).filter(k => result[k] !== null && result[k] !== undefined && result[k] !== '')
    };

  } catch (error) {
    console.error('❌ Error extracting business data from website:', error);
    throw error;
  }
}

module.exports = {
  getBusinessProfile,
  upsertBusinessProfile,
  deleteBusinessProfile,
  hasBusinessProfile,
  extractBusinessDataFromWebsite
};

