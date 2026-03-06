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
            'OpenAI': '',
            'Google': 'bg-[#22d3ee]',
            'Meta': 'bg-[#22d3ee]',
            'Anthropic': '',
            'DeepMind': '',
            'TechCrunch': '',
            'default': 'bg-[#22d3ee]'
        };
        return gradients[source] || gradients.default;
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
        if (onSave) onSave();
    };

    const getBadges = () => {
        const badges = [];
        if (isBreaking) badges.push({ text: 'BREAKING', color: '' });
        if (isTrending) badges.push({ text: 'TRENDING', color: '' });
        if (isFeatured) badges.push({ text: 'FEATURED', color: '' });
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
                className={`rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer ${isSelected
                        ? 'border-[#22d3ee] ring-2 ring-cyan-500/50 shadow-cyan-500/20 scale-[1.02]'
                        : 'border-white/[0.06] hover:border-white/30'
                    }`}
                style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    minHeight: '480px'
                }}
                onClick={handleCardClick}
            >
                {/* Image or Gradient Header */}
                <div className={`relative h-[220px] w-full overflow-hidden ${displayMode === 'error' ? `bg-[#111113] ${getSourceGradient()}` : 'bg-[#111113]'}`}>

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
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#22d3ee] border-[#22d3ee]' : 'bg-black/40 border-white/60'
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
                                    className={`px-2 py-1 rounded-md text-[10px] font-bold bg-[#22d3ee] ${badge.color} text-white`}
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
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition-colors"
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
                    <p className="text-[#a1a1aa] text-sm leading-relaxed mb-4 line-clamp-3">
                        {summary}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                                <span className="text-[#22d3ee]">🔗</span>
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
                            className="flex-1 px-4 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#18181b] text-white text-sm font-medium transition-colors border border-white/[0.06]"
                        >
                            Read Article
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onGeneratePost) onGeneratePost();
                            }}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-[#22d3ee] text-white text-sm font-medium transition-all"
                        >
                            Generate Post
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
