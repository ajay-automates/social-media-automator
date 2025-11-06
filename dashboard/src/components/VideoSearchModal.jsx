import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

/**
 * VideoSearchModal - Search and select professional stock videos from Pexels
 * 100% FREE - Unlimited HD/4K videos
 */
export default function VideoSearchModal({ show, onClose, onSelectVideo }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [orientation, setOrientation] = useState('portrait');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [hoveredVideo, setHoveredVideo] = useState(null);

  // Search on mount with default query
  useEffect(() => {
    if (show && videos.length === 0) {
      handleSearch('social media content');
    }
  }, [show]);

  const handleSearch = async (query = searchQuery) => {
    if (!query || query.trim().length < 2) {
      toast.error('Please enter at least 2 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/videos/search', {
        params: {
          q: query.trim(),
          orientation: orientation,
          per_page: 15
        }
      });

      if (response.data.success) {
        setVideos(response.data.videos || []);
        if (response.data.videos.length === 0) {
          toast('No videos found. Try a different keyword!', { icon: '🔍' });
        } else {
          console.log(`✅ Found ${response.data.videos.length} videos`);
        }
      }
    } catch (error) {
      console.error('Failed to search videos:', error);
      toast.error(error.response?.data?.error || 'Failed to search videos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVideo = () => {
    if (!selectedVideo) {
      toast.error('Please select a video first');
      return;
    }

    onSelectVideo(selectedVideo);
    onClose();
    toast.success('Video attached to your post!');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-800 border-2 border-purple-500/30 rounded-2xl max-w-6xl w-full max-h-[90vh] shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                🎬 Stock Video Library
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                100% Free • Unlimited HD/4K Videos • Powered by Pexels
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-lg p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Controls */}
          <div className="p-6 border-b border-gray-700 flex-shrink-0">
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search videos... (e.g., 'coffee shop', 'business', 'sunset')"
                className="flex-1 bg-gray-700/50 border-2 border-gray-600 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? '🔍 Searching...' : '🔍 Search'}
              </button>
            </div>

            {/* Orientation Selector */}
            <div className="flex gap-2">
              <span className="text-gray-400 text-sm font-semibold mr-2">Orientation:</span>
              {['portrait', 'landscape', 'square'].map((orient) => (
                <button
                  key={orient}
                  onClick={() => setOrientation(orient)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    orientation === orient
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {orient === 'portrait' && '📱 Portrait (9:16)'}
                  {orient === 'landscape' && '🖥️ Landscape (16:9)'}
                  {orient === 'square' && '⬜ Square (1:1)'}
                </button>
              ))}
            </div>
          </div>

          {/* Video Grid - Scrollable Area */}
          <div className="p-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-gray-400">Search for professional stock videos</p>
                <p className="text-gray-500 text-sm mt-2">Try: "business", "technology", "nature", "people"</p>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-sm mb-4">{videos.length} videos found</p>
                <div className="grid grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      isSelected={selectedVideo?.id === video.id}
                      isHovered={hoveredVideo === video.id}
                      onSelect={() => setSelectedVideo(video)}
                      onHover={() => setHoveredVideo(video.id)}
                      onHoverEnd={() => setHoveredVideo(null)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer - Always Visible */}
          <div className="p-6 border-t border-gray-700 flex items-center justify-between flex-shrink-0 bg-gray-800">
            <div className="text-sm text-gray-400">
              {selectedVideo ? (
                <span className="text-purple-400 font-semibold">
                  ✓ Selected: {selectedVideo.width}x{selectedVideo.height} • {Math.round(selectedVideo.duration)}s
                </span>
              ) : (
                'Click on a video to select it'
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSelectVideo}
                disabled={!selectedVideo}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use This Video →
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Video Card Component
function VideoCard({ video, isSelected, isHovered, onSelect, onHover, onHoverEnd }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef(null);

  // Play video on hover
  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.play().catch(err => console.log('Video play failed:', err));
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isHovered]);

  const getQualityBadge = () => {
    const hasHD = video.videoFiles.some(f => f.quality === 'hd');
    const hasUHD = video.videoFiles.some(f => f.quality === 'uhd');
    
    if (hasUHD || video.width >= 3840) return '4K';
    if (hasHD || video.width >= 1920) return 'HD';
    return 'SD';
  };

  return (
    <motion.div
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      onClick={onSelect}
      whileHover={{ scale: 1.05 }}
      className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'ring-4 ring-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.6)]'
          : 'ring-2 ring-gray-700 hover:ring-purple-500/50'
      }`}
    >
      {/* Video Preview */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.thumbnail}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
      />

      {/* Play Icon Overlay (when not playing) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Quality Badge */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-bold rounded">
        {getQualityBadge()}
      </div>

      {/* Duration Badge */}
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold rounded">
        {Math.round(video.duration)}s
      </div>

      {/* Selected Checkmark */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 left-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}

      {/* Resolution Info (on hover) */}
      {isHovered && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold rounded">
          {video.width}x{video.height}
        </div>
      )}
    </motion.div>
  );
}

