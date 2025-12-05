import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * TrendingCard - Netflix-style flat card with no 3D effects
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
    // Platform icons and colors
    const platformConfig = {
        twitter: { icon: '𝕏', color: '#1DA1F2', name: 'Twitter' },
        reddit: { icon: '🔴', color: '#FF4500', name: 'Reddit' },
        tiktok: { icon: '🎵', color: '#000000', name: 'TikTok' }
    };

    const config = platformConfig[platform] || platformConfig.twitter;

    return (
        <div className="flex-shrink-0 w-[280px] h-[360px]">
            {/* Card content - Netflix style: flat, clean, minimal */}
            <div
                className="h-full rounded-lg backdrop-blur-md border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/30"
                style={{
                    background: 'rgba(255, 255, 255, 0.05)'
                }}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{config.icon}</span>
                            <span className="text-xs font-semibold text-gray-400 uppercase">{config.name}</span>
                        </div>
                        {isFeatured && (
                            <span className="text-xs bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded font-bold">
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
                    <button
                        onClick={onViewPost}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    >
                        View Post
                    </button>
                    <button
                        onClick={onSave}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20"
                        aria-label="Save post"
                    >
                        <span className="text-lg">🔖</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
