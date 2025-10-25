/**
 * Billing Service
 * Handles Stripe subscription billing, usage tracking, and plan limits
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('./database');
const { getPlan, checkLimitWithGrace, getRecommendedUpgrade } = require('../config/plans');

// ============================================
// STRIPE CHECKOUT & SUBSCRIPTIONS
// ============================================

/**
 * Create Stripe checkout session for subscription
 * @param {string} userId - User ID from Supabase auth
 * @param {string} priceId - Stripe price ID (monthly or annual)
 * @param {string} plan - Plan name (pro, business)
 * @param {string} successUrl - Success redirect URL
 * @param {string} cancelUrl - Cancel redirect URL
 * @returns {object} Checkout session
 */
async function createCheckoutSession(userId, priceId, plan, successUrl, cancelUrl) {
  try {
    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    let customerId = subscription?.stripe_customer_id;
    
    // Get user email
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    
    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.user.email,
        metadata: {
          supabase_user_id: userId
        }
      });
      customerId = customer.id;
      
      // Store customer ID
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', userId);
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 14,  // 14-day free trial
        metadata: {
          supabase_user_id: userId,
          plan: plan
        }
      },
      metadata: {
        supabase_user_id: userId,
        plan: plan
      }
    });
    
    return {
      success: true,
      sessionId: session.id,
      url: session.url
    };
    
  } catch (error) {
    console.error('❌ Error creating checkout session:', error.message);
    throw error;
  }
}

/**
 * Create Stripe customer portal session
 * Allows users to manage their subscription
 * @param {string} userId - User ID
 * @param {string} returnUrl - Return URL after portal
 * @returns {object} Portal session
 */
async function createPortalSession(userId, returnUrl) {
  try {
    // Get customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    if (!subscription?.stripe_customer_id) {
      throw new Error('No Stripe customer found');
    }
    
    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl
    });
    
    return {
      success: true,
      url: session.url
    };
    
  } catch (error) {
    console.error('❌ Error creating portal session:', error.message);
    throw error;
  }
}

// ============================================
// STRIPE WEBHOOKS
// ============================================

/**
 * Handle Stripe webhook events
 * @param {object} event - Stripe webhook event
 * @returns {object} Result
 */
async function handleWebhook(event) {
  try {
    console.log(`📨 Stripe webhook: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        return await handleCheckoutCompleted(event.data.object);
      
      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(event.data.object);
      
      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(event.data.object);
      
      case 'invoice.payment_succeeded':
        return await handlePaymentSucceeded(event.data.object);
      
      case 'invoice.payment_failed':
        return await handlePaymentFailed(event.data.object);
      
      default:
        console.log(`⚠️  Unhandled webhook event: ${event.type}`);
        return { success: true, message: 'Event type not handled' };
    }
    
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    throw error;
  }
}

/**
 * Handle checkout session completed
 * @param {object} session - Checkout session
 */
async function handleCheckoutCompleted(session) {
  const userId = session.metadata.supabase_user_id;
  const plan = session.metadata.plan;
  const subscriptionId = session.subscription;
  const customerId = session.customer;
  
  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Update subscription in database
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan: plan,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
    }, {
      onConflict: 'user_id'
    });
  
  if (error) throw error;
  
  console.log(`✅ Subscription activated for user ${userId} (${plan})`);
  
  return { success: true };
}

/**
 * Handle subscription updated
 * @param {object} subscription - Stripe subscription
 */
async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata.supabase_user_id;
  
  // Update subscription status
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
  
  if (error) throw error;
  
  console.log(`✅ Subscription updated for user ${userId}`);
  
  return { success: true };
}

/**
 * Handle subscription deleted/cancelled
 * @param {object} subscription - Stripe subscription
 */
async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata.supabase_user_id;
  
  // Downgrade to free plan
  const { error } = await supabase
    .from('subscriptions')
    .update({
      plan: 'free',
      status: 'cancelled',
      stripe_subscription_id: null
    })
    .eq('stripe_subscription_id', subscription.id);
  
  if (error) throw error;
  
  console.log(`✅ Subscription cancelled for user ${userId}, downgraded to free`);
  
  return { success: true };
}

/**
 * Handle successful payment
 * @param {object} invoice - Stripe invoice
 */
async function handlePaymentSucceeded(invoice) {
  console.log(`✅ Payment succeeded for customer ${invoice.customer}`);
  return { success: true };
}

/**
 * Handle failed payment
 * @param {object} invoice - Stripe invoice
 */
async function handlePaymentFailed(invoice) {
  // Update subscription status to past_due
  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_customer_id', invoice.customer);
  
  if (error) throw error;
  
  console.log(`⚠️  Payment failed for customer ${invoice.customer}`);
  
  return { success: true };
}

// ============================================
// USAGE TRACKING
// ============================================

/**
 * Get current month usage for a user
 * @param {string} userId - User ID
 * @returns {object} Usage stats
 */
async function getUsage(userId) {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);  // First day of month
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
    console.error('❌ Error getting usage:', error.message);
    return {
      posts_count: 0,
      ai_count: 0,
      accounts_count: 0
    };
  }
}

/**
 * Increment usage count
 * @param {string} userId - User ID
 * @param {string} resource - Resource type (posts, ai, accounts)
 * @param {number} amount - Amount to increment (default: 1)
 */
async function incrementUsage(userId, resource, amount = 1) {
  try {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const monthStr = currentMonth.toISOString().split('T')[0];
    
    // Get current usage
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
      // Update existing
      await supabase
        .from('usage')
        .update({
          [column]: existing[column] + amount
        })
        .eq('user_id', userId)
        .eq('month', monthStr);
    } else {
      // Create new
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

/**
 * Check if user can perform an action based on their plan limits
 * @param {string} userId - User ID
 * @param {string} resource - Resource to check (posts, ai, accounts)
 * @returns {object} { allowed: boolean, message: string, limit: object }
 */
async function checkUsage(userId, resource) {
  try {
    // Get user's subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .single();
    
    const plan = sub?.plan || 'free';
    
    // Get current usage
    const usage = await getUsage(userId);
    const currentUsage = usage[`${resource}_count`] || 0;
    
    // Check limit with grace period
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
    console.error('❌ Error checking usage:', error.message);
    // Default to allowing action if there's an error
    return { allowed: true, message: null };
  }
}

/**
 * Get user's subscription info with usage
 * @param {string} userId - User ID
 * @returns {object} Subscription and usage info
 */
async function getUserBillingInfo(userId) {
  try {
    // Get subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const plan = sub?.plan || 'free';
    const planDetails = getPlan(plan);
    
    // Get usage
    const usage = await getUsage(userId);
    
    // Get connected accounts count
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
  // Checkout & Portal
  createCheckoutSession,
  createPortalSession,
  
  // Webhooks
  handleWebhook,
  
  // Usage Tracking
  getUsage,
  incrementUsage,
  checkUsage,
  getUserBillingInfo
};

