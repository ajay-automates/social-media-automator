import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

/**
 * CaptionImproverModal - AI-powered caption improvement
 * Shows 4 versions: Professional, Casual, Engaging, Short
 */
export default function CaptionImproverModal({ show, onClose, originalCaption, onSelectCaption, platform }) {
  const [improving, setImproving] = useState(false);
  const [improved, setImproved] = useState(null);
  const [selectedMode, setSelectedMode] = useState('professional');

  // Improve caption when modal opens
  useEffect(() => {
    if (show && originalCaption && !improved) {
      improveCaptionNow();
    }
  }, [show, originalCaption]);

  const improveCaptionNow = async () => {
    setImproving(true);
    try {
      const response = await api.post('/ai/improve-caption', {
        caption: originalCaption,
        platform: platform || 'linkedin'
      });

      if (response.data.success) {
        setImproved(response.data.improved);
      }
    } catch (error) {
      console.error('Failed to improve caption:', error);
      toast.error(error.response?.data?.error || 'Failed to improve caption');
    } finally {
      setImproving(false);
    }
  };

  const handleUseCaption = (captionText) => {
    onSelectCaption(captionText);
    onClose();
    toast.success('Caption updated!');
  };

  const modes = [
    { id: 'professional', icon: '💼', label: 'Professional', color: 'blue' },
    { id: 'casual', icon: '😊', label: 'Casual', color: 'green' },
    { id: 'engaging', icon: '🔥', label: 'Engaging', color: 'orange' },
    { id: 'short', icon: '⚡', label: 'Short', color: 'purple' }
  ];

  const colorClasses = {
    blue: 'bg-[#22d3ee]',
    green: '',
    orange: '',
    purple: 'bg-[#22d3ee]'
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
          className="bg-[#18181b] border-2 border-[#22d3ee]/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#22d3ee] p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                🎨 AI Caption Improver
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                Transform your caption with 4 AI-powered variations
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
            {/* Original Caption */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#a1a1aa] mb-2">YOUR ORIGINAL:</h3>
              <div className="bg-[#111113] border border-white/[0.06] rounded-lg p-4">
                <p className="text-[#a1a1aa] whitespace-pre-wrap">{originalCaption}</p>
                <p className="text-[#52525b] text-xs mt-2">{originalCaption.length} characters</p>
              </div>
            </div>

            <div className="border-t border-white/[0.06] mb-6"></div>

            {/* Loading State */}
            {improving ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-[#22d3ee]/20 border-t-[#22d3ee] rounded-full animate-spin mb-4"></div>
                <p className="text-[#a1a1aa] font-semibold">AI is improving your caption...</p>
                <p className="text-[#52525b] text-sm">This takes 5-10 seconds</p>
              </div>
            ) : improved ? (
              /* Improved Versions */
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#a1a1aa] mb-4">AI-IMPROVED VERSIONS:</h3>
                
                {modes.map((mode) => (
                  <CaptionCard
                    key={mode.id}
                    mode={mode}
                    caption={improved[mode.id]}
                    colorClass={colorClasses[mode.color]}
                    onUse={() => handleUseCaption(improved[mode.id])}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-[#a1a1aa]">
                No improvements generated yet
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/[0.06] bg-[#18181b]">
            <div className="flex items-center justify-between">
              <p className="text-[#a1a1aa] text-sm">
                Pick your favorite style or mix and match!
              </p>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-[#18181b] text-white rounded-lg hover:bg-[#18181b] transition font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Caption Card Component
function CaptionCard({ mode, caption, colorClass, onUse }) {
  if (!caption) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#111113] border border-white/[0.06] rounded-xl p-5 hover:border-[#22d3ee]/30 transition-all"
    >
      {/* Mode Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{mode.icon}</span>
          <h4 className="text-white font-bold">{mode.label}</h4>
        </div>
        <button
          onClick={onUse}
          className={`px-4 py-2 bg-[#22d3ee] ${colorClass} text-white font-semibold rounded-lg hover:opacity-90 transition`}
        >
          Use This →
        </button>
      </div>

      {/* Caption Text */}
      <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-4 mb-3">
        <p className="text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">{caption}</p>
      </div>

      {/* Character Count */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#52525b]">{caption.length} characters</span>
        <div className="flex gap-2">
          {caption.length <= 280 && (
            <span className="px-2 py-1 bg-[#22d3ee]/10 text-[#22d3ee] rounded">✓ Twitter</span>
          )}
          {caption.length <= 3000 && (
            <span className="px-2 py-1 bg-[#22d3ee]/10 text-[#22d3ee] rounded">✓ LinkedIn</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

