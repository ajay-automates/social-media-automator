import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * TrendingCard - Individual trending post card with 3D transform effects
 * 
 * Props:
 * - platform: 'twitter' | 'reddit' | 'tiktok'
 * - author: string
 * - timestamp: string
 * - content: string (max 3 lines)
 * - engagement: { likes, retweets, score }
 * - isFeatured: boolean (center card)
 * - position: 'left' | 'center' | 'right'
 * - onViewPost: function
 * - onSave: function
 */
export default function TrendingCard({
    platform = 'twitter',
    author = 'Unknown',
    timestamp = '2h ago',
    content = 'This is a trending post...',
    engagement = { likes: 0, retweets: 0, score: 0 },
    isFeatured = false,
    position = 'center',
    onViewPost = () => { },
    onSave = () => { }
}) {
    const [isHovered, setIsHovered] = useState(false);

    // Platform icons and colors
    const platformConfig = {
        twitter: { icon: '𝕏', color: '#1DA1F2', name: 'Twitter' },
        reddit: { icon: '🔴', color: '#FF4500', name: 'Reddit' },
        tiktok: { icon: '🎵', color: '#000000', name: 'TikTok' }
    };

    const config = platformConfig[platform] || platformConfig.twitter;

    // Transform styles based on position
    const getTransformStyle = () => {
        if (isHovered) {
            return {
                transform: isFeatured ? 'scale(1.08)' : 'scale(1.0) rotate(0deg)',
                zIndex: 10,
                opacity: 1
            };
        }

        switch (position) {
            case 'left':
                return {
                    transform: 'perspective(1000px) rotateY(2deg) rotateZ(-2deg) scale(0.95)',
                    zIndex: 1,
                    opacity: 0.9
                };
            case 'right':
                return {
                    transform: 'perspective(1000px) rotateY(-2deg) rotateZ(2deg) scale(0.95)',
                    zIndex: 1,
                    opacity: 0.9
                };
            default: // center
                return {
                    transform: 'scale(1.05)',
                    zIndex: 3,
                    opacity: 1
                };
        }
    };

    const transformStyle = getTransformStyle();

    // Gradient border for featured card
    const borderStyle = isFeatured ? {
        background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
        padding: '2px',
        borderRadius: '16px'
    } : {};

    // Glow effect for featured card
    const glowStyle = isFeatured ? {
        boxShadow: isHovered
            ? '0 0 60px rgba(255, 107, 107, 0.4)'
            : '0 0 40px rgba(255, 107, 107, 0.4)'
    } : {};

    return (
        <motion.div
            className="flex-shrink-0 w-[280px] lg:w-[280px] h-[360px] lg:h-[360px] md:w-[320px] md:h-[400px]"
            style={{
                ...transformStyle,
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                willChange: 'transform, opacity',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                scrollSnapAlign: 'center'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Gradient border wrapper for featured */}
            <div style={isFeatured ? borderStyle : {}}>
                {/* Card content */}
                <div
                    className="h-full rounded-2xl backdrop-blur-md border border-white/10 overflow-hidden"
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        ...glowStyle
                    }}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{config.icon}</span>
                                <span className="text-xs font-semibold text-gray-400 uppercase">{config.name}</span>
                            </div>
                            {isFeatured && (
                                <span className="text-xs bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-full font-bold">
                                    🔥 FEATURED
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                {author.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{author}</p>
                                <p className="text-xs text-gray-400">{timestamp}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1">
                        <p className="text-gray-200 text-sm leading-relaxed line-clamp-3">
                            {content}
                        </p>
                    </div>

                    {/* Engagement Metrics */}
                    <div className="px-4 py-3 border-t border-white/10 flex items-center gap-4">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <span>❤️</span>
                            <span>{engagement.likes >= 1000 ? `${(engagement.likes / 1000).toFixed(1)}k` : engagement.likes}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <span>🔄</span>
                            <span>{engagement.retweets >= 1000 ? `${(engagement.retweets / 1000).toFixed(1)}k` : engagement.retweets}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <span>📊</span>
                            <span>{engagement.score}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 flex gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onViewPost}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                        >
                            View Post
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onSave}
                            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20"
                            aria-label="Save post"
                        >
                            <span className="text-lg">🔖</span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
