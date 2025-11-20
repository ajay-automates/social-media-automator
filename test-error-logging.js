#!/usr/bin/env node

/**
 * Test script for Error Handling & Logging
 * Tests the new centralized error handler and request logger
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

async function test(name, testFn) {
    try {
        console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
        await testFn();
        console.log(`${colors.green}✓ ${name} passed${colors.reset}`);
        return true;
    } catch (error) {
        console.log(`${colors.red}✗ ${name} failed${colors.reset}`);
        console.error('  Error:', error.message);
        return false;
    }
}

async function runTests() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🧪 ERROR HANDLING & LOGGING TESTS');
    console.log('='.repeat(60));

    let passed = 0;
    let total = 0;

    // Test 1: Health check (should work)
    total++;
    if (await test('Health Check Returns 200', async () => {
        const response = await axios.get(`${BASE_URL}/api/health`);
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
        if (!response.data.status) throw new Error('Missing status field');
    })) passed++;

    // Test 2: 404 Error - Route not found
    total++;
    if (await test('404 Error - Route Not Found', async () => {
        try {
            await axios.get(`${BASE_URL}/api/nonexistent-route-xyz`);
            throw new Error('Should have thrown 404');
        } catch (err) {
            if (err.response?.status !== 404) throw new Error(`Expected 404, got ${err.response?.status}`);
            const data = err.response.data;
            if (!data.error) throw new Error('Missing error object');
            if (!data.error.code) throw new Error('Missing error code');
            if (!data.error.message) throw new Error('Missing error message');
            if (data.error.code !== 'ROUTE_NOT_FOUND') throw new Error(`Expected ROUTE_NOT_FOUND, got ${data.error.code}`);
        }
    })) passed++;

    // Test 3: 401 Error - Unauthorized
    total++;
    if (await test('401 Error - Unauthorized Access', async () => {
        try {
            await axios.get(`${BASE_URL}/api/accounts`);
            throw new Error('Should have thrown 401');
        } catch (err) {
            if (err.response?.status !== 401) throw new Error(`Expected 401, got ${err.response?.status}`);
            // Note: This endpoint has its own error handling, so format might differ
        }
    })) passed++;

    // Test 4: Public endpoint (should work)
    total++;
    if (await test('Public Endpoint - Billing Plans', async () => {
        const response = await axios.get(`${BASE_URL}/api/billing/plans`);
        if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
        if (!response.data.success) throw new Error('Expected success: true');
    })) passed++;

    // Test 5: Request logging verification
    total++;
    if (await test('Request Logging - Check Console Output', async () => {
        // Make a few requests
        await axios.get(`${BASE_URL}/api/health`);
        await axios.get(`${BASE_URL}/api/billing/plans`);
        try {
            await axios.get(`${BASE_URL}/api/nonexistent`);
        } catch (err) {
            // Expected to fail
        }
        console.log('  ℹ️  Check server console for request logs');
        console.log('  Expected format: METHOD /path STATUS XXms - user:anonymous');
    })) passed++;

    // Test 6: Error logging verification
    total++;
    if (await test('Error Logging - Check Error Console Output', async () => {
        try {
            await axios.get(`${BASE_URL}/api/invalid-endpoint-for-testing`);
        } catch (err) {
            // Expected
        }
        console.log('  ℹ️  Check server console for error logs');
        console.log('  Expected: ❌ Error: {...}');
    })) passed++;

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.blue}Test Results:${colors.reset} ${passed}/${total} passed`);
    if (passed === total) {
        console.log(`${colors.green}✓ All tests passed!${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠ Some tests failed${colors.reset}`);
    }
    console.log('='.repeat(60));

    console.log(`\n${colors.blue}Next Steps:${colors.reset}`);
    console.log('1. Check server console for request logs');
    console.log('2. Check logs/access.log (in production mode)');
    console.log('3. Check logs/error.log (in production mode)');
    console.log('4. Verify error responses have consistent format\n');

    process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
});
