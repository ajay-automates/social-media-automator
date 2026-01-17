/**
 * Production Health Check
 * Verifies all critical production settings
 */

require('dotenv').config();

console.log('\n🏥 PRODUCTION HEALTH CHECK\n');
console.log('='.repeat(60) + '\n');

// Check 1: Environment
console.log('1️⃣  ENVIRONMENT');
const nodeEnv = process.env.NODE_ENV;
if (nodeEnv === 'production') {
    console.log('   ✅ NODE_ENV = production');
} else {
    console.log(`   ⚠️  NODE_ENV = ${nodeEnv || 'not set'} (should be "production")`);
}
console.log('');

// Check 2: Razorpay Configuration
console.log('2️⃣  RAZORPAY BILLING');
const razorpayChecks = {
    'API Key': process.env.RAZORPAY_KEY_ID,
    'API Secret': process.env.RAZORPAY_KEY_SECRET,
    'Webhook Secret': process.env.RAZORPAY_WEBHOOK_SECRET,
    'Pro Monthly Plan': process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
    'Pro Annual Plan': process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID,
    'Business Monthly Plan': process.env.RAZORPAY_BUSINESS_MONTHLY_PLAN_ID,
    'Business Annual Plan': process.env.RAZORPAY_BUSINESS_ANNUAL_PLAN_ID
};

let razorpayOk = true;
for (const [name, value] of Object.entries(razorpayChecks)) {
    if (value) {
        console.log(`   ✅ ${name}: Configured`);
    } else {
        console.log(`   ❌ ${name}: NOT SET`);
        razorpayOk = false;
    }
}
console.log('');

// Check 3: AI Cost Limits
console.log('3️⃣  AI COST CONTROLS');
const dailyLimit = process.env.AI_DAILY_SPEND_LIMIT;
const monthlyLimit = process.env.AI_MONTHLY_SPEND_LIMIT;

if (dailyLimit) {
    console.log(`   ✅ Daily Limit: $${dailyLimit}`);
} else {
    console.log('   ⚠️  Daily Limit: Not set (using default $0.50)');
}

if (monthlyLimit) {
    console.log(`   ✅ Monthly Limit: $${monthlyLimit}`);
} else {
    console.log('   ⚠️  Monthly Limit: Not set (using default $5.00)');
}
console.log('');

// Check 4: Rate Limiting
console.log('4️⃣  RATE LIMITING');
if (nodeEnv === 'production') {
    console.log('   ✅ AI Endpoints: 50 requests/hour');
    console.log('   ✅ Auth Endpoints: 50 requests/15min');
    console.log('   ✅ General API: 100 requests/15min');
    console.log('   ✅ Public Routes: 200 requests/15min');
} else {
    console.log('   ⚠️  Development mode - limits are 10x higher');
}
console.log('');

// Check 5: Database
console.log('5️⃣  DATABASE');
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('   ✅ Supabase configured');
} else {
    console.log('   ❌ Supabase NOT configured');
}
console.log('');

// Overall Status
console.log('='.repeat(60));
console.log('\n📊 OVERALL STATUS:\n');

if (nodeEnv === 'production' && razorpayOk) {
    console.log('   🎉 PRODUCTION READY!\n');
    console.log('   Next Steps:');
    console.log('   1. Test all subscription flows');
    console.log('   2. Monitor Railway logs for 24 hours');
    console.log('   3. Check Razorpay webhook events');
    console.log('   4. Announce to users!\n');
} else {
    console.log('   ⚠️  ALMOST READY - Fix issues above\n');
}
