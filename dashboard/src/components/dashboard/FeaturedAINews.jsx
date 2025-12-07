import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FeaturedAINews - Netflix-style hero section for featured AI news article
 * 
 * Props:
 * - article: Featured article object { headline, summary, image, source, timestamp, url, viralScore }
 * - onReadArticle: Callback when "Read Article" clicked
 * - onGeneratePost: Callback when "Generate Post" clicked
 * - autoRotate: Auto-rotate every N seconds (default: 8)
 * - showNavigation: Show left/right arrows (default: true)
 */
export default function FeaturedAINews({ 
    article, 
    onReadArticle, 
    onGeneratePost,
    autoRotate = 8000,
    showNavigation = true
}) {
    const [imageError, setImageError] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);

    // Handle image loading with fallbacks
    useEffect(() => {
        if (!article?.image) {
            // Generate Bing fallback image
            const bingUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent((article?.headline || '') + ' AI news')}&w=1200&h=600&c=7&rs=1&p=0`;
            setImageSrc(bingUrl);
            setImageError(false);
            return;
        }

        // Try original image first
        setImageSrc(article.image);
        setImageError(false);
    }, [article?.image, article?.headline]);

    const handleImageError = () => {
        if (!imageError) {
            // Try proxy
            const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(article?.image || '')}&w=1200&h=600&fit=cover`;
            setImageSrc(proxyUrl);
            setImageError(true);
        } else {
            // Fallback to Bing
            const bingUrl = `https://tse1.mm.bing.net/th?q=${encodeURIComponent((article?.headline || '') + ' AI news')}&w=1200&h=600&c=7&rs=1&p=0`;
            setImageSrc(bingUrl);
        }
    };

    if (!article) return null;

    // Calculate viral score (0-100) - simple heuristic based on recency and source
    const calculateViralScore = () => {
        if (article.viralScore !== undefined) return article.viralScore;
        
        // Base score from timestamp (more recent = higher score)
        const hoursAgo = article.timestamp?.includes('h') 
            ? parseInt(article.timestamp) || 24 
            : article.timestamp?.includes('d') 
                ? parseInt(article.timestamp) * 24 || 48
                : 0;
        
        let score = Math.max(0, 100 - (hoursAgo * 2)); // Decrease 2 points per hour
        
        // Boost for trending sources
        const trendingSources = ['OpenAI', 'Anthropic', 'Google AI', 'DeepMind', 'TechCrunch'];
        if (trendingSources.some(s => article.source?.includes(s))) {
            score += 10;
        }
        
        return Math.min(100, Math.max(0, Math.round(score)));
    };

    const viralScore = calculateViralScore();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative w-full mb-8 group"
        >
            {/* Featured Hero Card */}
            <motion.div
                className="relative w-full rounded-2xl overflow-hidden backdrop-blur-md border border-white/20 transition-all duration-300 hover:border-white/30 hover:shadow-2xl hover:shadow-purple-500/20"
                style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    minHeight: '350px'
                }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3 }}
            >
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt={article.headline}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
                    )}
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
                </div>

                {/* Content Container */}
                <div className="relative z-10 p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[350px]">
                    {/* Left: Image (60% on desktop, full width on mobile) */}
                    <div className="lg:w-[60%] flex-shrink-0">
                        <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] rounded-xl overflow-hidden border border-white/20">
                            {imageSrc ? (
                                <img
                                    src={imageSrc}
                                    alt={article.headline}
                                    className="w-full h-full object-cover"
                                    onError={handleImageError}
                                    crossOrigin="anonymous"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
                                    <span className="text-6xl opacity-50">🤖</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Content (40% on desktop, full width on mobile) */}
                    <div className="lg:w-[40%] flex flex-col justify-between flex-grow">
                        {/* Top: Badges */}
                        <div className="flex items-start justify-between mb-4">
                            <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold shadow-lg">
                                TRENDING
                            </span>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/20">
                                <span className="text-cyan-400 text-sm font-bold">{viralScore}</span>
                                <span className="text-gray-400 text-xs">/100</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight line-clamp-3">
                            {article.headline}
                        </h2>

                        {/* Summary */}
                        <p className="text-gray-300 text-sm md:text-base mb-4 line-clamp-2 flex-grow">
                            {article.summary || article.bulletPoints?.[0] || 'Latest AI news update'}
                        </p>

                        {/* Source & Timestamp */}
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
                            <span className="font-medium text-white">{article.source}</span>
                            <span>•</span>
                            <span>{article.timestamp || 'Just now'}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={onReadArticle}
                                className="flex-1 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all border border-white/30 hover:border-white/50 backdrop-blur-sm"
                            >
                                Read Article
                            </button>
                            <button
                                onClick={onGeneratePost}
                                className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium transition-all shadow-lg hover:shadow-purple-500/50"
                            >
                                Generate Post
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

