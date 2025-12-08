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
      posts: 10,
      accounts: 5,
      ai: 5,
      images: 5,
      videos: 0,
      voice: 0,
      team: 0,
      platforms: ['linkedin', 'twitter', 'youtube']
    },
    features: [
      '10 posts per month',
      '5 specific accounts',
      '5 AI post generations',
      '5 Images per month',
      'Community support'
    ],
    features_excluded: [
      'Videos',
      'Voice generation',
      'Team members',
      'API access',
      'White-label'
    ]
  },

  pro: {
    name: 'Pro',
    price: 1000,        // ₹1000/month
    annual: 10000,      // ₹10000/year (2 months free)
    limits: {
      posts: 100,
      accounts: 20,
      ai: Infinity,
      images: 50,
      videos: 20,
      voice: 10,
      team: 1,
      platforms: ['linkedin', 'twitter', 'instagram', 'youtube']
    },
    features: [
      '100 posts per month',
      'All 20+ accounts',
      'Unlimited AI post gen',
      '50 Images/month',
      '20 Videos',
      '10 Voice generations',
      '1 Team member',
      'Email support'
    ],
    razorpay_monthly_plan_id: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
    razorpay_annual_plan_id: process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID
  },

  business: {
    name: 'Business',
    price: 5000,        // ₹5000/month
    annual: 50000,     // ₹50000/year (2 months free)
    limits: {
      posts: Infinity,
      accounts: 50,
      ai: Infinity,
      images: Infinity,
      videos: Infinity,
      voice: Infinity,
      team: 5,
      platforms: ['linkedin', 'twitter', 'instagram', 'youtube']
    },
    features: [
      'Unlimited posts',
      'All 20+ accounts',
      'Unlimited AI & Images',
      'Unlimited Videos',
      'Unlimited Voice gen',
      '5 Team members',
      'API Access',
      'White-label options',
      'Priority support'
    ],
    razorpay_monthly_plan_id: process.env.RAZORPAY_BUSINESS_MONTHLY_PLAN_ID,
    razorpay_annual_plan_id: process.env.RAZORPAY_BUSINESS_ANNUAL_PLAN_ID
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

// Validate plan IDs on module load
function validatePlanIds() {
  const missing = [];

  if (!PLANS.pro.razorpay_monthly_plan_id) {
    missing.push('RAZORPAY_PRO_MONTHLY_PLAN_ID');
  }
  if (!PLANS.pro.razorpay_annual_plan_id) {
    missing.push('RAZORPAY_PRO_ANNUAL_PLAN_ID');
  }
  if (!PLANS.business.razorpay_monthly_plan_id) {
    missing.push('RAZORPAY_BUSINESS_MONTHLY_PLAN_ID');
  }
  if (!PLANS.business.razorpay_annual_plan_id) {
    missing.push('RAZORPAY_BUSINESS_ANNUAL_PLAN_ID');
  }

  if (missing.length > 0) {
    console.warn('⚠️  Missing Razorpay Plan IDs:', missing.join(', '));
    console.warn('⚠️  Some subscription features may not work correctly.');
  } else {
    console.log('✅ All Razorpay Plan IDs configured');
    console.log('📋 Plan IDs:', {
      pro_monthly: PLANS.pro.razorpay_monthly_plan_id,
      pro_annual: PLANS.pro.razorpay_annual_plan_id,
      business_monthly: PLANS.business.razorpay_monthly_plan_id,
      business_annual: PLANS.business.razorpay_annual_plan_id
    });
  }
}

// Run validation on module load
if (process.env.NODE_ENV !== 'test') {
  validatePlanIds();
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

