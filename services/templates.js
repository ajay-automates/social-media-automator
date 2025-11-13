/**
 * Templates Service
 * Handles post templates and saved drafts
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get all templates for a user
 * @param {string} userId - User ID
 * @param {object} filters - Optional filters (category, search, sort)
 * @returns {Promise<Array>} Array of templates
 */
async function getTemplates(userId, filters = {}) {
  try {
    // Get user's personal templates AND public templates
    let query = supabase
      .from('post_templates')
      .select('*')
      .or(`user_id.eq.${userId},is_public.eq.true`);

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    // Filter by favorite (only for user's own templates)
    if (filters.favorite === true) {
      query = query.eq('is_favorite', true).eq('user_id', userId);
    }

    // Search by name, description, or text
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,text.ilike.%${filters.search}%`
      );
    }

    // Sort: Public templates first, then by creation date
    const sortBy = filters.sort || 'created_at';
    const sortOrder = filters.order || 'desc';
    query = query.order('is_public', { ascending: false }) // Public templates first
                 .order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) throw error;

    // Add a flag to indicate if user owns the template
    const templates = (data || []).map(template => ({
      ...template,
      is_owned: template.user_id === userId,
      can_edit: template.user_id === userId,
      can_delete: template.user_id === userId
    }));

    return templates;
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    throw error;
  }
}

/**
 * Get a single template by ID
 * @param {number} templateId - Template ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Template object
 */
async function getTemplateById(templateId, userId) {
  try {
    const { data, error } = await supabase
      .from('post_templates')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('❌ Error fetching template:', error);
    throw error;
  }
}

/**
 * Create a new template
 * @param {string} userId - User ID
 * @param {object} templateData - Template data
 * @returns {Promise<object>} Created template
 */
async function createTemplate(userId, templateData) {
  try {
    // Validate userId is a proper UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      throw new Error('Invalid user ID. Please log in again.');
    }
    
    // Validate input
    if (!templateData) {
      throw new Error('Template data is required');
    }

    const { 
      name, 
      description, 
      text, 
      image_url, 
      platforms, 
      category = 'general', 
      tags = [] 
    } = templateData;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('Template name is required and must be a non-empty string');
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new Error('Template content is required and must be a non-empty string');
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      throw new Error('At least one platform is required');
    }

    // Validate platforms
    const validPlatforms = ['linkedin', 'twitter', 'facebook', 'instagram', 'telegram'];
    const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
    
    if (invalidPlatforms.length > 0) {
      throw new Error(`Invalid platform(s): ${invalidPlatforms.join(', ')}. Valid platforms are: ${validPlatforms.join(', ')}`);
    }

    // Prepare template data
    const templateToCreate = {
      user_id: userId,
      name: name.trim(),
      description: description ? String(description).trim() : null,
      text: text.trim(),
      image_url: image_url || null,
      platforms: platforms,
      category: String(category || 'general').toLowerCase(),
      tags: Array.isArray(tags) ? tags : [String(tags)],
      use_count: 0,
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating template with data:', templateToCreate);

    const { data, error } = await supabase
      .from('post_templates')
      .insert([templateToCreate])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`✅ Template created: ${data.name} (ID: ${data.id})`);
    return data;
  } catch (error) {
    console.error('❌ Error creating template:', error);
    throw error;
  }
}

/**
 * Update a template
 * @param {number} templateId - Template ID
 * @param {string} userId - User ID (for authorization)
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated template
 */
async function updateTemplate(templateId, userId, updates) {
  try {
    // Remove fields that shouldn't be updated directly
    const { id, user_id, created_at, use_count, last_used_at, ...allowedUpdates } = updates;

    const { data, error } = await supabase
      .from('post_templates')
      .update(allowedUpdates)
      .eq('id', templateId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Template updated: ${data.name} (ID: ${data.id})`);

    return data;
  } catch (error) {
    console.error('❌ Error updating template:', error);
    throw error;
  }
}

/**
 * Delete a template
 * @param {number} templateId - Template ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<boolean>} Success status
 */
async function deleteTemplate(templateId, userId) {
  try {
    const { error } = await supabase
      .from('post_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId);

    if (error) throw error;

    console.log(`✅ Template deleted: ID ${templateId}`);

    return true;
  } catch (error) {
    console.error('❌ Error deleting template:', error);
    throw error;
  }
}

/**
 * Increment template use count
 * @param {number} templateId - Template ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<object>} Updated template
 */
async function incrementTemplateUse(templateId, userId) {
  try {
    // First verify the template belongs to the user
    const template = await getTemplateById(templateId, userId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    const { data, error } = await supabase
      .from('post_templates')
      .update({
        use_count: template.use_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('❌ Error incrementing template use:', error);
    throw error;
  }
}

/**
 * Toggle template favorite status
 * @param {number} templateId - Template ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} Updated template
 */
async function toggleTemplateFavorite(templateId, userId) {
  try {
    const template = await getTemplateById(templateId, userId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    const { data, error } = await supabase
      .from('post_templates')
      .update({
        is_favorite: !template.is_favorite
      })
      .eq('id', templateId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Template favorite toggled: ${data.name} (${data.is_favorite ? 'favorited' : 'unfavorited'})`);

    return data;
  } catch (error) {
    console.error('❌ Error toggling favorite:', error);
    throw error;
  }
}

/**
 * Duplicate a template
 * @param {number} templateId - Template ID to duplicate
 * @param {string} userId - User ID
 * @returns {Promise<object>} New template
 */
async function duplicateTemplate(templateId, userId) {
  try {
    // Try to get template (works for both owned and public templates)
    const { data: original, error: fetchError } = await supabase
      .from('post_templates')
      .select('*')
      .eq('id', templateId)
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .single();
    
    if (fetchError || !original) {
      throw new Error('Template not found or access denied');
    }

    // Create a copy with modified name
    const { data, error } = await supabase
      .from('post_templates')
      .insert([
        {
          user_id: userId,
          name: `${original.name} (Copy)`,
          description: original.description,
          text: original.text,
          image_url: original.image_url,
          platforms: original.platforms,
          category: original.category,
          tags: original.tags,
          use_count: 0,
          is_favorite: false,
          is_public: false // User's copy is private by default
        }
      ])
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Template duplicated: ${data.name} (ID: ${data.id})`);

    return data;
  } catch (error) {
    console.error('❌ Error duplicating template:', error);
    throw error;
  }
}

/**
 * Clone a public template to user's account
 * @param {number} templateId - Template ID to clone
 * @param {string} userId - User ID
 * @returns {Promise<object>} New template
 */
async function clonePublicTemplate(templateId, userId) {
  try {
    // Get the public template
    const { data: original, error: fetchError } = await supabase
      .from('post_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_public', true)
      .single();
    
    if (fetchError || !original) {
      throw new Error('Public template not found');
    }

    // Create a private copy for the user
    const { data, error } = await supabase
      .from('post_templates')
      .insert([
        {
          user_id: userId,
          name: original.name, // Keep original name (user can edit)
          description: original.description,
          text: original.text,
          image_url: original.image_url,
          platforms: original.platforms,
          category: original.category,
          tags: original.tags,
          use_count: 0,
          is_favorite: false,
          is_public: false
        }
      ])
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Public template cloned: ${data.name} (ID: ${data.id})`);

    return data;
  } catch (error) {
    console.error('❌ Error cloning template:', error);
    throw error;
  }
}

/**
 * Get template categories with counts
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of categories with counts
 */
async function getTemplateCategories(userId) {
  try {
    const { data, error } = await supabase
      .from('post_templates')
      .select('category')
      .eq('user_id', userId);

    if (error) throw error;

    // Count templates per category
    const categoryCounts = {};
    data.forEach(template => {
      const category = template.category || 'general';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Convert to array format
    const categories = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count
    }));

    return categories;
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    throw error;
  }
}

/**
 * Get template statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Template statistics
 */
async function getTemplateStats(userId) {
  try {
    const { data, error } = await supabase
      .from('post_templates')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: data.length,
      favorites: data.filter(t => t.is_favorite).length,
      mostUsed: data.sort((a, b) => b.use_count - a.use_count).slice(0, 5),
      byCategory: {},
      totalUses: data.reduce((sum, t) => sum + t.use_count, 0)
    };

    // Count by category
    data.forEach(template => {
      const category = template.category || 'general';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('❌ Error fetching template stats:', error);
    throw error;
  }
}

/**
 * Process template variables
 * Replace {{variable}} placeholders with actual values
 * Supports date, time, custom variables, and special formatting
 * @param {string} text - Template text with variables
 * @param {object} variables - Key-value pairs for replacement
 * @returns {string} Processed text
 */
function processTemplateVariables(text, variables = {}) {
  let processed = text;
  const now = new Date();

  // Default variables - Auto-populated with current date/time
  const defaults = {
    // Date/Time variables
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    day: now.toLocaleDateString('en-US', { weekday: 'long' }),
    month: now.toLocaleDateString('en-US', { month: 'long' }),
    year: now.getFullYear().toString(),

    // Common placeholder variables (users can fill these)
    hashtags: '#YourHashtags',
    mention: '@username',
    emoji: '✨',
    cta: 'Click here',
    call_to_action: 'Learn more →',
    link: 'https://yourlink.com',
    brand: 'Your Brand',
    company: 'Your Company',
    product: 'Your Product',
    product_name: 'Product Name',
    logo_emoji: '🎯',

    // Social proof variables
    testimonial: 'Customer testimonial here',
    customer_name: 'Customer Name',
    customer_title: 'Customer Title',
    rating: '5 stars',
    review: 'Great experience!',

    // Content variables
    topic: 'Your Topic',
    niche: 'Your Niche',
    industry: 'Your Industry',
    question: 'Your Question Here',
    answer: 'Your Answer Here',
    quote: 'Inspirational Quote',
    author: 'Quote Author',
    tip_content: 'Helpful tip goes here',

    // Personalization variables
    first_name: 'User',
    location: 'Your Location',

    // Additional variables
    trending_topic: '#TrendingTopic',
    random_emoji: '🚀',
    line_break: '\n',
    bullet: '•',
    number: '1',

    // Event/offer variables
    event_name: 'Event Name',
    event_date: 'Date',
    event_time: 'Time',
    registration_link: 'https://register.com',
    discount: '20',
    price_or_discount: '$99 → $49',
    coupon_code: 'SAVE20',
    end_date: now.toLocaleDateString(),
    offer_description: 'Special offer description',
    special_offer_or_benefit: 'Exclusive benefit',

    // Article/blog variables
    article_title: 'Article Title',
    excerpt: 'Short excerpt of article',
    blog_url: 'https://blog.yoursite.com',
    content_type: 'Photos',

    // Partnership/collaboration variables
    partner_name: 'Partner Name',
    partnership_details: 'Partnership details',
    benefits_for_audience: 'How it benefits you',

    // Community/user variables
    member_name: 'Member Name',
    what_makes_them_special: 'why they\'re awesome',
    their_quote: 'Member quote',
    their_contribution: 'What they contributed',

    // Feature/product variables
    feature_name: 'Feature Name',
    feature_description: 'What the feature does',
    benefit1: 'Benefit 1',
    benefit2: 'Benefit 2',
    benefit3: 'Benefit 3',

    // Thank you/appreciation variables
    what_customers_do: 'your amazing support',
    positive_impact: 'great things',
    gratitude_message: 'Thank you message',

    // Job/recruitment variables
    job_title: 'Job Title',
    job_type: 'Full-time',
    brief_description: 'Brief description',
    apply_link: 'https://careers.yoursite.com',

    // Case study variables
    company_name: 'Company Name',
    challenge: 'Challenge faced',
    solution: 'Solution provided',
    result_metric: 'Impressive result',

    // Transformation variables
    before_description: 'Before state',
    after_description: 'After state',
    transformation_results: 'Results achieved',

    // Thought leadership variables
    opinion: 'Your hot take here',
    explanation: 'Why you believe this',

    // Crisis communication variables
    issue: 'Issue description',
    explanation: 'Detailed explanation',
    timeline: 'Expected duration',
    solution: 'What we\'re doing about it',
    contact_info: 'support@yoursite.com',

    // Milestone variables
    follower_count: '10K',
    milestone: '10,000 followers',
    followers: 'followers',
    what_it_means: 'what this achievement means'
  };

  // Merge with provided variables (user inputs override defaults)
  const allVariables = { ...defaults, ...variables };

  // Replace all {{variable}} patterns
  Object.entries(allVariables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'gi');
    processed = processed.replace(regex, String(value || ''));
  });

  return processed;
}

/**
 * Get available template variables with descriptions
 * Useful for UI hints and variable picker
 * @returns {object} Object with variable names and descriptions
 */
function getAvailableVariables() {
  return {
    // Date/Time
    date: { description: 'Current date (MM/DD/YYYY)', category: 'Date/Time' },
    time: { description: 'Current time (HH:MM)', category: 'Date/Time' },
    day: { description: 'Day of week (e.g., Monday)', category: 'Date/Time' },
    month: { description: 'Current month name', category: 'Date/Time' },
    year: { description: 'Current year (e.g., 2025)', category: 'Date/Time' },

    // Brand/Company
    brand: { description: 'Your brand name', category: 'Brand' },
    company: { description: 'Your company name', category: 'Brand' },
    product: { description: 'Your product name', category: 'Brand' },
    logo_emoji: { description: 'Brand emoji/symbol', category: 'Brand' },

    // Content
    hashtags: { description: 'Relevant hashtags', category: 'Content' },
    mention: { description: 'User/account mention', category: 'Content' },
    emoji: { description: 'Relevant emoji', category: 'Content' },
    cta: { description: 'Call to action (short)', category: 'Content' },
    call_to_action: { description: 'Call to action (full)', category: 'Content' },
    link: { description: 'URL/link to share', category: 'Content' },
    topic: { description: 'Main topic/subject', category: 'Content' },
    question: { description: 'Question for engagement', category: 'Content' },

    // Social Proof
    testimonial: { description: 'Customer testimonial/review', category: 'Social Proof' },
    customer_name: { description: 'Customer/user name', category: 'Social Proof' },
    rating: { description: 'Star rating or review score', category: 'Social Proof' },

    // Personalization
    first_name: { description: 'User\'s first name', category: 'Personalization' },
    location: { description: 'User location/city', category: 'Personalization' },

    // Events
    event_name: { description: 'Event/webinar name', category: 'Events' },
    event_date: { description: 'Event date', category: 'Events' },
    event_time: { description: 'Event time', category: 'Events' },
    registration_link: { description: 'Registration URL', category: 'Events' }
  };
}

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  incrementTemplateUse,
  toggleTemplateFavorite,
  duplicateTemplate,
  clonePublicTemplate,
  getTemplateCategories,
  getTemplateStats,
  processTemplateVariables,
  getAvailableVariables
};
