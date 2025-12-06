import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * NewsCard - Newsletter-style AI news card
 * Displays TL;DR, key updates, analysis, stats, and related articles
 */
export default function NewsCard({
    headline = 'AI News Headline',
    source = 'OpenAI',
    author = null,
    timestamp = '2h ago',
    tldr = null,
    bulletPoints = [],
    analysis = null,
    stats = null,
    relatedArticles = [],
    url = '#',
    readTime = null,
    difficulty = null,
    isTrending = false,
    isBreaking = false,
    isFeatured = false,
    position = 'center',
    onReadArticle = () => { },
    onGeneratePost = () => { },
    onSave = () => { }
}) {
    const [expandedSections, setExpandedSections] = useState({
        keyUpdates: true,
        analysis: true,
        stats: true
    });
    const [isSaved, setIsSaved] = useState(false);

    // Source icons and colors
    const sourceConfig = {
        'OpenAI': { icon: '🤖', color: '#10A37F' },
        'Anthropic': { icon: '🧠', color: '#D97757' },
        'Google': { icon: '🔍', color: '#4285F4' },
        'Microsoft': { icon: '🪟', color: '#00A4EF' },
        'Meta': { icon: '📘', color: '#0668E1' },
        'DeepMind': { icon: '🔬', color: '#4285F4' },
        'TechCrunch': { icon: '📰', color: '#0A9928' }
    };

    const config = sourceConfig[source] || { icon: '📰', color: '#6366F1' };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
        onSave();
    };

    // Get badge glow color
    const getBadgeGlow = () => {
        if (isBreaking) return 'shadow-[0_0_20px_rgba(239,68,68,0.5)]';
        if (isTrending) return 'shadow-[0_0_20px_rgba(236,72,153,0.5)]';
        return '';
    };

    return (
        <div className="flex-shrink-0 w-[400px]">
            {/* Card content - Newsletter-style design */}
            <motion.div
                whileHover={{ y: -4 }}
                className={`rounded-xl backdrop-blur-md border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/30 ${getBadgeGlow()}`}
                style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    minHeight: '750px'
                }}
            >
                {/* Header with badges */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            {isBreaking && (
                                <span className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full font-bold animate-pulse">
                                    ⚡ BREAKING
                                </span>
                            )}
                            {isTrending && (
                                <span className="text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-1 rounded-full font-bold">
                                    🔥 TRENDING
                                </span>
                            )}
                            {isFeatured && (
                                <span className="text-xs bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-2 py-1 rounded-full font-bold">
                                    ⭐ FEATURED
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleSave}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                            aria-label="Save article"
                        >
                            <span className="text-lg">{isSaved ? '📌' : '🔖'}</span>
                        </button>
                    </div>

                    {/* Headline */}
                    <h3 className="text-white font-bold text-base leading-tight mb-3 line-clamp-2">
                        {headline}
                    </h3>

                    {/* Source + Author + Time */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                        <div className="flex items-center gap-1">
                            <span className="text-base">{config.icon}</span>
                            <span className="font-semibold">{source}</span>
                        </div>
                        <span>·</span>
                        <span>{timestamp}</span>
                        {author && (
                            <>
                                <span>·</span>
                                <span>✍️ By {author}</span>
                            </>
                        )}
                        {readTime && (
                            <>
                                <span>·</span>
                                <span>📖 {readTime} min read</span>
                            </>
                        )}
                    </div>
                </div>

                {/* TL;DR */}
                {tldr && (
                    <div className="p-4 border-b border-white/10">
                        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
                            <div className="text-xs font-bold text-blue-300 mb-2">🎯 TL;DR:</div>
                            <div className="text-sm text-gray-200 leading-relaxed">{tldr}</div>
                        </div>
                    </div>
                )}

                {/* Key Updates */}
                {bulletPoints && bulletPoints.length > 0 && (
                    <div className="p-4 border-b border-white/10">
                        <button
                            onClick={() => toggleSection('keyUpdates')}
                            className="flex items-center justify-between w-full text-left mb-2 hover:text-white transition-colors"
                        >
                            <span className="text-xs font-bold text-gray-300">📋 Key Updates:</span>
                            <span className="text-gray-400">{expandedSections.keyUpdates ? '▲' : '▼'}</span>
                        </button>
                        {expandedSections.keyUpdates && (
                            <ul className="space-y-2 mt-2">
                                {bulletPoints.map((point, index) => (
                                    <li key={index} className="flex items-start gap-2 text-xs text-gray-300">
                                        <span className="text-cyan-400 mt-0.5">•</span>
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Analysis */}
                {analysis && (
                    <div className="p-4 border-b border-white/10">
                        <button
                            onClick={() => toggleSection('analysis')}
                            className="flex items-center justify-between w-full text-left mb-2 hover:text-white transition-colors"
                        >
                            <span className="text-xs font-bold text-gray-300">💭 What This Means:</span>
                            <span className="text-gray-400">{expandedSections.analysis ? '▲' : '▼'}</span>
                        </button>
                        {expandedSections.analysis && (
                            <div className="rounded-lg bg-white/5 border border-white/10 p-3 mt-2">
                                <p className="text-xs text-gray-300 leading-relaxed">{analysis}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* By The Numbers */}
                {stats && stats.length > 0 && (
                    <div className="p-4 border-b border-white/10">
                        <button
                            onClick={() => toggleSection('stats')}
                            className="flex items-center justify-between w-full text-left mb-2 hover:text-white transition-colors"
                        >
                            <span className="text-xs font-bold text-gray-300">🔢 By The Numbers:</span>
                            <span className="text-gray-400">{expandedSections.stats ? '▲' : '▼'}</span>
                        </button>
                        {expandedSections.stats && (
                            <ul className="space-y-2 mt-2">
                                {stats.map((stat, index) => (
                                    <li key={index} className="flex items-start gap-2 text-xs text-gray-300">
                                        <span className="text-green-400 mt-0.5">•</span>
                                        <span>{stat}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Related Articles */}
                {relatedArticles && relatedArticles.length > 0 && (
                    <div className="p-4 border-b border-white/10">
                        <div className="text-xs font-bold text-gray-300 mb-2">🔗 Related:</div>
                        <div className="space-y-1.5">
                            {relatedArticles.slice(0, 3).map((article, index) => (
                                <a
                                    key={index}
                                    href={article.url || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    • {article.title} →
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="p-4 space-y-2">
                    <button
                        onClick={onReadArticle}
                        className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all inline-flex items-center justify-center gap-2"
                    >
                        <span>📖</span>
                        <span>Read Article</span>
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onGeneratePost}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all inline-flex items-center justify-center gap-1"
                        >
                            <span>✨</span>
                            <span>Generate Post</span>
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20"
                            aria-label="Save article"
                        >
                            <span className="text-base">{isSaved ? '📌' : '💾'}</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
