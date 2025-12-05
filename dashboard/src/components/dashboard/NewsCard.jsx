import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * NewsCard - Netflix-style flat card with no 3D effects
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
    // Source icons and colors
    const sourceConfig = {
        'OpenAI': { icon: '🤖', color: '#10A37F' },
        'Anthropic': { icon: '🧠', color: '#D97757' },
        'Google': { icon: '🔍', color: '#4285F4' },
        'Microsoft': { icon: '🪟', color: '#00A4EF' },
        'Meta': { icon: '📘', color: '#0668E1' }
    };

    const config = sourceConfig[source] || { icon: '📰', color: '#6366F1' };

    return (
        <div className="flex-shrink-0 w-[280px] h-[360px]">
            {/* Card content - Netflix style: flat, clean, minimal */}
            <div
                className="h-full rounded-lg backdrop-blur-md border border-white/10 overflow-hidden flex flex-col transition-all duration-300 hover:border-white/30"
                style={{
                    background: 'rgba(255, 255, 255, 0.05)'
                }}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{config.icon}</span>
                            <span className="text-xs font-semibold text-gray-400 uppercase">{source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {isTrending && (
                                <span className="text-xs bg-gradient-to-r from-pink-500 to-red-500 text-white px-2 py-1 rounded font-bold">
                                    🔥 TRENDING
                                </span>
                            )}
                            {isFeatured && (
                                <span className="text-xs bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-2 py-1 rounded font-bold">
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
                    <button
                        onClick={onReadArticle}
                        className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    >
                        Read Article
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onGeneratePost}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all inline-flex items-center justify-center gap-1"
                        >
                            <span>✨</span>
                            <span>Generate Post</span>
                        </button>
                        <button
                            onClick={onSave}
                            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20"
                            aria-label="Save article"
                        >
                            <span className="text-lg">🔖</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
