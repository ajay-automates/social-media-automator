/**
 * Trend Monitor Service
 * Monitors trending topics from Google Trends, Reddit, and Twitter
 * Matches trends to user's niche for timely content opportunities
 */

const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Fetch trending topics from Reddit
 * @param {string} subreddit - Subreddit name (default: 'all')
 * @param {number} limit - Number of trending posts
 * @returns {Promise<Array>} Trending topics
 */
async function fetchRedditTrending(subreddit = 'all', limit = 25) {
  try {
    console.log(`\n📱 Fetching Reddit trending from r/${subreddit}...`);

    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'SocialMediaAutomator/1.0'
      }
    });

    const posts = response.data.data.children.map(child => ({
      title: child.data.title,
      score: child.data.score,
      num_comments: child.data.num_comments,
      url: child.data.url,
      subreddit: child.data.subreddit,
      created: new Date(child.data.created_utc * 1000),
      upvote_ratio: child.data.upvote_ratio
    }));

    // Filter for high-quality trending posts
    const trending = posts.filter(p =>
      p.score > 500 &&
      p.upvote_ratio > 0.80
    );

    console.log(`   ✅ Found ${trending.length} trending topics on Reddit`);

    return trending.map(p => ({
      topic: p.title,
      source: 'reddit',
      score: Math.min(100, Math.round(p.score / 100)), // Convert to 0-100
      volume: p.score,
      category: p.subreddit,
      url: p.url
    }));

  } catch (error) {
    console.error('❌ Reddit trending fetch error:', error.message);
    return [];
  }
}

/**
 * Fetch trending topics from Twitter (via search)
 * Note: Twitter API v2 requires authentication. This is a simplified version.
 * For production, use Twitter API v2 with proper OAuth
 */
async function fetchTwitterTrending(keywords = [], location = 'US') {
  try {
    console.log(`\n🐦 Fetching Twitter trends for: ${keywords.join(', ')}...`);

    // For now, return mock data since Twitter API requires OAuth
    // In production, you'd use Twitter API v2:
    // GET https://api.twitter.com/2/tweets/search/recent?query=${keyword}

    console.log('   ⚠️  Twitter trending requires Twitter API credentials (coming soon)');

    return [];

  } catch (error) {
    console.error('❌ Twitter trending fetch error:', error.message);
    return [];
  }
}

/**
 * Fetch trending topics from Google Trends (RSS feed)
 * @param {string} geo - Geographic location (default: 'US')
 * @returns {Promise<Array>} Trending topics
 */
async function fetchGoogleTrends(geo = 'US') {
  try {
    console.log(`\n🔍 Fetching Google Trends for ${geo}...`);

    // Google Trends Daily RSS feed
    const url = `https://trends.google.com/trending/rss?geo=${geo}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SocialMediaAutomator/1.0)'
      }
    });

    // Parse RSS XML
    const xmlData = response.data;

    // Extract trending searches (basic XML parsing)
    const titleRegex = /<title>(.*?)<\/title>/g;
    const trafficRegex = /<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/g;

    const titles = [];
    const traffic = [];

    let match;
    while ((match = titleRegex.exec(xmlData)) !== null) {
      titles.push(match[1]);
    }
    while ((match = trafficRegex.exec(xmlData)) !== null) {
      traffic.push(match[1]);
    }

    // Skip first title (it's "Trending Searches")
    titles.shift();

    const trends = titles.slice(0, 20).map((title, index) => {
      const volumeStr = traffic[index] || '10,000+';
      const volume = parseInt(volumeStr.replace(/[+,]/g, '')) || 10000;

      return {
        topic: title,
        source: 'google',
        score: Math.min(100, Math.round(volume / 1000)), // Convert to 0-100
        volume: volume,
        category: 'general',
        url: `https://trends.google.com/trends/explore?q=${encodeURIComponent(title)}`
      };
    });

    console.log(`   ✅ Found ${trends.length} trending topics on Google`);

    return trends;

  } catch (error) {
    console.error('❌ Google Trends fetch error:', error.message);
    return [];
  }
}

/**
 * Aggregate trends from all sources
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} All trending topics
 */
/**
 * Fetch trending topics from Hacker News (Algolia API)
 * @returns {Promise<Array>} Trending topics
 */
async function fetchHackerNewsTrending() {
  try {
    console.log('\n👨‍💻 Fetching Hacker News trends...');
    // Fetch stories with > 200 points
    const url = 'https://hn.algolia.com/api/v1/search?tags=story&numericFilters=points>200';

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'SocialMediaAutomator/1.0'
      }
    });

    const hits = response.data.hits || [];

    const trending = hits.map(hit => ({
      topic: hit.title,
      source: 'hacker_news',
      score: Math.min(100, Math.round(hit.points / 10)), // Normalize points
      volume: hit.points,
      category: 'tech',
      url: `https://news.ycombinator.com/item?id=${hit.objectID}`
    }));

    console.log(`   ✅ Found ${trending.length} trending stories on Hacker News`);
    return trending;

  } catch (error) {
    console.error('❌ Hacker News fetch error:', error.message);
    return [];
  }
}

/**
 * Aggregate trends from all sources
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} All trending topics
 */
async function fetchAllTrends(options = {}) {
  try {
    console.log('\n🌐 Fetching trends from all sources...');

    // If subreddit is 'all', use a curated list of AI/Tech subreddits
    let redditTrends = [];
    if (!options.subreddit || options.subreddit === 'all') {
      const subreddits = ['artificial', 'MachineLearning', 'ChatGPT', 'technology', 'Futurology'];
      const results = await Promise.all(
        subreddits.map(sub => fetchRedditTrending(sub, 10))
      );
      redditTrends = results.flat();
    } else {
      redditTrends = await fetchRedditTrending(options.subreddit, options.limit || 25);
    }

    const [googleTrends, hackerNewsTrends] = await Promise.all([
      fetchGoogleTrends(options.geo || 'US'),
      fetchHackerNewsTrending()
    ]);

    const allTrends = [
      ...googleTrends,
      ...redditTrends,
      ...hackerNewsTrends
    ];

    // Sort by score (descending)
    allTrends.sort((a, b) => b.score - a.score);

    console.log(`\n✅ Total trends found: ${allTrends.length}`);

    return allTrends;

  } catch (error) {
    console.error('❌ Error fetching all trends:', error);
    return [];
  }
}

/**
 * Match trends to user's niche using AI
 * @param {Array} trends - Array of trending topics
 * @param {Array} userNiches - User's topics of interest
 * @param {number} minScore - Minimum match score (0-100)
 * @returns {Promise<Array>} Matched trends with scores
 */
async function matchTrendsToNiche(trends, userNiches, minScore = 60) {
  try {
    if (!trends || trends.length === 0) {
      return [];
    }

    if (!userNiches || userNiches.length === 0) {
      // No niche preferences, return top trends
      return trends.slice(0, 10).map(t => ({
        ...t,
        niche_match_score: 50
      }));
    }

    console.log(`\n🎯 Matching trends to niches: ${userNiches.join(', ')}...`);

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('   ⚠️  Anthropic API key not configured, returning all trends');
      return trends.slice(0, 10).map(t => ({
        ...t,
        niche_match_score: 50
      }));
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Batch process trends (max 20 at a time)
    const topTrends = trends.slice(0, 20);

    const prompt = `Match these trending topics to user's niches and return ONLY a JSON array of scores.

User's niches: ${userNiches.join(', ')}

Trending topics:
${topTrends.map((t, i) => `${i + 1}. ${t.topic}`).join('\n')}

For each topic, score 0-100 how relevant it is to the user's niches:
- 90-100: Perfect match (directly related)
- 70-89: Strong match (closely related)
- 50-69: Moderate match (somewhat related)
- 30-49: Weak match (tangentially related)
- 0-29: Poor match (not related)

Return ONLY a JSON array of numbers [score1, score2, ...], no additional text.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text.trim();

    // Extract JSON array
    const jsonMatch = responseText.match(/\[([\d,\s]+)\]/);
    if (!jsonMatch) {
      console.log('   ⚠️  Could not parse AI response, returning all trends');
      return trends.slice(0, 10).map(t => ({
        ...t,
        niche_match_score: 50
      }));
    }

    const scores = JSON.parse(jsonMatch[0]);

    // Combine trends with scores
    const matchedTrends = topTrends.map((trend, index) => ({
      ...trend,
      niche_match_score: scores[index] || 0
    }));

    // Filter by minimum score and sort
    const filtered = matchedTrends
      .filter(t => t.niche_match_score >= minScore)
      .sort((a, b) => b.niche_match_score - a.niche_match_score);

    console.log(`   ✅ Found ${filtered.length} matching trends (score >= ${minScore})`);

    return filtered;

  } catch (error) {
    console.error('❌ Error matching trends to niche:', error);
    // Return top 10 trends without scoring on error
    return trends.slice(0, 10).map(t => ({
      ...t,
      niche_match_score: 50
    }));
  }
}

/**
 * Save trend alert to database
 * @param {string} userId - User ID
 * @param {Object} trend - Trend object
 * @param {string} draftCaption - Draft caption (optional)
 * @returns {Promise<Object>} Saved trend alert
 */
async function saveTrendAlert(userId, trend, draftCaption = null) {
  try {
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // Expires in 48 hours

    const { data, error } = await supabase
      .from('trend_alerts')
      .insert({
        user_id: userId,
        trend_topic: trend.topic,
        trend_keyword: trend.topic.split(' ').slice(0, 3).join(' '), // First 3 words
        trend_source: trend.source,
        trend_score: trend.score,
        trend_volume: trend.volume,
        trend_category: trend.category,
        user_niche_match_score: trend.niche_match_score || 50,
        draft_caption: draftCaption,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('❌ Error saving trend alert:', error);
    throw error;
  }
}

/**
 * Get active trend alerts for user
 * @param {string} userId - User ID
 * @param {number} limit - Max number of alerts
 * @returns {Promise<Array>} Trend alerts
 */
async function getTrendAlerts(userId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('trend_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('user_niche_match_score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching trend alerts:', error);
    return [];
  }
}

/**
 * Fetch trending data for a specific keyword
 * @param {string} keyword - Keyword to fetch trends for
 * @param {number} days - Number of past days to look at (default: 7)
 * @returns {Promise<Object>} Keyword trending data with context
 */
async function fetchKeywordTrendingData(keyword, days = 7) {
  try {
    console.log(`\n🔍 Fetching trending data for keyword: "${keyword}" (last ${days} days)...`);

    if (!keyword || keyword.trim().length === 0) {
      return {
        keyword,
        success: false,
        error: 'Invalid keyword'
      };
    }

    // 1. Fetch all current trends
    const allTrends = await fetchAllTrends();

    // 2. Search for keyword in trends
    const keywordLower = keyword.toLowerCase();
    const relatedTrends = allTrends.filter(trend =>
      trend.topic.toLowerCase().includes(keywordLower) ||
      keywordLower.includes(trend.topic.toLowerCase().split(' ')[0])
    );

    // 3. Fetch Reddit posts related to keyword
    let redditPosts = [];
    try {
      // Search multiple subreddits that might have the keyword
      const subreddits = ['all', 'news', 'technology', 'business', 'sports', 'entertainment'];
      const redditResults = [];

      for (const subreddit of subreddits) {
        const posts = await fetchRedditTrending(subreddit, 15);
        const filtered = posts.filter(p =>
          p.topic.toLowerCase().includes(keywordLower)
        );
        redditResults.push(...filtered);
      }

      redditPosts = redditResults.slice(0, 5);
    } catch (error) {
      console.log(`   ⚠️  Error fetching Reddit posts for keyword`);
    }

    // 4. Get context about the keyword using AI
    let keywordContext = '';
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY
        });

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          temperature: 0.5,
          messages: [{
            role: 'user',
            content: `Provide a brief overview (2-3 sentences) about recent trends and news about "${keyword}" in the last ${days} days. Focus on factual information that would be useful for social media content creation.`
          }]
        });

        keywordContext = message.content[0].text;
      } catch (error) {
        console.log(`   ⚠️  Could not generate keyword context`);
      }
    }

    // 5. Combine and return data
    const trendingData = {
      keyword,
      success: true,
      context: keywordContext,
      relatedTrends,
      redditPosts,
      totalSources: (relatedTrends.length > 0 ? 1 : 0) + (redditPosts.length > 0 ? 1 : 0),
      lastUpdated: new Date().toISOString()
    };

    console.log(`   ✅ Found data about "${keyword}": ${relatedTrends.length} trending topics, ${redditPosts.length} reddit posts`);

    return trendingData;

  } catch (error) {
    console.error(`❌ Error fetching keyword trending data:`, error);
    return {
      keyword,
      success: false,
      error: error.message
    };
  }
}

/**
 * Monitor trends for user and create alerts
 * @param {string} userId - User ID
 * @param {Array} userNiches - User's topics of interest
 * @returns {Promise<Object>} Monitoring results
 */
async function monitorTrendsForUser(userId, userNiches) {
  try {
    console.log(`\n🤖 Monitoring trends for user ${userId}...`);

    // 1. Fetch all trends
    const trends = await fetchAllTrends();

    if (trends.length === 0) {
      return {
        success: false,
        message: 'No trends found',
        trendsFound: 0,
        alertsCreated: 0
      };
    }

    // 2. Match to user's niche
    const matchedTrends = await matchTrendsToNiche(trends, userNiches, 70);

    if (matchedTrends.length === 0) {
      return {
        success: true,
        message: 'No matching trends found',
        trendsFound: trends.length,
        alertsCreated: 0
      };
    }

    // 3. Save top 5 matches as alerts
    const topMatches = matchedTrends.slice(0, 5);
    const alerts = [];

    for (const trend of topMatches) {
      try {
        const alert = await saveTrendAlert(userId, trend);
        alerts.push(alert);
      } catch (error) {
        console.error(`   ⚠️  Failed to save alert for: ${trend.topic}`);
      }
    }

    console.log(`✅ Created ${alerts.length} trend alerts`);

    return {
      success: true,
      message: `Created ${alerts.length} trend alerts`,
      trendsFound: trends.length,
      matchedTrends: matchedTrends.length,
      alertsCreated: alerts.length,
      alerts
    };

  } catch (error) {
    console.error('❌ Error monitoring trends:', error);
    throw error;
  }
}

module.exports = {
  fetchRedditTrending,
  fetchTwitterTrending,
  fetchGoogleTrends,
  fetchAllTrends,
  matchTrendsToNiche,
  saveTrendAlert,
  getTrendAlerts,
  monitorTrendsForUser,
  fetchKeywordTrendingData
};
