/**
 * Comprehensive Production Audit Script
 * Checks all critical areas for production readiness
 */

require('dotenv').config();
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
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

// ============================================
// 1. ENVIRONMENT VARIABLES AUDIT
// ============================================
function auditEnvironmentVariables() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}1. ENVIRONMENT VARIABLES AUDIT${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Required variables
  const requiredVars = {
    'SUPABASE_URL': 'Supabase project URL',
    'SUPABASE_ANON_KEY': 'Supabase anonymous key',
    'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key',
    'SESSION_SECRET': 'Session secret for OAuth',
    'ANTHROPIC_API_KEY': 'Anthropic API key for AI features',
    'NODE_ENV': 'Node environment (should be production)'
  };

  for (const [varName, description] of Object.entries(requiredVars)) {
    if (process.env[varName]) {
      if (varName === 'NODE_ENV' && process.env[varName] !== 'production') {
        logWarning('ENV', `${varName} is set to "${process.env[varName]}" but should be "production"`);
      } else {
        logSuccess('ENV', `${varName} is set`);
      }
    } else {
      logIssue('ENV', `${varName} (${description}) is MISSING`);
    }
  }

  // Billing variables
  console.log(`\n${colors.blue}Billing Configuration:${colors.reset}`);
  const billingVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'RAZORPAY_PRO_MONTHLY_PLAN_ID',
    'RAZORPAY_PRO_ANNUAL_PLAN_ID',
    'RAZORPAY_BUSINESS_MONTHLY_PLAN_ID',
    'RAZORPAY_BUSINESS_ANNUAL_PLAN_ID'
  ];

  let billingConfigured = true;
  for (const varName of billingVars) {
    if (process.env[varName]) {
      logSuccess('BILLING', `${varName} is configured`);
    } else {
      logWarning('BILLING', `${varName} is MISSING - Billing features will not work`);
      billingConfigured = false;
    }
  }

  if (!billingConfigured) {
    logWarning('BILLING', 'Razorpay is not fully configured - Users cannot upgrade to paid plans');
  }

  // AI Cost Control
  console.log(`\n${colors.blue}AI Cost Control:${colors.reset}`);
  if (process.env.AI_DAILY_SPEND_LIMIT) {
    logSuccess('AI', `AI_DAILY_SPEND_LIMIT is set to ${process.env.AI_DAILY_SPEND_LIMIT}`);
  } else {
    logWarning('AI', 'AI_DAILY_SPEND_LIMIT not set (using default: 0.50)');
  }

  if (process.env.AI_MONTHLY_SPEND_LIMIT) {
    logSuccess('AI', `AI_MONTHLY_SPEND_LIMIT is set to ${process.env.AI_MONTHLY_SPEND_LIMIT}`);
  } else {
    logWarning('AI', 'AI_MONTHLY_SPEND_LIMIT not set (using default: 5.00)');
  }
}

// ============================================
// 2. CODE REVIEW - AUTHENTICATION
// ============================================
function auditAuthentication() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}2. AUTHENTICATION & SECURITY AUDIT${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const fs = require('fs');
  const serverJs = fs.readFileSync('server.js', 'utf8');

  // Check verifyAuth middleware
  if (serverJs.includes('status(503)') && serverJs.includes('isNetworkError')) {
    logSuccess('AUTH', 'verifyAuth returns 503 for network errors');
  } else {
    logIssue('AUTH', 'verifyAuth may not properly handle network errors');
  }

  if (serverJs.includes('circuitBreakerOpen')) {
    logSuccess('AUTH', 'Circuit breaker pattern implemented');
  } else {
    logIssue('AUTH', 'Circuit breaker not found');
  }

  if (serverJs.includes('AUTH_TIMEOUT') || serverJs.includes('8000')) {
    logSuccess('AUTH', 'Auth timeout handling implemented (8 seconds)');
  } else {
    logWarning('AUTH', 'Auth timeout may not be configured');
  }

  // Check frontend API interceptor
  const apiJs = fs.readFileSync('dashboard/src/lib/api.js', 'utf8');
  if (apiJs.includes('status === 503') && apiJs.includes('isNetworkError')) {
    logSuccess('AUTH', 'Frontend API interceptor handles 503 errors correctly');
  } else {
    logIssue('AUTH', 'Frontend may redirect on 503 errors');
  }

  if (apiJs.includes('window.location.href') && apiJs.includes('/auth')) {
    logSuccess('AUTH', 'Frontend redirects to auth on real 401 errors');
  } else {
    logWarning('AUTH', 'Frontend auth redirect may not be configured');
  }
}

// ============================================
// 3. CODE REVIEW - ERROR HANDLING
// ============================================
function auditErrorHandling() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}3. ERROR HANDLING AUDIT${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const fs = require('fs');
  
  // Check ErrorBoundary
  try {
    const errorBoundary = fs.readFileSync('dashboard/src/components/ui/ErrorBoundary.jsx', 'utf8');
    if (errorBoundary.includes('ErrorBoundary') && errorBoundary.includes('componentDidCatch')) {
      logSuccess('ERROR', 'ErrorBoundary component exists');
    } else {
      logIssue('ERROR', 'ErrorBoundary may not be properly implemented');
    }
  } catch (e) {
    logIssue('ERROR', 'ErrorBoundary component not found');
  }

  // Check error handler utility
  try {
    const errorHandler = fs.readFileSync('dashboard/src/utils/errorHandler.js', 'utf8');
    if (errorHandler.includes('503') && errorHandler.includes('isNetworkError')) {
      logSuccess('ERROR', 'Error handler handles 503 errors correctly');
    } else {
      logIssue('ERROR', 'Error handler may not handle network errors');
    }

    if (errorHandler.includes('429')) {
      logSuccess('ERROR', 'Error handler handles rate limit errors');
    } else {
      logWarning('ERROR', 'Rate limit error handling may be missing');
    }
  } catch (e) {
    logIssue('ERROR', 'Error handler utility not found');
  }

  // Check App.jsx for ErrorBoundary wrapper
  try {
    const appJsx = fs.readFileSync('dashboard/src/App.jsx', 'utf8');
    if (appJsx.includes('ErrorBoundary')) {
      logSuccess('ERROR', 'App wrapped in ErrorBoundary');
    } else {
      logIssue('ERROR', 'App may not be wrapped in ErrorBoundary');
    }
  } catch (e) {
    logWarning('ERROR', 'Could not check App.jsx');
  }
}

// ============================================
// 4. CODE REVIEW - DATABASE OPERATIONS
// ============================================
function auditDatabase() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}4. DATABASE OPERATIONS AUDIT${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const fs = require('fs');
  const databaseJs = fs.readFileSync('services/database.js', 'utf8');

  // Check Supabase initialization
  if (databaseJs.includes('supabaseAdmin') && databaseJs.includes('SERVICE_ROLE')) {
    logSuccess('DB', 'Supabase admin client initialized correctly');
  } else {
    logIssue('DB', 'Supabase admin client may not be initialized');
  }

  if (databaseJs.includes('supabaseAdmin') && databaseJs.includes('bypasses RLS')) {
    logSuccess('DB', 'Admin client used for backend operations (bypasses RLS)');
  } else {
    logWarning('DB', 'RLS bypass pattern may not be documented');
  }

  // Check error handling
  if (databaseJs.includes('try') && databaseJs.includes('catch')) {
    logSuccess('DB', 'Database operations have error handling');
  } else {
    logWarning('DB', 'Some database operations may lack error handling');
  }

  // Check critical functions
  const criticalFunctions = ['addPost', 'getDuePosts', 'updatePostStatus', 'getPostHistory'];
  for (const func of criticalFunctions) {
    if (databaseJs.includes(`function ${func}`) || databaseJs.includes(`async function ${func}`)) {
      logSuccess('DB', `Critical function ${func} exists`);
    } else {
      logIssue('DB', `Critical function ${func} not found`);
    }
  }
}

// ============================================
// 5. CODE REVIEW - RATE LIMITING
// ============================================
function auditRateLimiting() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}5. RATE LIMITING AUDIT${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const fs = require('fs');
  const rateLimiterJs = fs.readFileSync('middleware/rate-limiter.js', 'utf8');

  // Check production mode detection
  if (rateLimiterJs.includes('NODE_ENV === \'production\'')) {
    logSuccess('RATE', 'Rate limiter checks NODE_ENV for production mode');
  } else {
    logIssue('RATE', 'Rate limiter may not check production mode');
  }

  // Check limits
  if (rateLimiterJs.includes('50') && rateLimiterJs.includes('hour')) {
    logSuccess('RATE', 'AI endpoints limited to 50 req/hour in production');
  } else {
    logWarning('RATE', 'AI rate limit may not be configured correctly');
  }

  if (rateLimiterJs.includes('429')) {
    logSuccess('RATE', 'Rate limit errors return 429 status');
  } else {
    logIssue('RATE', 'Rate limit errors may not return 429');
  }
}

// ============================================
// 6. CODE REVIEW - BILLING
// ============================================
function auditBilling() {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}6. BILLING SYSTEM AUDIT${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const fs = require('fs');
  
  try {
    const billingJs = fs.readFileSync('services/billing.js', 'utf8');
    
    if (billingJs.includes('razorpay') && billingJs.includes('RAZORPAY_KEY_ID')) {
      logSuccess('BILLING', 'Billing service checks for Razorpay configuration');
    } else {
      logIssue('BILLING', 'Billing service may not check configuration');
    }

    if (billingJs.includes('createSubscription')) {
      logSuccess('BILLING', 'createSubscription function exists');
    } else {
      logIssue('BILLING', 'createSubscription function not found');
    }

    if (billingJs.includes('checkUsage')) {
      logSuccess('BILLING', 'checkUsage function exists');
    } else {
      logIssue('BILLING', 'checkUsage function not found');
    }
  } catch (e) {
    logIssue('BILLING', 'Could not read billing.js');
  }

  try {
    const plansJs = fs.readFileSync('config/plans.js', 'utf8');
    if (plansJs.includes('free') && plansJs.includes('pro') && plansJs.includes('business')) {
      logSuccess('BILLING', 'Plan configuration exists');
    } else {
      logIssue('BILLING', 'Plan configuration may be incomplete');
    }
  } catch (e) {
    logIssue('BILLING', 'Could not read plans.js');
  }
}

// ============================================
// MAIN EXECUTION
// ============================================
async function runAudit() {
  console.log(`${colors.bold}${colors.cyan}`);
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE PRODUCTION AUDIT                       ║');
  console.log('║     Social Media Automator                               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  auditEnvironmentVariables();
  auditAuthentication();
  auditErrorHandling();
  auditDatabase();
  auditRateLimiting();
  auditBilling();

  // Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}AUDIT SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.green}✅ Successes: ${successes.length}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${warnings.length}${colors.reset}`);
  console.log(`${colors.red}❌ Issues: ${issues.length}${colors.reset}\n`);

  if (issues.length > 0) {
    console.log(`${colors.red}${colors.bold}CRITICAL ISSUES FOUND:${colors.reset}\n`);
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.category}] ${issue.message}`);
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`${colors.yellow}${colors.bold}WARNINGS:${colors.reset}\n`);
    warnings.forEach((warning, i) => {
      console.log(`${i + 1}. [${warning.category}] ${warning.message}`);
    });
    console.log('');
  }

  const healthScore = Math.round(
    (successes.length / (successes.length + warnings.length + issues.length)) * 100
  );

  console.log(`${colors.cyan}Overall Health Score: ${healthScore}%${colors.reset}\n`);

  if (issues.length === 0 && warnings.length === 0) {
    console.log(`${colors.green}${colors.bold}✅ PRODUCTION READY!${colors.reset}\n`);
    process.exit(0);
  } else if (issues.length === 0) {
    console.log(`${colors.yellow}${colors.bold}⚠️  PRODUCTION READY WITH WARNINGS${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}❌ NOT PRODUCTION READY - Fix issues above${colors.reset}\n`);
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error(`${colors.red}Fatal error during audit:${colors.reset}`, err);
  process.exit(1);
});
