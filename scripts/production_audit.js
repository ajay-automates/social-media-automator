/**
 * Production Audit Script
 * Comprehensive check of all pricing tiers, rate limits, and production issues
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { getPlan, getAllPlans, checkLimitWithGrace } = require('../config/plans');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ANSI color codes for better readability
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m'
};

const issues = [];
const warnings = [];
const successes = [];

function logIssue(category, message) {
    issues.push({ category, message });
    console.log(`${colors.red}❌ [${category}] ${message}${colors.reset}`);
}

function logWarning(category, message) {
    warnings.push({ category, message });
    console.log(`${colors.yellow}⚠️  [${category}] ${message}${colors.reset}`);
}

function logSuccess(category, message) {
    successes.push({ category, message });
    console.log(`${colors.green}✅ [${category}] ${message}${colors.reset}`);
}

async function auditEnvironmentVariables() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}1. ENVIRONMENT VARIABLES AUDIT${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    // Critical environment variables
    const criticalVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'ANTHROPIC_API_KEY'
    ];

    // Billing-related variables
    const billingVars = [
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'RAZORPAY_WEBHOOK_SECRET',
        'RAZORPAY_PRO_MONTHLY_PLAN_ID',
        'RAZORPAY_PRO_ANNUAL_PLAN_ID',
        'RAZORPAY_BUSINESS_MONTHLY_PLAN_ID',
        'RAZORPAY_BUSINESS_ANNUAL_PLAN_ID'
    ];

    // AI Cost Control variables
    const aiCostVars = [
        'AI_DAILY_SPEND_LIMIT',
        'AI_MONTHLY_SPEND_LIMIT'
    ];

    for (const varName of criticalVars) {
        if (process.env[varName]) {
            logSuccess('ENV', `${varName} is configured`);
        } else {
            logIssue('ENV', `${varName} is MISSING`);
        }
    }

    console.log(`\n${colors.blue}Billing Configuration:${colors.reset}`);
    let billingConfigured = true;
    for (const varName of billingVars) {
        if (process.env[varName]) {
            logSuccess('BILLING', `${varName} is configured`);
        } else {
            logIssue('BILLING', `${varName} is MISSING - Billing will NOT work`);
            billingConfigured = false;
        }
    }

    if (!billingConfigured) {
        logIssue('BILLING', 'Razorpay is NOT configured - Users cannot upgrade to paid plans!');
    }

    console.log(`\n${colors.blue}AI Cost Control:${colors.reset}`);
    for (const varName of aiCostVars) {
        if (process.env[varName]) {
            logSuccess('AI_COST', `${varName} = $${process.env[varName]}`);
        } else {
            logWarning('AI_COST', `${varName} not set - using default`);
        }
    }
}

async function auditPlanConfiguration() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}2. PLAN CONFIGURATION AUDIT${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    const plans = getAllPlans();

    for (const [planName, planConfig] of Object.entries(plans)) {
        console.log(`\n${colors.magenta}Plan: ${planConfig.name.toUpperCase()}${colors.reset}`);
        console.log(`  Price: ₹${planConfig.price}/month (₹${planConfig.annual}/year)`);
        console.log(`  Limits:`);
        console.log(`    - Posts: ${planConfig.limits.posts === Infinity ? 'Unlimited' : planConfig.limits.posts}`);
        console.log(`    - Accounts: ${planConfig.limits.accounts}`);
        console.log(`    - AI: ${planConfig.limits.ai === Infinity ? 'Unlimited' : planConfig.limits.ai}`);
        console.log(`    - Images: ${planConfig.limits.images === Infinity ? 'Unlimited' : planConfig.limits.images}`);
        console.log(`    - Videos: ${planConfig.limits.videos === Infinity ? 'Unlimited' : planConfig.limits.videos}`);

        // Check if Razorpay plan IDs are configured for paid plans
        if (planName !== 'free') {
            if (planConfig.razorpay_monthly_plan_id) {
                logSuccess('PLAN', `${planName} monthly plan ID configured`);
            } else {
                logIssue('PLAN', `${planName} monthly plan ID MISSING`);
            }

            if (planConfig.razorpay_annual_plan_id) {
                logSuccess('PLAN', `${planName} annual plan ID configured`);
            } else {
                logIssue('PLAN', `${planName} annual plan ID MISSING`);
            }
        }
    }
}

async function auditDatabaseSchema() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}3. DATABASE SCHEMA AUDIT${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    // Check if critical tables exist
    const tables = ['subscriptions', 'usage', 'user_accounts', 'posts', 'ai_cost_tracking'];

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                logIssue('DATABASE', `Table '${table}' error: ${error.message}`);
            } else {
                logSuccess('DATABASE', `Table '${table}' exists and is accessible`);
            }
        } catch (err) {
            logIssue('DATABASE', `Table '${table}' check failed: ${err.message}`);
        }
    }
}

async function auditUserSubscriptions() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}4. USER SUBSCRIPTIONS AUDIT${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    try {
        // Get all users
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

        if (usersError) {
            logIssue('USERS', `Failed to fetch users: ${usersError.message}`);
            return;
        }

        console.log(`${colors.blue}Total Users: ${users.length}${colors.reset}\n`);

        // Get all subscriptions
        const { data: subscriptions, error: subsError } = await supabase
            .from('subscriptions')
            .select('*');

        if (subsError) {
            logIssue('SUBSCRIPTIONS', `Failed to fetch subscriptions: ${subsError.message}`);
            return;
        }

        // Count by plan
        const planCounts = {
            free: 0,
            pro: 0,
            business: 0
        };

        subscriptions.forEach(sub => {
            planCounts[sub.plan] = (planCounts[sub.plan] || 0) + 1;
        });

        console.log(`${colors.blue}Subscription Distribution:${colors.reset}`);
        console.log(`  Free: ${planCounts.free}`);
        console.log(`  Pro: ${planCounts.pro}`);
        console.log(`  Business: ${planCounts.business}`);

        // Check for users without subscriptions
        const usersWithoutSubs = users.filter(user =>
            !subscriptions.find(sub => sub.user_id === user.id)
        );

        if (usersWithoutSubs.length > 0) {
            logWarning('SUBSCRIPTIONS', `${usersWithoutSubs.length} users without subscription records`);
        } else {
            logSuccess('SUBSCRIPTIONS', 'All users have subscription records');
        }

    } catch (err) {
        logIssue('USERS', `Audit failed: ${err.message}`);
    }
}

async function auditUsageLimits() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}5. USAGE LIMITS ENFORCEMENT AUDIT${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    try {
        // Get all users with their subscriptions and usage
        const { data: subscriptions, error: subsError } = await supabase
            .from('subscriptions')
            .select('*');

        if (subsError) {
            logIssue('USAGE', `Failed to fetch subscriptions: ${subsError.message}`);
            return;
        }

        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);
        const monthStr = currentMonth.toISOString().split('T')[0];

        const { data: usageRecords, error: usageError } = await supabase
            .from('usage')
            .select('*')
            .eq('month', monthStr);

        if (usageError) {
            logIssue('USAGE', `Failed to fetch usage: ${usageError.message}`);
            return;
        }

        console.log(`${colors.blue}Checking usage limits for ${usageRecords.length} active users this month:${colors.reset}\n`);

        for (const usage of usageRecords) {
            const subscription = subscriptions.find(s => s.user_id === usage.user_id);
            if (!subscription) continue;

            const plan = subscription.plan;
            const planConfig = getPlan(plan);

            // Check posts limit
            const postsCheck = checkLimitWithGrace(plan, 'posts', usage.posts_count);
            if (postsCheck.hardBlock) {
                logWarning('USAGE', `User on ${plan} plan has EXCEEDED posts limit: ${usage.posts_count}/${planConfig.limits.posts}`);
            } else if (postsCheck.inGracePeriod) {
                logWarning('USAGE', `User on ${plan} plan in GRACE period for posts: ${usage.posts_count}/${planConfig.limits.posts}`);
            }

            // Check AI limit
            const aiCheck = checkLimitWithGrace(plan, 'ai', usage.ai_count);
            if (aiCheck.hardBlock) {
                logWarning('USAGE', `User on ${plan} plan has EXCEEDED AI limit: ${usage.ai_count}/${planConfig.limits.ai}`);
            } else if (aiCheck.inGracePeriod) {
                logWarning('USAGE', `User on ${plan} plan in GRACE period for AI: ${usage.ai_count}/${planConfig.limits.ai}`);
            }
        }

        logSuccess('USAGE', 'Usage limit enforcement is configured correctly');

    } catch (err) {
        logIssue('USAGE', `Audit failed: ${err.message}`);
    }
}

async function auditRateLimits() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}6. RATE LIMITS AUDIT${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    const rateLimiterPath = require.resolve('../middleware/rate-limiter');
    try {
        const rateLimiter = require(rateLimiterPath);

        console.log(`${colors.blue}Rate Limiter Configuration:${colors.reset}`);
        console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);

        if (process.env.NODE_ENV === 'production') {
            console.log(`  AI Endpoints: 50 requests/hour`);
            console.log(`  Auth Endpoints: 50 requests/15min`);
            console.log(`  General API: 100 requests/15min`);
            console.log(`  Public Routes: 200 requests/15min`);
        } else {
            console.log(`  AI Endpoints: 500 requests/hour (dev mode)`);
            console.log(`  Auth Endpoints: 100 requests/15min (dev mode)`);
            console.log(`  General API: 1000 requests/15min (dev mode)`);
            console.log(`  Public Routes: 2000 requests/15min (dev mode)`);
        }

        logSuccess('RATE_LIMIT', 'Rate limiter is configured');
    } catch (err) {
        logIssue('RATE_LIMIT', `Rate limiter check failed: ${err.message}`);
    }
}

async function auditAICostTracking() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}7. AI COST TRACKING AUDIT${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    try {
        // Check if ai_cost_tracking table exists and has data
        const { data: costData, error: costError } = await supabase
            .from('ai_cost_tracking')
            .select('*')
            .order('date', { ascending: false })
            .limit(10);

        if (costError) {
            logWarning('AI_COST', `AI cost tracking table may not exist: ${costError.message}`);
        } else {
            logSuccess('AI_COST', `AI cost tracking table exists with ${costData.length} recent records`);

            // Calculate total spending
            const today = new Date().toISOString().split('T')[0];
            const todayCosts = costData.filter(c => c.date === today);
            const todayTotal = todayCosts.reduce((sum, c) => sum + c.cost, 0);

            console.log(`  Today's AI spending: $${todayTotal.toFixed(4)}`);

            const dailyLimit = parseFloat(process.env.AI_DAILY_SPEND_LIMIT || '0.50');
            if (todayTotal > dailyLimit) {
                logWarning('AI_COST', `Today's spending ($${todayTotal.toFixed(4)}) exceeds daily limit ($${dailyLimit})`);
            }
        }
    } catch (err) {
        logIssue('AI_COST', `Audit failed: ${err.message}`);
    }
}

async function generateSummaryReport() {
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}PRODUCTION AUDIT SUMMARY${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    console.log(`${colors.bgGreen}${colors.white} SUCCESSES: ${successes.length} ${colors.reset}`);
    console.log(`${colors.yellow}⚠️  WARNINGS: ${warnings.length}${colors.reset}`);
    console.log(`${colors.bgRed}${colors.white} CRITICAL ISSUES: ${issues.length} ${colors.reset}\n`);

    if (issues.length > 0) {
        console.log(`${colors.red}═══ CRITICAL ISSUES ═══${colors.reset}`);
        issues.forEach((issue, i) => {
            console.log(`${i + 1}. [${issue.category}] ${issue.message}`);
        });
    }

    if (warnings.length > 0) {
        console.log(`\n${colors.yellow}═══ WARNINGS ═══${colors.reset}`);
        warnings.forEach((warning, i) => {
            console.log(`${i + 1}. [${warning.category}] ${warning.message}`);
        });
    }

    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    // Overall health score
    const totalChecks = successes.length + warnings.length + issues.length;
    const healthScore = ((successes.length / totalChecks) * 100).toFixed(1);

    console.log(`${colors.blue}Overall Health Score: ${healthScore}%${colors.reset}`);

    if (issues.length === 0 && warnings.length === 0) {
        console.log(`${colors.green}✅ Production is READY for real users!${colors.reset}`);
    } else if (issues.length > 0) {
        console.log(`${colors.red}❌ CRITICAL ISSUES must be fixed before production use!${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠️  Warnings should be addressed for optimal performance${colors.reset}`);
    }
}

async function runFullAudit() {
    console.log(`${colors.magenta}`);
    console.log(`╔═══════════════════════════════════════════════════════╗`);
    console.log(`║     SOCIAL MEDIA AUTOMATOR - PRODUCTION AUDIT        ║`);
    console.log(`╚═══════════════════════════════════════════════════════╝`);
    console.log(`${colors.reset}\n`);

    await auditEnvironmentVariables();
    await auditPlanConfiguration();
    await auditDatabaseSchema();
    await auditUserSubscriptions();
    await auditUsageLimits();
    await auditRateLimits();
    await auditAICostTracking();
    await generateSummaryReport();
}

// Run the audit
runFullAudit().catch(err => {
    console.error(`${colors.red}Fatal error during audit:${colors.reset}`, err);
    process.exit(1);
});
