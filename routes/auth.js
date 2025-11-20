const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const { encryptState, decryptState } = require('../utilities/oauthState');
const { getFrontendUrl } = require('../utilities/helpers');
const { supabaseAdmin } = require('../utilities/supabase');
const crypto = require('crypto');
const axios = require('axios');

// In-memory storage for PKCE code_verifier (use Redis in production)
const pkceStore = new Map();
const sessionPkceStore = new Map();

const {
    initiateLinkedInOAuth,
    handleLinkedInCallback,
    initiateRedditOAuth,
    handleRedditCallback,
    handleInstagramCallback,
    initiateFacebookOAuth,
    handleFacebookCallback,
    initiatePinterestOAuth,
    handlePinterestCallback,
    initiateMediumOAuth,
    handleMediumCallback,
    initiateTumblrOAuth,
    handleTumblrCallback,
    disconnectAccount,
    getUserConnectedAccounts
} = require('../services/oauth');

const { validateBotToken } = require('../services/telegram');
const { validateWebhook: validateSlackWebhook } = require('../services/slack');
const { validateWebhook: validateDiscordWebhook } = require('../services/discord');
const { verifyMastodonCredentials } = require('../services/mastodon');
const { verifyBlueskyCredentials } = require('../services/bluesky');
const { validateDevToApiKey } = require('../services/devto');
const tiktokService = require('../services/tiktok');
const { generateYouTubeOAuthUrl, exchangeYouTubeCode, getChannelInfo } = require('../services/youtube');

// ============================================
// LINKEDIN ROUTES
// ============================================

router.post('/linkedin/url', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const clientId = process.env.LINKEDIN_CLIENT_ID;

        if (!clientId) {
            return res.status(500).json({
                success: false,
                error: 'LinkedIn OAuth not configured'
            });
        }

        const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/linkedin/callback`;
        const state = encryptState(userId);
        const scope = 'openid profile email w_member_social';

        const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', clientId);
        authUrl.searchParams.append('redirect_uri', redirectUri);
        authUrl.searchParams.append('scope', scope);
        authUrl.searchParams.append('state', state);

        res.json({
            success: true,
            authUrl: authUrl.toString()
        });
    } catch (error) {
        console.error('Error generating LinkedIn OAuth URL:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate OAuth URL'
        });
    }
});

router.get('/linkedin/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            return res.redirect(`${getFrontendUrl()}/dashboard?error=linkedin_denied`);
        }

        if (!code || !state) {
            return res.redirect(`${getFrontendUrl()}/dashboard?error=linkedin_missing_params`);
        }

        let userId;
        try {
            userId = decryptState(state);
        } catch (stateError) {
            return res.redirect(`${getFrontendUrl()}/dashboard?error=linkedin_invalid_state`);
        }

        const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/linkedin/callback`;

        let tokenResponse;
        try {
            tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
                params: {
                    grant_type: 'authorization_code',
                    code,
                    client_id: process.env.LINKEDIN_CLIENT_ID,
                    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
                    redirect_uri: redirectUri
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
        } catch (tokenError) {
            return res.redirect(`${getFrontendUrl()}/dashboard?error=linkedin_token_exchange_failed`);
        }

        const { access_token, expires_in } = tokenResponse.data;

        const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const profile = profileResponse.data;
        const expiresAt = new Date(Date.now() + (expires_in * 1000));

        await supabaseAdmin
            .from('user_accounts')
            .upsert({
                user_id: userId,
                platform: 'linkedin',
                platform_name: 'LinkedIn',
                oauth_provider: 'linkedin',
                access_token: access_token,
                token_expires_at: expiresAt.toISOString(),
                platform_user_id: profile.sub,
                platform_username: profile.name || profile.email,
                status: 'active',
                connected_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,platform,platform_user_id'
            });

        res.redirect(`${getFrontendUrl()}/connect-accounts?connected=linkedin&success=true`);
    } catch (error) {
        console.error('Error in LinkedIn callback:', error.message);
        res.redirect(`${getFrontendUrl()}/dashboard?error=linkedin_failed`);
    }
});

// ============================================
// TWITTER ROUTES
// ============================================

router.post('/twitter/url', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const clientId = process.env.TWITTER_CLIENT_ID;

        if (!clientId) {
            return res.status(500).json({
                success: false,
                error: 'Twitter OAuth not configured'
            });
        }

        const codeVerifier = crypto.randomBytes(32).toString('base64url');
        const codeChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');

        const state = encryptState(userId);

        const pkceData = { codeVerifier, userId, timestamp: Date.now() };
        pkceStore.set(state, pkceData);
        sessionPkceStore.set(state, pkceData);

        try {
            await supabaseAdmin
                .from('oauth_states')
                .insert({
                    state: state,
                    code_verifier: codeVerifier,
                    user_id: userId,
                    platform: 'twitter',
                    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
                });
        } catch (dbError) {
            console.warn('Could not save PKCE to database:', dbError.message);
        }

        setTimeout(() => {
            pkceStore.delete(state);
            sessionPkceStore.delete(state);
        }, 30 * 60 * 1000);

        const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/twitter/callback`;
        const scope = 'tweet.read tweet.write users.read offline.access tweet.moderate.write';

        const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', clientId);
        authUrl.searchParams.append('redirect_uri', redirectUri);
        authUrl.searchParams.append('scope', scope);
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('code_challenge_method', 'S256');

        res.json({
            success: true,
            authUrl: authUrl.toString()
        });
    } catch (error) {
        console.error('Error generating Twitter OAuth URL:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate OAuth URL'
        });
    }
});

router.get('/twitter/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            return res.redirect(`${getFrontendUrl()}/dashboard?error=twitter_denied`);
        }

        if (!code || !state) {
            return res.redirect(`${getFrontendUrl()}/dashboard?error=twitter_missing_params`);
        }

        let pkceData = pkceStore.get(state);
        if (!pkceData) {
            pkceData = sessionPkceStore.get(state);
            if (pkceData) {
                pkceStore.set(state, pkceData);
            }
        }

        if (!pkceData) {
            try {
                const { data: dbState } = await supabaseAdmin
                    .from('oauth_states')
                    .select('*')
                    .eq('state', state)
                    .eq('platform', 'twitter')
                    .gte('expires_at', new Date().toISOString())
                    .single();

                if (dbState) {
                    pkceData = {
                        codeVerifier: dbState.code_verifier,
                        userId: dbState.user_id,
                        timestamp: Date.now()
                    };
                    await supabaseAdmin.from('oauth_states').delete().eq('state', state);
                }
            } catch (dbErr) {
                console.error('Database lookup failed:', dbErr.message);
            }
        }

        if (!pkceData) {
            return res.redirect(`${getFrontendUrl()}/dashboard?error=twitter_expired`);
        }

        const { codeVerifier, userId } = pkceData;
        pkceStore.delete(state);

        const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/twitter/callback`;

        let tokenResponse;
        try {
            tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    client_id: process.env.TWITTER_CLIENT_ID,
                    redirect_uri: redirectUri,
                    code_verifier: codeVerifier
                }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
                }
            });
        } catch (tokenError) {
            return res.redirect(`${getFrontendUrl()}/dashboard?error=twitter_token_exchange_failed`);
        }

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        const userData = userResponse.data.data;
        const expiresAt = new Date(Date.now() + (expires_in * 1000));

        await supabaseAdmin
            .from('user_accounts')
            .upsert({
                user_id: userId,
                platform: 'twitter',
                platform_name: 'Twitter',
                oauth_provider: 'twitter',
                access_token: access_token,
                refresh_token: refresh_token,
                token_expires_at: expiresAt.toISOString(),
                platform_user_id: userData.id,
                platform_username: userData.username,
                status: 'active',
                connected_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,platform,platform_user_id'
            });

        res.redirect(`${getFrontendUrl()}/connect-accounts?connected=twitter&success=true`);
    } catch (error) {
        console.error('Error in Twitter callback:', error.message);
        res.redirect(`${getFrontendUrl()}/dashboard?error=twitter_failed`);
    }
});

// ============================================
// REDDIT ROUTES
// ============================================

router.post('/reddit/url', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const clientId = process.env.REDDIT_CLIENT_ID;

        if (!clientId) {
            return res.status(500).json({
                success: false,
                error: 'Reddit OAuth not configured'
            });
        }

        const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/reddit/callback`;
        const oauthUrl = initiateRedditOAuth(userId, redirectUri);

        res.json({
            success: true,
            oauthUrl: oauthUrl
        });
    } catch (error) {
        console.error('Error generating Reddit OAuth URL:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/reddit/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            return res.redirect('/settings?error=reddit_denied');
        }

        if (!code || !state) {
            return res.redirect('/settings?error=reddit_missing_params');
        }

        const redirectUri = `${process.env.APP_URL || req.protocol + '://' + req.get('host')}/auth/reddit/callback`;
        const result = await handleRedditCallback(code, state, redirectUri);

        if (result.success) {
            res.redirect('/settings?success=reddit');
        } else {
            res.redirect('/settings?error=reddit_failed');
        }
    } catch (error) {
        console.error('Reddit callback error:', error);
        res.redirect('/settings?error=reddit_callback_failed');
    }
});

// ============================================
// INSTAGRAM ROUTES
// ============================================

router.post('/instagram/url', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { initiateInstagramOAuth } = require('../services/oauth');
        const authUrl = initiateInstagramOAuth(userId);

        res.json({
            success: true,
            authUrl: authUrl.toString()
        });
    } catch (error) {
        console.error('Error generating Instagram OAuth URL:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/instagram/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            return res.redirect('/dashboard?error=instagram_denied');
        }

        if (!code || !state) {
            return res.redirect('/dashboard?error=instagram_invalid_callback');
        }

        try {
            const { handleInstagramCallback } = require('../services/oauth');
            await handleInstagramCallback(code, state);
            return res.redirect('/connect-accounts?instagram=connected');
        } catch (callbackError) {
            return res.redirect(`/dashboard?error=instagram_failed&message=${encodeURIComponent(callbackError.message)}`);
        }
    } catch (error) {
        console.error('Error handling Instagram callback:', error);
        return res.redirect('/dashboard?error=instagram_failed');
    }
});

// ============================================
// FACEBOOK ROUTES
// ============================================

router.post('/facebook/url', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { initiateFacebookOAuth } = require('../services/oauth');
        const oauthUrl = initiateFacebookOAuth(userId);

        res.json({
            success: true,
            oauthUrl
        });
    } catch (error) {
        console.error('Error generating Facebook OAuth URL:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/facebook/callback', async (req, res) => {
    try {
        const { code, state, error, error_message } = req.query;

        if (error) {
            return res.redirect(`/connect-accounts?error=facebook_denied&message=${encodeURIComponent(error_message || error)}`);
        }

        if (!code || !state) {
            return res.redirect('/connect-accounts?error=facebook_failed&message=Missing+authorization+code');
        }

        const { handleFacebookCallback } = require('../services/oauth');

        try {
            const result = await handleFacebookCallback(code, state);

            if (result.success && result.accounts && result.accounts.length > 0) {
                return res.redirect('/connect-accounts?facebook=connected');
            } else {
                return res.redirect('/connect-accounts?error=facebook_no_pages&message=No+Facebook+Pages+found.+Please+create+a+Facebook+Page+first.');
            }
        } catch (callbackError) {
            let errorMsg = callbackError.message;
            if (callbackError.response?.data?.error) {
                errorMsg = callbackError.response.data.error.message || errorMsg;
            }
            return res.redirect(`/connect-accounts?error=facebook_failed&message=${encodeURIComponent(errorMsg)}`);
        }
    } catch (error) {
        console.error('Error handling Facebook callback:', error);
        return res.redirect(`/connect-accounts?error=facebook_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`);
    }
});

// ============================================
// YOUTUBE ROUTES
// ============================================

router.post('/youtube/url', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const state = encryptState(userId);
        const oauthUrl = generateYouTubeOAuthUrl(userId, state);
        res.json({ success: true, oauthUrl });
    } catch (error) {
        console.error('Error generating YouTube OAuth URL:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/youtube/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            return res.redirect(`/dashboard?error=youtube_denied`);
        }
        if (!code || !state) {
            return res.redirect('/dashboard?error=youtube_missing_params');
        }

        let userId;
        try {
            userId = decryptState(state);
        } catch (stateError) {
            return res.redirect('/dashboard?error=youtube_invalid_state');
        }

        const tokenData = await exchangeYouTubeCode(code);
        const channelInfo = await getChannelInfo(tokenData.accessToken);

        if (!channelInfo) {
            throw new Error('Could not retrieve channel information');
        }

        const expiresAt = new Date(Date.now() + (tokenData.expiresIn * 1000));

        const { error: upsertError } = await supabaseAdmin
            .from('user_accounts')
            .upsert({
                user_id: userId,
                platform: 'youtube',
                platform_name: 'YouTube',
                oauth_provider: 'google',
                access_token: tokenData.accessToken,
                refresh_token: tokenData.refreshToken,
                token_expires_at: expiresAt.toISOString(),
                platform_user_id: channelInfo.channelId,
                platform_username: channelInfo.title,
                status: 'active',
                connected_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,platform,platform_user_id'
            });

        if (upsertError) throw upsertError;

        res.redirect('/connect-accounts?connected=youtube&success=true');
    } catch (error) {
        console.error('Error in YouTube callback:', error.message);
        res.redirect('/dashboard?error=youtube_failed');
    }
});

// ============================================
// TIKTOK ROUTES
// ============================================

router.post('/tiktok/url', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const redirectUri = `${process.env.APP_URL}/auth/tiktok/callback`;
        const state = crypto.randomBytes(32).toString('hex');

        // Store state in database for verification (implementation needed in tiktok service or helper)
        // await storeOAuthState(userId, 'tiktok', state);

        const authUrl = tiktokService.generateAuthUrl(redirectUri, state);

        res.json({
            success: true,
            url: authUrl
        });
    } catch (error) {
        console.error('Error generating TikTok OAuth URL:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/tiktok/callback', async (req, res) => {
    try {
        const { code, state, error, error_description } = req.query;

        if (error) {
            return res.redirect(`/dashboard?error=${encodeURIComponent(error_description || error)}`);
        }

        if (!code || !state) {
            return res.redirect('/dashboard?error=Missing authorization code or state');
        }

        // Verify state and get user ID (implementation needed)
        // const stateData = await verifyOAuthState(state, 'tiktok');
        // const userId = stateData.user_id;
        const userId = 'temp-user-id'; // Placeholder

        const redirectUri = `${process.env.APP_URL}/auth/tiktok/callback`;
        const tokenData = await tiktokService.exchangeCodeForToken(code, redirectUri);
        const userInfo = await tiktokService.getUserInfo(tokenData.accessToken);

        await supabaseAdmin.from('user_accounts').upsert({
            user_id: userId,
            platform: 'tiktok',
            access_token: tokenData.accessToken,
            refresh_token: tokenData.refreshToken,
            expires_at: new Date(Date.now() + tokenData.expiresIn * 1000),
            refresh_expires_at: new Date(Date.now() + tokenData.refreshExpiresIn * 1000),
            platform_user_id: userInfo.openId,
            platform_username: userInfo.username,
            status: 'active',
            connected_at: new Date().toISOString()
        }, { onConflict: 'user_id,platform,platform_user_id' });

        res.redirect('/connect-accounts?connected=tiktok&success=true');
    } catch (error) {
        console.error('TikTok OAuth callback error:', error);
        res.redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
    }
});

// ============================================
// OTHER PLATFORM ROUTES
// ============================================

router.post('/pinterest/url', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/pinterest/callback`;
        const authUrl = initiatePinterestOAuth(userId, redirectUri);
        res.json({ success: true, authUrl });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/pinterest/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;
        if (error) return res.redirect(`${getFrontendUrl()}/connect-accounts?error=pinterest_denied`);
        if (!code || !state) return res.redirect(`${getFrontendUrl()}/connect-accounts?error=pinterest_missing_params`);

        const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/pinterest/callback`;
        await handlePinterestCallback(code, state, redirectUri);
        res.redirect(`${getFrontendUrl()}/connect-accounts?success=pinterest_connected`);
    } catch (error) {
        res.redirect(`${getFrontendUrl()}/connect-accounts?error=pinterest_failed`);
    }
});

router.post('/tumblr/url', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        if (!process.env.TUMBLR_CONSUMER_KEY) {
            return res.status(503).json({ success: false, error: 'Tumblr not configured' });
        }
        const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/tumblr/callback`;
        const { authUrl } = await initiateTumblrOAuth(userId, redirectUri);
        res.json({ success: true, url: authUrl });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to generate Tumblr OAuth URL' });
    }
});

router.get('/tumblr/callback', async (req, res) => {
    try {
        const { oauth_token, oauth_verifier, denied } = req.query;
        if (denied) return res.redirect(`${getFrontendUrl()}/connect-accounts?error=tumblr_denied`);
        if (!oauth_token || !oauth_verifier) return res.redirect(`${getFrontendUrl()}/connect-accounts?error=tumblr_missing_params`);

        const result = await handleTumblrCallback(oauth_token, oauth_verifier);
        res.redirect(`${getFrontendUrl()}/connect-accounts?success=tumblr_connected&blog=${encodeURIComponent(result.blogName)}`);
    } catch (error) {
        res.redirect(`${getFrontendUrl()}/connect-accounts?error=tumblr_failed`);
    }
});

router.post('/medium/url', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        if (!process.env.MEDIUM_CLIENT_ID) return res.status(503).json({ success: false, error: 'Medium not configured' });

        const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/medium/callback`;
        const authUrl = initiateMediumOAuth(userId, redirectUri);
        res.json({ success: true, url: authUrl });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to generate Medium OAuth URL' });
    }
});

router.get('/medium/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;
        if (error) return res.redirect(`${getFrontendUrl()}/connect-accounts?error=medium_denied`);
        if (!code || !state) return res.redirect(`${getFrontendUrl()}/connect-accounts?error=medium_missing_params`);

        const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/medium/callback`;
        const result = await handleMediumCallback(code, state, redirectUri);
        res.redirect(`${getFrontendUrl()}/connect-accounts?success=medium_connected&user=${encodeURIComponent(result.username)}`);
    } catch (error) {
        res.redirect(`${getFrontendUrl()}/connect-accounts?error=medium_failed`);
    }
});

// ============================================
// MANUAL CONNECTION ROUTES
// ============================================

router.post('/telegram/connect', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { botToken, chatId } = req.body;

        if (!botToken || !chatId) return res.status(400).json({ success: false, error: 'Bot token and chat ID required' });

        const validation = await validateBotToken(botToken);
        if (!validation.valid) return res.status(400).json({ success: false, error: validation.error || 'Invalid bot token' });

        await supabaseAdmin.from('user_accounts').upsert({
            user_id: userId,
            platform: 'telegram',
            platform_name: validation.bot.username || 'Telegram Bot',
            oauth_provider: 'manual',
            access_token: botToken,
            platform_user_id: chatId,
            platform_username: validation.bot.username || 'bot',
            status: 'active',
            connected_at: new Date().toISOString()
        }, { onConflict: 'user_id,platform,platform_user_id' });

        res.json({ success: true, message: 'Telegram connected', bot: validation.bot });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/slack/connect', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { webhookUrl, channelName } = req.body;

        if (!webhookUrl) return res.status(400).json({ success: false, error: 'Webhook URL required' });

        const validation = await validateSlackWebhook(webhookUrl);
        if (!validation.valid) return res.status(400).json({ success: false, error: validation.error || 'Invalid webhook URL' });

        await supabaseAdmin.from('user_accounts').upsert({
            user_id: userId,
            platform: 'slack',
            platform_name: channelName || 'Slack',
            oauth_provider: 'webhook',
            access_token: webhookUrl,
            platform_user_id: webhookUrl.substring(0, 50),
            platform_username: channelName || 'Slack Workspace',
            status: 'active',
            connected_at: new Date().toISOString()
        }, { onConflict: 'user_id,platform,platform_user_id' });

        res.json({ success: true, message: 'Slack connected', channel: channelName || 'Slack' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/discord/connect', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { webhookUrl, serverName } = req.body;

        if (!webhookUrl) return res.status(400).json({ success: false, error: 'Webhook URL required' });

        const validation = await validateDiscordWebhook(webhookUrl);
        if (!validation.valid) return res.status(400).json({ success: false, error: validation.error || 'Invalid webhook URL' });

        await supabaseAdmin.from('user_accounts').upsert({
            user_id: userId,
            platform: 'discord',
            platform_name: serverName || 'Discord',
            oauth_provider: 'webhook',
            access_token: webhookUrl,
            platform_user_id: webhookUrl.substring(0, 50),
            platform_username: serverName || 'Discord Server',
            status: 'active',
            connected_at: new Date().toISOString()
        }, { onConflict: 'user_id,platform,platform_user_id' });

        res.json({ success: true, message: 'Discord connected', server: serverName || 'Discord' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/mastodon/connect', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { accessToken, instanceUrl } = req.body;

        if (!accessToken || !instanceUrl) return res.status(400).json({ success: false, error: 'Access token and instance URL required' });

        let normalizedUrl = instanceUrl.trim();
        if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;

        const userInfo = await verifyMastodonCredentials(accessToken, normalizedUrl);
        if (!userInfo.success) return res.status(400).json({ success: false, error: 'Invalid Mastodon credentials' });

        await supabaseAdmin.from('user_accounts').upsert({
            user_id: userId,
            platform: 'mastodon',
            platform_name: 'Mastodon',
            oauth_provider: 'access_token',
            access_token: accessToken,
            platform_user_id: userInfo.id,
            platform_username: userInfo.acct,
            platform_metadata: JSON.stringify({
                instanceUrl: normalizedUrl,
                username: userInfo.username,
                displayName: userInfo.displayName,
                url: userInfo.url,
                followersCount: userInfo.followersCount
            }),
            status: 'active',
            connected_at: new Date().toISOString()
        }, { onConflict: 'user_id,platform,platform_user_id' });

        res.json({ success: true, account: { platform: 'mastodon', username: userInfo.acct } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/bluesky/connect', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { handle, appPassword } = req.body;

        if (!handle || !appPassword) return res.status(400).json({ success: false, error: 'Handle and app password required' });

        const userInfo = await verifyBlueskyCredentials(handle, appPassword);
        if (!userInfo.success) return res.status(400).json({ success: false, error: 'Invalid Bluesky credentials' });

        await supabaseAdmin.from('user_accounts').upsert({
            user_id: userId,
            platform: 'bluesky',
            platform_name: 'Bluesky',
            oauth_provider: 'app_password',
            access_token: userInfo.accessJwt,
            refresh_token: userInfo.refreshJwt,
            platform_user_id: userInfo.did,
            platform_username: userInfo.handle,
            platform_metadata: JSON.stringify({
                did: userInfo.did,
                handle: userInfo.handle,
                displayName: userInfo.displayName
            }),
            status: 'active',
            connected_at: new Date().toISOString()
        }, { onConflict: 'user_id,platform,platform_user_id' });

        res.json({ success: true, account: { platform: 'bluesky', handle: userInfo.handle } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/devto/connect', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { apiKey } = req.body;

        if (!apiKey) return res.status(400).json({ success: false, error: 'API key required' });

        const validation = await validateDevToApiKey(apiKey);
        if (!validation.valid) return res.status(400).json({ success: false, error: validation.error || 'Invalid Dev.to API key' });

        const userInfo = validation.user;
        await supabaseAdmin.from('user_accounts').upsert({
            user_id: userId,
            platform: 'devto',
            platform_name: 'Dev.to',
            oauth_provider: 'api_key',
            access_token: apiKey,
            platform_user_id: userInfo.userId.toString(),
            platform_username: userInfo.username,
            status: 'active',
            connected_at: new Date().toISOString()
        }, { onConflict: 'user_id,platform,platform_user_id' });

        res.json({ success: true, account: { platform: 'devto', username: userInfo.username } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
