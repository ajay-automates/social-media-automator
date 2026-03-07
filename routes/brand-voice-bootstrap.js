/**
 * Brand Voice Bootstrap Routes
 * New API endpoints for bootstrapping brand voice from pasted posts
 * 
 * These routes need to be added to server.js:
 *   const brandVoiceBootstrapRoutes = require('./routes/brand-voice-bootstrap');
 *   brandVoiceBootstrapRoutes(app, verifyAuth);
 */

const { bootstrapBrandVoice, getBrandVoiceProfile, getSamplePosts, saveSamplePosts } = require('../services/brand-voice-analyzer');

module.exports = function(app, verifyAuth) {

  /**
   * POST /api/content-agent/brand-voice/bootstrap
   * Bootstrap brand voice from pasted posts + identity info
   * 
   * Body:
   * {
   *   "samplePosts": ["post1 text", "post2 text", ...],  // min 3 required
   *   "identity": {
   *     "name": "Ajay Kumar Reddy",
   *     "role": "Senior AI/ML Engineer building production AI systems",
   *     "topics": ["AI engineering", "building in public", "shipping fast", "LLMs"],
   *     "style_notes": "I share what I learn while building. Direct, technical but accessible. I celebrate shipping."
   *   }
   * }
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

      // Filter out empty posts
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
          message: 'No brand voice profile found. Use the bootstrap endpoint to create one by pasting your best posts.',
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
        samples: samples.slice(0, 5) // Return first 5 as preview
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
