// =============================================================================
// Platform Analytics Service
// Fetches real metrics (followers, views, likes, comments) from each platform API
// and stores daily snapshots with day-over-day deltas.
// =============================================================================

const { createClient } = require('@supabase/supabase-js');

function getAdminClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// =============================================================================
// YouTube — YouTube Data API v3
// =============================================================================
async function fetchYouTubeAnalytics(account) {
  const token = account.access_token;

  const channelRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const channelData = await channelRes.json();

  if (!channelData.items?.length) throw new Error('No YouTube channel found');

  const stats = channelData.items[0].statistics;

  const videosRes = await fetch(
    'https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&type=video&maxResults=20&order=date',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const videosData = await videosRes.json();
  const videoIds = (videosData.items || []).map(v => v.id.videoId).join(',');

  let posts = [];
  if (videoIds) {
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const statsData = await statsRes.json();
    posts = (statsData.items || []).map(video => ({
      platformPostId: video.id,
      title: video.snippet.title,
      postUrl: `https://youtube.com/watch?v=${video.id}`,
      thumbnailUrl: video.snippet.thumbnails?.medium?.url || null,
      publishedAt: video.snippet.publishedAt,
      views: parseInt(video.statistics.viewCount || '0'),
      likes: parseInt(video.statistics.likeCount || '0'),
      comments: parseInt(video.statistics.commentCount || '0'),
      shares: 0,
    }));
  }

  return {
    followers: parseInt(stats.subscriberCount || '0'),
    totalViews: parseInt(stats.viewCount || '0'),
    totalLikes: posts.reduce((s, p) => s + p.likes, 0),
    totalComments: posts.reduce((s, p) => s + p.comments, 0),
    totalPosts: parseInt(stats.videoCount || '0'),
    posts,
  };
}

// =============================================================================
// Instagram — Instagram Graph API
// =============================================================================
async function fetchInstagramAnalytics(account) {
  const token = account.access_token;

  const profileRes = await fetch(
    `https://graph.instagram.com/me?fields=id,username,media_count,followers_count&access_token=${token}`
  );
  const profile = await profileRes.json();

  const mediaRes = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20&access_token=${token}`
  );
  const mediaData = await mediaRes.json();

  const posts = (mediaData.data || []).map(post => ({
    platformPostId: post.id,
    title: post.caption?.substring(0, 100) || null,
    postUrl: post.permalink,
    thumbnailUrl: post.thumbnail_url || post.media_url || null,
    publishedAt: post.timestamp,
    views: 0,
    likes: post.like_count || 0,
    comments: post.comments_count || 0,
    shares: 0,
  }));

  let impressions = 0;
  try {
    const insightsRes = await fetch(
      `https://graph.instagram.com/${profile.id}/insights?metric=impressions&period=day&access_token=${token}`
    );
    const insightsData = await insightsRes.json();
    if (insightsData.data) {
      impressions = insightsData.data.find(m => m.name === 'impressions')?.values?.[0]?.value || 0;
    }
  } catch (e) { /* insights require business account */ }

  return {
    followers: profile.followers_count || 0,
    totalViews: impressions,
    totalLikes: posts.reduce((s, p) => s + p.likes, 0),
    totalComments: posts.reduce((s, p) => s + p.comments, 0),
    totalPosts: profile.media_count || 0,
    posts,
  };
}

// =============================================================================
// LinkedIn — LinkedIn API v2
// =============================================================================
async function fetchLinkedInAnalytics(account) {
  const token = account.access_token;

  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const profile = await profileRes.json();

  let posts = [];
  let totalLikes = 0;
  let totalComments = 0;

  try {
    const postsRes = await fetch(
      `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:person:${account.platform_user_id})&count=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const postsData = await postsRes.json();

    for (const post of postsData.elements || []) {
      try {
        const actionsRes = await fetch(
          `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(post.id)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const actions = await actionsRes.json();
        const likes = actions.likesSummary?.totalLikes || 0;
        const comments = actions.commentsSummary?.totalFirstLevelComments || 0;
        posts.push({
          platformPostId: post.id,
          title: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text?.substring(0, 100) || null,
          postUrl: null,
          thumbnailUrl: null,
          publishedAt: new Date(post.created?.time || Date.now()).toISOString(),
          views: 0,
          likes,
          comments,
          shares: 0,
        });
        totalLikes += likes;
        totalComments += comments;
      } catch (e) { /* skip post */ }
    }
  } catch (e) { /* posts endpoint may need extra permissions */ }

  return {
    followers: 0,
    totalViews: 0,
    totalLikes,
    totalComments,
    totalPosts: posts.length,
    posts,
  };
}

// =============================================================================
// Twitter/X — X API v2
// =============================================================================
async function fetchTwitterAnalytics(account) {
  const token = account.access_token;

  const userRes = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const userData = await userRes.json();
  const user = userData.data;
  const publicMetrics = user?.public_metrics || {};

  let posts = [];
  try {
    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${user.id}/tweets?max_results=20&tweet.fields=public_metrics,created_at`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const tweetsData = await tweetsRes.json();
    posts = (tweetsData.data || []).map(tweet => ({
      platformPostId: tweet.id,
      title: tweet.text?.substring(0, 100) || null,
      postUrl: `https://x.com/${user.username}/status/${tweet.id}`,
      thumbnailUrl: null,
      publishedAt: tweet.created_at,
      views: tweet.public_metrics?.impression_count || 0,
      likes: tweet.public_metrics?.like_count || 0,
      comments: tweet.public_metrics?.reply_count || 0,
      shares: tweet.public_metrics?.retweet_count || 0,
    }));
  } catch (e) { /* may require elevated access */ }

  return {
    followers: publicMetrics.followers_count || 0,
    totalViews: posts.reduce((s, p) => s + p.views, 0),
    totalLikes: posts.reduce((s, p) => s + p.likes, 0),
    totalComments: posts.reduce((s, p) => s + p.comments, 0),
    totalPosts: publicMetrics.tweet_count || 0,
    posts,
  };
}

// =============================================================================
// Substack — Unofficial public API
// =============================================================================
async function fetchSubstackAnalytics(account) {
  const subdomain = account.platform_username;
  try {
    const res = await fetch(`https://${subdomain}.substack.com/api/v1/archive?sort=new&limit=20`);
    const postsData = await res.json();
    const posts = (postsData || []).map(post => ({
      platformPostId: String(post.id),
      title: post.title,
      postUrl: post.canonical_url,
      thumbnailUrl: post.cover_image || null,
      publishedAt: post.post_date,
      views: 0,
      likes: post.reactions?.length || 0,
      comments: post.comment_count || 0,
      shares: 0,
    }));
    return {
      followers: 0,
      totalViews: 0,
      totalLikes: posts.reduce((s, p) => s + p.likes, 0),
      totalComments: posts.reduce((s, p) => s + p.comments, 0),
      totalPosts: posts.length,
      posts,
    };
  } catch (e) {
    return { followers: 0, totalViews: 0, totalLikes: 0, totalComments: 0, totalPosts: 0, posts: [] };
  }
}

// =============================================================================
// Dispatcher
// =============================================================================
async function fetchPlatformAnalytics(account) {
  switch (account.platform) {
    case 'youtube':   return fetchYouTubeAnalytics(account);
    case 'instagram': return fetchInstagramAnalytics(account);
    case 'linkedin':  return fetchLinkedInAnalytics(account);
    case 'twitter':   return fetchTwitterAnalytics(account);
    case 'substack':  return fetchSubstackAnalytics(account);
    default: throw new Error(`No analytics fetcher for platform: ${account.platform}`);
  }
}

// =============================================================================
// Main sync function — fetches all platforms for a user and saves to DB
// =============================================================================
async function syncUserAnalytics(userId) {
  const db = getAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Get all active connected accounts for this user
  const { data: accounts, error } = await db
    .from('user_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .in('platform', ['youtube', 'instagram', 'linkedin', 'twitter', 'substack']);

  if (error) throw error;
  if (!accounts?.length) return { results: [], message: 'No connected accounts' };

  const results = [];

  for (const account of accounts) {
    try {
      const analytics = await fetchPlatformAnalytics(account);

      // Get yesterday's snapshot for delta calculation
      const { data: prevSnapshot } = await db
        .from('platform_daily_snapshots')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', account.platform)
        .lt('date', today)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      // Upsert today's snapshot with deltas
      await db.from('platform_daily_snapshots').upsert(
        {
          user_id: userId,
          platform: account.platform,
          date: today,
          followers: analytics.followers,
          followers_delta: prevSnapshot ? analytics.followers - prevSnapshot.followers : 0,
          total_views: analytics.totalViews,
          views_delta: prevSnapshot ? analytics.totalViews - prevSnapshot.total_views : 0,
          total_likes: analytics.totalLikes,
          likes_delta: prevSnapshot ? analytics.totalLikes - prevSnapshot.total_likes : 0,
          total_comments: analytics.totalComments,
          comments_delta: prevSnapshot ? analytics.totalComments - prevSnapshot.total_comments : 0,
          total_posts: analytics.totalPosts,
        },
        { onConflict: 'user_id,platform,date' }
      );

      // Upsert post metrics
      for (const post of analytics.posts) {
        await db.from('platform_post_metrics').upsert(
          {
            user_id: userId,
            platform: account.platform,
            platform_post_id: post.platformPostId,
            title: post.title,
            post_url: post.postUrl,
            thumbnail_url: post.thumbnailUrl,
            published_at: post.publishedAt,
            views: post.views,
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
            fetched_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,platform,platform_post_id' }
        );
      }

      results.push({ platform: account.platform, status: 'success', postsUpdated: analytics.posts.length });
    } catch (err) {
      console.error(`[platformAnalytics] Failed to sync ${account.platform} for user ${userId}:`, err.message);
      results.push({ platform: account.platform, status: 'error', message: err.message });
    }
  }

  return { results, syncedAt: new Date().toISOString() };
}

module.exports = { syncUserAnalytics, fetchPlatformAnalytics };
