import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { showSuccess, showError } from './ui/Toast';
import {
  FaLinkedin,
  FaTwitter,
  FaReddit,
  FaTiktok,
  FaYoutube,
  FaLightbulb,
  FaRocket,
  FaChartLine,
  FaPoll,
  FaBook,
  FaQuestion,
  FaGraduationCap,
  FaComments
} from 'react-icons/fa';

export default function ContentIdeasModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [count, setCount] = useState(20);
  const [generating, setGenerating] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', Icon: FaLinkedin, color: 'bg-[#22d3ee]', glow: 'rgba(59, 130, 246, 0.5)' },
    { id: 'twitter', name: 'Twitter', Icon: FaTwitter, color: '', glow: 'rgba(14, 165, 233, 0.5)' },
    { id: 'reddit', name: 'Reddit', Icon: FaReddit, color: '', glow: 'rgba(249, 115, 22, 0.5)' },
    { id: 'tiktok', name: 'TikTok', Icon: FaTiktok, color: 'bg-[#18181b]', glow: 'rgba(107, 114, 128, 0.5)' },
    { id: 'youtube', name: 'YouTube', Icon: FaYoutube, color: '', glow: 'rgba(220, 38, 38, 0.5)' }
  ];

  const getTypeIcon = (type) => {
    const iconMap = {
      'case-study': FaChartLine,
      'poll': FaPoll,
      'tips': FaLightbulb,
      'story': FaBook,
      'data': FaChartLine,
      'question': FaQuestion,
      'tutorial': FaGraduationCap,
      'thread': FaComments,
      'lessons': FaGraduationCap,
      'commentary': FaComments
    };
    return iconMap[type] || FaRocket;
  };

  const getBadgeColor = (potential) => {
    if (potential === 'high') return ' border-green-400/50 text-green-200';
    if (potential === 'medium') return ' border-yellow-400/50 text-yellow-200';
    return 'bg-[#18181b] border-white/[0.06] text-[#a1a1aa]';
  };

  const generateIdeas = async () => {
    if (!topic || topic.trim().length < 3) {
      showError('Please enter a topic (at least 3 characters)');
      return;
    }

    setGenerating(true);
    setIdeas([]);
    setShowResults(false);

    try {
      const response = await api.post('/ai/content-ideas', {
        topic: topic.trim(),
        platform,
        count
      });

      if (response.data.success && response.data.ideas) {
        setIdeas(response.data.ideas);
        setShowResults(true);
        showSuccess(`Generated ${response.data.ideas.length} content ideas! 💡`);
      }
    } catch (err) {
      console.error('Ideas generation error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to generate ideas';
      showError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const useIdea = (idea) => {
    // Navigate to Create Post with pre-filled caption
    navigate('/create', {
      state: {
        ideaText: idea.title,
        ideaTopic: topic,
        platforms: [platform]
      }
    });
    onClose();
    showSuccess('Idea loaded! Start writing your post 🚀');
  };

  const handleRegenerate = () => {
    setShowResults(false);
    setIdeas([]);
    generateIdeas();
  };

  const handleClose = () => {
    setTopic('');
    setIdeas([]);
    setShowResults(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-[#0a0a0b]"
        >
          {/* Glossy overlay */}
          <div className="absolute inset-0 bg-[#111113] from-white/10 via-transparent to-transparent pointer-events-none rounded-2xl"></div>

          {/* Header */}
          <div className="relative bg-[#22d3ee] border-b border-white/[0.08] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#22d3ee]  opacity-50 rounded-full"></div>
                  <div className="relative w-16 h-16 bg-[#0a0a0b] rounded-2xl flex items-center justify-center transform rotate-12">
                    <FaLightbulb className="text-3xl text-white transform -rotate-12" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-black bg-[#22d3ee] from-white text-white">
                    AI Content Ideas Generator
                  </h2>
                  <p className="text-[#a1a1aa] mt-1">Never run out of content ideas again ✨</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-[#a1a1aa] hover:text-white transition text-3xl p-2 hover:bg-[#111113] rounded-lg"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {!showResults ? (
              /* Input Form */
              <div className="space-y-6">
                {/* Topic Input */}
                <div>
                  <label className="block text-white font-bold mb-3 flex items-center gap-2">
                    <FaLightbulb className="text-yellow-400" />
                    What topic do you want ideas about?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder='E.g., "social media marketing", "productivity tips", "AI automation"'
                      className="w-full bg-[#18181b] border border-white/[0.08] text-white px-5 py-4 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-[#22d3ee] transition placeholder:text-[#a1a1aa]"
                      autoFocus
                    />
                    {/* Input glow on focus */}
                    {topic && (
                      <div className="absolute inset-0 bg-[#22d3ee]  -z-10 rounded-xl"></div>
                    )}
                  </div>
                </div>

                {/* Platform Selector */}
                <div>
                  <label className="block text-white font-bold mb-3">
                    Select Platform
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {platforms.map((p) => {
                      const PlatformIcon = p.Icon;
                      const isSelected = platform === p.id;
                      return (
                        <motion.button
                          key={p.id}
                          whileHover={{ scale: 1.05, boxShadow: `0 10px 30px ${p.glow}` }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPlatform(p.id)}
                          className={`group relative p-5 rounded-xl font-bold text-sm transition-all border-2 overflow-hidden ${
                            isSelected
                              ? `bg-[#111113] ${p.color} text-white border-white/40`
                              : 'bg-[#18181b] text-[#a1a1aa] border-white/[0.08] hover:border-white/[0.08]'
                          }`}
                          style={isSelected ? { boxShadow: `0 8px 24px ${p.glow}` } : {}}
                        >
                          {/* Glossy overlay */}
                          <div className={`absolute inset-0 bg-[#111113] from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isSelected ? 'opacity-30' : ''}`}></div>
                          
                          <div className="relative flex flex-col items-center gap-2">
                            <PlatformIcon className="text-3xl drop-shadow-lg" />
                            <span>{p.name}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Count Selector */}
                <div>
                  <label className="block text-white font-bold mb-3">
                    Number of Ideas
                  </label>
                  <div className="flex gap-3">
                    {[10, 20, 30].map((num) => (
                      <motion.button
                        key={num}
                        whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(147, 51, 234, 0.4)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCount(num)}
                        className={`group relative flex-1 py-4 rounded-xl font-black transition-all border-2 overflow-hidden ${
                          count === num
                            ? 'bg-[#22d3ee] text-white border-[#22d3ee]/40'
                            : 'bg-[#18181b] text-[#a1a1aa] border-white/[0.08] hover:border-[#22d3ee]/30'
                        }`}
                      >
                        {/* Glossy effect */}
                        <div className={`absolute inset-0 bg-[#111113] from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity ${count === num ? 'opacity-30' : ''}`}></div>
                        <span className="relative">{num} Ideas</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <motion.button
                  whileHover={{ scale: generating ? 1 : 1.02, boxShadow: '0 20px 60px rgba(147, 51, 234, 0.6)' }}
                  whileTap={{ scale: generating ? 1 : 0.98 }}
                  onClick={generateIdeas}
                  disabled={generating || !topic.trim()}
                  className="group relative w-full bg-[#22d3ee] text-white px-8 py-5 rounded-xl font-black text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden"
                >
                  {/* Glossy shine */}
                  <div className="absolute inset-0 bg-[#111113] from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <span className="relative flex items-center gap-3">
                    {generating ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                        AI is brainstorming ideas...
                      </>
                    ) : (
                      <>
                        <FaRocket className="text-2xl" />
                        Generate Ideas
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            ) : (
              /* Results Display */
              <div>
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0a0a0b] rounded-lg flex items-center justify-center">
                        <FaLightbulb className="text-xl text-white" />
                      </div>
                      {ideas.length} Content Ideas for "{topic}"
                    </h3>
                    <p className="text-[#a1a1aa] text-sm mt-2 flex items-center gap-2">
                      Platform: 
                      {(() => {
                        const selectedPlatform = platforms.find(p => p.id === platform);
                        const PlatformIcon = selectedPlatform?.Icon;
                        return (
                          <span className="inline-flex items-center gap-1.5 bg-[#22d3ee] border border-[#22d3ee]/30 px-3 py-1 rounded-lg font-bold">
                            {PlatformIcon && <PlatformIcon className="text-base" />}
                            {selectedPlatform?.name}
                          </span>
                        );
                      })()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRegenerate}
                      className="group relative bg-[#22d3ee] text-white px-5 py-2.5 rounded-lg font-bold hover:opacity-90 transition text-sm flex items-center gap-2 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-[#111113] from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Regenerate
                      </span>
                    </motion.button>
                    <button
                      onClick={() => setShowResults(false)}
                      className="bg-[#18181b] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#18181b] transition text-sm border border-white/[0.08]"
                    >
                      ← Back
                    </button>
                  </div>
                </div>

                {/* Ideas Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ideas.map((idea, index) => {
                    const TypeIcon = getTypeIcon(idea.type);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03, y: -6, boxShadow: '0 20px 60px rgba(147, 51, 234, 0.4)' }}
                        className="group relative bg-[#0a0a0b]"
                        onClick={() => useIdea(idea)}
                      >
                        {/* Glossy shine effect */}
                        <div className="absolute inset-0 bg-[#111113] from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

                        <div className="relative">
                          {/* Type Icon & Badge */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-[#22d3ee]  opacity-50 rounded-full"></div>
                              <div className="relative w-12 h-12 bg-[#0a0a0b]/40 border border-[#22d3ee]/30 rounded-xl flex items-center justify-center">
                                <TypeIcon className="text-xl text-[#a1a1aa]" />
                              </div>
                            </div>
                            {idea.engagement_potential && (
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black bg-[#22d3ee] ${getBadgeColor(idea.engagement_potential)} border-2 uppercase`}>
                                {idea.engagement_potential === 'high' && '🔥 '}
                                {idea.engagement_potential}
                              </span>
                            )}
                          </div>

                          {/* Idea Title */}
                          <h4 className="text-white font-bold text-base mb-3 line-clamp-2 group-hover:text-white group-hover:bg-[#22d3ee] group-hover: group-hover: group-hover:bg-clip-text transition-all">
                            {idea.title}
                          </h4>

                          {/* Hook/Description */}
                          {idea.hook && (
                            <p className="text-[#a1a1aa] text-sm mb-4 line-clamp-2 leading-relaxed">
                              {idea.hook}
                            </p>
                          )}

                          {/* Use Button */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.08]">
                            <span className="text-xs text-[#52525b] font-bold uppercase tracking-wider">
                              {idea.type?.replace('-', ' ')}
                            </span>
                            <div className="group/btn relative overflow-hidden bg-[#22d3ee] text-white px-5 py-2.5 rounded-xl font-black text-sm group-hover: transition-all">
                              <div className="absolute inset-0 bg-[#22d3ee] from-white/30 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                              <span className="relative flex items-center gap-1.5">
                                Use This Idea
                                <FaRocket className="text-xs" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bottom Actions */}
                <div className="mt-8 flex items-center justify-center">
                  <div className="bg-[#22d3ee] border border-[#22d3ee]/20 px-6 py-3 rounded-xl">
                    <p className="text-[#a1a1aa] text-sm font-semibold flex items-center gap-2">
                      <FaRocket className="text-[#a1a1aa]" />
                      Click any idea to start creating your post instantly
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

