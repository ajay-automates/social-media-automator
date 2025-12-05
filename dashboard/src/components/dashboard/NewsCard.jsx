import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * NewsCard - Individual AI news card with 3D transform effects
 * 
 * Props:
 * - headline: string
 * - source: string
 * - timestamp: string
 * - bulletPoints: string[] (4 key points)
 * - isTrending: boolean
 * - isFeatured: boolean (center card)
 * - position: 'left' | 'center' | 'right'
 * - onReadArticle: function
 * - onGeneratePost: function
 * - onSave: function
 */
export default function NewsCard({
    headline = 'AI News Headline',
    source = 'OpenAI',
    timestamp = '2h ago',
    bulletPoints = ['Key point 1', 'Key point 2', 'Key point 3', 'Key point 4'],
    isTrending = false,
    isFeatured = false,
    position = 'center',
    onReadArticle = () => { },
    onGeneratePost = () => { },
    onSave = () => { }
}) {
    const [isHovered, setIsHovered] = useState(false);

    // Source icons and colors
    const sourceConfig = {
        'OpenAI': { icon: '🤖', color: '#10A37F' },
        'Anthropic': { icon: '🧠', color: '#D97757' },
        'Google': { icon: '🔍', color: '#4285F4' },
        'Microsoft': { icon: '🪟', color: '#00A4EF' },
        'Meta': { icon: '📘', color: '#0668E1' }
    };

    const config = sourceConfig[source] || { icon: '📰', color: '#6366F1' };

    // Transform styles based on position (same as TrendingCard)
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

    // Blue-cyan gradient border for featured card
    const borderStyle = isFeatured ? {
        background: 'linear-gradient(135deg, #4ECDC4, #556FFF)',
        padding: '2px',
        borderRadius: '16px'
    } : {};

    // Blue glow effect for featured card
    const glowStyle = isFeatured ? {
        boxShadow: isHovered
            ? '0 0 60px rgba(78, 205, 196, 0.4)'
            : '0 0 40px rgba(78, 205, 196, 0.4)'
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
                    className="h-full rounded-2xl backdrop-blur-md border border-white/10 overflow-hidden flex flex-col"
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        ...glowStyle
                    }}
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{config.icon}</span>
                                <span className="text-xs font-semibold text-gray-400 uppercase">{source}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isTrending && (
                                    <span className="text-xs bg-gradient-to-r from-pink-500 to-red-500 text-white px-2 py-1 rounded-full font-bold">
                                        🔥 TRENDING
                                    </span>
                                )}
                                {isFeatured && (
                                    <span className="text-xs bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-2 py-1 rounded-full font-bold">
                                        ⭐ FEATURED
                                    </span>
                                )}
                            </div>
                        </div>
                        <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">
                            {headline}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">{timestamp}</p>
                    </div>

                    {/* Bullet Points */}
                    <div className="p-4 flex-1 overflow-hidden">
                        <ul className="space-y-2">
                            {bulletPoints.slice(0, 4).map((point, index) => (
                                <li key={index} className="flex items-start gap-2 text-xs text-gray-300">
                                    <span className="text-cyan-400 mt-0.5">•</span>
                                    <span className="line-clamp-2">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="p-4 space-y-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onReadArticle}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                        >
                            Read Article
                        </motion.button>
                        <div className="flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onGeneratePost}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:shadow-lg transition-all inline-flex items-center justify-center gap-1"
                            >
                                <span>✨</span>
                                <span>Generate Post</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onSave}
                                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20"
                                aria-label="Save article"
                            >
                                <span className="text-lg">🔖</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
