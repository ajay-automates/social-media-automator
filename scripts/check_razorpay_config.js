/**
 * Check Razorpay Plan IDs Configuration
 * Run this to verify all plan IDs are set correctly
 */

require('dotenv').config();

console.log('\n🔍 Checking Razorpay Plan IDs Configuration...\n');

const planIds = {
    'RAZORPAY_PRO_MONTHLY_PLAN_ID': process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
    'RAZORPAY_PRO_ANNUAL_PLAN_ID': process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID,
    'RAZORPAY_BUSINESS_MONTHLY_PLAN_ID': process.env.RAZORPAY_BUSINESS_MONTHLY_PLAN_ID,
    'RAZORPAY_BUSINESS_ANNUAL_PLAN_ID': process.env.RAZORPAY_BUSINESS_ANNUAL_PLAN_ID
};

let allConfigured = true;

for (const [name, value] of Object.entries(planIds)) {
    if (value && value.startsWith('plan_')) {
        console.log(`✅ ${name}: ${value}`);
    } else if (value) {
        console.log(`⚠️  ${name}: "${value}" (doesn't start with "plan_" - might be invalid)`);
        allConfigured = false;
    } else {
        console.log(`❌ ${name}: NOT SET`);
        allConfigured = false;
    }
}

console.log('\n' + '='.repeat(60) + '\n');

if (allConfigured) {
    console.log('✅ All Razorpay Plan IDs are configured correctly!\n');
} else {
    console.log('❌ Some Razorpay Plan IDs are missing or invalid.\n');
    console.log('📝 To fix:');
    console.log('1. Go to Razorpay Dashboard → Subscriptions → Plans');
    console.log('2. Copy the Plan ID for each plan');
    console.log('3. Add to Railway environment variables');
    console.log('4. Restart the application\n');
}

// Also check the config/plans.js to see what it's reading
console.log('📋 What config/plans.js is reading:\n');
const { PLANS } = require('../config/plans');

console.log('Pro Plan:');
console.log(`  Monthly Plan ID: ${PLANS.pro.razorpay_monthly_plan_id || 'undefined'}`);
console.log(`  Annual Plan ID: ${PLANS.pro.razorpay_annual_plan_id || 'undefined'}`);

console.log('\nBusiness Plan:');
console.log(`  Monthly Plan ID: ${PLANS.business.razorpay_monthly_plan_id || 'undefined'}`);
console.log(`  Annual Plan ID: ${PLANS.business.razorpay_annual_plan_id || 'undefined'}`);

console.log('\n');
