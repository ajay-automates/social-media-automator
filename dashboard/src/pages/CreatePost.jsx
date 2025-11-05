import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { PostingOverlay } from '../components/ui/LoadingStates';
import { useLoadingState } from '../hooks/useLoadingState';
import { showSuccess, showError } from '../components/ui/Toast';
import { celebrateSuccess } from '../utils/animations';
import UpgradeModal from '../components/UpgradeModal';
import PlatformChip from '../components/ui/PlatformChip';
import AnimatedBackground from '../components/ui/AnimatedBackground';

export default function CreatePost() {
  const navigate = useNavigate();
  const { isLoading, currentStep, startLoading, stopLoading } = useLoadingState();
  const [caption, setCaption] = useState('');
  const [platforms, setPlatforms] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [image, setImage] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [showAIModal, setShowAIModal] = useState(false);
  const [niche, setNiche] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [aiVariations, setAiVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [billingInfo, setBillingInfo] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [pendingVideoFile, setPendingVideoFile] = useState(null);
  const [redditSubreddit, setRedditSubreddit] = useState('');
  const [redditTitle, setRedditTitle] = useState('');
  const [moderatedSubreddits, setModeratedSubreddits] = useState([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeInstructions, setYoutubeInstructions] = useState('');
  const [generatingFromYoutube, setGeneratingFromYoutube] = useState(false);
  const [youtubeVariations, setYoutubeVariations] = useState([]);
  const [aiVideoPrompt, setAiVideoPrompt] = useState('');
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [showVideoGenPreview, setShowVideoGenPreview] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [generatedHashtags, setGeneratedHashtags] = useState([]);
  const [generatingHashtags, setGeneratingHashtags] = useState(false);
  const [showHashtags, setShowHashtags] = useState(false);
  const [bestTimes, setBestTimes] = useState([]);
  const [loadingBestTimes, setLoadingBestTimes] = useState(false);
  const [showBestTimes, setShowBestTimes] = useState(true);

  useEffect(() => {
    loadBillingInfo();
    loadConnectedAccounts();
    loadTemplates();
  }, []);

  const loadConnectedAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      const accountsData = response.data?.accounts || response.data || [];
      const accounts = Array.isArray(accountsData) ? accountsData : [];
      setConnectedAccounts(accounts);
      
      // Auto-select first connected platform if available
      if (accounts.length > 0 && platforms.length === 0) {
        setPlatforms([accounts[0].platform]);
      }
    } catch (err) {
      console.error('Error loading connected accounts:', err);
      setConnectedAccounts([]);
    }
  };

  // Load moderated subreddits when Reddit is selected
  useEffect(() => {
    if (platforms.includes('reddit')) {
      loadModeratedSubreddits();
    }
  }, [platforms]);

  // Load best times when platform is selected
  useEffect(() => {
    if (platforms.length > 0) {
      loadBestTimes();
    }
  }, [platforms]);

  const loadBillingInfo = async () => {
    try {
      const response = await api.get('/billing/usage');
      setBillingInfo(response.data);
    } catch (err) {
      console.error('Error loading billing info:', err);
    }
  };

  const loadModeratedSubreddits = async () => {
    try {
      const response = await api.get('/reddit/subreddits');
      if (response.data?.success) {
        setModeratedSubreddits(response.data.subreddits || []);
        // Set first subreddit as default
        if (response.data.subreddits && response.data.subreddits.length > 0) {
          setRedditSubreddit(response.data.subreddits[0]);
        }
      }
    } catch (err) {
      console.error('Error loading Reddit subreddits:', err);
      // Silently fail if Reddit not connected
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/templates');
      const templatesData = Array.isArray(response.data) ? response.data : response.data?.templates || [];
      setTemplates(templatesData);
    } catch (err) {
      console.error('Error loading templates:', err);
      setTemplates([]);
    }
  };

  const loadTemplateIntoForm = (template) => {
    // Load caption
    setCaption(template.text);
    
    // Load platforms (only select if they're connected)
    const connectedPlatforms = connectedAccounts.map(acc => acc.platform);
    const validPlatforms = template.platforms.filter(p => connectedPlatforms.includes(p));
    setPlatforms(validPlatforms);
    
    // Load image if available
    if (template.image_url) {
      setImage(template.image_url);
    }
    
    // Close modal
    setShowTemplateModal(false);
    
    // Show success message
    showSuccess(`Template "${template.name}" loaded! Replace {{variables}} with your content.`);
  };

  const generateAIHashtags = async () => {
    if (!caption || caption.trim().length < 10) {
      showError('Please enter at least 10 characters in your caption first');
      return;
    }

    setGeneratingHashtags(true);
    setGeneratedHashtags([]);

    try {
      const selectedPlatform = platforms.length > 0 ? platforms[0] : 'instagram';
      
      const response = await api.post('/ai/hashtags', {
        caption: caption.trim(),
        platform: selectedPlatform
      });

      if (response.data.success && response.data.hashtags) {
        setGeneratedHashtags(response.data.hashtags);
        setShowHashtags(true);
        showSuccess(`Generated ${response.data.hashtags.length} hashtags for ${selectedPlatform}!`);
      }
    } catch (err) {
      console.error('Hashtag generation error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to generate hashtags';
      showError(errorMessage);
      
      // Check if usage limit reached
      if (err.response?.data?.limitReached) {
        setShowUpgrade(true);
      }
    } finally {
      setGeneratingHashtags(false);
    }
  };

  const addHashtagToCaption = (hashtag) => {
    if (!caption.includes(hashtag)) {
      setCaption(caption + (caption.endsWith(' ') || caption.endsWith('\n') ? '' : ' ') + hashtag);
      showSuccess(`Added ${hashtag}`);
    }
  };

  const addAllHashtags = () => {
    const hashtagString = generatedHashtags.join(' ');
    setCaption(caption + (caption.endsWith(' ') || caption.endsWith('\n') ? '' : '\n\n') + hashtagString);
    showSuccess(`Added all ${generatedHashtags.length} hashtags!`);
  };

  const loadBestTimes = async () => {
    if (platforms.length === 0) return;
    
    setLoadingBestTimes(true);
    try {
      const selectedPlatform = platforms[0]; // Use first selected platform
      const response = await api.get(`/analytics/best-times?platform=${selectedPlatform}`);
      
      if (response.data.success && response.data.recommendations) {
        setBestTimes(response.data.recommendations);
      }
    } catch (err) {
      console.error('Error loading best times:', err);
      // Silent fail - not critical
      setBestTimes([]);
    } finally {
      setLoadingBestTimes(false);
    }
  };

  const scheduleAtRecommendedTime = async (timeRecommendation) => {
    if (!caption.trim()) {
      showError('Please enter a caption first');
      return;
    }

    if (platforms.length === 0) {
      showError('Please select at least one platform');
      return;
    }

    try {
      // Parse the day and time from recommendation
      const { day, time } = timeRecommendation;
      
      // Calculate the next occurrence of this day/time
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDayIndex = daysOfWeek.indexOf(day);
      
      if (targetDayIndex === -1) {
        showError('Invalid day in recommendation');
        return;
      }
      
      // Parse time (e.g., "9:00 AM" or "2:30 PM")
      const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) {
        showError('Invalid time format in recommendation');
        return;
      }
      
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      // Find next occurrence of this day
      const now = new Date();
      const currentDay = now.getDay();
      let daysUntilTarget = targetDayIndex - currentDay;
      
      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes)))) {
        daysUntilTarget += 7; // Next week
      }
      
      const scheduleDate = new Date(now);
      scheduleDate.setDate(scheduleDate.getDate() + daysUntilTarget);
      scheduleDate.setHours(hours, minutes, 0, 0);
      
      // Schedule the post
      startLoading('Scheduling post...');
      
      const requestData = {
        text: caption.trim(),
        platforms,
        imageUrl: image,
        scheduleTime: scheduleDate.toISOString(),
        redditTitle: platforms.includes('reddit') ? redditTitle : undefined,
        redditSubreddit: platforms.includes('reddit') ? redditSubreddit : undefined
      };
      
      const response = await api.post('/post/schedule', requestData);
      
      if (response.data.success) {
        showSuccess(`Post scheduled for ${day} at ${time}! Redirecting to calendar...`);
        celebrateSuccess();
        
        // Redirect to calendar after 1.5 seconds
        setTimeout(() => {
          navigate('/calendar');
        }, 1500);
      }
      
    } catch (err) {
      console.error('Schedule error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to schedule post';
      showError(errorMessage);
    } finally {
      stopLoading();
    }
  };

  const generateCaption = async () => {
    if (!niche) {
      showError('Please select a niche');
      return;
    }

    setGenerating(true);
    setAiVariations([]);
    setSelectedVariation(null);
    
    try {
      const response = await api.post('/ai/generate', {
        topic: niche, // Use niche as topic
        niche: niche,
        platform: platforms[0] || 'linkedin'
      });
      
      // Server returns variations array
      const variations = response.data.variations || [];
      
      if (variations.length === 0) {
        showError('No variations generated');
        return;
      }
      
      setAiVariations(variations);
      showSuccess('Generated 3 caption variations! ✨');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate caption';
      showError(errorMessage);
      console.error('AI error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const selectVariation = (variation, index) => {
    setSelectedVariation(index);
    setCaption(variation);
    setShowAIModal(false);
    showSuccess('Caption added! ✨');
  };

  const generateFromYoutube = async () => {
    if (!youtubeUrl.trim()) {
      showError('Please enter a URL');
      return;
    }

    setGeneratingFromYoutube(true);
    setYoutubeVariations([]);
    
    try {
      const response = await api.post('/ai/youtube-caption', {
        videoUrl: youtubeUrl,
        instructions: youtubeInstructions,
        platform: platforms[0] || 'linkedin'
      });
      
      const variations = response.data.variations || [];
      
      if (variations.length === 0) {
        showError('No variations generated');
        return;
      }
      
      setYoutubeVariations(variations);
      showSuccess('Generated 3 caption variations from URL! ✨');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate caption from URL';
      showError(errorMessage);
      console.error('URL caption error:', err);
    } finally {
      setGeneratingFromYoutube(false);
    }
  };

  const selectYoutubeVariation = (variation) => {
    setCaption(variation);
    setShowYoutubeModal(false);
    setYoutubeUrl('');
    setYoutubeInstructions('');
    setYoutubeVariations([]);
    showSuccess('Caption added! ✨');
  };

  const generateImage = async () => {
    if (!aiImagePrompt.trim()) {
      showError('Please enter an image prompt');
      return;
    }

    setGeneratingImage(true);
    try {
      const response = await api.post('/ai/image/generate', {
        prompt: aiImagePrompt,
        style: 'photographic'
      });
      
      if (response.data.imageUrl) {
        setGeneratedImage(response.data.imageUrl);
        setShowImagePreview(true);
        showSuccess('Image generated! Choose to attach or regenerate ✨');
      } else {
        // Check if it's a balance error
        const errorMsg = response.data.error || '';
        if (errorMsg.includes('enough balance') || errorMsg.includes('balance')) {
          showError('⚠️ AI Image service needs credits. Please add credits to your Stability AI account or use manual image upload.');
        } else {
          showError(errorMsg || 'No image URL returned');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate image';
      
      // Friendly message for balance issues
      if (errorMessage.includes('enough balance') || errorMessage.includes('balance')) {
        showError('⚠️ AI Image service needs credits. Please add credits to Stability AI or use manual image upload.');
      } else {
        showError(errorMessage);
      }
      
      console.error('AI Image error:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setGeneratingImage(false);
    }
  };

  const attachImage = () => {
    if (generatedImage) {
      setImage(generatedImage);
      setShowImagePreview(false);
      showSuccess('Image attached! 📎');
    }
  };

  const regenerateImage = () => {
    if (generatedImage) {
      setGeneratedImage(null);
      setShowImagePreview(false);
      generateImage();
    }
  };

  const useExample = (exampleText) => {
    setAiImagePrompt(exampleText);
  };

  const useVideoExample = (exampleText) => {
    setAiVideoPrompt(exampleText);
  };

  const generateVideo = async () => {
    if (!aiVideoPrompt.trim()) {
      showError('Please enter a video prompt');
      return;
    }

    setGeneratingVideo(true);
    try {
      // Note: This would call a video generation API
      // For now, showing a coming soon message
      showError('🎬 AI Video Generation coming soon! Currently in development. For now, please upload videos manually.');
      
      // Future implementation:
      // const response = await api.post('/ai/video/generate', {
      //   prompt: aiVideoPrompt,
      //   duration: 5, // seconds
      //   aspect_ratio: '16:9'
      // });
      // 
      // if (response.data.videoUrl) {
      //   setGeneratedVideo(response.data.videoUrl);
      //   setShowVideoGenPreview(true);
      //   showSuccess('Video generated! Choose to attach or regenerate ✨');
      // }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate video';
      showError(errorMessage);
      console.error('AI Video error:', err);
    } finally {
      setGeneratingVideo(false);
    }
  };

  const attachGeneratedVideo = () => {
    if (generatedVideo) {
      setImage(generatedVideo);
      setMediaType('video');
      setShowVideoGenPreview(false);
      showSuccess('Video attached! 📎');
    }
  };

  const regenerateVideo = () => {
    if (generatedVideo) {
      setGeneratedVideo(null);
      setShowVideoGenPreview(false);
      generateVideo();
    }
  };

  const handleAttachVideo = async () => {
    if (!pendingVideoFile) {
      showError('No video selected');
      return;
    }

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', pendingVideoFile);
      
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        const uploadedUrl = response.data.videoUrl || response.data.url || response.data.imageUrl;
        setImage(uploadedUrl);
        showSuccess('Video attached successfully! Ready to post.');
        
        // Clear pending video
        setPendingVideoFile(null);
        // Keep preview URL for display
      } else {
        showError('Failed to upload video');
      }
    } catch (err) {
      console.error('Video upload error:', err);
      showError('Video upload failed: ' + err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handlePost = async () => {
    if (!caption.trim()) {
      showError('Please enter a caption');
      return;
    }

    // Validate Reddit-specific fields if Reddit is selected
    if (platforms.includes('reddit')) {
      if (!redditTitle.trim()) {
        showError('Reddit requires a post title. Please enter one.');
        return;
      }
      if (!redditSubreddit) {
        showError('Please select a subreddit for Reddit posting.');
        return;
      }
    }

    // Validate Instagram requires image
    if (platforms.includes('instagram') && !image) {
      showError('Instagram requires an image. Please upload or generate an image first.');
      return;
    }

    // Check usage limits
    if (billingInfo && billingInfo.usage && billingInfo.usage.posts) {
      const { usage, plan } = billingInfo;
      const percentage = usage.posts.used / usage.posts.limit;
      
      if (percentage >= 1.0 && usage.posts.limit !== Infinity) {
        setShowUpgrade(true);
        return;
      }
    }

    startLoading(platforms[0] || 'twitter');
    
    try {
      // Prepare post metadata for platform-specific requirements
      const postMetadata = {};
      if (platforms.includes('reddit')) {
        postMetadata.reddit_subreddit = redditSubreddit;
        postMetadata.reddit_title = redditTitle;
      }
      
      const response = await api.post('/post/now', {
        text: caption,
        platforms: platforms,
        accountId: 1, // Will be replaced with actual account selection
        imageUrl: image, // Send the Cloudinary URL to the server
        post_metadata: Object.keys(postMetadata).length > 0 ? postMetadata : undefined
      });
      
      // Check actual results from posting
      const results = response.data?.results || {};
      const allSuccess = response.data?.success === true;
      const partialSuccess = response.data?.partial === true;
      
      // Flatten results to check individual platform success
      const platformResults = Object.values(results).flat().filter(r => r && typeof r === 'object');
      const failedPlatforms = platformResults.filter(r => r.success === false || r.error);
      const succeededPlatforms = platformResults.filter(r => r.success === true);
      
      if (allSuccess) {
        // All platforms succeeded
        celebrateSuccess();
        showSuccess('Post created successfully! 🎉');
        
        // Reset form
        setCaption('');
        setImage(null);
        
        // Redirect after success
        setTimeout(() => navigate('/dashboard'), 2000);
      } else if (partialSuccess && succeededPlatforms.length > 0) {
        // Some platforms succeeded, some failed
        const successNames = succeededPlatforms.map(r => r.platform || 'Unknown').join(', ');
        const failedNames = failedPlatforms.map(r => r.platform || 'Unknown').join(', ');
        const failedErrors = failedPlatforms.map(r => r.error || 'Unknown error').join('; ');
        
        celebrateSuccess();
        showSuccess(`Partially posted! ✓ ${successNames.toUpperCase()} succeeded`);
        showError(`Failed: ${failedNames.toUpperCase()} - ${failedErrors}`);
        
        // Reset form but don't redirect immediately
        setCaption('');
        setImage(null);
        
        // Redirect after delay
        setTimeout(() => navigate('/dashboard'), 3000);
      } else {
        // All platforms failed
        const errorMessages = failedPlatforms
          .map(r => `${r.platform || 'Platform'}: ${r.error || 'Unknown error'}`)
          .join('; ');
        
        showError(`All platforms failed: ${errorMessages}`);
        // Don't reset form, let user try again
      }
      
    } catch (err) {
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        showError('Please connect your social media accounts first', { 
          label: 'Go to Settings', 
          onClick: () => navigate('/settings') 
        });
      } else {
        showError('Failed to create post', { label: 'Retry', onClick: handlePost });
      }
      console.error('Post error:', err);
    } finally {
      stopLoading();
    }
  };

  const togglePlatform = (platform) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  return (
    <>
      {isLoading && (
        <PostingOverlay platforms={platforms} currentPlatform={currentStep} />
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-5xl mx-auto px-6 py-8"
      >
        {/* Animated Background */}
        <AnimatedBackground variant="purple" />

        <div className="mb-8 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent"
          >
            Create Post
          </motion.h1>
        </div>
        
        <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6 relative z-10">
          {/* Reddit-Specific Fields */}
          {platforms.includes('reddit') && (
            <div className="space-y-4 bg-orange-900/20 backdrop-blur-sm border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-300 font-semibold">
                <span>🔴</span>
                <span>Reddit Settings</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Post Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={redditTitle}
                  onChange={(e) => setRedditTitle(e.target.value)}
                  placeholder="Enter post title (required for Reddit, max 300 chars)"
                  maxLength={300}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {redditTitle.length}/300 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subreddit <span className="text-red-400">*</span>
                </label>
                {moderatedSubreddits.length > 0 ? (
                  <select
                    value={redditSubreddit}
                    onChange={(e) => setRedditSubreddit(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {moderatedSubreddits.map(sub => (
                      <option key={sub} value={sub}>
                        r/{sub}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-gray-300 bg-yellow-900/20 backdrop-blur-sm border border-yellow-500/30 rounded p-3">
                    ⚠️ No moderated subreddits found. You can only post to subreddits where you're a moderator.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Load from Template Button */}
          <div className="flex justify-between items-center mb-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowTemplateModal(true)}
              className="group relative bg-purple-600/30 backdrop-blur-lg border-2 border-purple-400/30 text-white px-5 py-2.5 rounded-xl hover:bg-purple-600/40 font-medium transition-all shadow-lg hover:shadow-purple-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              <span className="relative flex items-center gap-2">
                📋 Load from Template
                {templates.length > 0 && (
                  <span className="bg-purple-500/50 px-2 py-0.5 rounded-full text-xs">
                    {templates.length}
                  </span>
                )}
              </span>
            </motion.button>
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-4 bg-gray-800/50 border-2 border-gray-600 text-white rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-gray-400"
              rows={6}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-gray-400">{caption.length} characters</div>
              {caption.length >= 10 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={generateAIHashtags}
                  disabled={generatingHashtags}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                >
                  {generatingHashtags ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      🏷️ Generate Hashtags
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>

          {/* Generated Hashtags Display */}
          {showHashtags && generatedHashtags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-2xl border-2 border-blue-400/40 rounded-2xl p-6 shadow-2xl shadow-blue-500/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="text-2xl">🏷️</span>
                    Generated Hashtags ({generatedHashtags.length})
                  </h4>
                  <button
                    onClick={() => setShowHashtags(false)}
                    className="text-gray-400 hover:text-white transition text-2xl p-1"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-3 mb-5">
                  {generatedHashtags.map((hashtag, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addHashtagToCaption(hashtag)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition text-sm shadow-lg"
                    >
                      {hashtag}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addAllHashtags}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition shadow-lg"
                >
                  ✨ Add All Hashtags to Caption
                </motion.button>
              </div>
            </motion.div>
          )}
          
          {/* AI Generate Buttons */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAIModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              ✨ Generate with AI
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowYoutubeModal(true)}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              � Generate from URL
            </motion.button>
          </div>
        </div>

        {/* AI Image Generation */}
        <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg p-6 mt-6 relative z-10">
          <h3 className="text-xl font-bold text-white mb-4">✨ AI Image Generator</h3>
          
          {/* Example Prompts */}
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-2">
              {['city skyline at night', 'modern workspace setup', 'abstract tech design', 'coffee cup on desk'].map((example, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => useExample(example)}
                  className="px-3 py-1 text-sm bg-gray-700 text-gray-200 rounded-full hover:bg-gray-600 transition"
                >
                  {example}
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Prompt Input */}
          <textarea
            value={aiImagePrompt}
            onChange={(e) => setAiImagePrompt(e.target.value)}
            placeholder="Describe the image you want to create..."
            className="w-full p-4 bg-gray-700/50 border-2 border-gray-600 text-white rounded-lg resize-none focus:ring-2 focus:ring-purple-500 mb-4 placeholder:text-gray-400"
            rows={3}
          />
          
          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateImage}
            disabled={generatingImage || !aiImagePrompt.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {generatingImage ? 'Generating...' : '🎨 Generate Image'}
          </motion.button>

          {/* Generated Image Preview */}
          {showImagePreview && generatedImage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 border-2 border-purple-200 rounded-lg bg-purple-50"
            >
              <p className="text-sm font-semibold text-gray-700 mb-3">Generated Image:</p>
              <img 
                src={generatedImage} 
                alt="Generated preview" 
                className="w-full rounded-lg mb-4 border-2 border-gray-200"
              />
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={attachImage}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  📎 Attach Image
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={regenerateImage}
                  disabled={generatingImage}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  🔄 Regenerate
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowImagePreview(false);
                    setGeneratedImage(null);
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  ✕
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* AI Video Generation */}
        <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg p-6 mt-6 relative z-10">
          <h3 className="text-xl font-bold text-white mb-4">🎬 AI Video Generator</h3>
          
          <div className="mb-4 p-4 bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-200 flex items-center gap-2">
              <span className="text-xl">🚧</span>
              <span><strong>Coming Soon:</strong> AI-powered video generation is currently in development. Stay tuned for exciting updates!</span>
            </p>
          </div>
          
          {/* Example Prompts */}
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-2">
              {['product showcase animation', 'social media intro video', 'abstract motion graphics', 'text animation reveal'].map((example, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => useVideoExample(example)}
                  className="px-3 py-1 text-sm bg-gray-700 text-gray-200 rounded-full hover:bg-gray-600 transition"
                >
                  {example}
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Prompt Input */}
          <textarea
            value={aiVideoPrompt}
            onChange={(e) => setAiVideoPrompt(e.target.value)}
            placeholder="Describe the video you want to create... (5-10 seconds, 16:9 aspect ratio)"
            className="w-full p-4 bg-gray-700/50 border-2 border-gray-600 text-white rounded-lg resize-none focus:ring-2 focus:ring-blue-500 mb-4 placeholder:text-gray-400"
            rows={3}
          />
          
          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateVideo}
            disabled={generatingVideo || !aiVideoPrompt.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {generatingVideo ? 'Generating...' : '🎬 Generate Video'}
          </motion.button>

          {/* Generated Video Preview */}
          {showVideoGenPreview && generatedVideo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-900/20 backdrop-blur-sm border-2 border-blue-500/30 rounded-lg"
            >
              <p className="text-sm font-semibold text-gray-200 mb-3">Generated Video:</p>
              <video 
                src={generatedVideo} 
                controls
                className="w-full rounded-lg mb-4 border-2 border-gray-600"
              />
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={attachGeneratedVideo}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  📎 Attach Video
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={regenerateVideo}
                  disabled={generatingVideo}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  🔄 Regenerate
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowVideoGenPreview(false);
                    setGeneratedVideo(null);
                  }}
                  className="bg-gray-800/50 backdrop-blur-sm border border-white/10 text-gray-200 px-6 py-3 rounded-lg font-semibold hover:bg-gray-700/50 transition"
                >
                  ✕
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Image/Video Upload */}
        <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg p-6 mt-6 relative z-10">
          <h3 className="text-xl font-bold text-white mb-4">📁 Upload Media</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Image or Video (Optional)
            </label>
            {image && (
              <div className="mb-3">
                <img src={image} alt="Preview" className="w-full max-h-64 object-contain rounded-lg border-2 border-gray-300" />
                <button
                  onClick={() => setImage(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  Remove Image
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*,video/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const isVideo = file.type.startsWith('video/');
                  setMediaType(isVideo ? 'video' : 'image');
                  
                  if (isVideo) {
                    // Store video file and show preview
                    setPendingVideoFile(file);
                    const previewUrl = URL.createObjectURL(file);
                    setVideoPreviewUrl(previewUrl);
                    showSuccess('Video ready to attach! Click "Attach Video" to upload.');
                  } else {
                    // Handle image as before
                    const reader = new FileReader();
                    reader.onload = (e) => setImage(e.target.result);
                    reader.readAsDataURL(file);
                  }
                }
              }}
              className="w-full p-3 bg-gray-800/50 border-2 border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Video Preview and Attach Button */}
          {pendingVideoFile && (
            <div className="bg-blue-900/20 backdrop-blur-sm border-2 border-blue-500/30 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🎬</div>
                  <div>
                    <p className="font-semibold text-white">{pendingVideoFile.name}</p>
                    <p className="text-sm text-gray-300">
                      {(pendingVideoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAttachVideo}
                  disabled={uploadingMedia}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {uploadingMedia ? 'Uploading...' : 'Attach Video'}
                </button>
              </div>
              {videoPreviewUrl && (
                <div className="mt-4">
                  <video 
                    src={videoPreviewUrl} 
                    controls 
                    className="w-full max-h-64 rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Attached Media Confirmation */}
          {image && !pendingVideoFile && (
            <div className="bg-green-900/20 backdrop-blur-sm border-2 border-green-500/30 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <p className="font-semibold text-green-300">
                    {mediaType === 'video' ? 'Video' : 'Image'} attached and ready to post!
                  </p>
                  <p className="text-sm text-green-400">
                    Click &quot;Post Now&quot; to share across platforms
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Platform Selection with 3D Chips */}
        <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg p-6 mt-6 relative z-10">
          <h3 className="text-xl font-bold text-white mb-4">🎯 Select Platforms</h3>
          
          {connectedAccounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔗</div>
              <h4 className="text-lg font-semibold text-white mb-2">No Platforms Connected</h4>
              <p className="text-gray-400 mb-4">Connect your social media accounts to start posting</p>
              <button
                onClick={() => navigate('/connect-accounts')}
                className="group relative bg-blue-600/30 backdrop-blur-lg border-2 border-blue-400/30 text-white px-6 py-3 rounded-xl hover:bg-blue-600/40 font-medium transition-all shadow-lg hover:shadow-blue-500/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                <span className="relative">Connect Accounts</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-4">
                {connectedAccounts.map(account => (
                  <PlatformChip
                    key={account.platform}
                    platform={account.platform}
                    selected={platforms.includes(account.platform)}
                    onClick={() => togglePlatform(account.platform)}
                    size="md"
                  />
                ))}
              </div>
              {platforms.length > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-400 mt-3"
                >
                  ✓ {platforms.length} platform{platforms.length > 1 ? 's' : ''} selected
                </motion.p>
              )}
            </div>
          )}

          {/* Instagram Image Requirement Warning */}
          {platforms.includes('instagram') && !image && (
            <div className="border border-yellow-500/30 bg-yellow-900/20 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2 mt-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-yellow-300">Image Required</div>
                <div className="text-sm text-yellow-400">Instagram requires an image or video. Please upload or generate one above.</div>
              </div>
            </div>
          )}

          {/* TikTok Video Requirement Warning */}
          {platforms.includes("tiktok") && !videoUrl && (
            <div className="border border-amber-500/30 bg-amber-900/20 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2 mt-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-amber-300">Video Required for TikTok</div>
                <div className="text-sm text-amber-400">TikTok requires a video file. Please upload a video above to post to TikTok.</div>
              </div>
            </div>
          )}

          {/* Post Usage Info */}
          {billingInfo && billingInfo.usage && billingInfo.usage.posts && (
            <div className={`border rounded-lg p-3 backdrop-blur-sm mt-4 ${billingInfo.usage.posts.used / billingInfo.usage.posts.limit >= 0.8 ? 'border-yellow-500/30 bg-yellow-900/20' : 'border-white/10 bg-gray-800/30'}`}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-200">
                  {billingInfo.usage.posts.limit === Infinity ? 'Unlimited posts' : `${billingInfo.usage.posts.limit - billingInfo.usage.posts.used} posts remaining`}
                </span>
                {billingInfo.usage.posts.used / billingInfo.usage.posts.limit >= 0.8 && billingInfo.plan && billingInfo.plan.name === 'free' && (
                  <a href="/pricing" className="text-blue-600 hover:text-blue-700 font-medium">
                    Upgrade →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Best Time to Post Recommendations */}
          {platforms.length > 0 && showBestTimes && bestTimes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-2xl border-2 border-blue-400/40 rounded-2xl p-6 shadow-2xl shadow-blue-500/20 overflow-hidden mt-4"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-white font-bold text-lg flex items-center gap-2">
                    <span className="text-2xl">⏰</span>
                    Best Time to Post on {platforms[0].charAt(0).toUpperCase() + platforms[0].slice(1)}
                  </h4>
                  <button
                    onClick={() => setShowBestTimes(false)}
                    className="text-gray-400 hover:text-white transition text-2xl p-1"
                  >
                    ✕
                  </button>
                </div>

                {loadingBestTimes ? (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-300 text-sm mt-3 font-medium">Analyzing best times...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bestTimes.map((time, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => scheduleAtRecommendedTime(time)}
                        className="group/time relative w-full bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-xl border-2 border-blue-400/30 rounded-xl p-4 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/30 transition-all overflow-hidden cursor-pointer text-left"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover/time:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-3xl">{['🥇', '🥈', '🥉'][index]}</span>
                              <span className="font-bold text-blue-200 text-lg">{time.day} at {time.time}</span>
                            </div>
                            <p className="text-sm text-gray-300 pl-11">{time.reason}</p>
                          </div>
                          <div className="text-blue-400 opacity-0 group-hover/time:opacity-100 transition-opacity text-xs font-semibold mt-1">
                            Click to schedule →
                          </div>
                        </div>
                      </motion.button>
                    ))}
                    
                    <div className="text-xs text-blue-300/60 mt-4 flex items-center gap-2 bg-blue-900/20 backdrop-blur-sm border border-blue-400/20 rounded-lg px-3 py-2">
                      <span>🤖</span>
                      <span>Powered by AI + your posting history</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePost}
              disabled={isLoading || !caption.trim() || platforms.length === 0}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Posting...' : 'Post Now'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gray-800/50 backdrop-blur-sm border border-white/10 text-gray-200 px-6 py-3 rounded-lg font-semibold hover:bg-gray-700/50 transition"
            >
              📅 Schedule
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">AI Caption Generator</h2>
              <button
                onClick={() => {
                  setShowAIModal(false);
                  setAiVariations([]);
                  setSelectedVariation(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* If variations exist, show them */}
            {aiVariations.length > 0 ? (
              <div>
                <p className="text-gray-300 mb-4">Choose one of the generated captions:</p>
                <div className="space-y-3 mb-6">
                  {aiVariations.map((variation, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectVariation(variation, index)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition ${
                        selectedVariation === index
                          ? 'border-purple-500 bg-purple-900/50'
                          : 'border-gray-600 hover:border-purple-400 bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          selectedVariation === index
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-600 text-gray-200'
                        }`}>
                          {index + 1}
                        </div>
                        <p className="text-gray-200 flex-1">{variation}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowAIModal(false);
                    setAiVariations([]);
                    setSelectedVariation(null);
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Close
                </motion.button>
              </div>
            ) : (
              /* If no variations, show the generation form */
              <div>
                <p className="text-gray-300 mb-4">Select your niche and AI will create captivating captions.</p>
                
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full p-3 bg-gray-700 border-2 border-gray-600 text-white rounded-lg mb-4 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a niche...</option>
                  <option value="tech">💻 Technology</option>
                  <option value="business">💼 Business</option>
                  <option value="lifestyle">✨ Lifestyle</option>
                  <option value="marketing">📢 Marketing</option>
                  <option value="productivity">⚡ Productivity</option>
                  <option value="education">🎓 Education</option>
                </select>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={generateCaption}
                    disabled={generating || !niche}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {generating ? 'Generating...' : 'Generate ✨'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowAIModal(false);
                      setAiVariations([]);
                      setSelectedVariation(null);
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* YouTube Modal */}
      {showYoutubeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">🔗 Generate from URL</h2>
              <button
                onClick={() => {
                  setShowYoutubeModal(false);
                  setYoutubeUrl('');
                  setYoutubeInstructions('');
                  setYoutubeVariations([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* If variations exist, show them */}
            {youtubeVariations.length > 0 ? (
              <div>
                <p className="text-gray-300 mb-4">Choose one of the generated captions:</p>
                <div className="space-y-3 mb-6">
                  {youtubeVariations.map((variation, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectYoutubeVariation(variation)}
                      className="w-full p-4 rounded-lg border-2 text-left transition border-gray-600 hover:border-red-400 bg-gray-700/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold bg-gray-600 text-gray-200">
                          {index + 1}
                        </div>
                        <p className="text-gray-200 flex-1">{variation}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setYoutubeVariations([]);
                    setYoutubeUrl('');
                    setYoutubeInstructions('');
                  }}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  ← Back to Input
                </motion.button>
              </div>
            ) : (
              /* If no variations, show the generation form */
              <div>
                <p className="text-gray-300 mb-4">
                  Enter any URL to generate captions. YouTube videos will use transcripts, other URLs will be scraped for content.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL *
                  </label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or any article URL"
                    className="w-full p-3 bg-gray-700 border-2 border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    YouTube videos must have captions/transcripts enabled. Other URLs will be scraped for content.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={youtubeInstructions}
                    onChange={(e) => setYoutubeInstructions(e.target.value)}
                    placeholder="E.g., Focus on the marketing tips, make it more casual, emphasize the key takeaways..."
                    className="w-full p-3 bg-gray-700 border-2 border-gray-600 text-white rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder:text-gray-400"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Add specific instructions for how to create the caption
                  </p>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={generateFromYoutube}
                    disabled={generatingFromYoutube || !youtubeUrl.trim()}
                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {generatingFromYoutube ? 'Generating...' : '🔗 Generate'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowYoutubeModal(false);
                      setYoutubeUrl('');
                      setYoutubeInstructions('');
                      setYoutubeVariations([]);
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason="posts_limit"
        currentPlan={billingInfo?.plan?.name || 'free'}
      />

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900/95 backdrop-blur-xl border-2 border-white/20 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-lg border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">📋 Load from Template</h2>
                  <p className="text-gray-300 text-sm mt-1">Select a template to get started quickly</p>
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-white transition p-2"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>

              {/* Search and Filter */}
              <div className="mt-4 flex gap-3">
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400"
                />
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="px-4 py-2 bg-gray-800/50 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Categories</option>
                  <option value="promotional">🎯 Promotional</option>
                  <option value="educational">📚 Educational</option>
                  <option value="engagement">💬 Engagement</option>
                  <option value="announcement">📢 Announcement</option>
                  <option value="personal">👤 Personal</option>
                  <option value="seasonal">🎄 Seasonal</option>
                  <option value="general">✨ General</option>
                </select>
              </div>
            </div>

            {/* Templates List */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-gray-300 text-lg">No templates yet</p>
                  <p className="text-gray-400 text-sm mt-2">Create templates from the Templates page</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates
                    .filter(t => {
                      const matchesSearch = !templateSearch || 
                        t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                        t.text.toLowerCase().includes(templateSearch.toLowerCase());
                      const matchesCategory = templateCategory === 'all' || t.category === templateCategory;
                      return matchesSearch && matchesCategory;
                    })
                    .map(template => (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        className="group relative bg-gray-800/50 backdrop-blur-lg border-2 border-white/10 rounded-xl p-5 cursor-pointer hover:border-purple-400/50 transition-all"
                        onClick={() => loadTemplateIntoForm(template)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                        
                        <div className="relative">
                          {/* Template Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 pr-2">
                              <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
                              {template.is_public && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-sm border border-blue-400/40 text-blue-200 rounded-full text-xs font-medium">
                                  🌐 Public
                                </span>
                              )}
                            </div>
                            {template.is_favorite && <span className="text-xl">⭐</span>}
                          </div>

                          {/* Description */}
                          {template.description && (
                            <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                          )}

                          {/* Content Preview */}
                          <p className="text-sm text-gray-300 mb-3 line-clamp-2 bg-gray-700/30 p-2 rounded">
                            {template.text}
                          </p>

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded border border-purple-400/30">
                              {template.category}
                            </span>
                            <span className="text-gray-400">
                              Used {template.use_count || 0}×
                            </span>
                          </div>

                          {/* Platforms */}
                          <div className="flex gap-1 mt-3 flex-wrap">
                            {template.platforms.slice(0, 4).map(platform => (
                              <span
                                key={platform}
                                className="px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs border border-white/10"
                              >
                                {platform}
                              </span>
                            ))}
                            {template.platforms.length > 4 && (
                              <span className="px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs border border-white/10">
                                +{template.platforms.length - 4}
                              </span>
                            )}
                          </div>

                          {/* Click hint */}
                          <div className="mt-3 text-center text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to load →
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}

              {/* No Results */}
              {templates.length > 0 && templates.filter(t => {
                const matchesSearch = !templateSearch || 
                  t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                  t.text.toLowerCase().includes(templateSearch.toLowerCase());
                const matchesCategory = templateCategory === 'all' || t.category === templateCategory;
                return matchesSearch && matchesCategory;
              }).length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-gray-300">No templates match your search</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
