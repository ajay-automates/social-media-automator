const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../utilities/supabase');

// Import Services
const {
    getUserConnectedAccounts,
    getUserCredentialsForPosting,
    disconnectAccount
} = require('../services/oauth');

const {
    checkUsage,
    incrementUsage,
    createCheckoutSession,
    createPortalSession,
    getUserBillingInfo
} = require('../services/billing');

const {
    addPost,
    updatePostStatus,
    getPostHistory,
    getPlatformStats,
    getAnalyticsOverview,
    getTimelineData,
    healthCheck
} = require('../services/database');

const {
    postNow,
    schedulePost,
    getQueue,
    deleteFromQueue
} = require('../services/scheduler');

// ============================================
// HEALTH CHECK
// ============================================

router.get('/health', async (req, res) => {
    try {
        const dbHealth = await healthCheck();
        res.json({
            success: true,
            status: 'online',
            database: dbHealth ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'error',
            error: error.message
        });
    }
});

const { uploadBase64Image } = require('../services/cloudinary');
const { getUserBoards } = require('../services/pinterest');

const {
    generateCaption,
    generateHashtags,
    recommendPostTime,
    generatePostVariations,
    generateContentIdeas,
    improveCaption,
    generateCaptionFromImage
} = require('../services/ai');

const {
    analyzeBestTimes,
    getPostingHeatmap
} = require('../services/analytics');

const {
    generateWeeklyReport
} = require('../services/reports');

const { getAllPlans } = require('../config/plans');

const {
    extractTranscript,
    generateCaptionFromTranscript
} = require('../services/youtube-transcript');

const aiImageService = require('../services/ai-image');

const {
    analyzeUserPatterns,
    generateInsights,
    scoreDraftPost,
    getUserInsights,
    getUserPatterns
} = require('../services/analytics-insights-agent');

// ============================================
// ACCOUNT ROUTES
// ============================================

router.get('/accounts', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const accounts = await getUserConnectedAccounts(userId);
        res.json({
            success: true,
            accounts: accounts || [],
            count: accounts?.length || 0
        });
    } catch (error) {
        console.error('Error in /api/accounts:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.put('/user/accounts/:id/label', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;
        const { label } = req.body;

        if (!label || label.trim() === '') {
            return res.status(400).json({ success: false, error: 'Label is required' });
        }

        const { data, error } = await supabaseAdmin
            .from('user_accounts')
            .update({ account_label: label.trim() })
            .eq('id', accountId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, account: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/user/accounts/:id/set-default', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const accountId = req.params.id;

        const { data: account, error: fetchError } = await supabaseAdmin
            .from('user_accounts')
            .select('platform')
            .eq('id', accountId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !account) {
            return res.status(404).json({ success: false, error: 'Account not found' });
        }

        await supabaseAdmin
            .from('user_accounts')
            .update({ is_default: false })
            .eq('user_id', userId)
            .eq('platform', account.platform);

        const { data, error } = await supabaseAdmin
            .from('user_accounts')
            .update({ is_default: true })
            .eq('id', accountId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, account: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/user/accounts/:platform', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const platform = req.params.platform;
        const result = await disconnectAccount(userId, platform);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POSTING & SCHEDULING ROUTES
// ============================================

router.post('/post/now', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { text, imageUrl, videoUrl, post_metadata, variations, accountIds } = req.body;
        let platforms = req.body.platforms;

        if (!text && !variations) {
            return res.status(400).json({ success: false, error: 'Text or variations are required' });
        }

        const usageCheck = await checkUsage(userId, 'posts');
        if (!usageCheck.allowed) {
            return res.status(402).json({
                success: false,
                error: usageCheck.message,
                limitReached: true,
                upgradePlan: usageCheck.upgradePlan
            });
        }

        let credentials = await getUserCredentialsForPosting(userId);

        if (accountIds && typeof accountIds === 'object' && Object.keys(accountIds).length > 0) {
            const filteredCredentials = {};
            for (const platform of platforms) {
                if (accountIds[platform]) {
                    const selectedAccountId = accountIds[platform];
                    if (credentials[platform] && Array.isArray(credentials[platform])) {
                        filteredCredentials[platform] = credentials[platform].filter(acc => acc.id === selectedAccountId);
                    } else {
                        filteredCredentials[platform] = credentials[platform] || [];
                    }
                } else {
                    filteredCredentials[platform] = credentials[platform] || [];
                }
            }
            credentials = filteredCredentials;
        }

        if (imageUrl && imageUrl.includes('/video/') && platforms.includes('linkedin')) {
            platforms = platforms.filter(p => p !== 'linkedin');
        }

        let finalImageUrl = imageUrl;
        if (platforms.includes('instagram') && imageUrl && imageUrl.startsWith('data:image')) {
            const uploadResult = await uploadBase64Image(
                imageUrl.replace(/^data:image\/\w+;base64,/, ''),
                userId
            );
            if (uploadResult.success) {
                finalImageUrl = uploadResult.url;
            } else {
                return res.status(400).json({ success: false, error: 'Failed to upload image for Instagram' });
            }
        }

        const platformResults = await postNow(
            variations || text,
            finalImageUrl || null,
            platforms,
            credentials,
            post_metadata,
            !!variations,
            videoUrl || null
        );

        const platformArray = Object.values(platformResults);
        const flattenResults = platformArray.flat().filter(r => r && typeof r === 'object');
        const allSuccess = flattenResults.length > 0 && flattenResults.every(r => r.success === true);
        const anySuccess = flattenResults.length > 0 && flattenResults.some(r => r.success === true);

        let status = 'failed';
        if (allSuccess) status = 'posted';
        else if (anySuccess) status = 'partial';

        const textToSave = text || (variations ? Object.values(variations)[0] : 'Post with variations');
        const savedPost = await addPost({
            text: textToSave,
            imageUrl: imageUrl || null,
            platforms,
            scheduleTime: new Date(),
            credentials,
            userId
        });

        if (savedPost && savedPost.id) {
            await updatePostStatus(savedPost.id, status, platformResults);
        }

        if (anySuccess) {
            await incrementUsage(userId, 'posts');
        }

        res.json({
            success: allSuccess,
            partial: anySuccess && !allSuccess,
            results: platformResults
        });
    } catch (error) {
        console.error('Error in /api/post/now:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/schedule', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { text, imageUrl, platforms, scheduleTime, post_metadata, variations, accountIds } = req.body;

        if (!text && !variations) return res.status(400).json({ success: false, error: 'Text or variations required' });
        if (!scheduleTime) return res.status(400).json({ success: false, error: 'Schedule time required' });

        const usageCheck = await checkUsage(userId, 'posts');
        if (!usageCheck.allowed) {
            return res.status(402).json({
                success: false,
                error: usageCheck.message,
                limitReached: true,
                upgradePlan: usageCheck.upgradePlan
            });
        }

        let credentials = await getUserCredentialsForPosting(userId);
        if (accountIds && typeof accountIds === 'object' && Object.keys(accountIds).length > 0) {
            const filteredCredentials = {};
            for (const platform of platforms) {
                if (accountIds[platform]) {
                    const selectedAccountId = accountIds[platform];
                    if (credentials[platform] && Array.isArray(credentials[platform])) {
                        filteredCredentials[platform] = credentials[platform].filter(acc => acc.id === selectedAccountId);
                    } else {
                        filteredCredentials[platform] = credentials[platform] || [];
                    }
                } else {
                    filteredCredentials[platform] = credentials[platform] || [];
                }
            }
            credentials = filteredCredentials;
        }

        const result = await schedulePost({
            userId,
            text,
            imageUrl,
            platforms,
            scheduleTime,
            credentials,
            metadata: post_metadata,
            variations,
            accountIds
        });

        await incrementUsage(userId, 'posts');

        res.json(result);
    } catch (error) {
        console.error('Error scheduling post:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/queue', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const queue = await getQueue(userId);
        res.json({ success: true, queue });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/queue/:id', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const result = await deleteFromQueue(postId, userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/history', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit, offset } = req.query;
        const history = await getPostHistory(userId, limit, offset);
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// AI ROUTES
// ============================================

router.post('/ai/generate', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { topic, platform, tone, length, keywords, includeHashtags, includeEmoji, targetAudience, language } = req.body;

        const usageCheck = await checkUsage(userId, 'ai_captions');
        if (!usageCheck.allowed) {
            return res.status(402).json({
                success: false,
                error: usageCheck.message,
                limitReached: true,
                upgradePlan: usageCheck.upgradePlan
            });
        }

        const caption = await generateCaption({
            topic, platform, tone, length, keywords, includeHashtags, includeEmoji, targetAudience, language
        });

        await incrementUsage(userId, 'ai_captions');
        res.json({ success: true, caption });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/ai/hashtags', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { text, platform, count } = req.body;

        const usageCheck = await checkUsage(userId, 'ai_captions');
        if (!usageCheck.allowed) {
            return res.status(402).json({
                success: false,
                error: usageCheck.message,
                limitReached: true,
                upgradePlan: usageCheck.upgradePlan
            });
        }

        const hashtags = await generateHashtags(text, platform, count);
        await incrementUsage(userId, 'ai_captions');
        res.json({ success: true, hashtags });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/ai/content-ideas', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { topic, industry, count } = req.body;

        const usageCheck = await checkUsage(userId, 'ai_captions');
        if (!usageCheck.allowed) {
            return res.status(402).json({
                success: false,
                error: usageCheck.message,
                limitReached: true,
                upgradePlan: usageCheck.upgradePlan
            });
        }

        const ideas = await generateContentIdeas(topic, industry, count);
        await incrementUsage(userId, 'ai_captions');
        res.json({ success: true, ideas });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/ai/improve-caption', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { text, instruction, platform } = req.body;

        const usageCheck = await checkUsage(userId, 'ai_captions');
        if (!usageCheck.allowed) {
            return res.status(402).json({
                success: false,
                error: usageCheck.message,
                limitReached: true,
                upgradePlan: usageCheck.upgradePlan
            });
        }

        const improved = await improveCaption(text, instruction, platform);
        await incrementUsage(userId, 'ai_captions');
        res.json({ success: true, improved });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/ai/caption-from-image', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { imageUrl, platform, tone } = req.body;

        const usageCheck = await checkUsage(userId, 'ai_captions');
        if (!usageCheck.allowed) {
            return res.status(402).json({
                success: false,
                error: usageCheck.message,
                limitReached: true,
                upgradePlan: usageCheck.upgradePlan
            });
        }

        const caption = await generateCaptionFromImage(imageUrl, platform, tone);
        await incrementUsage(userId, 'ai_captions');
        res.json({ success: true, caption });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/ai/variations', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { text, platforms } = req.body;

        const usageCheck = await checkUsage(userId, 'ai_captions');
        if (!usageCheck.allowed) {
            return res.status(402).json({
                success: false,
                error: usageCheck.message,
                limitReached: true,
                upgradePlan: usageCheck.upgradePlan
            });
        }

        const variations = await generatePostVariations(text, platforms);
        await incrementUsage(userId, 'ai_captions');
        res.json({ success: true, variations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/ai/youtube-caption', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { videoUrl, platform, tone, length } = req.body;

        const usageCheck = await checkUsage(userId, 'ai_captions');
        if (!usageCheck.allowed) {
            return res.status(402).json({
                success: false,
                error: usageCheck.message,
                limitReached: true,
                upgradePlan: usageCheck.upgradePlan
            });
        }

        const transcript = await extractTranscript(videoUrl);
        if (!transcript) return res.status(400).json({ success: false, error: 'Could not extract transcript' });

        const caption = await generateCaptionFromTranscript(transcript, { platform, tone, length });
        await incrementUsage(userId, 'ai_captions');
        res.json({ success: true, caption, transcriptLength: transcript.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/ai/image/generate', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { prompt, style, aspectRatio, negativePrompt } = req.body;

        const usageCheck = await checkUsage(userId, 'ai_images');
        if (!usageCheck.allowed) {
            return res.status(402).json({
                success: false,
                error: usageCheck.message,
                limitReached: true,
                upgradePlan: usageCheck.upgradePlan
            });
        }

        const imageUrl = await aiImageService.generateImage({
            prompt, style, aspectRatio, negativePrompt, userId
        });

        await incrementUsage(userId, 'ai_images');
        res.json({ success: true, imageUrl });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

router.get('/analytics/overview', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { period } = req.query;
        const overview = await getAnalyticsOverview(userId, period);
        res.json({ success: true, overview });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/analytics/platforms', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { period } = req.query;
        const stats = await getPlatformStats(userId, period);
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/analytics/timeline', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { period } = req.query;
        const timeline = await getTimelineData(userId, period);
        res.json({ success: true, timeline });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/analytics/best-times', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { platform } = req.query;
        const bestTimes = await analyzeBestTimes(userId, platform);
        res.json({ success: true, bestTimes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/analytics/heatmap', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const heatmap = await getPostingHeatmap(userId);
        res.json({ success: true, heatmap });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/analytics/export', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { format, period } = req.query;
        const reportUrl = await generateWeeklyReport(userId, period, format);
        res.json({ success: true, reportUrl });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/analytics-agent/insights', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const insights = await getUserInsights(userId);
        res.json({ success: true, insights });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/analytics-agent/patterns', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const patterns = await getUserPatterns(userId);
        res.json({ success: true, patterns });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/analytics-agent/score-draft', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { text, platform, image } = req.body;
        const score = await scoreDraftPost(userId, { text, platform, image });
        res.json({ success: true, score });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/analytics-agent/insights/:id/dismiss', verifyAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await supabaseAdmin.from('analytics_insights').update({ is_dismissed: true }).eq('id', id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/analytics-agent/insights/:id/viewed', verifyAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await supabaseAdmin.from('analytics_insights').update({ is_read: true }).eq('id', id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// BILLING ROUTES
// ============================================

router.get('/billing/plans', async (req, res) => {
    try {
        const plans = getAllPlans();
        res.json({ success: true, plans });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/billing/usage', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const usage = await getUserBillingInfo(userId);
        res.json({ success: true, usage });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/billing/checkout', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { priceId, planId, interval } = req.body;
        const session = await createCheckoutSession(userId, priceId, planId, interval);
        res.json({ success: true, url: session.url });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/billing/portal', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const session = await createPortalSession(userId);
        res.json({ success: true, url: session.url });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PLATFORM SPECIFIC API ROUTES
// ============================================

router.get('/reddit/subreddits', verifyAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: account, error } = await supabaseAdmin
            .from('user_accounts')
            .select('platform_metadata')
            .eq('user_id', userId)
            .eq('platform', 'reddit')
            .eq('status', 'active')
            .single();

        if (error || !account) return res.status(404).json({ success: false, error: 'No Reddit account connected' });

        const subreddits = account.platform_metadata ? JSON.parse(account.platform_metadata) : [];
        res.json({ success: true, subreddits });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/pinterest/boards/:userId', verifyAuth, async (req, res) => {
    try {
        const userId = req.params.userId;
        if (req.user.id !== parseInt(userId) && req.user.id !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const { data: account, error } = await supabaseAdmin
            .from('user_accounts')
            .select('*')
            .eq('user_id', userId)
            .eq('platform', 'pinterest')
            .single();

        if (error || !account) return res.status(404).json({ success: false, error: 'Pinterest account not connected' });

        const result = await getUserBoards({
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            token_expires_at: account.token_expires_at,
            user_id: userId
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
