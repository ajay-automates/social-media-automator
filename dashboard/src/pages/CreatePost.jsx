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
  const [platforms, setPlatforms] = useState(['twitter']);
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

  useEffect(() => {
    loadBillingInfo();
  }, []);

  // Load moderated subreddits when Reddit is selected
  useEffect(() => {
    if (platforms.includes('reddit')) {
      loadModeratedSubreddits();
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
      
      console.log('AI Image response:', response.data);
      
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
      
      console.log('📤 Uploading video to Cloudinary...');
      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        const uploadedUrl = response.data.videoUrl || response.data.url || response.data.imageUrl;
        setImage(uploadedUrl);
        console.log('✅ Video uploaded and attached, URL:', uploadedUrl);
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
      console.log('📤 About to post - image state:', image);
      console.log('📤 Caption:', caption);
      console.log('📤 Platforms:', platforms);
      
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
            className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-2"
          >
            Create Post
          </motion.h1>
          <p className="text-gray-400">Share your message across 25+ platforms</p>
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
            <div className="mt-2 text-sm text-gray-400">{caption.length} characters</div>
          </div>
          
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
          
          {/* Image Upload */}
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
            <div className="bg-blue-900/20 backdrop-blur-sm border-2 border-blue-500/30 rounded-lg p-4">
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
            <div className="bg-green-900/20 backdrop-blur-sm border-2 border-green-500/30 rounded-lg p-4">
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
          
          {/* Platform Selection with 3D Chips */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Select Platforms
            </label>
            <div className="flex flex-wrap gap-4">
              {[
                'twitter', 'linkedin', 'facebook', 'telegram', 
                'slack', 'discord', 'reddit', 'instagram', 
                'youtube', 'tiktok'
              ].map(platformId => (
                <PlatformChip
                  key={platformId}
                  platform={platformId}
                  selected={platforms.includes(platformId)}
                  onClick={() => togglePlatform(platformId)}
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

          {/* Instagram Image Requirement Warning */}
          {platforms.includes('instagram') && !image && (
            <div className="border border-yellow-500/30 bg-yellow-900/20 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-yellow-300">Image Required</div>
                <div className="text-sm text-yellow-400">Instagram requires an image or video. Please upload or generate one above.</div>
              </div>
            </div>
          )}
          

          {/* TikTok Video Requirement Warning */}
          {platforms.includes("tiktok") && !videoUrl && (
            <div className="border border-amber-500/30 bg-amber-900/20 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-amber-300">Video Required for TikTok</div>
                <div className="text-sm text-amber-400">TikTok requires a video file. Please upload a video above to post to TikTok.</div>
              </div>
            </div>
          )}
          {/* Post Usage Info */}
          {billingInfo && billingInfo.usage && billingInfo.usage.posts && (
            <div className={`border rounded-lg p-3 backdrop-blur-sm ${billingInfo.usage.posts.used / billingInfo.usage.posts.limit >= 0.8 ? 'border-yellow-500/30 bg-yellow-900/20' : 'border-white/10 bg-gray-800/30'}`}>
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

          {/* Actions */}
          <div className="flex gap-4">
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
    </>
  );
}
