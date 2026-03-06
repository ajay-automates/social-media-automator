import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

/**
 * ImageCaptionModal - Generate captions from images using Claude Vision
 * Analyzes image and creates 3 engaging caption variations
 */
export default function ImageCaptionModal({ show, onClose, imageUrl, onSelectCaption, platform }) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  // Generate captions when modal opens
  useEffect(() => {
    if (show && imageUrl && !result) {
      generateCaptionsNow();
    }
  }, [show, imageUrl]);

  const generateCaptionsNow = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/ai/caption-from-image', {
        imageUrl: imageUrl,
        platform: platform || 'linkedin'
      });

      if (response.data.success) {
        setResult(response.data);
        console.log('✅ AI analyzed image:', response.data.description);
      }
    } catch (error) {
      console.error('Failed to generate captions from image:', error);
      toast.error(error.response?.data?.error || 'Failed to analyze image');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseCaption = (caption) => {
    onSelectCaption(caption);
    onClose();
    setResult(null); // Reset for next use
    toast.success('Caption generated from image!');
  };

  const handleRegenerate = () => {
    setResult(null);
    generateCaptionsNow();
  };

  if (!show) return null;

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
          className="bg-[#18181b] border-2 border-[#22d3ee]/20 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#22d3ee] p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                🖼️ AI Caption from Image
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Claude Vision analyzes your image and creates perfect captions
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
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Image Preview */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#a1a1aa] mb-2">YOUR IMAGE:</h3>
              <div className="bg-[#111113] border border-white/[0.06] rounded-lg overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="Your uploaded image" 
                  className="w-full max-h-80 object-contain"
                />
              </div>
            </div>

            {/* Loading State */}
            {generating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-[#22d3ee]/20 border-t-[#22d3ee] rounded-full animate-spin mb-4"></div>
                <p className="text-[#a1a1aa] font-semibold">AI is analyzing your image...</p>
                <p className="text-[#52525b] text-sm">Claude Vision is at work! (8-15 seconds)</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* What AI Sees */}
                <div>
                  <h3 className="text-sm font-bold text-[#a1a1aa] mb-2">🔍 WHAT AI SEES:</h3>
                  <div className="bg-[#22d3ee]/10 border border-[#22d3ee]/30 rounded-lg p-4">
                    <p className="text-[#22d3ee] text-sm italic">"{result.description}"</p>
                  </div>
                </div>

                <div className="border-t border-white/[0.06] my-4"></div>

                {/* Generated Captions */}
                <div>
                  <h3 className="text-sm font-bold text-[#a1a1aa] mb-4">✨ GENERATED CAPTIONS:</h3>
                  <div className="space-y-3">
                    {result.captions && result.captions.map((caption, index) => (
                      <CaptionOption
                        key={index}
                        index={index + 1}
                        caption={caption}
                        onUse={() => handleUseCaption(caption)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[#a1a1aa]">
                No captions generated yet
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/[0.06] bg-[#18181b] flex items-center justify-between">
            <div>
              {result && (
                <button
                  onClick={handleRegenerate}
                  disabled={generating}
                  className="px-4 py-2 bg-[#22d3ee]/10 text-[#a1a1aa] border border-[#22d3ee]/30 rounded-lg hover:bg-[#22d3ee]/10 transition text-sm font-semibold disabled:opacity-50"
                >
                  🔄 Regenerate
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#18181b] text-white rounded-lg hover:bg-[#18181b] transition font-semibold"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Caption Option Component
function CaptionOption({ index, caption, onUse }) {
  const icons = ['💼', '😊', '🔥'];
  const labels = ['Professional', 'Casual', 'Engaging'];
  const colors = [
    'bg-[#22d3ee]',
    '',
    ''
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[#111113] border border-white/[0.06] rounded-xl p-5 hover:border-[#22d3ee]/30 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icons[index - 1]}</span>
          <span className="text-white font-bold">{labels[index - 1]}</span>
        </div>
        <button
          onClick={onUse}
          className={`px-4 py-2 bg-[#22d3ee] ${colors[index - 1]} text-white font-semibold rounded-lg hover:opacity-90 transition`}
        >
          Use This Caption →
        </button>
      </div>

      {/* Caption Text */}
      <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-4 mb-2">
        <p className="text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">{caption}</p>
      </div>

      {/* Character Count */}
      <p className="text-[#52525b] text-xs">{caption.length} characters</p>
    </motion.div>
  );
}

