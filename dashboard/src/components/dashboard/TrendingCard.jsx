import { motion } from 'framer-motion';
import { useState } from 'react';

/**
 * TrendingCard - Rich, detailed viral post card
 * Displays full post context, engagement metrics, viral score, and top reply
 */
export default function TrendingCard({
    platform = 'twitter',
    author = 'Unknown',
    timestamp = '2h ago',
    content = 'This is a trending post...',
    image = null,
    engagement = { likes: 0, retweets: 0, comments: 0, views: 0 },
    viralScore = 0,
    topReply = null,
    hashtags = [],
    url = '#',
    isFeatured = false,
    isBreaking = false,
    position = 'center',
    onViewPost = () => { },
    onGeneratePost = () => { },
    onSave = () => { }
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Platform icons and colors
    const platformConfig = {
        twitter: { icon: '𝕏', color: '#1DA1F2', name: 'Twitter' },
        reddit: { icon: '🔴', color: '#FF4500', name: 'Reddit' },
        tiktok: { icon: '🎵', color: '#000000', name: 'TikTok' },
        linkedin: { icon: '💼', color: '#0A66C2', name: 'LinkedIn' }
    };

    const config = platformConfig[platform] || platformConfig.twitter;

    // Get platform gradient for fallback
    const getPlatformGradient = () => {
        const gradients = {
            twitter: 'from-blue-500 to-cyan-600',
            reddit: 'from-orange-500 to-red-600',
            tiktok: 'from-pink-500 to-purple-600',
            linkedin: 'from-blue-600 to-indigo-700'
        };
        return gradients[platform] || gradients.twitter;
    };

    // Format large numbers
    const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // Get viral score color
    const getScoreColor = (score) => {
        if (score >= 9) return 'from-red-500 to-orange-500';
        if (score >= 7) return 'from-orange-500 to-yellow-500';
        if (score >= 5) return 'from-yellow-500 to-green-500';
        return 'from-green-500 to-blue-500';
    };

    // Get badge glow color
    const getBadgeGlow = () => {
        if (isBreaking) return 'shadow-[0_0_20px_rgba(239,68,68,0.5)]';
        if (viralScore >= 9) return 'shadow-[0_0_20px_rgba(249,115,22,0.5)]';
        if (viralScore >= 7) return 'shadow-[0_0_20px_rgba(234,179,8,0.5)]';
        return '';
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
        onSave();
    };

    return (
        <div className="flex-shrink-0 w-[380px]">
            {/* Card content - Rich, detailed design */}
            <motion.div
                whileHover={{ y: -4 }}
                className={`rounded-xl backdrop-blur-md border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/30 ${getBadgeGlow()}`}
                style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    minHeight: '650px'
                }}
            >
                {/* Header with badges */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {isBreaking && (
                                <span className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full font-bold animate-pulse">
                                    ⚡ BREAKING
                                </span>
                            )}
                            {!isBreaking && viralScore >= 9 && (
                                <span className="text-xs bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-full font-bold">
                                    🔥 VIRAL
                                </span>
                            )}
                            {isFeatured && (
                                <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full font-bold">
                                    ⭐ FEATURED
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleSave}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                            aria-label="Save post"
                        >
                            <span className="text-lg">{isSaved ? '📌' : '🔖'}</span>
                        </button>
                    </div>

                    {/* Platform + Author + Time */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-xl">{config.icon}</span>
                        <span className="font-semibold text-gray-300">{config.name}</span>
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-400">@{author}</span>
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-400">{timestamp}</span>
                    </div>
                </div>

                {/* Image Section (if available) */}
                {image && (
                    <div className="relative h-[200px] w-full overflow-hidden">
                        <img
                            src={image}
                            alt="Post visual"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback to gradient if image fails to load
                                e.target.style.display = 'none';
                                e.target.parentElement.classList.add('bg-gradient-to-br', ...getPlatformGradient().split(' '));
                                const fallbackIcon = document.createElement('div');
                                fallbackIcon.className = 'w-full h-full flex items-center justify-center';
                                fallbackIcon.innerHTML = `<span class="text-8xl opacity-30">${config.icon}</span>`;
                                e.target.parentElement.appendChild(fallbackIcon);
                            }}
                        />
                    </div>
                )}

                {/* Post Content */}
                <div className="p-4">
                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">
                        {content}
                    </p>
                </div>

                {/* Engagement Metrics */}
                <div className="px-4 pb-3">
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-pink-400">
                                <span>💬</span>
                                <span className="font-semibold">{formatNumber(engagement.comments)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-green-400">
                                <span>🔁</span>
                                <span className="font-semibold">{formatNumber(engagement.retweets)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-red-400">
                                <span>❤️</span>
                                <span className="font-semibold">{formatNumber(engagement.likes)}</span>
                            </div>
                        </div>
                        {engagement.views > 0 && (
                            <div className="text-center text-gray-400 text-xs mt-2">
                                👁️ {formatNumber(engagement.views)} views
                            </div>
                        )}
                    </div>
                </div>

                {/* Viral Score & Top Reply */}
                <div className="px-4 pb-3 space-y-2">
                    {viralScore > 0 && (
                        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">🔥 Viral Score:</span>
                                <span className={`text-sm font-bold bg-gradient-to-r ${getScoreColor(viralScore)} bg-clip-text text-transparent`}>
                                    {viralScore.toFixed(1)}/10
                                </span>
                            </div>
                        </div>
                    )}

                    {topReply && (
                        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <div className="text-xs text-gray-400 mb-1">💭 Top reply:</div>
                            <div className="text-xs text-gray-300 line-clamp-2">"{topReply}"</div>
                        </div>
                    )}
                </div>

                {/* Hashtags */}
                {hashtags && hashtags.length > 0 && (
                    <div className="px-4 pb-3">
                        <div className="flex flex-wrap gap-2">
                            {hashtags.slice(0, 4).map((tag, index) => (
                                <span
                                    key={index}
                                    className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="p-4 flex gap-2 border-t border-white/10">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (url && url !== '#') {
                                window.open(url, '_blank');
                            } else {
                                onViewPost();
                            }
                        }}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all inline-flex items-center justify-center gap-2"
                    >
                        <span>🔗</span>
                        <span>View Post</span>
                    </button>
                    <button
                        onClick={onGeneratePost}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all inline-flex items-center justify-center gap-2"
                    >
                        <span>✨</span>
                        <span>Create Post</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
