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
    let query = supabase
      .from('post_templates')
      .select('*')
      .eq('user_id', userId);

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    // Filter by favorite
    if (filters.favorite === true) {
      query = query.eq('is_favorite', true);
    }

    // Search by name, description, or text
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,text.ilike.%${filters.search}%`
      );
    }

    // Sort
    const sortBy = filters.sort || 'created_at';
    const sortOrder = filters.order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
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
    const original = await getTemplateById(templateId, userId);
    
    if (!original) {
      throw new Error('Template not found');
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
          is_favorite: false
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
 * @param {string} text - Template text with variables
 * @param {object} variables - Key-value pairs for replacement
 * @returns {string} Processed text
 */
function processTemplateVariables(text, variables = {}) {
  let processed = text;

  // Default variables
  const defaults = {
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    month: new Date().toLocaleDateString('en-US', { month: 'long' }),
    year: new Date().getFullYear().toString()
  };

  // Merge with provided variables
  const allVariables = { ...defaults, ...variables };

  // Replace all {{variable}} patterns
  Object.entries(allVariables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'gi');
    processed = processed.replace(regex, value);
  });

  return processed;
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
  getTemplateCategories,
  getTemplateStats,
  processTemplateVariables
};
