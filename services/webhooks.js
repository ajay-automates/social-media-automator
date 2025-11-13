/**
 * Webhook Notifications Service
 * Send webhooks to Zapier, Make, and other services
 * Supports retry logic, HMAC signatures, and comprehensive logging
 */

const axios = require('axios');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Available webhook events
 */
const WEBHOOK_EVENTS = {
  POST_SUCCESS: 'post.success',
  POST_FAILED: 'post.failed',
  POST_SCHEDULED: 'post.scheduled',
  POST_RECYCLED: 'post.recycled',
  POST_DELETED: 'post.deleted',
  CONTENT_GENERATED: 'content.generated',
  ANALYTICS_INSIGHT: 'analytics.insight'
};

/**
 * Validate webhook URL
 */
function validateWebhookUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Generate HMAC signature for webhook security
 */
function generateSignature(payload, secret) {
  if (!secret) return null;
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

/**
 * Send webhook notification
 */
async function sendWebhook(webhookId, eventType, payload, attemptNumber = 1) {
  const startTime = Date.now();

  try {
    // Get webhook configuration
    const { data: webhook, error: webhookError } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', webhookId)
      .eq('enabled', true)
      .single();

    if (webhookError || !webhook) {
      console.log(`⚠️ Webhook ${webhookId} not found or disabled`);
      return { success: false, error: 'Webhook not found or disabled' };
    }

    // Build webhook payload
    const webhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
      webhook_id: webhookId
    };

    // Generate signature if secret is provided
    const signature = generateSignature(webhookPayload, webhook.secret);

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'SocialMediaAutomator/1.0'
    };

    if (signature) {
      headers['X-Webhook-Signature'] = signature;
      headers['X-Webhook-Signature-Algorithm'] = 'sha256';
    }

    console.log(`\n🔔 Sending webhook to ${webhook.name}...`);
    console.log(`   Event: ${eventType}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Attempt: ${attemptNumber}`);

    // Send webhook
    const response = await axios.post(webhook.url, webhookPayload, {
      headers,
      timeout: 10000, // 10 second timeout
      validateStatus: () => true // Don't throw on non-2xx status
    });

    const responseTime = Date.now() - startTime;
    const success = response.status >= 200 && response.status < 300;

    // Log the webhook call
    await logWebhook({
      webhook_id: webhookId,
      user_id: webhook.user_id,
      event_type: eventType,
      post_id: payload.post_id || null,
      url: webhook.url,
      payload: webhookPayload,
      headers,
      status_code: response.status,
      response_body: JSON.stringify(response.data).substring(0, 1000), // Limit to 1000 chars
      success,
      error_message: success ? null : response.statusText,
      attempt_number: attemptNumber,
      is_retry: attemptNumber > 1,
      response_time_ms: responseTime
    });

    // Update webhook stats
    await updateWebhookStats(webhookId, success);

    if (success) {
      console.log(`✅ Webhook sent successfully (${responseTime}ms)`);
      return { success: true, status: response.status, responseTime };
    } else {
      console.log(`❌ Webhook failed with status ${response.status}`);
      
      // Retry logic
      if (webhook.retry_enabled && attemptNumber < webhook.max_retries) {
        console.log(`   🔄 Retrying in ${webhook.retry_delay_seconds} seconds...`);
        
        await new Promise(resolve => setTimeout(resolve, webhook.retry_delay_seconds * 1000));
        return sendWebhook(webhookId, eventType, payload, attemptNumber + 1);
      }
      
      return { 
        success: false, 
        status: response.status, 
        error: response.statusText,
        responseTime 
      };
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Webhook error:`, error.message);

    // Log the failed attempt
    await logWebhook({
      webhook_id: webhookId,
      user_id: payload.user_id || null,
      event_type: eventType,
      post_id: payload.post_id || null,
      url: payload.url || 'unknown',
      payload: payload,
      headers: {},
      status_code: 0,
      response_body: null,
      success: false,
      error_message: error.message,
      attempt_number: attemptNumber,
      is_retry: attemptNumber > 1,
      response_time_ms: responseTime
    });

    // Update stats
    await updateWebhookStats(webhookId, false);

    return { success: false, error: error.message, responseTime };
  }
}

/**
 * Trigger webhooks for a specific event
 */
async function triggerWebhooks(userId, eventType, payload) {
  try {
    console.log(`\n🔔 Triggering webhooks for event: ${eventType}`);

    // Get all enabled webhooks for this user that match this event
    const { data: webhooks, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true)
      .contains('events', [eventType]); // Array contains check

    if (error) throw error;

    if (!webhooks || webhooks.length === 0) {
      console.log(`   No webhooks configured for event ${eventType}`);
      return { triggered: 0, results: [] };
    }

    console.log(`   Found ${webhooks.length} webhooks to trigger`);

    // Filter by platform if specified
    const filteredWebhooks = webhooks.filter(webhook => {
      // If no platform filter, allow all
      if (!webhook.platforms || webhook.platforms.length === 0) {
        return true;
      }
      
      // If payload has platform, check if it matches
      if (payload.platform) {
        return webhook.platforms.includes(payload.platform);
      }
      
      // If payload has platforms array, check if any match
      if (payload.platforms && Array.isArray(payload.platforms)) {
        return payload.platforms.some(p => webhook.platforms.includes(p));
      }
      
      return true;
    });

    console.log(`   ${filteredWebhooks.length} webhooks match platform filters`);

    // Send all webhooks in parallel
    const results = await Promise.allSettled(
      filteredWebhooks.map(webhook => 
        sendWebhook(webhook.id, eventType, payload)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`✅ Webhooks triggered: ${successful} successful, ${failed} failed`);

    return {
      triggered: results.length,
      successful,
      failed,
      results: results.map((r, i) => ({
        webhook_id: filteredWebhooks[i].id,
        webhook_name: filteredWebhooks[i].name,
        ...r.value
      }))
    };

  } catch (error) {
    console.error('❌ Error triggering webhooks:', error);
    return { triggered: 0, successful: 0, failed: 0, error: error.message };
  }
}

/**
 * Log webhook call to database
 */
async function logWebhook(logData) {
  try {
    const { error } = await supabase
      .from('webhook_logs')
      .insert(logData);

    if (error) throw error;

  } catch (error) {
    console.error('❌ Error logging webhook:', error.message);
  }
}

/**
 * Update webhook statistics
 */
async function updateWebhookStats(webhookId, success) {
  try {
    const { data: webhook, error: fetchError } = await supabase
      .from('webhook_endpoints')
      .select('total_triggers, successful_triggers, failed_triggers')
      .eq('id', webhookId)
      .single();

    if (fetchError || !webhook) return;

    const updates = {
      total_triggers: (webhook.total_triggers || 0) + 1,
      last_triggered_at: new Date().toISOString()
    };

    if (success) {
      updates.successful_triggers = (webhook.successful_triggers || 0) + 1;
    } else {
      updates.failed_triggers = (webhook.failed_triggers || 0) + 1;
    }

    const { error: updateError } = await supabase
      .from('webhook_endpoints')
      .update(updates)
      .eq('id', webhookId);

    if (updateError) throw updateError;

  } catch (error) {
    console.error('❌ Error updating webhook stats:', error.message);
  }
}

/**
 * Get user's webhooks
 */
async function getUserWebhooks(userId) {
  try {
    const { data, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('❌ Error getting webhooks:', error);
    throw error;
  }
}

/**
 * Create webhook endpoint
 */
async function createWebhook(userId, webhookData) {
  try {
    // Validate URL
    if (!validateWebhookUrl(webhookData.url)) {
      throw new Error('Invalid webhook URL. Must start with http:// or https://');
    }

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        user_id: userId,
        name: webhookData.name,
        url: webhookData.url,
        enabled: webhookData.enabled !== undefined ? webhookData.enabled : true,
        events: webhookData.events || ['post.success', 'post.failed'],
        platforms: webhookData.platforms || [],
        secret: webhookData.secret || null,
        retry_enabled: webhookData.retry_enabled !== undefined ? webhookData.retry_enabled : true,
        max_retries: webhookData.max_retries || 3,
        retry_delay_seconds: webhookData.retry_delay_seconds || 5
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Webhook created: ${data.name}`);
    return data;

  } catch (error) {
    console.error('❌ Error creating webhook:', error);
    throw error;
  }
}

/**
 * Update webhook endpoint
 */
async function updateWebhook(userId, webhookId, updates) {
  try {
    // Validate URL if provided
    if (updates.url && !validateWebhookUrl(updates.url)) {
      throw new Error('Invalid webhook URL');
    }

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .update(updates)
      .eq('id', webhookId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Webhook updated: ${webhookId}`);
    return data;

  } catch (error) {
    console.error('❌ Error updating webhook:', error);
    throw error;
  }
}

/**
 * Delete webhook endpoint
 */
async function deleteWebhook(userId, webhookId) {
  try {
    const { error } = await supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', userId);

    if (error) throw error;

    console.log(`✅ Webhook deleted: ${webhookId}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error deleting webhook:', error);
    throw error;
  }
}

/**
 * Test webhook endpoint
 */
async function testWebhook(userId, webhookId) {
  try {
    const testPayload = {
      user_id: userId,
      post_id: null,
      test: true,
      message: 'This is a test webhook from Social Media Automator',
      timestamp: new Date().toISOString()
    };

    const result = await sendWebhook(webhookId, 'test.webhook', testPayload);

    return result;

  } catch (error) {
    console.error('❌ Error testing webhook:', error);
    throw error;
  }
}

/**
 * Get webhook logs
 */
async function getWebhookLogs(userId, webhookId = null, limit = 50) {
  try {
    let query = supabase
      .from('webhook_logs')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (webhookId) {
      query = query.eq('webhook_id', webhookId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('❌ Error getting webhook logs:', error);
    throw error;
  }
}

/**
 * Get webhook statistics
 */
async function getWebhookStats(userId) {
  try {
    const { data, error } = await supabase
      .from('webhook_stats')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('❌ Error getting webhook stats:', error);
    throw error;
  }
}

module.exports = {
  WEBHOOK_EVENTS,
  validateWebhookUrl,
  sendWebhook,
  triggerWebhooks,
  getUserWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookLogs,
  getWebhookStats
};

