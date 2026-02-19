/**
 * Environment Variable Validator
 * 
 * Checks for required environment variables at startup to ensure
 * the application has all necessary configuration.
 * 
 * Categories:
 * - Core: Basic server config
 * - Database: Supabase connection
 * - Auth: OAuth credentials
 * - AI: AI service keys
 * - Payment: Stripe config
 * - Email: SMTP/SendGrid config
 */

const requiredVars = {
    // Core & Database (Critical - App won't start without these)
    core: [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SESSION_SECRET'
    ]
};

const featureVars = {
    // AI Services (Required for AI features)
    ai: [
        'ANTHROPIC_API_KEY'
    ],

    // Payment (Required for billing)
    payment: [
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET'
    ]
};

const optionalVars = {
    core: [
        'PORT',
        'NODE_ENV',
        'APP_URL',
        'FRONTEND_URL'
    ],
    ai: [
        'STABILITY_API_KEY' // Optional image generation
    ],
    email: [
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASSWORD',
        'SENDGRID_API_KEY'
    ],
    oauth: [
        'LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET',
        'TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET',
        'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
        'TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET',
        'PINTEREST_APP_ID', 'PINTEREST_APP_SECRET'
    ]
};

function validateEnv() {
    // Skip validation in test environment if needed
    if (process.env.NODE_ENV === 'test') return;

    console.log('🔍 Validating environment variables...');

    const missing = [];
    const warnings = [];

    // Check required variables
    Object.entries(requiredVars).forEach(([category, vars]) => {
        vars.forEach(key => {
            if (!process.env[key]) {
                missing.push(`${category}: ${key}`);
            }
        });
    });

    // Check feature variables (Warn only)
    Object.entries(featureVars).forEach(([category, vars]) => {
        vars.forEach(key => {
            if (!process.env[key]) {
                warnings.push(`${category}: ${key} is missing. Related features will be disabled.`);
            }
        });
    });

    // Check for at least one email configuration
    const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER;
    const hasSendGrid = process.env.SENDGRID_API_KEY;

    if (!hasSmtp && !hasSendGrid) {
        warnings.push('Email: No email service configured (SMTP or SendGrid). Email features will be disabled.');
    }

    // Check for OAuth credentials
    const configuredOAuth = optionalVars.oauth.filter(key => process.env[key]);
    if (configuredOAuth.length === 0) {
        warnings.push('Auth: No OAuth providers configured. Social logins will not work.');
    }

    // Validate formats
    if (process.env.PORT && isNaN(process.env.PORT)) {
        missing.push('Core: PORT must be a number');
    }

    // Report results
    if (warnings.length > 0) {
        console.log('\n⚠️  Configuration Warnings:');
        warnings.forEach(w => console.log(`   - ${w}`));
    }

    if (missing.length > 0) {
        console.error('\n❌ Critical Configuration Missing:');
        missing.forEach(m => console.error(`   - ${m}`));
        console.error('\nPlease check your .env file and ensure all required variables are set.');
        console.error('Server startup aborted.\n');
        process.exit(1);
    }

    console.log('✅ Environment validation passed\n');
}

module.exports = { validateEnv };
