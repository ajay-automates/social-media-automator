/**
 * Brand Voice Bootstrap Routes
 * API endpoints for bootstrapping brand voice from pasted posts OR connected accounts
 */

const { bootstrapBrandVoice, getBrandVoiceProfile, getSamplePosts, saveSamplePosts } = require('../services/brand-voice-analyzer');
const { fetchUserPosts } = require('../services/fetch-user-posts');

module.exports = function(app, verifyAuth) {

  /**
   * POST /api/content-agent/brand-voice/auto-bootstrap
   * AUTO-FETCH posts from connected accounts (Twitter, internal) and bootstrap voice
   * This is the one-click solution - no manual pasting needed!
   * 
   * Body (optional):
   * {
   *   "identity": {
   *     "name": "Ajay Kumar Reddy",
   *     "role": "Senior AI/ML Engineer",
   *     "topics": ["AI", "building in public"],
   *     "style_notes": "Direct, technical, celebrates shipping"
   *   }
   * }
   */
  app.post('/api/content-agent/brand-voice/auto-bootstrap', verifyAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { identity } = req.body;

      console.log(`\n\u{1F680} AUTO-BOOTSTRAP: Fetching posts from connected accounts for user ${userId}...`);

      // Step 1: Fetch posts from all connected platforms
      const fetchResult = await fetchUserPosts(userId);

      if (fetchResult.totalFetched < 3) {
        return res.status(400).json({
          success: false,
          error: `Only found ${fetchResult.totalFetched} posts across your connected accounts. Need at least 3. Try posting more through the app or paste your best posts manually using the /bootstrap endpoint.`,
          sources: fetchResult.sources,
          totalFetched: fetchResult.totalFetched,
          suggestion: 'You can also paste your LinkedIn posts manually via POST /api/content-agent/brand-voice/bootstrap'
        });
      }

      console.log(`   \u{1F4E5} Found ${fetchResult.totalFetched} posts. Bootstrapping voice...`);

      // Step 2: Bootstrap brand voice from fetched posts
      const result = await bootstrapBrandVoice(userId, fetchResult.posts, identity || {});

      res.json({
        success: result.success,
        message: result.success
          ? `Brand voice auto-bootstrapped from ${result.postsAnalyzed} posts pulled from your connected accounts!`
          : result.message,
        brandVoice: result.brandVoice || null,
        postsAnalyzed: result.postsAnalyzed || 0,
        samplePostsSaved: result.samplePostsSaved || 0,
        sources: fetchResult.sources,
        totalFetched: fetchResult.totalFetched
      });

    } catch (error) {
      console.error('\u274C Error in auto-bootstrap:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to auto-bootstrap brand voice'
      });
    }
  });

  /**
   * GET /api/content-agent/brand-voice/fetch-posts
   * Preview: fetch posts from connected accounts WITHOUT bootstrapping
   * Useful to see what posts are available before committing
   */
  app.get('/api/content-agent/brand-voice/fetch-posts', verifyAuth, async (req, res) => {
    try {
      const userId = req.user.id;

      console.log(`\u{1F50D} Previewing available posts for user ${userId}...`);

      const fetchResult = await fetchUserPosts(userId);

      res.json({
        success: true,
        posts: fetchResult.posts.slice(0, 20), // Preview first 20
        sources: fetchResult.sources,
        totalFetched: fetchResult.totalFetched,
        message: fetchResult.totalFetched >= 3
          ? `Found ${fetchResult.totalFetched} posts. Ready to bootstrap your voice!`
          : `Only found ${fetchResult.totalFetched} posts. Need at least 3 for voice analysis.`
      });

    } catch (error) {
      console.error('\u274C Error fetching posts preview:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch posts'
      });
    }
  });

  /**
   * POST /api/content-agent/brand-voice/bootstrap
   * Bootstrap brand voice from MANUALLY PASTED posts + identity info
   * Use this when auto-fetch doesn't have enough posts (e.g., LinkedIn)
   */
  app.post('/api/content-agent/brand-voice/bootstrap', verifyAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { samplePosts, identity } = req.body;

      if (!samplePosts || !Array.isArray(samplePosts)) {
        return res.status(400).json({
          success: false,
          error: 'samplePosts must be an array of strings (your best posts)'
        });
      }

      if (samplePosts.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Need at least 3 sample posts to bootstrap brand voice'
        });
      }

      const validPosts = samplePosts.filter(p => typeof p === 'string' && p.trim().length > 10);

      if (validPosts.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Need at least 3 non-empty posts (each must be more than 10 characters)'
        });
      }

      console.log(`\u{1F680} POST /api/content-agent/brand-voice/bootstrap`);
      console.log(`   User: ${userId}`);
      console.log(`   Posts: ${validPosts.length}`);
      console.log(`   Identity: ${identity?.name || 'not provided'}`);

      const result = await bootstrapBrandVoice(userId, validPosts, identity || {});

      res.json({
        success: result.success,
        message: result.success
          ? `Brand voice bootstrapped from ${result.postsAnalyzed} posts. Your voice profile is now active.`
          : result.message,
        brandVoice: result.brandVoice || null,
        postsAnalyzed: result.postsAnalyzed || 0,
        samplePostsSaved: result.samplePostsSaved || 0
      });

    } catch (error) {
      console.error('\u274C Error in /api/content-agent/brand-voice/bootstrap:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to bootstrap brand voice'
      });
    }
  });

  /**
   * GET /api/content-agent/brand-voice/samples
   * Get the saved sample posts for the user
   */
  app.get('/api/content-agent/brand-voice/samples', verifyAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const samples = await getSamplePosts(userId);

      res.json({
        success: true,
        samples,
        count: samples.length
      });

    } catch (error) {
      console.error('\u274C Error fetching sample posts:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch sample posts'
      });
    }
  });

  /**
   * PUT /api/content-agent/brand-voice/samples
   * Update/replace sample posts
   */
  app.put('/api/content-agent/brand-voice/samples', verifyAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const { samplePosts } = req.body;

      if (!samplePosts || !Array.isArray(samplePosts)) {
        return res.status(400).json({
          success: false,
          error: 'samplePosts must be an array of strings'
        });
      }

      const validPosts = samplePosts.filter(p => typeof p === 'string' && p.trim().length > 10);
      await saveSamplePosts(userId, validPosts);

      res.json({
        success: true,
        message: `Updated ${validPosts.length} sample posts`,
        count: validPosts.length
      });

    } catch (error) {
      console.error('\u274C Error updating sample posts:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update sample posts'
      });
    }
  });

  /**
   * GET /api/content-agent/brand-voice/full
   * Get the complete brand voice profile including samples and identity
   */
  app.get('/api/content-agent/brand-voice/full', verifyAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const brandVoice = await getBrandVoiceProfile(userId);
      const samples = await getSamplePosts(userId);

      if (!brandVoice) {
        return res.json({
          success: false,
          message: 'No brand voice profile found. Use auto-bootstrap to pull posts from your connected accounts, or paste your best posts manually.',
          hasProfile: false,
          hasSamples: samples.length > 0,
          sampleCount: samples.length
        });
      }

      res.json({
        success: true,
        hasProfile: true,
        hasSamples: samples.length > 0,
        sampleCount: samples.length,
        brandVoice,
        samples: samples.slice(0, 5)
      });

    } catch (error) {
      console.error('\u274C Error fetching full brand voice:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch brand voice'
      });
    }
  });

};
