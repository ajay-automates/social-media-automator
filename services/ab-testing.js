/**
 * A/B Testing Engine
 * Test content variations to optimize engagement
 */

const { createClient } = require('@supabase/supabase-js');
const { schedulePost } = require('./scheduler');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Create new A/B test
 */
async function createABTest(userId, testData) {
  try {
    console.log(`\n🧪 Creating A/B test: ${testData.name}`);

    // Create the test
    const { data: test, error: testError } = await supabase
      .from('ab_tests')
      .insert({
        user_id: userId,
        name: testData.name,
        description: testData.description || null,
        test_type: testData.test_type || 'caption',
        platforms: testData.platforms,
        variation_count: testData.variations.length,
        status: 'active',
        test_duration_hours: testData.test_duration_hours || 48
      })
      .select()
      .single();

    if (testError) throw testError;

    console.log(`✅ Test created with ID: ${test.id}`);

    // Create variations and schedule posts
    const variations = [];
    for (let i = 0; i < testData.variations.length; i++) {
      const variation = testData.variations[i];
      
      // Create variation record
      const { data: variationRecord, error: varError } = await supabase
        .from('ab_test_variations')
        .insert({
          test_id: test.id,
          user_id: userId,
          variation_name: variation.name || String.fromCharCode(65 + i), // 'A', 'B', 'C'
          caption: variation.caption,
          hashtags: variation.hashtags || [],
          image_url: variation.image_url || null
        })
        .select()
        .single();

      if (varError) throw varError;

      // Schedule post for this variation
      const scheduleTime = variation.schedule_time || new Date(Date.now() + (i * 60 * 60 * 1000)); // Stagger by 1 hour
      
      const { data: scheduledPost, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          text: variation.caption,
          platforms: testData.platforms,
          image_url: variation.image_url || null,
          status: 'queued',
          schedule_time: scheduleTime.toISOString()
        })
        .select()
        .single();

      if (postError) throw postError;

      // Link variation to post
      await supabase
        .from('ab_test_variations')
        .update({ 
          post_id: scheduledPost.id,
          post_time: scheduleTime.toISOString()
        })
        .eq('id', variationRecord.id);

      variations.push({
        ...variationRecord,
        post_id: scheduledPost.id,
        scheduled_for: scheduleTime
      });

      console.log(`   ✅ Variation ${variationRecord.variation_name}: Post ${scheduledPost.id} scheduled`);
    }

    console.log(`\n🎉 A/B test created with ${variations.length} variations!`);

    return {
      success: true,
      test,
      variations
    };

  } catch (error) {
    console.error('❌ Error creating A/B test:', error);
    throw error;
  }
}

/**
 * Get user's A/B tests
 */
async function getUserABTests(userId, status = null) {
  try {
    let query = supabase
      .from('ab_tests')
      .select(`
        *,
        variations:ab_test_variations (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('❌ Error getting A/B tests:', error);
    throw error;
  }
}

/**
 * Get A/B test results
 */
async function getTestResults(userId, testId) {
  try {
    const { data, error } = await supabase
      .from('ab_test_results')
      .select('*')
      .eq('test_id', testId)
      .eq('user_id', userId);

    if (error) throw error;

    return data || [];

  } catch (error) {
    console.error('❌ Error getting test results:', error);
    throw error;
  }
}

/**
 * Update variation metrics (called after post is published)
 */
async function updateVariationMetrics(postId, metrics) {
  try {
    // Find variation by post_id
    const { data: variation, error: findError } = await supabase
      .from('ab_test_variations')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (findError || !variation) {
      console.log(`ℹ️ No A/B test variation found for post ${postId}`);
      return;
    }

    // Calculate total engagement
    const totalEngagement = (metrics.likes || 0) + 
                           (metrics.comments || 0) + 
                           (metrics.shares || 0) + 
                           (metrics.clicks || 0);

    const engagementRate = metrics.views > 0 
      ? (totalEngagement / metrics.views) * 100 
      : 0;

    // Update variation
    const { error: updateError } = await supabase
      .from('ab_test_variations')
      .update({
        views: metrics.views || 0,
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        shares: metrics.shares || 0,
        clicks: metrics.clicks || 0,
        total_engagement: totalEngagement,
        engagement_rate: engagementRate.toFixed(2),
        posted: true,
        posted_at: new Date().toISOString()
      })
      .eq('id', variation.id);

    if (updateError) throw updateError;

    console.log(`✅ Updated metrics for variation ${variation.variation_name}`);

    // Check if test should be completed
    await checkAndCompleteTest(variation.test_id);

  } catch (error) {
    console.error('❌ Error updating variation metrics:', error);
  }
}

/**
 * Check if all variations are posted and complete test
 */
async function checkAndCompleteTest(testId) {
  try {
    // Get all variations for this test
    const { data: variations, error } = await supabase
      .from('ab_test_variations')
      .select('*')
      .eq('test_id', testId);

    if (error) throw error;

    // Check if all variations are posted
    const allPosted = variations.every(v => v.posted);
    
    if (!allPosted) {
      return; // Test still in progress
    }

    // Get test details
    const { data: test, error: testError } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('id', testId)
      .single();

    if (testError) throw error;

    // Check if test duration has passed
    const testEndTime = new Date(test.started_at);
    testEndTime.setHours(testEndTime.getHours() + test.test_duration_hours);
    
    if (new Date() < testEndTime) {
      return; // Test duration not complete
    }

    // Find winner (highest total engagement)
    const winner = variations.reduce((best, current) => 
      (current.total_engagement > best.total_engagement) ? current : best
    );

    // Calculate confidence (simplified - based on engagement difference)
    const totalEngagement = variations.reduce((sum, v) => sum + v.total_engagement, 0);
    const confidence = totalEngagement > 0 
      ? Math.min(100, (winner.total_engagement / totalEngagement) * 100)
      : 0;

    // Update test with winner
    const { error: updateError } = await supabase
      .from('ab_tests')
      .update({
        status: 'completed',
        winner_variation_id: winner.id,
        winner_declared_at: new Date().toISOString(),
        confidence_score: confidence.toFixed(2),
        completed_at: new Date().toISOString()
      })
      .eq('id', testId);

    if (updateError) throw updateError;

    console.log(`\n🏆 Test ${testId} completed! Winner: Variation ${winner.variation_name}`);
    console.log(`   Confidence: ${confidence.toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error completing test:', error);
  }
}

/**
 * Manually declare winner
 */
async function declareWinner(userId, testId, variationId) {
  try {
    // Verify variation belongs to test
    const { data: variation, error } = await supabase
      .from('ab_test_variations')
      .select('*')
      .eq('id', variationId)
      .eq('test_id', testId)
      .eq('user_id', userId)
      .single();

    if (error || !variation) {
      throw new Error('Variation not found');
    }

    // Update test
    const { error: updateError } = await supabase
      .from('ab_tests')
      .update({
        status: 'completed',
        winner_variation_id: variationId,
        winner_declared_at: new Date().toISOString(),
        confidence_score: 100, // Manually declared = 100% confidence
        completed_at: new Date().toISOString()
      })
      .eq('id', testId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    console.log(`✅ Winner declared for test ${testId}: Variation ${variation.variation_name}`);

    return { success: true, winner: variation };

  } catch (error) {
    console.error('❌ Error declaring winner:', error);
    throw error;
  }
}

/**
 * Cancel A/B test
 */
async function cancelTest(userId, testId) {
  try {
    const { error } = await supabase
      .from('ab_tests')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', testId)
      .eq('user_id', userId);

    if (error) throw error;

    console.log(`✅ Test ${testId} cancelled`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error cancelling test:', error);
    throw error;
  }
}

/**
 * Get A/B testing insights
 */
async function getABTestingInsights(userId) {
  try {
    // Get all completed tests
    const { data: tests, error } = await supabase
      .from('ab_tests')
      .select(`
        *,
        variations:ab_test_variations (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!tests || tests.length === 0) {
      return {
        total_tests: 0,
        insights: []
      };
    }

    // Generate insights
    const insights = [];

    // Insight 1: Best performing variation type
    const variationPerformance = {};
    tests.forEach(test => {
      test.variations.forEach(v => {
        if (!variationPerformance[v.variation_name]) {
          variationPerformance[v.variation_name] = { wins: 0, total: 0 };
        }
        variationPerformance[v.variation_name].total++;
        if (v.id === test.winner_variation_id) {
          variationPerformance[v.variation_name].wins++;
        }
      });
    });

    // Insight 2: Average engagement improvement
    const avgImprovement = tests.reduce((sum, test) => {
      const winner = test.variations.find(v => v.id === test.winner_variation_id);
      const loser = test.variations.find(v => v.id !== test.winner_variation_id);
      if (winner && loser && loser.total_engagement > 0) {
        const improvement = ((winner.total_engagement - loser.total_engagement) / loser.total_engagement) * 100;
        return sum + improvement;
      }
      return sum;
    }, 0) / tests.length;

    insights.push({
      type: 'improvement',
      message: `A/B testing improves engagement by ${avgImprovement.toFixed(0)}% on average`,
      value: avgImprovement.toFixed(1)
    });

    return {
      total_tests: tests.length,
      insights
    };

  } catch (error) {
    console.error('❌ Error getting A/B insights:', error);
    throw error;
  }
}

module.exports = {
  createABTest,
  getUserABTests,
  getTestResults,
  updateVariationMetrics,
  checkAndCompleteTest,
  declareWinner,
  cancelTest,
  getABTestingInsights
};

