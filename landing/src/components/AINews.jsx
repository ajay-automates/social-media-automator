import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

/**
 * Static mock AI news data (fallback when API fails)
 */
const MOCK_AI_NEWS = [
    {
        id: 1,
        headline: "OpenAI Unveils GPT-5: Revolutionary Multimodal AI Model with Enhanced Reasoning",
        summary: "OpenAI announces GPT-5 with breakthrough capabilities in reasoning, code generation, and multimodal understanding. Early tests show 40% improvement over GPT-4.",
        source: "OpenAI Blog",
        timestamp: "2h ago",
        url: "https://openai.com/blog",
        viralScore: 95,
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop"
    },
    {
        id: 2,
        headline: "Google Gemini Ultra Surpasses Human Performance in MMLU Benchmark",
        summary: "Google's Gemini Ultra achieves 90.0% accuracy on Massive Multitask Language Understanding, setting new industry standards for AI reasoning capabilities.",
        source: "Google AI",
        timestamp: "5h ago",
        url: "https://deepmind.google/technologies/gemini/",
        viralScore: 92,
        image: "https://images.unsplash.com/photo-1676299080923-6f17b22e5c0a?w=1200&h=600&fit=crop"
    },
    {
        id: 3,
        headline: "Apple Intelligence: Revolutionary On-Device AI Coming to iPhone 16",
        summary: "Apple reveals Apple Intelligence, a privacy-first AI system running entirely on-device. New Siri capabilities and AI-powered features announced.",
        source: "Apple Newsroom",
        timestamp: "8h ago",
        url: "https://www.apple.com/newsroom",
        viralScore: 88,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=600&fit=crop"
    },
    {
        id: 4,
        headline: "Anthropic Claude 3.5 Sonnet: Fastest AI Model with Superior Coding Abilities",
        summary: "Anthropic releases Claude 3.5 Sonnet, featuring 2x faster inference and state-of-the-art performance in coding, math, and creative writing tasks.",
        source: "Anthropic",
        timestamp: "12h ago",
        url: "https://www.anthropic.com",
        viralScore: 90,
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop"
    },
    {
        id: 5,
        headline: "Y Combinator Invests $500M in AI Startups: Focus on Agentic AI and Robotics",
        summary: "Y Combinator announces massive AI investment fund, backing 50+ startups building agentic AI systems and autonomous robots for enterprise applications.",
        source: "Y Combinator",
        timestamp: "1d ago",
        url: "https://www.ycombinator.com",
        viralScore: 85,
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=600&fit=crop"
    },
    {
        id: 6,
        headline: "OpenAI Partners with Microsoft: $10B Investment in AI Infrastructure",
        summary: "Microsoft extends partnership with OpenAI, investing $10 billion in cloud infrastructure to support next-generation AI model training and deployment.",
        source: "TechCrunch AI",
        timestamp: "3h ago",
        url: "https://techcrunch.com",
        viralScore: 87,
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=600&fit=crop"
    },
    {
        id: 7,
        headline: "Google DeepMind's AlphaFold 3 Predicts Protein Structures with 95% Accuracy",
        summary: "DeepMind releases AlphaFold 3, revolutionizing drug discovery with unprecedented accuracy in protein structure prediction and molecular interactions.",
        source: "DeepMind Blog",
        timestamp: "6h ago",
        url: "https://deepmind.google",
        viralScore: 91,
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=600&fit=crop"
    },
    {
        id: 8,
        headline: "Apple's M4 Chip: Neural Engine Powers On-Device AI at 38 TOPS",
        summary: "Apple's new M4 chip features upgraded Neural Engine delivering 38 trillion operations per second, enabling real-time AI processing without cloud dependency.",
        source: "Ars Technica AI",
        timestamp: "9h ago",
        url: "https://arstechnica.com",
        viralScore: 86,
        image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=1200&h=600&fit=crop"
    },
    {
        id: 9,
        headline: "Claude AI Now Powers 50,000+ Enterprise Applications",
        summary: "Anthropic reports rapid enterprise adoption of Claude AI, with major companies deploying it for customer service, content generation, and data analysis.",
        source: "VentureBeat AI",
        timestamp: "4h ago",
        url: "https://venturebeat.com",
        viralScore: 83,
        image: "https://images.unsplash.com/photo-1555255707-c07966088b7b?w=1200&h=600&fit=crop"
    },
    {
        id: 10,
        headline: "Y Combinator W24 Batch: 40% of Startups Focus on AI Agents",
        summary: "Y Combinator's Winter 2024 batch sees unprecedented AI focus, with 40% of startups building AI agents for automation, productivity, and enterprise solutions.",
        source: "Y Combinator",
        timestamp: "2d ago",
        url: "https://www.ycombinator.com",
        viralScore: 82,
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=600&fit=crop"
    },
    {
        id: 11,
        headline: "OpenAI's Sora: Text-to-Video AI Generates Hollywood-Quality Content",
        summary: "OpenAI demonstrates Sora's capabilities, generating 60-second video clips from text prompts with remarkable realism and cinematic quality.",
        source: "OpenAI Blog",
        timestamp: "7h ago",
        url: "https://openai.com/research",
        viralScore: 94,
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&h=600&fit=crop"
    },
    {
        id: 12,
        headline: "Google's Gemini Pro Powers Bard: Now Available in 40+ Languages",
        summary: "Google expands Bard's reach with Gemini Pro integration, offering advanced AI capabilities in 40+ languages with improved accuracy and context understanding.",
        source: "Google AI",
        timestamp: "10h ago",
        url: "https://bard.google.com",
        viralScore: 89,
        image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&h=600&fit=crop"
    }
];

/**
 * AINews - Landing page AI News section with Netflix-style hero and scrollable cards
 * Fetches viral AI news from public API endpoint, falls back to mock data
 */
export default function AINews() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [featuredIndex, setFeaturedIndex] = useState(0);
    const autoRotateIntervalRef = useRef(null);
    const [imageErrors, setImageErrors] = useState({});

    // API base URL (adjust based on your backend URL)
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://capable-motivation-production-7a75.up.railway.app';

    useEffect(() => {
        const fetchNews = async () => {
            try {
                setLoading(true);
                console.log('🔍 Fetching AI news from:', `${API_BASE_URL}/api/news/public?limit=12`);
                const response = await fetch(`${API_BASE_URL}/api/news/public?limit=12`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('📰 News API response:', data);

                if (data.success && data.news && data.news.length > 0) {
                    const formattedNews = formatNewsData(data.news);
                    console.log('✅ Formatted news:', formattedNews.length, 'articles');
                    setNews(formattedNews);
                } else {
                    console.warn('⚠️ No news data in response, using mock data');
                    // Use mock data as fallback
                    setNews(MOCK_AI_NEWS);
                }
            } catch (error) {
                console.error('❌ Failed to fetch AI news, using mock data:', error);
                // Use mock data as fallback
                setNews(MOCK_AI_NEWS);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    // Auto-rotate featured article every 8 seconds
    useEffect(() => {
        if (news.length === 0) return;

        const maxFeatured = Math.min(5, news.length);
        autoRotateIntervalRef.current = setInterval(() => {
            setFeaturedIndex((prev) => (prev + 1) % maxFeatured);
        }, 8000);

        return () => {
            if (autoRotateIntervalRef.current) {
                clearInterval(autoRotateIntervalRef.current);
            }
        };
    }, [news]);

    // Format news data
    const formatNewsData = (rawNews) => {
        const allArticles = Array.isArray(rawNews) ? rawNews : Object.values(rawNews).flat();
        
        return allArticles.slice(0, 12).map((article, index) => {
            // If article already has the correct format (from mock data), return as-is
            if (article.headline && article.viralScore !== undefined) {
                return article;
            }
            
            // Otherwise, format from API response
            const date = new Date(article.pubDate || article.timestamp || new Date());
            const diffInHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
            
            let timestamp;
            if (diffInHours < 1) timestamp = 'Just now';
            else if (diffInHours < 24) timestamp = `${diffInHours}h ago`;
            else timestamp = `${Math.floor(diffInHours / 24)}d ago`;

            return {
                id: article.id || index,
                headline: article.title || article.headline || 'AI News Update',
                summary: (article.description || article.summary || '').replace(/<[^>]*>/g, '').substring(0, 150) + '...',
                image: article.image || article.imageUrl || null,
                source: article.source || 'AI News',
                timestamp: article.timestamp || timestamp,
                url: article.url || article.link || '#',
                viralScore: article.viralScore !== undefined ? article.viralScore : calculateViralScore(diffInHours, article.source)
            };
        });
    };

    // Calculate viral score
    const calculateViralScore = (hoursAgo, source) => {
        let score = Math.max(0, 100 - (hoursAgo * 2));
        const trendingSources = ['OpenAI', 'Anthropic', 'Google AI', 'DeepMind', 'TechCrunch'];
        if (trendingSources.some(s => source?.includes(s))) {
            score += 10;
        }
        return Math.min(100, Math.max(0, Math.round(score)));
    };

    // Handle image error
    const handleImageError = (articleId, imageUrl) => {
        if (!imageErrors[articleId]) {
            setImageErrors(prev => ({ ...prev, [articleId]: 'proxy' }));
        } else if (imageErrors[articleId] === 'proxy') {
            setImageErrors(prev => ({ ...prev, [articleId]: 'bing' }));
        }
    };

    // Get image source with fallbacks
    const getImageSrc = (article) => {
        if (!article.image) {
            return `https://tse1.mm.bing.net/th?q=${encodeURIComponent(article.headline + ' AI news')}&w=1200&h=600&c=7&rs=1&p=0`;
        }
        
        if (imageErrors[article.id] === 'proxy') {
            return `https://wsrv.nl/?url=${encodeURIComponent(article.image)}&w=1200&h=600&fit=cover`;
        }
        
        if (imageErrors[article.id] === 'bing') {
            return `https://tse1.mm.bing.net/th?q=${encodeURIComponent(article.headline + ' AI news')}&w=1200&h=600&c=7&rs=1&p=0`;
        }
        
        return article.image;
    };

    const featuredArticle = news.length > 0 ? news[featuredIndex] : null;
    const remainingNews = news.length > 0 ? news.filter((_, idx) => idx !== featuredIndex).slice(0, 8) : [];
    
    // Debug: Log component state
    console.log('🔍 AINews Component State:', { 
        loading, 
        newsCount: news.length, 
        featuredIndex, 
        hasFeatured: !!featuredArticle,
        API_BASE_URL 
    });

    return (
        <section className="relative py-20 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
            
            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                        📰 Viral AI News
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Stay updated with the latest AI breakthroughs, trends, and insights
                    </p>
                </motion.div>

                {/* Loading State */}
                {loading && (
                    <div className="animate-pulse mb-12">
                        <div className="h-96 bg-white/5 rounded-2xl"></div>
                    </div>
                )}

                {/* Featured Hero Section */}
                {!loading && featuredArticle && (
                    <div className="relative mb-12" style={{ minHeight: '400px' }}>
                        <AnimatePresence initial={false} mode="wait">
                            <motion.div
                                key={`featured-${featuredIndex}-${featuredArticle.headline?.substring(0, 20)}`}
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.03 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full"
                            >
                                <div className="relative w-full rounded-2xl overflow-hidden backdrop-blur-md border border-white/20 hover:border-white/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                                        minHeight: '350px'
                                    }}
                                >
                                    {/* Background Image */}
                                    <div className="absolute inset-0">
                                        <img
                                            src={getImageSrc(featuredArticle)}
                                            alt={featuredArticle.headline}
                                            className="w-full h-full object-cover"
                                            onError={() => handleImageError(featuredArticle.id, featuredArticle.image)}
                                            crossOrigin="anonymous"
                                            referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
                                    </div>

                                    {/* Content */}
                                    <div className="relative z-10 p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[350px]">
                                        {/* Image */}
                                        <div className="lg:w-[60%] flex-shrink-0">
                                            <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] rounded-xl overflow-hidden border border-white/20">
                                                <img
                                                    src={getImageSrc(featuredArticle)}
                                                    alt={featuredArticle.headline}
                                                    className="w-full h-full object-cover"
                                                    onError={() => handleImageError(featuredArticle.id, featuredArticle.image)}
                                                    crossOrigin="anonymous"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="lg:w-[40%] flex flex-col justify-between flex-grow">
                                            <div className="flex items-start justify-between mb-4">
                                                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold shadow-lg">
                                                    TRENDING
                                                </span>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/20">
                                                    <span className="text-cyan-400 text-sm font-bold">{featuredArticle.viralScore}</span>
                                                    <span className="text-gray-400 text-xs">/100</span>
                                                </div>
                                            </div>

                                            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight line-clamp-3">
                                                {featuredArticle.headline}
                                            </h3>

                                            <p className="text-gray-300 text-sm md:text-base mb-4 line-clamp-2 flex-grow">
                                                {featuredArticle.summary}
                                            </p>

                                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
                                                <span className="font-medium text-white">{featuredArticle.source}</span>
                                                <span>•</span>
                                                <span>{featuredArticle.timestamp}</span>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <a
                                                    href={featuredArticle.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all border border-white/30 hover:border-white/50 backdrop-blur-sm text-center"
                                                >
                                                    Read Article
                                                </a>
                                                <Link
                                                    to="/"
                                                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium transition-all shadow-lg hover:shadow-purple-500/50 text-center"
                                                >
                                                    Try Free
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Arrows */}
                        {news.length > 1 && (
                            <>
                                <button
                                    onClick={() => {
                                        const maxFeatured = Math.min(5, news.length);
                                        setFeaturedIndex((prev) => (prev - 1 + maxFeatured) % maxFeatured);
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => {
                                        const maxFeatured = Math.min(5, news.length);
                                        setFeaturedIndex((prev) => (prev + 1) % maxFeatured);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}

                        {/* Dots Indicator */}
                        {news.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                                {Array.from({ length: Math.min(5, news.length) }).map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setFeaturedIndex(idx)}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                            idx === featuredIndex
                                                ? 'bg-white w-6'
                                                : 'bg-white/40 hover:bg-white/60'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* More Trending News Cards */}
                {remainingNews.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h3 className="text-2xl font-bold text-white mb-6">More Trending AI News</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
                            {remainingNews.map((article) => (
                                <motion.div
                                    key={article.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4 }}
                                    whileHover={{ y: -4 }}
                                    className="rounded-xl backdrop-blur-md border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/30 cursor-pointer flex-shrink-0"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                                        minHeight: '400px'
                                    }}
                                >
                                    {/* Image */}
                                    <div className="relative h-[200px] w-full overflow-hidden bg-gray-800">
                                        <img
                                            src={getImageSrc(article)}
                                            alt={article.headline}
                                            className="w-full h-full object-cover"
                                            onError={() => handleImageError(article.id, article.image)}
                                            crossOrigin="anonymous"
                                            referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg">
                                                TRENDING
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h4 className="text-white text-lg font-bold leading-tight mb-3 line-clamp-2">
                                            {article.headline}
                                        </h4>
                                        <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
                                            {article.summary}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                                            <span>{article.source}</span>
                                            <span>{article.timestamp}</span>
                                        </div>
                                        <a
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-sm font-medium transition-all text-center"
                                        >
                                            Read More
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
}

