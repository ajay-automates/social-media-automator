/**
 * AI Cost Tracker Service
 * Tracks API costs and enforces spending limits
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials for cost tracker');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Claude API Pricing (per 1M tokens)
const PRICING = {
  'claude-3-5-haiku-20241022': {
    input: 0.25,   // $0.25 per 1M input tokens
    output: 1.25  // $1.25 per 1M output tokens
  },
  'claude-3-haiku-20240307': {
    input: 0.25,
    output: 1.25
  },
  'claude-sonnet-4-20250514': {
    input: 3.00,   // $3.00 per 1M input tokens
    output: 15.00  // $15.00 per 1M output tokens
  },
  'claude-sonnet-4-5-20250929': {
    input: 3.00,
    output: 15.00
  }
};

// Default to cheapest model
const DEFAULT_MODEL = 'claude-3-5-haiku-20241022';

// Global spending limits (can be overridden via environment variables)
// Increased defaults to allow more usage - user can still override via env vars
const DAILY_SPEND_LIMIT = parseFloat(process.env.AI_DAILY_SPEND_LIMIT || '1.00'); // $1.00 per day (increased from $0.50)
const MONTHLY_SPEND_LIMIT = parseFloat(process.env.AI_MONTHLY_SPEND_LIMIT || '10.00'); // $10.00 per month (increased from $5.00)

/**
 * Estimate cost for an API call
 * @param {string} model - Model name
 * @param {number} inputTokens - Estimated input tokens
 * @param {number} maxOutputTokens - Max output tokens requested
 * @returns {number} Estimated cost in USD
 */
function estimateCost(model, inputTokens, maxOutputTokens) {
  const pricing = PRICING[model] || PRICING[DEFAULT_MODEL];
  if (!pricing) {
    console.warn(`⚠️ Unknown model pricing for ${model}, using default`);
    return estimateCost(DEFAULT_MODEL, inputTokens, maxOutputTokens);
  }

  // Estimate output tokens as 50% of max_output_tokens (conservative)
  const estimatedOutputTokens = Math.floor(maxOutputTokens * 0.5);
  
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (estimatedOutputTokens / 1_000_000) * pricing.output;
  
  return inputCost + outputCost;
}

/**
 * Get cheapest model for a task
 * @param {string} taskType - Type of task ('simple', 'complex', 'creative')
 * @returns {string} Model name
 */
function getCheapestModel(taskType = 'simple') {
  // For most tasks, Haiku is sufficient and cheapest
  if (taskType === 'simple' || taskType === 'topic_selection' || taskType === 'summarization') {
    return 'claude-3-5-haiku-20241022';
  }
  
  // For complex tasks, still use Haiku (it's good enough)
  // Only use Sonnet if absolutely necessary (not recommended for cost savings)
  return 'claude-3-5-haiku-20241022';
}

/**
 * Get today's spending
 * @returns {Promise<number>} Total spending today in USD
 */
async function getTodaySpending() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('ai_cost_tracking')
      .select('cost')
      .gte('date', todayStr)
      .lt('date', new Date(today.getTime() + 86400000).toISOString().split('T')[0]);

    if (error) {
      console.error('❌ Error fetching today spending:', error);
      return 0;
    }

    return data.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0);
  } catch (error) {
    console.error('❌ Error getting today spending:', error);
    return 0;
  }
}

/**
 * Get this month's spending
 * @returns {Promise<number>} Total spending this month in USD
 */
async function getMonthSpending() {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayStr = firstDay.toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('ai_cost_tracking')
      .select('cost')
      .gte('date', firstDayStr);

    if (error) {
      console.error('❌ Error fetching month spending:', error);
      return 0;
    }

    return data.reduce((sum, record) => sum + (parseFloat(record.cost) || 0), 0);
  } catch (error) {
    console.error('❌ Error getting month spending:', error);
    return 0;
  }
}

/**
 * Check if spending limit would be exceeded
 * @param {number} estimatedCost - Estimated cost of the API call
 * @returns {Promise<{allowed: boolean, reason?: string, currentDaily?: number, currentMonthly?: number}>}
 */
async function checkSpendingLimit(estimatedCost) {
  const todaySpending = await getTodaySpending();
  const monthSpending = await getMonthSpending();

  const wouldExceedDaily = (todaySpending + estimatedCost) > DAILY_SPEND_LIMIT;
  const wouldExceedMonthly = (monthSpending + estimatedCost) > MONTHLY_SPEND_LIMIT;

  if (wouldExceedDaily) {
    return {
      allowed: false,
      reason: `Daily spending limit exceeded. Current: $${todaySpending.toFixed(2)}/${DAILY_SPEND_LIMIT.toFixed(2)}`,
      currentDaily: todaySpending,
      currentMonthly: monthSpending,
      limitDaily: DAILY_SPEND_LIMIT,
      limitMonthly: MONTHLY_SPEND_LIMIT
    };
  }

  if (wouldExceedMonthly) {
    return {
      allowed: false,
      reason: `Monthly spending limit exceeded. Current: $${monthSpending.toFixed(2)}/${MONTHLY_SPEND_LIMIT.toFixed(2)}`,
      currentDaily: todaySpending,
      currentMonthly: monthSpending,
      limitDaily: DAILY_SPEND_LIMIT,
      limitMonthly: MONTHLY_SPEND_LIMIT
    };
  }

  return {
    allowed: true,
    currentDaily: todaySpending,
    currentMonthly: monthSpending,
    limitDaily: DAILY_SPEND_LIMIT,
    limitMonthly: MONTHLY_SPEND_LIMIT
  };
}

/**
 * Record actual cost after API call
 * @param {string} model - Model used
 * @param {number} inputTokens - Actual input tokens used
 * @param {number} outputTokens - Actual output tokens used
 * @param {string} userId - User ID (optional)
 * @param {string} feature - Feature name (optional)
 * @returns {Promise<void>}
 */
async function recordCost(model, inputTokens, outputTokens, userId = null, feature = null) {
  try {
    const pricing = PRICING[model] || PRICING[DEFAULT_MODEL];
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;

    const today = new Date().toISOString().split('T')[0];

    await supabaseAdmin
      .from('ai_cost_tracking')
      .insert({
        date: today,
        model: model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost: totalCost.toFixed(6), // Store with 6 decimal precision
        user_id: userId,
        feature: feature,
        created_at: new Date().toISOString()
      });

    console.log(`💰 Cost recorded: $${totalCost.toFixed(4)} (${inputTokens} in + ${outputTokens} out tokens, model: ${model})`);
  } catch (error) {
    console.error('❌ Error recording cost:', error);
    // Don't throw - cost tracking shouldn't break the app
  }
}

/**
 * Get spending summary
 * @returns {Promise<{today: number, month: number, limitDaily: number, limitMonthly: number}>}
 */
async function getSpendingSummary() {
  const today = await getTodaySpending();
  const month = await getMonthSpending();

  return {
    today: today,
    month: month,
    limitDaily: DAILY_SPEND_LIMIT,
    limitMonthly: MONTHLY_SPEND_LIMIT,
    remainingDaily: Math.max(0, DAILY_SPEND_LIMIT - today),
    remainingMonthly: Math.max(0, MONTHLY_SPEND_LIMIT - month)
  };
}

module.exports = {
  estimateCost,
  getCheapestModel,
  checkSpendingLimit,
  recordCost,
  getSpendingSummary,
  getTodaySpending,
  getMonthSpending,
  PRICING,
  DEFAULT_MODEL,
  DAILY_SPEND_LIMIT,
  MONTHLY_SPEND_LIMIT
};

