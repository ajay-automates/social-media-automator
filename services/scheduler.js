const cron = require('node-cron');
const { postTextToLinkedIn, postImageToLinkedIn, postToLinkedIn } = require('./linkedin');
const { postToTwitter } = require('./twitter');
const { sendToTelegram } = require('./telegram');
const { sendToSlack } = require('./slack');
const { sendToDiscord } = require('./discord');
const { postToReddit } = require('./reddit');
const { postToInstagram } = require('./instagram');
const { postToFacebookPage } = require('./facebook');
const { postToYouTube } = require('./youtube');
const { getUserCredentialsForPosting, refreshRedditToken } = require('./oauth');
const { updatePostStatus } = require('./database');
const cache = require('./cache');

// Use shared Supabase admin client from database.js
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const supabase = createClient(supabaseUrl, supabaseServiceKey);

let isProcessing = false;

// Start the scheduler
function startScheduler() {
  console.log('🚀 Queue processor started - checking every minute');

  // Run every minute - process due posts
  cron.schedule('* * * * *', async () => {
    if (isProcessing) return;

    try {
      isProcessing = true;
      await processDueQueue();
    } catch (error) {
      console.error('❌ Queue processor error:', error);
    } finally {
      isProcessing = false;
    }
  });

  // Run every Monday at 9 AM - send weekly email reports
  cron.schedule('0 9 * * 1', async () => {
    console.log('📧 Running weekly email reports job...');

    try {
      const { sendWeeklyReportsToAll } = require('./reports');
      const result = await sendWeeklyReportsToAll();
      console.log(`✅ Email reports sent: ${result.sent} successful, ${result.failed} failed`);
    } catch (error) {
      console.error('❌ Email reports job error:', error);
    }
  });

  console.log('📧 Email reports scheduler initialized (Mondays at 9 AM)');

  // Run every Sunday at 10 AM - content recycling for all users with auto-recycle enabled
  cron.schedule('0 10 * * 0', async () => {
    console.log('♻️  Running content recycling job...');

    try {
      const { runAutoRecycleForAllUsers } = require('./content-recycling');
      const result = await runAutoRecycleForAllUsers();
      console.log(`✅ Content recycling completed: ${result.successfulUsers}/${result.processedUsers} users`);
    } catch (error) {
      console.error('❌ Content recycling job error:', error);
    }
  });

  console.log('♻️  Content recycling scheduler initialized (Sundays at 10 AM)');
}

async function processDueQueue() {
  try {
    // Get all posts that are due (including partial failures for retry)
    const { data: duePostsData, error: dueError } = await supabase
      .from('posts')
      .select('*')
      .in('status', ['queued', 'partial']) // Also retry partial failures
      .lte('schedule_time', new Date().toISOString())
      .limit(10);

    if (dueError) {
      console.error('Error fetching due posts:', dueError);
      return;
    }

    if (!duePostsData || duePostsData.length === 0) {
      return;
    }

    console.log(`📋 Processing ${duePostsData.length} due posts...`);

    for (const post of duePostsData) {
      await postNow(post);
    }
  } catch (error) {
    console.error('❌ Error in processDueQueue:', error);
  }
}

async function postNow(text, imageUrl, platforms, providedCredentials, post_metadata, useVariations = false, videoUrl = null) {
  try {
    console.log('📹 postNow called with video:', videoUrl ? 'YES' : 'NO');
    let id, user_id, image_url, platformsArray, credentials, postMetadata, variationsData;

    // Support both signatures:
    // 1. postNow({id, user_id, text, image_url, platforms, post_metadata}) - for scheduled posts
    // 2. postNow(text, imageUrl, platforms, credentials, post_metadata, useVariations) - for immediate posts
    if (typeof text === 'object' && text.text) {
      // Signature 1: Scheduled post object
      ({ id, user_id, text, image_url, platforms, post_metadata } = text);
      platformsArray = platforms;
      postMetadata = post_metadata;
      if (typeof platforms === 'string') {
        platformsArray = JSON.parse(platforms);
      }
      // Get credentials from database
      credentials = await getUserCredentialsForPosting(user_id);
    } else if (typeof text === 'object' && !text.text) {
      // Signature 3: Variations object
      variationsData = text;
      platformsArray = platforms;
      image_url = videoUrl || imageUrl; // Prioritize video over image
      credentials = providedCredentials;
      postMetadata = post_metadata;
      user_id = 'immediate';
    } else {
      // Signature 2: Immediate post (OLD signature)
      platformsArray = platforms;
      image_url = videoUrl || imageUrl; // Prioritize video over image
      credentials = providedCredentials;
      postMetadata = post_metadata;
      user_id = 'immediate';
    }

    console.log(`\n📤 Posting to: ${platformsArray.join(', ')}`);
    if (variationsData) {
      console.log(`🎨 Using platform-specific variations`);
    }
    if (videoUrl) {
      console.log(`📹 Attaching video: ${videoUrl.substring(0, 50)}...`);
    } else if (imageUrl) {
      console.log(`🖼️ Attaching image: ${imageUrl.substring(0, 50)}...`);
    }

    if (!credentials) {
      console.error(`❌ No credentials found`);
      return {};
    }

    const results = {};

    // Process each platform
    for (const platform of platformsArray) {
      try {
        // Get platform-specific text (use variation if available, otherwise use original text)
        const platformText = variationsData && variationsData[platform] ? variationsData[platform] : text;

        console.log(`  → Posting to ${platform}...`);
        if (variationsData && variationsData[platform]) {
          console.log(`    🎨 Using custom variation (${platformText.length} chars)`);
        }

        if (platform === 'linkedin') {
          if (credentials.linkedin && Array.isArray(credentials.linkedin)) {
            results.linkedin = [];
            for (const account of credentials.linkedin) {
              try {
                const result = await postToLinkedIn(platformText, image_url, account);
                // Ensure platform property is set
                if (!result.platform) {
                  result.platform = 'linkedin';
                }
                results.linkedin.push(result);
                if (result.success) {
                  console.log('    ✅ Posted to LinkedIn');
                } else {
                  console.log('    ❌ LinkedIn error: ' + result.error);
                }
              } catch (err) {
                console.error('    ❌ LinkedIn error:', err.message);
                results.linkedin.push({ success: false, error: err.message, platform: 'linkedin' });
              }
            }
          }
        }
        else if (platform === 'twitter') {
          // Twitter - post to all connected accounts
          if (credentials.twitter && Array.isArray(credentials.twitter)) {
            console.log(`🐦 Twitter credentials found:`, credentials.twitter.length, 'accounts');
            for (const account of credentials.twitter) {
              console.log(`🐦 Posting to Twitter with account:`, JSON.stringify(account, null, 2));
              try {
                // Check if token is expired and refresh if needed
                if (account.token_expires_at && new Date(account.token_expires_at) <= new Date()) {
                  console.log('    🔄 Twitter token expired, refreshing...');
                  const { refreshTwitterToken } = require('./twitter-auth');
                  const refreshResult = await refreshTwitterToken(user_id, account.platform_user_id);
                  
                  if (refreshResult.success) {
                    // Update account with new token
                    account.accessToken = refreshResult.accessToken;
                    account.bearerToken = refreshResult.accessToken;
                    console.log('    ✅ Twitter token refreshed');
                  } else {
                    console.error('    ❌ Failed to refresh Twitter token:', refreshResult.error);
                    results.twitter = results.twitter || [];
                    results.twitter.push({ 
                      success: false, 
                      error: 'Token expired and refresh failed. Please reconnect your Twitter account.',
                      platform: 'twitter'
                    });
                    continue;
                  }
                }

                const result = await postToTwitter(platformText, account, image_url);
                results.twitter = results.twitter || [];
                // Ensure platform property is set
                if (!result.platform) {
                  result.platform = 'twitter';
                }
                results.twitter.push(result);
                
                // Check if error is due to token expiration (401, token expired, unauthorized)
                if (!result.success && (
                  result.error?.toLowerCase().includes('token') || 
                  result.error?.toLowerCase().includes('expired') || 
                  result.error?.toLowerCase().includes('unauthorized') ||
                  result.error?.includes('401')
                )) {
                  console.log('    🔄 Twitter returned token error, attempting refresh...');
                  const { refreshTwitterToken } = require('./twitter-auth');
                  const refreshResult = await refreshTwitterToken(user_id, account.platform_user_id);
                  
                  if (refreshResult.success) {
                    account.accessToken = refreshResult.accessToken;
                    account.bearerToken = refreshResult.accessToken;
                    // Retry posting
                    const retryResult = await postToTwitter(platformText, account, image_url);
                    if (retryResult.success) {
                      results.twitter[results.twitter.length - 1] = retryResult;
                      console.log(`    ✅ Posted to Twitter after token refresh`);
                    } else {
                      results.twitter[results.twitter.length - 1] = {
                        ...retryResult,
                        error: `Token refreshed but post still failed: ${retryResult.error}`
                      };
                      console.error(`    ❌ Twitter post failed after refresh:`, retryResult.error);
                    }
                  } else {
                    results.twitter[results.twitter.length - 1] = {
                      success: false,
                      error: `Token expired. Please reconnect your Twitter account in Settings.`,
                      platform: 'twitter',
                      requiresReconnect: true
                    };
                    console.error('    ❌ Failed to refresh Twitter token:', refreshResult.error);
                  }
                } else if (result.success) {
                  console.log(`    ✅ Posted to Twitter successfully`);
                } else {
                  console.log(`    ❌ Twitter error:`, result.error);
                }
              } catch (err) {
                console.error(`    ❌ Twitter error:`, err.message);
                const errorMessage = err.response?.status === 401 
                  ? 'Token expired. Please reconnect your Twitter account in Settings.'
                  : err.message;
                results.twitter = results.twitter || [];
                results.twitter.push({ 
                  success: false, 
                  error: errorMessage, 
                  platform: 'twitter',
                  requiresReconnect: err.response?.status === 401
                });
              }
            }
          } else {
            console.log(`⚠️  No Twitter credentials found`);
          }
        }
        else if (platform === 'telegram') {
          // Telegram - post to all connected bots
          if (credentials.telegram && Array.isArray(credentials.telegram) && credentials.telegram.length > 0) {
            results.telegram = [];
            for (const account of credentials.telegram) {
              try {
                // Note: getUserCredentialsForPosting returns { botToken, chatId }
                console.log(`    📱 Posting to Telegram - Bot token: ${account.botToken ? 'exists' : 'missing'}, Chat ID: ${account.chatId}`);
                const result = await sendToTelegram(account.botToken, account.chatId, platformText, image_url);
                // Ensure platform property is set
                if (!result.platform) {
                  result.platform = 'telegram';
                }
                results.telegram.push(result);
                console.log(`    ✅ Posted to Telegram - Result:`, JSON.stringify(result, null, 2));
              } catch (err) {
                console.error(`    ❌ Telegram error:`, err.message);
                console.error(`    ❌ Telegram error details:`, {
                  message: err.message,
                  response: err.response?.data,
                  status: err.response?.status
                });
                
                // Check for common Telegram errors
                let errorMessage = err.message;
                if (err.response?.status === 401 || err.message?.toLowerCase().includes('unauthorized')) {
                  errorMessage = 'Telegram bot token is invalid or expired. Please reconnect your Telegram bot in Settings.';
                } else if (err.response?.status === 400) {
                  errorMessage = `Telegram error: ${err.response?.data?.description || err.message}`;
                } else if (err.response?.status === 403) {
                  errorMessage = 'Telegram bot does not have permission to send messages to this chat. Please check bot permissions.';
                }
                
                results.telegram.push({ 
                  success: false,
                  error: errorMessage, 
                  platform: 'telegram',
                  requiresReconnect: err.response?.status === 401
                });
              }
            }
          } else {
            console.log(`⚠️  No Telegram credentials found or invalid format`);
            console.log(`⚠️  Credentials structure:`, JSON.stringify(credentials.telegram, null, 2));
          }
        }
        else if (platform === 'slack') {
          // Slack - post to all connected webhooks
          if (credentials.slack && Array.isArray(credentials.slack) && credentials.slack.length > 0) {
            results.slack = [];
            for (const account of credentials.slack) {
              try {
                console.log(`    💬 Posting to Slack - Webhook: ${account.webhookUrl ? 'exists' : 'missing'}`);
                const result = await sendToSlack(account.webhookUrl, platformText, image_url);
                // Ensure platform property is set
                if (!result.platform) {
                  result.platform = 'slack';
                }
                results.slack.push(result);
                console.log(`    ✅ Posted to Slack - Result:`, JSON.stringify(result, null, 2));
              } catch (err) {
                console.error(`    ❌ Slack error:`, err.message);
                results.slack.push({ 
                  success: false,
                  error: err.message, 
                  platform: 'slack' 
                });
              }
            }
          } else {
            console.log(`⚠️  No Slack credentials found`);
          }
        }
        else if (platform === 'discord') {
          // Discord - post to all connected webhooks
          if (credentials.discord && Array.isArray(credentials.discord) && credentials.discord.length > 0) {
            results.discord = [];
            for (const account of credentials.discord) {
              try {
                console.log(`    🎮 Posting to Discord - Webhook: ${account.webhookUrl ? 'exists' : 'missing'}`);
                const result = await sendToDiscord(account.webhookUrl, platformText, image_url);
                // Ensure platform property is set
                if (!result.platform) {
                  result.platform = 'discord';
                }
                results.discord.push(result);
                console.log(`    ✅ Posted to Discord - Result:`, JSON.stringify(result, null, 2));
              } catch (err) {
                console.error(`    ❌ Discord error:`, err.message);
                results.discord.push({ 
                  success: false,
                  error: err.message, 
                  platform: 'discord' 
                });
              }
            }
          } else {
            console.log(`⚠️  No Discord credentials found`);
          }
        }
        else if (platform === 'reddit') {
          // Reddit - post to moderated subreddits
          if (credentials.reddit && Array.isArray(credentials.reddit) && credentials.reddit.length > 0) {
            results.reddit = [];
            for (const account of credentials.reddit) {
              try {
                // Check if token expired (Reddit tokens expire in 1 hour)
                let accessToken = account.accessToken;
                if (new Date(account.tokenExpiresAt) <= new Date()) {
                  console.log('    🔄 Refreshing Reddit token...');
                  const newToken = await refreshRedditToken(account.refreshToken);
                  accessToken = newToken.access_token;

                  // Update token in database
                  const { supabaseAdmin } = require('./database');
                  await supabaseAdmin
                    .from('user_accounts')
                    .update({
                      access_token: newToken.access_token,
                      token_expires_at: newToken.expires_at
                    })
                    .eq('platform', 'reddit')
                    .eq('access_token', account.accessToken);
                }

                // Get target subreddit and title from post metadata
                const subreddit = postMetadata?.reddit_subreddit || account.moderatedSubreddits[0];
                const title = postMetadata?.reddit_title || text.substring(0, 300); // Reddit title limit

                if (!subreddit) {
                  console.log(`    ⚠️  No subreddit specified for Reddit post`);
                  results.reddit.push({
                    success: false,
                    error: 'No subreddit specified',
                    platform: 'reddit'
                  });
                  continue;
                }

                console.log(`    🔴 Posting to Reddit r/${subreddit}`);
                const result = await postToReddit(subreddit, title, platformText, image_url, accessToken);
                results.reddit.push(result);

                if (result.success) {
                  console.log(`    ✅ Posted to Reddit - URL: ${result.url}`);
                } else {
                  console.log(`    ❌ Reddit error: ${result.error}`);
                }
              } catch (err) {
                console.error(`    ❌ Reddit error:`, err.message);
                results.reddit.push({ 
                  success: false,
                  error: err.message, 
                  platform: 'reddit' 
                });
              }
            }
          } else {
            console.log(`⚠️  No Reddit credentials found`);
          }
        }
        else if (platform === 'instagram') {
          // ✅ FIXED: Use database credentials instead of process.env
          if (credentials.instagram && Array.isArray(credentials.instagram)) {
            for (const account of credentials.instagram) {
              try {
                // Credentials structure: { accessToken, igUserId }
                const result = await postToInstagram(platformText, image_url, account.accessToken, account.igUserId);
                // Ensure platform property is set
                if (!result.platform) {
                  result.platform = 'instagram';
                }
                results.instagram = results.instagram || [];
                results.instagram.push(result);
                if (result.success) {
                  console.log(`    ✅ Posted to Instagram`);
                } else {
                  console.log(`    ❌ Instagram error: ${result.error}`);
                }
              } catch (err) {
                console.error(`    ❌ Instagram error:`, err.message);
                results.instagram = results.instagram || [];
                results.instagram.push({
                  success: false,
                  error: err.message,
                  platform: 'instagram'
                });
              }
            }
          }
        }
        else if (platform === 'facebook') {
          // ✅ FIXED: Use database credentials instead of process.env
          if (credentials.facebook && Array.isArray(credentials.facebook)) {
            for (const account of credentials.facebook) {
              try {
                // Credentials structure: { accessToken, pageId }
                const result = await postToFacebookPage(text, image_url, {
                  pageId: account.pageId,
                  accessToken: account.accessToken
                });
                // Ensure platform property is set
                if (!result.platform) {
                  result.platform = 'facebook';
                }
                results.facebook = results.facebook || [];
                results.facebook.push(result);
                if (result.success) {
                  console.log(`    ✅ Posted to Facebook`);
                } else {
                  console.log(`    ❌ Facebook error: ${result.error}`);
                }
              } catch (err) {
                console.error(`    ❌ Facebook error:`, err.message);
                results.facebook = results.facebook || [];
                results.facebook.push({
                  success: false,
                  error: err.message,
                  platform: 'facebook'
                });
              }
            }
          }
        }
        else if (platform === 'youtube') {
          if (credentials.youtube && Array.isArray(credentials.youtube)) {
            results.youtube = [];
            for (const account of credentials.youtube) {
              try {
                // Only post if we have a video URL
                console.log('    🔍 Checking YouTube video URL:', image_url);
                // Check for Cloudinary video pattern, generic /video/ path, or common video extensions
                let isVideo = image_url && (
                  image_url.includes('/video/upload/') ||
                  image_url.includes('/video/') ||
                  image_url.match(/\.(mp4|mov|avi|wmv|flv|mkv|webm)$/i)
                );

                // Fallback for YouTube: if we have a URL and it doesn't look like an image, treat as video
                // This handles cases where the URL might not have a standard extension but is intended as a video
                if (!isVideo && image_url && platform === 'youtube') {
                  const isImage = image_url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                  if (!isImage) {
                    console.log('    ⚠️  URL detection ambiguous, assuming video for YouTube');
                    isVideo = true;
                  }
                }

                const videoUrl = isVideo ? image_url : null;

                if (!videoUrl) {
                  console.log(`    ⚠️  Skipping YouTube - no video URL provided`);
                  results.youtube.push({
                    success: false,
                    error: 'YouTube requires a video URL (Shorts only). Community Posts not supported.',
                    platform: 'youtube'
                  });
                  continue;
                }

                const content = {
                  text: text,
                  videoUrl: videoUrl,
                  imageUrl: null,
                  title: text.substring(0, 100),
                  description: text.substring(0, 5000),
                  tags: [],
                  type: 'short'
                };

                // Match the format that youtube.js expects
                // Include token_expires_at for proactive refresh
                const ytCredentials = {
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  token_expires_at: account.token_expires_at
                };

                const result = await postToYouTube(content, ytCredentials);
                results.youtube.push(result);

                if (result.success) {
                  console.log(`    ✅ Posted to YouTube (${account.platform_user_id})`);
                } else {
                  console.log(`    ❌ YouTube error: ${result.error}`);
                }
              } catch (err) {
                console.error(`    ❌ YouTube error:`, err.message);
                results.youtube.push({
                  success: false,
                  error: err.message,
                  platform: 'youtube'
                });
              }
            }
          }
        }
        else if (platform === 'tiktok') {
          // TikTok - post to all connected accounts
          if (credentials.tiktok && Array.isArray(credentials.tiktok)) {
            results.tiktok = [];
            for (const account of credentials.tiktok) {
              try {
                // TikTok requires video URL
                const videoUrl = image_url && (image_url.includes('/video/upload/') || image_url.includes('/video/')) ? image_url : null;

                if (!videoUrl) {
                  console.log(`    ⚠️  Skipping TikTok - no video URL provided`);
                  results.tiktok.push({
                    success: false,
                    error: 'TikTok requires a video URL. Text-only posts not supported.',
                    platform: 'tiktok'
                  });
                  continue;
                }

                // Post to TikTok using postToTikTok from server.js (via require)
                const tiktokService = require('./tiktok');

                // Check token expiry and refresh if needed
                let accessToken = account.access_token;
                if (new Date(account.expires_at) <= new Date()) {
                  const newTokens = await tiktokService.refreshAccessToken(account.refresh_token);
                  accessToken = newTokens.accessToken;
                }

                // Validate video URL
                const isValid = await tiktokService.validateVideoUrl(videoUrl);
                if (!isValid) {
                  throw new Error('Video URL is not accessible');
                }

                // Post video
                const result = await tiktokService.postVideo(accessToken, {
                  videoUrl: videoUrl,
                  caption: text || '',
                  privacyLevel: 'PUBLIC_TO_EVERYONE'
                });

                results.tiktok.push({
                  success: true,
                  platform: 'tiktok',
                  accountId: account.account_id,
                  publishId: result.publishId,
                  message: result.message
                });

                console.log(`    ✅ Posted to TikTok (@${account.username}) - Publish ID: ${result.publishId}`);
                console.log(`    📱 Video sent to TikTok inbox - user will receive notification`);
              } catch (err) {
                console.error(`    ❌ TikTok error:`, err.message);
                results.tiktok.push({
                  success: false,
                  error: err.message,
                  platform: 'tiktok',
                  accountId: account.account_id
                });
              }
            }
          }
        }
        else if (platform === 'pinterest') {
          // Pinterest - requires an image
          if (credentials.pinterest && Array.isArray(credentials.pinterest)) {
            results.pinterest = [];
            for (const account of credentials.pinterest) {
              try {
                if (!image_url) {
                  console.log(`    ⚠️  Skipping Pinterest - image required`);
                  results.pinterest.push({
                    success: false,
                    error: 'Pinterest requires an image. Please attach an image.',
                    platform: 'pinterest'
                  });
                  continue;
                }

                const { postToPinterest } = require('./pinterest');

                const result = await postToPinterest(text, image_url, account, {
                  boardId: post_metadata?.pinterestBoardId || null,
                  link: post_metadata?.pinterestLink || null,
                  title: post_metadata?.pinterestTitle || null
                });
                // Ensure platform property is set
                if (!result.platform) {
                  result.platform = 'pinterest';
                }
                results.pinterest.push(result);

                if (result.success) {
                  console.log(`    ✅ Posted to Pinterest (@${account.username})`);
                } else {
                  console.log(`    ❌ Pinterest error: ${result.error}`);
                }
              } catch (err) {
                console.error(`    ❌ Pinterest error:`, err.message);
                results.pinterest.push({
                  success: false,
                  error: err.message,
                  platform: 'pinterest'
                });
              }
            }
          }
        }
        else if (platform === 'medium') {
          // Medium - requires title and content
          if (credentials.medium && Array.isArray(credentials.medium)) {
            results.medium = [];
            for (const account of credentials.medium) {
              try {
                const { postToMedium, extractTitle, formatMediumContent, extractHashtags } = require('./medium');

                // Extract title from text (first line or first 60 chars)
                const title = extractTitle(text);

                // Format content for Medium (markdown with title and optional image)
                const content = formatMediumContent(title, text, image_url);

                // Extract hashtags as tags (max 3)
                const tags = extractHashtags(text);

                const result = await postToMedium(
                  title,
                  content,
                  'markdown',     // contentFormat
                  'public',       // publishStatus
                  tags,           // tags array
                  null,           // canonicalUrl
                  account         // credentials
                );

                results.medium.push(result);

                if (result.success) {
                  console.log(`    ✅ Posted to Medium (@${account.username}): ${result.url}`);
                } else {
                  console.log(`    ❌ Medium error: ${result.error}`);
                }
              } catch (err) {
                console.error(`    ❌ Medium error:`, err.message);
                results.medium.push({
                  success: false,
                  error: err.message,
                  platform: 'medium',
                  account: account.username || 'Medium'
                });
              }
            }
          }
        }
        else if (platform === 'devto') {
          // Dev.to - publish articles
          if (credentials.devto && Array.isArray(credentials.devto)) {
            results.devto = [];
            for (const account of credentials.devto) {
              try {
                const { postToDevTo, extractTitle, formatDevToContent, extractHashtags } = require('./devto');

                // Extract title from text (first line or first 60 chars)
                const title = extractTitle(text);

                // Format content for Dev.to (markdown with title and optional image)
                const body = formatDevToContent(title, text, image_url);

                // Extract hashtags as tags (max 4)
                const tags = extractHashtags(text);

                const result = await postToDevTo(
                  title,          // title
                  body,           // body_markdown
                  true,           // published
                  tags,           // tags array
                  image_url,      // coverImageUrl
                  null,           // canonicalUrl
                  null,           // description
                  account         // credentials
                );

                results.devto.push(result);

                if (result.success) {
                  console.log(`    ✅ Posted to Dev.to (@${account.username}): ${result.url}`);
                } else {
                  console.log(`    ❌ Dev.to error: ${result.error}`);
                }
              } catch (err) {
                console.error(`    ❌ Dev.to error:`, err.message);
                results.devto.push({
                  success: false,
                  error: err.message,
                  platform: 'devto',
                  account: account.username || 'Dev.to'
                });
              }
            }
          }
        }
        else if (platform === 'tumblr') {
          // Tumblr - supports text and photo posts
          if (credentials.tumblr && Array.isArray(credentials.tumblr)) {
            results.tumblr = [];
            for (const account of credentials.tumblr) {
              try {
                const { formatTumblrPost, postToTumblr } = require('./tumblr');

                // Format post based on whether there's an image
                const { type, data } = formatTumblrPost(text, image_url);

                const result = await postToTumblr(
                  account.blogName,
                  type,
                  data,
                  account
                );

                results.tumblr.push(result);

                if (result.success) {
                  console.log(`    ✅ Posted to Tumblr (${account.blogName}): ${result.url}`);
                } else {
                  console.log(`    ❌ Tumblr error: ${result.error}`);
                }
              } catch (err) {
                console.error(`    ❌ Tumblr error:`, err.message);
                results.tumblr.push({
                  success: false,
                  error: err.message,
                  platform: 'tumblr',
                  account: account.blogName || 'Tumblr'
                });
              }
            }
          }
        }
        else if (platform === 'mastodon') {
          // Mastodon - decentralized microblogging
          if (credentials.mastodon && Array.isArray(credentials.mastodon)) {
            results.mastodon = [];
            for (const account of credentials.mastodon) {
              try {
                const { postToMastodon, formatMastodonStatus } = require('./mastodon');

                // Format status (handle 500 char limit)
                const status = formatMastodonStatus(text, 500);

                const result = await postToMastodon(
                  status,
                  image_url,
                  'public', // visibility
                  account
                );

                results.mastodon.push(result);

                if (result.success) {
                  console.log(`    ✅ Posted to Mastodon (@${account.username}): ${result.url}`);
                } else {
                  console.log(`    ❌ Mastodon error: ${result.error}`);
                }
              } catch (err) {
                console.error(`    ❌ Mastodon error:`, err.message);
                results.mastodon.push({
                  success: false,
                  error: err.message,
                  platform: 'mastodon',
                  account: account.username || 'Mastodon'
                });
              }
            }
          }
        }
        else if (platform === 'bluesky') {
          // Bluesky - AT Protocol social network
          if (credentials.bluesky && Array.isArray(credentials.bluesky)) {
            results.bluesky = [];
            for (const account of credentials.bluesky) {
              try {
                const { postToBluesky, formatBlueskyText } = require('./bluesky');

                // Format text (handle 300 char limit)
                const formattedText = formatBlueskyText(text, 300);

                const result = await postToBluesky(
                  formattedText,
                  image_url,
                  account
                );

                results.bluesky.push(result);

                if (result.success) {
                  console.log(`    ✅ Posted to Bluesky (@${account.handle}): ${result.url}`);
                } else {
                  console.log(`    ❌ Bluesky error: ${result.error}`);
                }
              } catch (err) {
                console.error(`    ❌ Bluesky error:`, err.message);
                results.bluesky.push({
                  success: false,
                  error: err.message,
                  platform: 'bluesky',
                  account: account.handle || 'Bluesky'
                });
              }
            }
          }
        }

      } catch (error) {
        console.error(`❌ Platform ${platform} error:`, error);
        // Ensure platform name is set, fallback to platform variable if result doesn't have it
        const platformName = platform || 'unknown';
        results[platformName] = {
          success: false,
          error: error.message,
          platform: platformName
        };
      }
    }

    // Check if all platforms succeeded
    // A result is considered failed if success === false OR if it has an error
    const hasErrors = Object.values(results).some(r => {
      if (Array.isArray(r)) {
        return r.some(item => item.success === false || item.error);
      }
      return r.success === false || r.error;
    });

    // Check if ANY platform succeeded
    const hasSuccess = Object.values(results).some(r => {
      if (Array.isArray(r)) {
        return r.some(item => item.success === true);
      }
      return r.success === true;
    });

    // Determine status:
    // - 'posted' if all platforms succeeded
    // - 'partial' if some platforms succeeded and some failed (keep in queue for retry)
    // - 'failed' only if ALL platforms failed
    let status;
    if (!hasErrors) {
      status = 'posted';
    } else if (hasSuccess) {
      status = 'partial'; // Some succeeded, some failed - keep for retry
    } else {
      status = 'failed'; // All failed
    }

    // Only update post status if this is a scheduled post (has id)
    if (id) {
      await updatePostStatus(id, status, results);
      console.log(`✅ Post [${id}] completed - Status: ${status}`);

      // Invalidate analytics cache for this user (post status changed)
      if (user_id && user_id !== 'immediate') {
        cache.invalidateUserCacheByCategory(user_id, ['analytics', 'platform_stats']);
      }

      // Trigger webhooks for post success/failure/partial
      try {
        const { triggerWebhooks } = require('./webhooks');
        let eventType = 'post.success';
        if (status === 'failed') {
          eventType = 'post.failed';
        } else if (status === 'partial') {
          eventType = 'post.partial';
        }

        await triggerWebhooks(user_id, eventType, {
          post_id: id,
          text,
          platforms,
          image_url,
          status,
          results,
          timestamp: new Date().toISOString()
        });
      } catch (webhookError) {
        console.error('⚠️ Webhook trigger error (non-critical):', webhookError.message);
      }

      // Track hashtags from post
      try {
        const { trackHashtagsFromPost } = require('./hashtag-tracker');
        await trackHashtagsFromPost(user_id, id, text, platforms, !hasErrors);
      } catch (hashtagError) {
        console.error('⚠️ Hashtag tracking error (non-critical):', hashtagError.message);
      }
    }

    // Return results for immediate posting
    return results;

  } catch (error) {
    console.error(`❌ Error posting:`, error);

    // Only update post status if this is a scheduled post (has id)
    if (id) {
      await updatePostStatus(id, 'failed', { error: error.message });

      // Invalidate analytics cache for this user (post status changed)
      if (user_id && user_id !== 'immediate') {
        cache.invalidateUserCacheByCategory(user_id, ['analytics', 'platform_stats']);
      }

      // Trigger webhook for failure
      try {
        const { triggerWebhooks } = require('./webhooks');
        await triggerWebhooks(user_id, 'post.failed', {
          post_id: id,
          text,
          platforms,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      } catch (webhookError) {
        console.error('⚠️ Webhook trigger error (non-critical):', webhookError.message);
      }
    }

    throw error; // Re-throw for immediate posts
  }
}

// Note: updatePostStatus is now imported from database.js to avoid duplication

async function schedulePost(postData) {
  try {
    const { user_id, text, image_url, platforms, schedule_time } = postData;

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          user_id,
          text,
          image_url,
          platforms: Array.isArray(platforms) ? platforms : [platforms],
          schedule_time: new Date(schedule_time).toISOString(),
          status: 'queued',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    return { success: true, post: data[0] };
  } catch (error) {
    console.error('Error scheduling post:', error);
    return { success: false, error: error.message };
  }
}

async function getQueue(userId) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'queued')
      .order('schedule_time', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching queue:', error);
    return [];
  }
}

async function deleteFromQueue(postId, userId) {
  try {
    const { error, count } = await supabase      .from('posts')      .delete({ count: 'exact' })
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return { success: true, count };
  } catch (error) {
    console.error('Error deleting from queue:', error);
    return { success: false, error: error.message };
  }
}

async function getAllQueuedPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'queued')
      .order('schedule_time', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all queued posts:', error);
    return [];
  }
}

module.exports = {
  startScheduler,
  postNow,
  schedulePost,
  getQueue,
  deleteFromQueue,
  getAllQueuedPosts,
  processDueQueue,
};