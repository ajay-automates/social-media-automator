import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { PostingOverlay } from '../components/ui/LoadingStates';
import { useLoadingState } from '../hooks/useLoadingState';
import { showSuccess, showError } from '../components/ui/Toast';
import { celebrateSuccess } from '../utils/animations';

export default function CreatePost() {
  const navigate = useNavigate();
  const { isLoading, currentStep, startLoading, stopLoading } = useLoadingState();
  const [caption, setCaption] = useState('');
  const [platforms, setPlatforms] = useState(['twitter']);
  const [image, setImage] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [niche, setNiche] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [aiVariations, setAiVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

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

  const handlePost = async () => {
    if (!caption.trim()) {
      showError('Please enter a caption');
      return;
    }

    startLoading('twitter');
    
    try {
      const response = await api.post('/post/now', {
        text: caption,
        platforms: platforms,
        accountId: 1, // Will be replaced with actual account selection
        imageUrl: image // Send the Cloudinary URL to the server
      });
      
      celebrateSuccess();
      showSuccess('Post created successfully! 🎉');
      
      // Reset form
      setCaption('');
      setImage(null);
      
      // Redirect after success
      setTimeout(() => navigate('/dashboard'), 2000);
      
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
              Image (Optional)
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
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => setImage(e.target.result);
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {['twitter', 'linkedin', 'telegram'].map(platform => (
                <motion.button
                  key={platform}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => togglePlatform(platform)}
                  className={`px-6 py-3 rounded-lg font-medium transition ${
                    platforms.includes(platform)
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {platform === 'twitter' && '🐦'} {platform === 'linkedin' && '🔗'} {platform === 'telegram' && '💬'}
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
          
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
    </>
  );
}
