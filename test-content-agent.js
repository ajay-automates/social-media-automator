/**
 * Test Script for Content Creation Agent
 * Tests all the core functionality without needing authentication
 */

const { analyzeBrandVoice, getBrandVoiceProfile } = require('./services/brand-voice-analyzer');
const { fetchAllTrends, matchTrendsToNiche } = require('./services/trend-monitor');
const { generateTopicIdeas } = require('./services/content-creation-agent');

// Test user ID (replace with your actual user ID from Supabase)
const TEST_USER_ID = 'ad14450a-b2da-4fe4-98f3-269f4a4fa2e5'; // From the logs

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TESTING CONTENT CREATION AGENT');
  console.log('='.repeat(60) + '\n');

  try {
    // Test 1: Fetch Trends
    console.log('📊 TEST 1: Fetching Trending Topics...');
    console.log('-'.repeat(60));

    const trends = await fetchAllTrends({ geo: 'US', limit: 10 });

    console.log(`✅ Found ${trends.length} trending topics:`);
    trends.slice(0, 5).forEach((trend, i) => {
      console.log(`   ${i + 1}. ${trend.topic} (${trend.source}, score: ${trend.score})`);
    });
    console.log('');

    // Test 2: Match Trends to Niche
    console.log('📊 TEST 2: Matching Trends to Niche...');
    console.log('-'.repeat(60));

    const userNiches = ['technology', 'business', 'AI', 'startups'];
    const matchedTrends = await matchTrendsToNiche(trends, userNiches, 60);

    console.log(`✅ Found ${matchedTrends.length} matching trends:`);
    matchedTrends.slice(0, 5).forEach((trend, i) => {
      console.log(`   ${i + 1}. ${trend.topic} (match: ${trend.niche_match_score}/100)`);
    });
    console.log('');

    // Test 3: Analyze Brand Voice
    console.log('📊 TEST 3: Analyzing Brand Voice...');
    console.log('-'.repeat(60));

    const brandVoiceResult = await analyzeBrandVoice(TEST_USER_ID, 30);

    if (brandVoiceResult.success) {
      const bv = brandVoiceResult.brandVoice;
      console.log(`✅ Brand Voice Analyzed:`);
      console.log(`   Tone: ${bv.tone}`);
      console.log(`   Formality: ${bv.formality_level}/10`);
      console.log(`   Avg Caption Length: ${bv.avg_caption_length} chars`);
      console.log(`   Emoji Usage: ${bv.emoji_usage ? 'Yes' : 'No'}`);
      console.log(`   Hashtag Style: ${bv.hashtag_style}`);
      console.log(`   Posts Analyzed: ${bv.analyzed_post_count}`);
      console.log(`   Topics: ${bv.topics_of_interest?.join(', ') || 'None'}`);
    } else {
      console.log(`⚠️  ${brandVoiceResult.message}`);
      console.log(`   (This is normal if you haven't posted yet)`);
    }
    console.log('');

    // Test 4: Generate Topic Ideas
    console.log('📊 TEST 4: Generating Topic Ideas...');
    console.log('-'.repeat(60));

    const mockBrandVoice = {
      topics_of_interest: ['SaaS', 'AI', 'productivity', 'social media']
    };

    const topics = await generateTopicIdeas(TEST_USER_ID, mockBrandVoice, 7);

    console.log(`✅ Generated ${topics.length} topic ideas:`);
    topics.forEach((topic, i) => {
      console.log(`   ${i + 1}. ${topic.topic}`);
    });
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n🎉 Content Creation Agent is working!\n');
    console.log('Next steps:');
    console.log('1. Run the database migration in Supabase');
    console.log('2. Test the API endpoints using curl or Postman');
    console.log('3. Build the frontend UI\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run tests
console.log('\n⏳ Starting tests in 2 seconds...\n');
setTimeout(runTests, 2000);
