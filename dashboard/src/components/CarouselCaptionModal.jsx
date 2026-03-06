import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

export default function CarouselCaptionModal({ show, onClose, images, topic, platform, onCaptionsGenerated }) {
  const [generating, setGenerating] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const generateCaptions = async () => {
    setGenerating(true);
    setCaptions([]);

    try {
      const response = await api.post('/carousel/generate-captions', {
        imageUrls: images,
        topic: topic || 'carousel post',
        platform: platform || 'linkedin'
      });

      if (response.data.success) {
        setCaptions(response.data.captions);
        toast.success(`Generated ${response.data.captions.length} captions! 🎨`);
      }
    } catch (error) {
      console.error('Caption generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate captions');
    } finally {
      setGenerating(false);
    }
  };

  const updateCaption = (index, newText) => {
    const newCaptions = [...captions];
    newCaptions[index] = newText;
    setCaptions(newCaptions);
  };

  const regenerateOne = async (index) => {
    toast.info('Regenerating single caption...');
    // For simplicity, regenerate all and just use that one
    await generateCaptions();
  };

  const handleUse = () => {
    if (captions.length === 0) {
      toast.error('Please generate captions first');
      return;
    }
    onCaptionsGenerated(captions);
  };

  // Auto-generate when modal opens
  useEffect(() => {
    if (show && images && images.length > 0 && captions.length === 0 && !generating) {
      console.log('🎨 Auto-generating captions for', images.length, 'images');
      generateCaptions();
    }
  }, [show, images]);

  if (!show) return null;

  console.log('Modal state:', { show, generating, captionCount: captions.length, imageCount: images?.length });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#18181b] border-2 border-[#22d3ee]/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#22d3ee] p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                🤖 AI Carousel Caption Generator
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                Analyzing {images.length} slides with Claude Vision AI
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-[#111113] rounded-lg p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {generating ? (
              /* Loading State */
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-[#22d3ee]/20 border-t-[#22d3ee] rounded-full animate-spin mb-4"></div>
                <p className="text-[#a1a1aa] font-semibold text-lg">AI is analyzing your images...</p>
                <p className="text-[#52525b] text-sm mt-2">This may take 10-20 seconds</p>
                <div className="mt-4 flex gap-2">
                  {images.map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-[#22d3ee] rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
                  ))}
                </div>
              </div>
            ) : captions.length > 0 ? (
              /* Generated Captions */
              <div className="space-y-4">
                <div className="bg-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-lg p-4 mb-6">
                  <p className="text-[#22d3ee] text-sm">
                    ✨ AI has analyzed all {images.length} slides and created a progressive story!
                    Review and edit each caption below.
                  </p>
                </div>

                {captions.map((caption, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#111113] border border-white/[0.06] rounded-xl p-5 hover:border-[#22d3ee]/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={images[index]} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                      </div>

                      {/* Caption Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{['📌', '💡', '🎯', '✨', '🚀', '💪', '🔥', '⭐', '🎉', '🏆'][index]}</span>
                            <span className="text-white font-bold">Slide {index + 1}</span>
                          </div>
                          <button
                            onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                            className="text-[#22d3ee] hover:text-[#22d3ee] text-sm font-semibold"
                          >
                            {editingIndex === index ? '✓ Done' : '✏️ Edit'}
                          </button>
                        </div>

                        {editingIndex === index ? (
                          <textarea
                            value={caption}
                            onChange={(e) => updateCaption(index, e.target.value)}
                            className="w-full bg-[#18181b] border border-white/[0.06] text-white rounded-lg p-3 focus:ring-2 focus:ring-purple-500 resize-none"
                            rows={3}
                          />
                        ) : (
                          <p className="text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">{caption}</p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[#52525b] text-xs">{caption.length} characters</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Initial State */
              <div className="text-center py-12 text-[#a1a1aa]">
                Click "Generate" to create AI captions
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/[0.06] bg-[#18181b] flex items-center justify-between">
            <button
              onClick={generateCaptions}
              disabled={generating}
              className="px-6 py-3 bg-[#22d3ee]/10 text-[#a1a1aa] border border-[#22d3ee]/30 rounded-lg hover:bg-[#22d3ee]/10 transition font-semibold disabled:opacity-50"
            >
              🔄 Regenerate All
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-[#18181b] text-white rounded-lg hover:bg-[#18181b] transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUse}
                disabled={captions.length === 0}
                className="px-6 py-3 bg-[#22d3ee] text-white rounded-lg hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use These Captions →
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

