import { motion } from 'framer-motion';
import { useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

// Pre-filled suggestion ideas for new users
const postSuggestions = [
  {
    text: "🚀 Just joined Social Media Automator and posted to all my platforms in seconds! This is a game changer for content creators. #SocialMediaAutomation #ContentCreator",
    category: "Announcement"
  },
  {
    text: "💡 Tip of the day: Consistency is key to social media success. Posting regularly keeps your audience engaged! #SocialMediaTips #ContentStrategy",
    category: "Tip"
  },
  {
    text: "🎉 Excited to share that I'm now automating my social media posts across 10+ platforms! More time for creating, less time for posting. #Productivity #Automation",
    category: "Personal"
  }
];

export default function FirstPostStep() {
  const { nextStep, prevStep, setFirstPostData } = useOnboarding();
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const handleSuggestionClick = (suggestion, index) => {
    setCaption(suggestion.text);
    setSelectedSuggestion(index);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview('');
  };

  const handleContinue = () => {
    // Save post data to onboarding context
    setFirstPostData({ caption, image, imagePreview });
    nextStep();
  };

  const canContinue = caption.trim().length > 0;
  const charCount = caption.length;
  const maxChars = 280; // Twitter limit as baseline

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gray-900/30 backdrop-blur-xl border-2 border-white/20 rounded-3xl shadow-2xl p-8 max-w-3xl w-full my-8"
      >
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-400 font-semibold">STEP 2 of 3</span>
            <span className="text-sm text-gray-400">Almost there!</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '33%' }}
              animate={{ width: '66%' }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Create Your First Post
        </h2>
        <p className="text-gray-300 mb-6">
          Write something or pick a suggestion below to get started!
        </p>

        {/* Quick Suggestions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-purple-400 mb-3">💡 QUICK START IDEAS</h3>
          <div className="grid grid-cols-1 gap-3">
            {postSuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSuggestionClick(suggestion, index)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  selectedSuggestion === index
                    ? 'bg-blue-500/20 border-blue-400'
                    : 'glass border-white/20 hover:border-purple-400 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-purple-400 font-semibold mb-1">{suggestion.category}</div>
                    <div className="text-white text-sm line-clamp-2">{suggestion.text}</div>
                  </div>
                  {selectedSuggestion === index && (
                    <div className="ml-2 bg-blue-500 rounded-full p-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Caption Textarea */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-white">Your Post</label>
            <span className={`text-sm font-mono ${charCount > maxChars ? 'text-red-400' : 'text-gray-400'}`}>
              {charCount} / {maxChars}
            </span>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's on your mind? Write your first post here..."
            rows={6}
            className="w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
          />
          {charCount > maxChars && (
            <p className="text-xs text-red-400 mt-1">
              ⚠️ Twitter has a 280 character limit. Consider shortening your post.
            </p>
          )}
        </div>

        {/* Image Upload (Optional) */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-white mb-3">📷 Add Image (Optional)</h3>
          {!imagePreview ? (
            <label className="block cursor-pointer">
              <div className="glass border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-white/5 transition-all">
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-white font-semibold mb-1">Click to upload an image</p>
                <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative glass border-2 border-white/20 rounded-xl p-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-6 right-6 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={prevStep}
            className="glass border border-white/20 text-gray-300 px-8 py-4 rounded-xl font-medium hover:bg-white/10 transition-all"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              canContinue
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:shadow-blue-500/50'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>{canContinue ? 'Continue to Review' : 'Write something first'}</span>
            {canContinue && <span>→</span>}
          </button>
        </div>

        {/* Helpful Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <h4 className="text-white font-semibold mb-1">Pro Tip</h4>
              <p className="text-sm text-gray-300">
                Keep your posts under 280 characters for maximum compatibility across all platforms. You can always customize per platform later!
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

