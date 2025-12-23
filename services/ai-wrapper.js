/**
 * AI Wrapper Service
 * Wraps Anthropic API calls with cost tracking and spending limits
 */

const Anthropic = require('@anthropic-ai/sdk');
const costTracker = require('./cost-tracker');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Estimate tokens in a string (rough approximation)
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil((text?.length || 0) / 4);
}

/**
 * Make an AI API call with cost tracking and spending limits
 * @param {Object} options - API call options
 * @param {string} options.model - Model name (defaults to cheapest)
 * @param {number} options.max_tokens - Max output tokens
 * @param {Array} options.messages - Message array
 * @param {number} options.temperature - Temperature (optional)
 * @param {string} options.userId - User ID for tracking (optional)
 * @param {string} options.feature - Feature name for tracking (optional)
 * @param {string} options.taskType - Task type for model selection ('simple', 'complex', 'creative')
 * @returns {Promise<Object>} API response with cost info
 */
async function makeAICall(options) {
  const {
    model = null,
    max_tokens = 1000,
    messages = [],
    temperature = 0.7,
    userId = null,
    feature = 'ai_call',
    taskType = 'simple'
  } = options;

  // Use cheapest model if not specified
  const selectedModel = model || costTracker.getCheapestModel(taskType);

  // Estimate input tokens
  const inputText = messages.map(m => m.content).join(' ');
  const estimatedInputTokens = estimateTokens(inputText);

  // Estimate cost
  const estimatedCost = costTracker.estimateCost(selectedModel, estimatedInputTokens, max_tokens);

  // Check spending limits BEFORE making the call
  const limitCheck = await costTracker.checkSpendingLimit(estimatedCost);
  if (!limitCheck.allowed) {
    throw new Error(`Spending limit exceeded: ${limitCheck.reason}. Please try again later or contact support.`);
  }

  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)} (${estimatedInputTokens} in tokens, ${max_tokens} max out, model: ${selectedModel})`);

  try {
    // Make the API call
    const response = await anthropic.messages.create({
      model: selectedModel,
      max_tokens: max_tokens,
      temperature: temperature,
      messages: messages
    });

    // Extract actual token usage
    const inputTokens = response.usage?.input_tokens || estimatedInputTokens;
    const outputTokens = response.usage?.output_tokens || Math.floor(max_tokens * 0.5);

    // Record actual cost
    await costTracker.recordCost(selectedModel, inputTokens, outputTokens, userId, feature);

    // Add cost info to response
    const actualCost = costTracker.estimateCost(selectedModel, inputTokens, outputTokens);
    response._cost = {
      model: selectedModel,
      inputTokens: inputTokens,
      outputTokens: outputTokens,
      estimatedCost: estimatedCost,
      actualCost: actualCost
    };

    return response;
  } catch (error) {
    console.error(`❌ AI API call failed (model: ${selectedModel}):`, error.message);
    throw error;
  }
}

/**
 * Get spending summary
 * @returns {Promise<Object>} Spending summary
 */
async function getSpendingSummary() {
  return await costTracker.getSpendingSummary();
}

module.exports = {
  makeAICall,
  getSpendingSummary,
  estimateTokens,
  anthropic // Export original client for advanced use cases
};

