/**
 * Fetch User Posts Service
 * Pulls past posts from connected social media accounts to bootstrap brand voice
 * 
 * Sources (in priority order):
 * 1. Twitter API (tweet.read scope available) - fetches real tweets
 * 2. Internal posts table (posts made through our app)
 * 3. LinkedIn - limited by API scope (w_member_social is write-only)
 * 
 * Falls back gracefully if any source fails.
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Fetch user's past posts from all connected platforms
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { posts: string[], sources: object, totalFetched: number }
 */
async function fetchUserPosts(userId) {
  console.log(`\n\u{1F50D} Fetching past posts for user ${userId} from connected accounts...`);

  const allPosts = [];
  const sources = {};

  // 1. Fetch from internal posts table (posts made through the app)
  try {
    const internalPosts = await fetchInternalPosts(userId);
    if (internalPosts.length > 0) {
      allPosts.push(...internalPosts);
      sources.internal = { count: internalPosts.length, status: 'success' };
      console.log(`   \u2705 Internal posts: ${internalPosts.length} posts`);
    } else {
      sources.internal = { count: 0, status: 'empty' };
      console.log(`   \u26A0\uFE0F  Internal posts: none found`);
    }
  } catch (error) {
    sources.internal = { count: 0, status: 'error', error: error.message };
    console.error(`   \u274C Internal posts error:`, error.message);
  }

  // 2. Fetch from Twitter (we have tweet.read scope)
  try {
    const twitterPosts = await fetchTwitterPosts(userId);
    if (twitterPosts.length > 0) {
      allPosts.push(...twitterPosts);
      sources.twitter = { count: twitterPosts.length, status: 'success' };
      console.log(`   \u2705 Twitter posts: ${twitterPosts.length} tweets`);
    } else {
      sources.twitter = { count: 0, status: 'empty' };
      console.log(`   \u26A0\uFE0F  Twitter: no tweets found or not connected`);
    }
  } catch (error) {
    sources.twitter = { count: 0, status: 'error', error: error.message };
    console.error(`   \u274C Twitter error:`, error.message);
  }

  // 3. Try LinkedIn (may fail due to scope limitations)
  try {
    const linkedinPosts = await fetchLinkedInPosts(userId);
    if (linkedinPosts.length > 0) {
      allPosts.push(...linkedinPosts);
      sources.linkedin = { count: linkedinPosts.length, status: 'success' };
      console.log(`   \u2705 LinkedIn posts: ${linkedinPosts.length} posts`);
    } else {
      sources.linkedin = { count: 0, status: 'not_available', note: 'LinkedIn read API requires r_member_social scope or Community Management API access' };
      console.log(`   \u26A0\uFE0F  LinkedIn: read API not available with current scope`);
    }
  } catch (error) {
    sources.linkedin = { count: 0, status: 'not_available', error: error.message };
    console.log(`   \u{1F4DD} LinkedIn: ${error.message}`);
  }

  // Deduplicate posts (some may exist in both internal and platform sources)
  const uniquePosts = deduplicatePosts(allPosts);

  console.log(`\n   \u{1F4CA} Total unique posts fetched: ${uniquePosts.length}`);
  console.log(`   Sources: ${JSON.stringify(Object.keys(sources).map(k => `${k}:${sources[k].count}`).join(', '))}`);

  return {
    posts: uniquePosts,
    sources,
    totalFetched: uniquePosts.length
  };
}

/**
 * Fetch posts from internal database (posts made through our app)
 */
async function fetchInternalPosts(userId) {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('text, platforms, created_at')
    .eq('user_id', userId)
    .eq('status', 'posted')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) throw error;

  return (data || [])
    .filter(p => p.text && p.text.trim().length > 20)
    .map(p => p.text.trim());
}

/**
 * Fetch tweets from Twitter API using stored OAuth token
 * Uses GET /2/users/:id/tweets endpoint (requires tweet.read scope)
 */
async function fetchTwitterPosts(userId) {
  // Get Twitter account credentials
  const { data: account, error } = await supabaseAdmin
    .from('user_accounts')
    .select('access_token, platform_user_id, platform_username, token_expires_at')
    .eq('user_id', userId)
    .eq('platform', 'twitter')
    .eq('status', 'active')
    .single();

  if (error || !account) {
    return []; // No Twitter account connected
  }

  if (!account.access_token || !account.platform_user_id) {
    return [];
  }

  try {
    // Fetch user's recent tweets using Twitter API v2
    const response = await axios.get(
      `https://api.twitter.com/2/users/${account.platform_user_id}/tweets`,
      {
        params: {
          max_results: 30,
          'tweet.fields': 'created_at,public_metrics,text',
          exclude: 'retweets,replies' // Only original tweets
        },
        headers: {
          'Authorization': `Bearer ${account.access_token}`
        },
        timeout: 10000
      }
    );

    if (!response.data?.data) {
      return [];
    }

    // Filter to only substantial tweets (not just links or short replies)
    return response.data.data
      .filter(tweet => tweet.text && tweet.text.trim().length > 30)
      .filter(tweet => !tweet.text.startsWith('RT @')) // Skip retweets that slipped through
      .map(tweet => tweet.text.trim());

  } catch (apiError) {
    // Handle token expiry
    if (apiError.response?.status === 401) {
      console.log('   \u{1F504} Twitter token expired, attempting refresh...');
      // TODO: implement token refresh and retry
    }
    throw new Error(`Twitter API: ${apiError.response?.data?.detail || apiError.message}`);
  }
}

/**
 * Attempt to fetch LinkedIn posts
 * NOTE: LinkedIn's w_member_social scope only allows WRITING posts.
 * Reading posts requires r_member_social or Community Management API access.
 * This function attempts the call but will gracefully fail.
 */
async function fetchLinkedInPosts(userId) {
  // Get LinkedIn account credentials
  const { data: account, error } = await supabaseAdmin
    .from('user_accounts')
    .select('access_token, platform_user_id, token_expires_at')
    .eq('user_id', userId)
    .eq('platform', 'linkedin')
    .eq('status', 'active')
    .single();

  if (error || !account) {
    return [];
  }

  try {
    // Try the Posts API (requires Community Management API access)
    const personUrn = `urn:li:person:${account.platform_user_id}`;
    const response = await axios.get(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        params: {
          q: 'authors',
          authors: `List(${personUrn})`,
          sortBy: 'LAST_MODIFIED',
          count: 20
        },
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        },
        timeout: 10000
      }
    );

    if (!response.data?.elements) {
      return [];
    }

    // Extract text from UGC posts
    return response.data.elements
      .map(post => {
        const shareContent = post.specificContent?.['com.linkedin.ugc.ShareContent'];
        return shareContent?.shareCommentary?.text || '';
      })
      .filter(text => text.length > 30);

  } catch (apiError) {
    // This is expected to fail with current scope
    if (apiError.response?.status === 403 || apiError.response?.status === 401) {
      throw new Error('LinkedIn read API not available with current OAuth scope (w_member_social is write-only). Paste your LinkedIn posts manually for now.');
    }
    throw new Error(`LinkedIn API: ${apiError.response?.data?.message || apiError.message}`);
  }
}

/**
 * Deduplicate posts by content similarity
 * Removes exact duplicates and very similar posts
 */
function deduplicatePosts(posts) {
  const seen = new Set();
  const unique = [];

  for (const post of posts) {
    // Normalize for comparison
    const normalized = post.toLowerCase().replace(/\s+/g, ' ').trim().substring(0, 100);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(post);
    }
  }

  return unique;
}

module.exports = {
  fetchUserPosts,
  fetchInternalPosts,
  fetchTwitterPosts,
  fetchLinkedInPosts
};
