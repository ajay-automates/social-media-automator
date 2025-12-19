import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function NewsCard({
    headline,
    summary,
    image,
    source,
    timestamp,
    sourceCount = 1,
    url,
    isBreaking = false,
    isTrending = false,
    isFeatured = false,
    position = 'center',
    onReadArticle,
    onGeneratePost,
    onSave,
    isSelected = false,
    onToggleSelect,
    isSelectionMode = false
}) {
    const [isSaved, setIsSaved] = useState(false);

    // Fallback URLs
    // 1. Proxy (bypasses CORS/Referrer blocks)
    const proxyUrl = image ? `https://wsrv.nl/?url=${encodeURIComponent(image)}&w=800&h=450&fit=cover` : null;
    // 2. Bing Search (Fallback if proxy fails or no image provided)
    const bingFallbackUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent(headline + ' ' + (source || '') + ' AI news')}&w=800&h=450&c=7&rs=1&p=0`;

    // State to track image display mode
    // 'initial' = try prop image directly
    // 'proxy' = try via wsrv.nl proxy
    // 'bing' = try bing image search
    // 'error' = show gradient
    const [displayMode, setDisplayMode] = useState('initial');
    const [currentSrc, setCurrentSrc] = useState(image || bingFallbackUrl);

    useEffect(() => {
        // Reset state when props change
        if (image) {
            setDisplayMode('initial');
            setCurrentSrc(image);
        } else {
            setDisplayMode('bing');
            setCurrentSrc(bingFallbackUrl);
        }
    }, [image, headline, source]);

    const handleError = () => {
        if (displayMode === 'initial' && proxyUrl) {
            // Main image failed, try proxy
            // console.log('Main image failed, trying proxy...');
            setDisplayMode('proxy');
            setCurrentSrc(proxyUrl);
        } else if (displayMode === 'initial' || displayMode === 'proxy') {
            // Proxy failed (or didn't exist), try Bing
            // console.log('Proxy failed, trying Bing...');
            setDisplayMode('bing');
            setCurrentSrc(bingFallbackUrl);
        } else {
            // Bing failed, show gradient
            // console.log('Bing failed, showing gradient.');
            setDisplayMode('error');
        }
    };

    // Generate gradient based on source
    const getSourceGradient = () => {
        const gradients = {
            'OpenAI': 'from-emerald-500 to-teal-600',
            'Google': 'from-blue-500 to-indigo-600',
            'Meta': 'from-purple-500 to-pink-600',
            'Anthropic': 'from-orange-500 to-red-600',
            'DeepMind': 'from-cyan-500 to-blue-600',
            'TechCrunch': 'from-green-500 to-emerald-600',
            'default': 'from-blue-600 to-violet-800'
        };
        return gradients[source] || gradients.default;
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
        if (onSave) onSave();
    };

    const getBadges = () => {
        const badges = [];
        if (isBreaking) badges.push({ text: 'BREAKING', color: 'from-red-500 to-pink-500' });
        if (isTrending) badges.push({ text: 'TRENDING', color: 'from-pink-500 to-purple-500' });
        if (isFeatured) badges.push({ text: 'FEATURED', color: 'from-cyan-500 to-blue-500' });
        return badges;
    };

    const handleCardClick = () => {
        if (isSelectionMode || isSelected) {
            if (onToggleSelect) onToggleSelect();
        } else if (url && url !== '#') {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="flex-shrink-0 w-[380px]">
            <motion.div
                whileHover={{ y: -4 }}
                // Use isSelected prop to conditionally add border
                className={`rounded-xl backdrop-blur-md border overflow-hidden transition-all duration-300 cursor-pointer ${isSelected
                        ? 'border-cyan-500 ring-2 ring-cyan-500/50 shadow-cyan-500/20 shadow-lg scale-[1.02]'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    minHeight: '480px'
                }}
                onClick={handleCardClick}
            >
                {/* Image or Gradient Header */}
                <div className={`relative h-[220px] w-full overflow-hidden ${displayMode === 'error' ? `bg-gradient-to-br ${getSourceGradient()}` : 'bg-gray-900'}`}>

                    {displayMode !== 'error' ? (
                        <img
                            key={currentSrc} // Critical: Force re-render when src changes
                            src={currentSrc}
                            alt={headline}
                            className="w-full h-full object-cover"
                            onError={handleError}
                            crossOrigin="anonymous" // Try to request correctly
                            referrerPolicy="no-referrer"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-8xl opacity-30">
                                {source === 'OpenAI' && '🤖'}
                                {source === 'Google' && '🔍'}
                                {source === 'Meta' && '👥'}
                                {source === 'Anthropic' && '🧠'}
                                {source === 'DeepMind' && '🎯'}
                                {source === 'TechCrunch' && '📱'}
                                {!['OpenAI', 'Google', 'Meta', 'Anthropic', 'DeepMind', 'TechCrunch'].includes(source) && '📰'}
                            </span>
                        </div>
                    )}

                    {/* Selection Overlay Checkbox */}
                    {(isSelectionMode || isSelected) && (
                        <div className="absolute top-3 right-12 z-20">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'bg-black/40 border-white/60'
                                }`}>
                                {isSelected && <span className="text-white font-bold">✓</span>}
                            </div>
                        </div>
                    )}

                    {/* Badges overlay */}
                    {getBadges().length > 0 && (
                        <div className="absolute top-3 left-3 flex gap-2">
                            {getBadges().map((badge, idx) => (
                                <span
                                    key={idx}
                                    className={`px-2 py-1 rounded-md text-[10px] font-bold bg-gradient-to-r ${badge.color} text-white shadow-lg`}
                                >
                                    {badge.text}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Save button overlay (kept for individual interaction) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSave();
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                    >
                        <span className="text-lg">{isSaved ? '📌' : '🔖'}</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Headline */}
                    <h3 className="text-white text-lg font-bold leading-tight mb-3 line-clamp-2">
                        {headline}
                    </h3>

                    {/* Summary */}
                    <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
                        {summary}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                                <span className="text-blue-400">🔗</span>
                                <span className="font-medium">{sourceCount} sources</span>
                            </span>
                            <span>•</span>
                            <span>{timestamp}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (url && url !== '#') {
                                    window.open(url, '_blank');
                                } else if (onReadArticle) {
                                    onReadArticle();
                                }
                            }}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors border border-gray-700"
                        >
                            Read Article
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onGeneratePost) onGeneratePost();
                            }}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
                        >
                            Generate Post
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
