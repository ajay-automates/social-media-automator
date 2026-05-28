import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaLink, FaTimes } from 'react-icons/fa';
import api from '../lib/api';
import { showError, showSuccess } from './ui/Toast';

const cleanText = (value = '') => String(value)
  .replace(/<[^>]*>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const getDomain = (url = '') => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

export default function UrlPostModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [sourceUrl, setSourceUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleClose = () => {
    setSourceUrl('');
    setInstructions('');
    onClose();
  };

  const generateFromUrl = async () => {
    if (!sourceUrl.trim()) {
      showError('Enter a URL first');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post('/ai/youtube-caption', {
        videoUrl: sourceUrl.trim(),
        instructions: instructions.trim(),
        platform: 'linkedin'
      });

      const variation = response.data?.variations?.[0];
      if (!variation) {
        showError('No post generated from URL');
        return;
      }

      navigate('/content-agent', {
        state: {
          studioArticle: {
            title: sourceUrl.trim(),
            description: instructions.trim() || variation,
            url: sourceUrl.trim(),
            source: getDomain(sourceUrl) || 'URL'
          },
          studioDraft: cleanText(variation)
        }
      });

      showSuccess('Generated post from URL');
      handleClose();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to generate from URL');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-[#111113] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="p-5 border-b border-white/[0.06] flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#52525b] font-semibold mb-1">Quick action</p>
              <h2 className="text-xl font-semibold text-white">Generate from URL</h2>
              <p className="text-sm text-[#a1a1aa] mt-1">Drop in a link and send the draft straight to Post Studio.</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/[0.06]"
            >
              <FaTimes size={14} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">URL</label>
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full px-3 py-2.5 bg-[#0d0d0f] border border-white/[0.08] rounded-lg text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#22d3ee]/40"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Instructions</label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Optional tone or angle..."
                rows={4}
                className="w-full px-3 py-2.5 bg-[#0d0d0f] border border-white/[0.08] rounded-lg text-sm text-white placeholder-[#52525b] resize-none focus:outline-none focus:border-[#22d3ee]/40"
              />
            </div>

            <button
              onClick={generateFromUrl}
              disabled={generating || !sourceUrl.trim()}
              className="w-full px-4 py-3 rounded-lg bg-[#22d3ee] text-[#0a0a0b] text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaLink size={13} />
              {generating ? 'Generating...' : 'Generate from URL'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
