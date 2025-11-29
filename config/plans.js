/**
 * Plan Configuration
 * Defines pricing tiers, limits, and features for the SaaS application
 */

const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    annual: 0,
    limits: {
      posts: 10,           // 10 posts per month
      accounts: 1,         // 1 social media account
      ai: 0,               // No AI captions
      platforms: ['linkedin', 'twitter', 'youtube']  // Only LinkedIn and Twitter
    },
    features: [
      '10 posts per month',
      '1 social account',
      'LinkedIn or Twitter only',
      'Community support',
      'Basic scheduling',
      'Post history'
    ],
    features_excluded: [
      'AI caption generation',
      'Instagram support',
      'CSV bulk upload',
      'Priority support',
      'API access'
    ]
  },

  pro: {
    name: 'Pro',
    price: 0,
    annual: 0,          // Free
    limits: {
      posts: Infinity,    // Unlimited posts
      accounts: 3,        // 3 social media accounts
      ai: 100,            // 100 AI generations per month
      platforms: ['linkedin', 'twitter', 'instagram']  // All platforms
    },
    features: [
      'Unlimited posts',
      '3 social accounts',
      'All platforms (LinkedIn, Twitter, Instagram)',
      '100 AI caption generations/month',
      'CSV bulk upload',
      'Email support',
      'Advanced scheduling',
      'Full analytics',
      'Post templates'
    ],
    razorpay_monthly_plan_id: null,
    razorpay_annual_plan_id: null
  },

  business: {
    name: 'Business',
    price: 0,
    annual: 0,          // Free
    limits: {
      posts: Infinity,    // Unlimited posts
      accounts: 10,       // 10 social media accounts
      ai: Infinity,       // Unlimited AI generations
      platforms: ['linkedin', 'twitter', 'instagram']  // All platforms
    },
    features: [
      'Unlimited everything',
      '10 social accounts',
      'All platforms',
      'Unlimited AI captions',
      'CSV bulk upload',
      'Priority support',
      'API access',
      'White-label option',
      'Remove branding',
      'Custom integrations',
      'Dedicated account manager'
    ],
    razorpay_monthly_plan_id: null,
    razorpay_annual_plan_id: null
  }
};

/**
 * Get plan by name
 * @param {string} planName - Name of the plan (free, pro, business)
 * @returns {object} Plan configuration
 */
function getPlan(planName) {
  const plan = PLANS[planName.toLowerCase()];
  if (!plan) {
    throw new Error(`Plan "${planName}" not found`);
  }
  return plan;
}

/**
 * Get all available plans
 * @returns {object} All plans
 */
function getAllPlans() {
  return PLANS;
}

/**
 * Check if user has reached limit for a specific resource
 * @param {string} planName - User's current plan
 * @param {string} resource - Resource to check (posts, accounts, ai)
 * @param {number} currentUsage - Current usage count
 * @returns {object} { allowed: boolean, limit: number, remaining: number }
 */
function checkLimit(planName, resource, currentUsage) {
  const plan = getPlan(planName);
  const limit = plan.limits[resource];

  if (limit === Infinity) {
    return {
      allowed: true,
      limit: 'Unlimited',
      remaining: 'Unlimited'
    };
  }

  const remaining = Math.max(0, limit - currentUsage);
  const allowed = currentUsage < limit;

  return {
    allowed,
    limit,
    remaining,
    usage: currentUsage
  };
}

/**
 * Apply soft limit grace
 * Allows users to exceed limits by a small amount before blocking
 * @param {string} planName - User's current plan
 * @param {string} resource - Resource to check
 * @param {number} currentUsage - Current usage count
 * @param {number} graceAmount - Number of extra allowed (default: 2)
 * @returns {object} Limit check result with grace applied
 */
function checkLimitWithGrace(planName, resource, currentUsage, graceAmount = 2) {
  const plan = getPlan(planName);
  const limit = plan.limits[resource];

  if (limit === Infinity) {
    return {
      allowed: true,
      hardBlock: false,
      limit: 'Unlimited',
      remaining: 'Unlimited',
      message: null
    };
  }

  const remaining = limit - currentUsage;
  const inGracePeriod = currentUsage >= limit && currentUsage < (limit + graceAmount);
  const hardBlock = currentUsage >= (limit + graceAmount);

  let message = null;
  if (hardBlock) {
    message = `You've reached your ${plan.name} plan limit of ${limit} ${resource} per month. Please upgrade to continue.`;
  } else if (inGracePeriod) {
    message = `You've used ${currentUsage}/${limit} ${resource} this month. Consider upgrading to ${planName === 'free' ? 'Pro' : 'Business'} for unlimited access.`;
  } else if (remaining <= 2 && remaining > 0) {
    message = `Warning: Only ${remaining} ${resource} remaining this month.`;
  }

  return {
    allowed: !hardBlock,
    hardBlock,
    inGracePeriod,
    limit,
    remaining: Math.max(0, remaining),
    usage: currentUsage,
    message
  };
}

/**
 * Get recommended upgrade plan
 * @param {string} currentPlan - User's current plan
 * @returns {string} Recommended plan to upgrade to
 */
function getRecommendedUpgrade(currentPlan) {
  const upgradePath = {
    'free': 'pro',
    'pro': 'business',
    'business': null  // Already on highest plan
  };

  return upgradePath[currentPlan.toLowerCase()] || null;
}

/**
 * Calculate savings for annual billing
 * @param {string} planName - Plan name
 * @returns {object} { monthly: number, annual: number, savings: number, monthsFree: number }
 */
function calculateAnnualSavings(planName) {
  const plan = getPlan(planName);

  if (plan.price === 0) {
    return null;  // Free plan has no annual option
  }

  const monthlyTotal = plan.price * 12;
  const savings = monthlyTotal - plan.annual;
  const monthsFree = Math.round(savings / plan.price);

  return {
    monthly: plan.price,
    monthlyTotal,
    annual: plan.annual,
    savings,
    monthsFree,
    savingsPercent: Math.round((savings / monthlyTotal) * 100)
  };
}

/**
 * Check if a feature is available for a plan
 * @param {string} planName - Plan name
 * @param {string} feature - Feature to check (e.g., 'ai_captions', 'bulk_upload')
 * @returns {boolean} Whether the feature is available
 */
function hasFeature(planName, feature) {
  const plan = getPlan(planName);

  const featureMap = {
    'ai_captions': plan.limits.ai > 0,
    'bulk_upload': planName !== 'free',
    'all_platforms': plan.limits.platforms.includes('instagram'),
    'api_access': planName === 'business',
    'priority_support': planName === 'business',
    'white_label': planName === 'business',
    'unlimited_posts': plan.limits.posts === Infinity,
    'unlimited_ai': plan.limits.ai === Infinity
  };

  return featureMap[feature] !== undefined ? featureMap[feature] : false;
}

module.exports = {
  PLANS,
  getPlan,
  getAllPlans,
  checkLimit,
  checkLimitWithGrace,
  getRecommendedUpgrade,
  calculateAnnualSavings,
  hasFeature
};

