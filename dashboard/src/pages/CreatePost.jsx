import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { PostingOverlay } from '../components/ui/LoadingStates';
import { useLoadingState } from '../hooks/useLoadingState';
import { showSuccess, showError } from '../components/ui/Toast';
import { celebrateSuccess } from '../utils/animations';
import UpgradeModal from '../components/UpgradeModal';

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
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);

  useEffect(() => {
    loadBillingInfo();
  }, []);

  const loadBillingInfo = async () => {
    try {
      const response = await api.get('/billing/usage');
      setBillingInfo(response.data);
    } catch (err) {
      console.error('Error loading billing info:', err);
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
      const response = await api.post('/post/now', {
        text: caption,
        platforms: platforms,
        accountId: 1, // Will be replaced with actual account selection
        imageUrl: image // Send the Cloudinary URL to the server
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
        className="w-full max-w-5xl mx-auto px-6 py-8"
      >
        <h1 className="text-4xl font-bold mb-4">Create Post</h1>
        <p className="text-gray-600 mb-8">Share your message across multiple platforms</p>
        
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Caption Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-4 border-2 border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              rows={6}
            />
            <div className="mt-2 text-sm text-gray-500">{caption.length} characters</div>
          </div>
          
          {/* AI Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAIModal(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            ✨ Generate with AI
          </motion.button>
          
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Video Preview and Attach Button */}
          {pendingVideoFile && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">🎬</div>
                  <div>
                    <p className="font-semibold text-gray-900">{pendingVideoFile.name}</p>
                    <p className="text-sm text-gray-600">
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
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <p className="font-semibold text-green-900">
                    {mediaType === 'video' ? 'Video' : 'Image'} attached and ready to post!
                  </p>
                  <p className="text-sm text-green-700">
                    Click &quot;Post Now&quot; to share across platforms
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'twitter', name: 'Twitter', icon: '🐦', color: 'bg-sky-500' },
                { id: 'linkedin', name: 'LinkedIn', icon: '🔗', color: 'bg-blue-600' },
                { id: 'facebook', name: 'Facebook', icon: '📘', color: 'bg-blue-700' },
                { id: 'telegram', name: 'Telegram', icon: '💬', color: 'bg-indigo-600' },
                { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500' },
                { id: 'youtube', name: 'YouTube', icon: '🎬', color: 'bg-red-600' },                { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black' }
              ].map(platform => (
                <motion.button
                  key={platform.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => togglePlatform(platform.id)}
                  className={`px-6 py-3 rounded-lg font-medium transition ${
                    platforms.includes(platform.id)
                      ? `${platform.color} text-white shadow-lg ${platform.id === 'instagram' ? '' : ''}`
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {platform.icon} {platform.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Instagram Image Requirement Warning */}
          {platforms.includes('instagram') && !image && (
            <div className="border border-yellow-400 bg-yellow-50 rounded-lg p-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-yellow-800">Image Required</div>
                <div className="text-sm text-yellow-700">Instagram requires an image or video. Please upload or generate one above.</div>
              </div>
            </div>
          )}
          

          {/* TikTok Video Requirement Warning */}
          {platforms.includes("tiktok") && !videoUrl && (
            <div className="border border-amber-400 bg-amber-50 rounded-lg p-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-amber-800">Video Required for TikTok</div>
                <div className="text-sm text-amber-700">TikTok requires a video file. Please upload a video above to post to TikTok.</div>
              </div>
            </div>
          )}
          {/* Post Usage Info */}
          {billingInfo && billingInfo.usage && billingInfo.usage.posts && (
            <div className={`border rounded-lg p-3 ${billingInfo.usage.posts.used / billingInfo.usage.posts.limit >= 0.8 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
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
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              📅 Schedule
            </motion.button>
          </div>
        </div>

        {/* AI Image Generation */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">✨ AI Image Generator</h3>
          
          {/* Example Prompts */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-2">
              {['city skyline at night', 'modern workspace setup', 'abstract tech design', 'coffee cup on desk'].map((example, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => useExample(example)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition"
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
            className="w-full p-4 border-2 border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 mb-4"
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
      </motion.div>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">AI Caption Generator</h2>
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
                <p className="text-gray-600 mb-4">Choose one of the generated captions:</p>
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
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          selectedVariation === index
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <p className="text-gray-700 flex-1">{variation}</p>
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
                <p className="text-gray-600 mb-4">Select your niche and AI will create captivating captions.</p>
                
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-purple-500"
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
