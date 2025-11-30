/**
 * Billing Service
 * Handles Razorpay subscription billing, usage tracking, and plan limits
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const { supabase } = require('./database');
const { getPlan, checkLimitWithGrace, getRecommendedUpgrade } = require('../config/plans');

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } catch (err) {
    console.warn('⚠️ Failed to initialize Razorpay:', err.message);
  }
} else {
  console.warn('⚠️ Razorpay keys missing. Billing features disabled.');
}

// ============================================
// RAZORPAY SUBSCRIPTIONS
// ============================================

/**
 * Create Razorpay subscription
 * @param {string} userId - User ID from Supabase auth
 * @param {string} planId - Razorpay Plan ID
 * @returns {object} Subscription details
 */
async function createSubscription(userId, planId) {
  try {
    // Create subscription
    if (!razorpay) throw new Error('Payment gateway not configured');
    
    if (!planId) {
      throw new Error('Plan ID is required');
    }
    
    console.log('🔍 Creating Razorpay subscription:', { userId, planId });
    
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120, // 10 years (max limit usually)
      notes: {
        userId: userId
      }
    });

    console.log('✅ Subscription created successfully:', subscription.id);

    return {
      success: true,
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID
    };

  } catch (error) {
    console.error('❌ Error creating subscription:', error);
    console.error('❌ Error details:', {
      message: error.message,
      description: error.description,
      field: error.field,
      source: error.source,
      step: error.step,
      reason: error.reason,
      metadata: error.metadata
    });
    
    // Return more detailed error message
    const errorMessage = error.description || error.message || 'Failed to create subscription';
    throw new Error(errorMessage);
  }
}

/**
 * Verify Razorpay payment signature
 * @param {string} userId - User ID
 * @param {object} paymentData - { razorpay_payment_id, razorpay_subscription_id, razorpay_signature }
 * @param {string} planName - Plan name (pro, business)
 */
async function verifyPayment(userId, paymentData, planName) {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = paymentData;

    // Verify signature
    const text = razorpay_payment_id + '|' + razorpay_subscription_id;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    // Get subscription details to calculate dates
    if (!razorpay) throw new Error('Payment gateway not configured');
    const subDetails = await razorpay.subscriptions.fetch(razorpay_subscription_id);

    // Update subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        razorpay_subscription_id: razorpay_subscription_id,
        razorpay_customer_id: subDetails.customer_id, // Razorpay creates this automatically
        plan: planName,
        status: 'active',
        current_period_end: new Date(subDetails.current_end * 1000).toISOString(),
        trial_ends_at: null
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;

    return { success: true };

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    throw error;
  }
}

/**
 * Cancel Subscription
 * @param {string} userId - User ID
 */
async function cancelSubscription(userId) {
  try {
    // Get subscription ID
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('razorpay_subscription_id')
      .eq('user_id', userId)
      .single();

    if (!sub?.razorpay_subscription_id) {
      throw new Error('No active subscription found');
    }

    // Cancel in Razorpay
    if (razorpay) {
      await razorpay.subscriptions.cancel(sub.razorpay_subscription_id);
    }

    // Update DB
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        plan: 'free'
      })
      .eq('user_id', userId);

    return { success: true };

  } catch (error) {
    console.error('❌ Error cancelling subscription:', error);
    throw error;
  }
}

// ============================================
// RAZORPAY WEBHOOKS
// ============================================

/**
 * Handle Razorpay webhook events
 * @param {object} req - Express request object
 */
async function handleWebhook(req) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (generated_signature !== signature) {
      throw new Error('Invalid webhook signature');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // console.log(`📨 Razorpay webhook: ${event}`);

    switch (event) {
      case 'subscription.charged':
        await handleSubscriptionCharged(payload.subscription);
        break;

      case 'subscription.cancelled':
      case 'subscription.halted':
        await handleSubscriptionCancelled(payload.subscription);
        break;

      default:
        // Ignore other events
        break;
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    throw error;
  }
}

async function handleSubscriptionCharged(subscription) {
  const subId = subscription.entity.id;
  const userId = subscription.entity.notes.userId; // We attached this when creating

  if (!userId) {
    console.error('⚠️ User ID not found in subscription notes');
    return;
  }

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: new Date(subscription.entity.current_end * 1000).toISOString()
    })
    .eq('razorpay_subscription_id', subId);
}

async function handleSubscriptionCancelled(subscription) {
  const subId = subscription.entity.id;

  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      plan: 'free'
    })
    .eq('razorpay_subscription_id', subId);
}

// ============================================
// USAGE TRACKING (Same as before)
// ============================================

async function getUsage(userId) {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const { data: usage } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth.toISOString().split('T')[0])
      .single();

    return usage || {
      posts_count: 0,
      ai_count: 0,
      accounts_count: 0
    };
  } catch (error) {
    return { posts_count: 0, ai_count: 0, accounts_count: 0 };
  }
}

async function incrementUsage(userId, resource, amount = 1) {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthStr = currentMonth.toISOString().split('T')[0];

    const { data: existing } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', monthStr)
      .single();

    const columnMap = {
      'posts': 'posts_count',
      'ai': 'ai_count',
      'accounts': 'accounts_count'
    };

    const column = columnMap[resource];

    if (existing) {
      await supabase
        .from('usage')
        .update({ [column]: existing[column] + amount })
        .eq('user_id', userId)
        .eq('month', monthStr);
    } else {
      await supabase
        .from('usage')
        .insert({
          user_id: userId,
          month: monthStr,
          [column]: amount
        });
    }
  } catch (error) {
    console.error('❌ Error incrementing usage:', error.message);
  }
}

async function checkUsage(userId, resource) {
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .single();

    const plan = sub?.plan || 'free';
    const usage = await getUsage(userId);
    const currentUsage = usage[`${resource}_count`] || 0;
    const limitCheck = checkLimitWithGrace(plan, resource, currentUsage);

    if (!limitCheck.allowed) {
      const upgradePlan = getRecommendedUpgrade(plan);
      const upgradeMessage = upgradePlan ? ` Upgrade to ${upgradePlan.toUpperCase()} for unlimited access.` : '';

      return {
        allowed: false,
        hardBlock: limitCheck.hardBlock,
        message: limitCheck.message + upgradeMessage,
        limit: limitCheck,
        upgradePlan
      };
    }

    return {
      allowed: true,
      message: limitCheck.message,
      limit: limitCheck
    };
  } catch (error) {
    return { allowed: true, message: null };
  }
}

async function getUserBillingInfo(userId) {
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    const plan = sub?.plan || 'free';
    const planDetails = getPlan(plan);
    const usage = await getUsage(userId);

    const { data: accounts } = await supabase
      .from('user_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active');

    const accountsCount = accounts?.length || 0;

    return {
      plan: {
        name: plan,
        displayName: planDetails.name,
        price: planDetails.price,
        limits: planDetails.limits
      },
      subscription: {
        status: sub?.status || 'active',
        currentPeriodEnd: sub?.current_period_end,
        trialEndsAt: sub?.trial_ends_at
      },
      usage: {
        posts: {
          used: usage.posts_count,
          limit: planDetails.limits.posts,
          remaining: planDetails.limits.posts === Infinity ? 'Unlimited' : Math.max(0, planDetails.limits.posts - usage.posts_count)
        },
        ai: {
          used: usage.ai_count,
          limit: planDetails.limits.ai,
          remaining: planDetails.limits.ai === Infinity ? 'Unlimited' : Math.max(0, planDetails.limits.ai - usage.ai_count)
        },
        accounts: {
          used: accountsCount,
          limit: planDetails.limits.accounts
        }
      }
    };
  } catch (error) {
    console.error('❌ Error getting billing info:', error.message);
    throw error;
  }
}

module.exports = {
  createSubscription,
  verifyPayment,
  cancelSubscription,
  handleWebhook,
  getUsage,
  incrementUsage,
  checkUsage,
  getUserBillingInfo
};
