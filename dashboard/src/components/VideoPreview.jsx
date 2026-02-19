import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * VideoPreview - Shows selected video with play preview
 */
export default function VideoPreview({ video, onRemove, onChangeVideo }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const getQualityLabel = () => {
    if (video.width >= 3840) return '4K';
    if (video.width >= 1920) return 'HD';
    if (video.width >= 1280) return 'HD';
    return 'SD';
  };

  const getOrientationIcon = () => {
    if (video.orientation === 'portrait') return '📱';
    if (video.orientation === 'landscape') return '🖥️';
    return '⬜';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-800/50 backdrop-blur-xl border-2 border-purple-500/30 rounded-xl p-4 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-bold flex items-center gap-2">
          🎬 Attached Video
        </h4>
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-300 transition p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Video Preview */}
      <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
        <video
          ref={videoRef}
          src={video.videoUrl}
          poster={video.thumbnail}
          className="w-full h-full object-cover"
          onClick={togglePlay}
          onEnded={() => setIsPlaying(false)}
          muted
          playsInline
        />

        {/* Play/Pause Button Overlay */}
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/20 transition"
        >
          {!isPlaying && (
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Quality Badge */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-bold rounded">
          {getQualityLabel()}
        </div>
      </div>

      {/* Video Info */}
      <div className="flex items-center justify-between text-sm mb-3">
        <div className="flex items-center gap-3 text-gray-300">
          <span className="flex items-center gap-1">
            {getOrientationIcon()} {video.width}x{video.height}
          </span>
          <span className="flex items-center gap-1">
            ⏱️ {Math.round(video.duration)}s
          </span>
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-semibold">
            Pexels
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onChangeVideo}
          className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-semibold"
        >
          Change Video
        </button>
        <button
          onClick={togglePlay}
          className="px-4 py-2 bg-purple-600/20 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-600/30 transition text-sm font-semibold"
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Preview'}
        </button>
      </div>

      {/* Platform Compatibility Warning */}
      {video.duration > 60 && (
        <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
          <p className="text-yellow-300 text-xs">
            ⚠️ Video is {Math.round(video.duration)}s - Some platforms have shorter limits (TikTok: 60s)
          </p>
        </div>
      )}
    </motion.div>
  );
}

