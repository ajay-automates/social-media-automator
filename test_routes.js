const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testRoute(name, url, method = 'GET', expectedStatus = 200) {
    try {
        console.log(`Testing ${name} (${method} ${url})...`);
        const response = await axios({
            method,
            url: `${BASE_URL}${url}`,
            maxRedirects: 0,
            validateStatus: () => true // Don't throw on error status
        });

        if (response.status === expectedStatus) {
            console.log(`✅ ${name}: Success (Status ${response.status})`);
            return true;
        } else {
            console.log(`❌ ${name}: Failed (Expected ${expectedStatus}, got ${response.status})`);
            console.log('   Response:', response.data);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${name}: Error - ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting API Route Tests...\n');

    let passed = 0;
    let total = 0;

    // 1. Health Check
    total++;
    if (await testRoute('Health Check', '/api/health')) passed++;

    // 2. Public API Route (Billing Plans)
    total++;
    if (await testRoute('Billing Plans', '/api/billing/plans')) passed++;

    // 3. Protected API Route (Accounts - Expect 401)
    total++;
    if (await testRoute('Protected Route (Accounts)', '/api/accounts', 'GET', 401)) passed++;

    // 4. Auth Route Mounting (LinkedIn URL - Expect 401 as it is protected)
    // This confirms /api/auth prefix is working and routing to auth.js
    total++;
    if (await testRoute('Auth Route (LinkedIn URL)', '/api/auth/linkedin/url', 'POST', 401)) passed++;

    // 5. Auth Callback Route (LinkedIn Callback - Expect 302 Redirect or 200)
    // In the code: return res.redirect(...) if params missing.
    // Redirect status is usually 302.
    total++;
    if (await testRoute('Auth Callback (LinkedIn)', '/auth/linkedin/callback', 'GET', 302)) passed++;

    console.log(`\n✨ Tests Completed: ${passed}/${total} passed.`);
}

runTests();
