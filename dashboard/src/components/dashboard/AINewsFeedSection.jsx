import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Changed path
import OverlappingCardCarousel from './OverlappingCardCarousel';
import NewsCard from './NewsCard';
import FeaturedAINews from './FeaturedAINews';
import GeneratePostPreview from './GeneratePostPreview';
import BulkScheduleModal from './BulkScheduleModal'; // Added import
import { useToast } from '../../context/ToastContext'; // Changed import

/**
 * AINewsFeedSection - Container for AI news with overlapping card layout
 * 
 * Props:
 * - news: array of AI news objects (optional override)
 * - loading: boolean (optional override)
 */
export default function AINewsFeedSection({ news: initialNews, loading: initialLoading }) {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // Force re-render on refresh
    const { showSuccess, showError, celebrateSuccess } = useToast(); // Initialized useToast

    // Featured Article State (Netflix-style hero)
    const [featuredIndex, setFeaturedIndex] = useState(0);
    const autoRotateIntervalRef = useRef(null);

    // Preview Modal State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [connectedPlatforms, setConnectedPlatforms] = useState([]);
    // Selection State
    const [selectedArticles, setSelectedArticles] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    // Bulk Modal State
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false); // Added state

    // Fetch connected accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await api.get('/accounts');
                if (response.data && response.data.accounts) {
                    const platforms = response.data.accounts.map(acc => acc.platform);
                    setConnectedPlatforms([...new Set(platforms)]); // Unique platforms
                }
            } catch (error) {
                console.error('Failed to fetch connected accounts:', error);
            }
        };
        fetchAccounts();
    }, []);

    // Formatting Logic
    const formatNewsData = (rawNews) => {
        // Flatten the categorized news object
        let allArticles = [];
        if (Array.isArray(rawNews)) {
            allArticles = rawNews;
        } else {
            Object.values(rawNews).forEach(category => {
                if (category.articles && Array.isArray(category.articles)) {
                    allArticles = [...allArticles, ...category.articles];
                }
            });
        }

        // Sort by recency
        allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        // Deduplicate by title
        const uniqueArticles = Array.from(new Map(allArticles.map(item => [item.title, item])).values());

        // Map to component format
        return uniqueArticles.slice(0, 20).map((article, index) => {
            // Calculate relative time safely
            let date = new Date(article.pubDate || article.timestamp || new Date());
            if (isNaN(date.getTime())) date = new Date();

            const now = new Date();
            const diffInMs = now - date;
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

            let timestamp;
            if (diffInHours < 1) {
                timestamp = 'Just now';
            } else if (diffInHours < 24) {
                timestamp = `${diffInHours}h ago`;
            } else {
                timestamp = `${Math.floor(diffInHours / 24)}d ago`;
            }

            // format description as bullet points (simple split by sentences)
            const description = article.description || '';
            // Remove HTML tags if any
            const cleanDesc = description.replace(/<[^>]*>?/gm, '');
            // Split into "points" effectively just using the summary as one point if short, or splitting if long
            const bulletPoints = cleanDesc.length > 100
                ? [cleanDesc.substring(0, 150) + '...']
                : [cleanDesc];

            // Ensure we rely on 'url' property, fallback to 'link'
            const articleUrl = article.url || article.link;

            return {
                id: index,
                headline: article.title,
                summary: bulletPoints[0], // Use first bullet point as summary
                image: article.image || article.imageUrl || null,
                source: article.source || 'AI News',
                timestamp: timestamp,
                sourceCount: 1,
                bulletPoints: bulletPoints,
                isTrending: index < 3, // Top 3 are trending
                url: articleUrl
            };
        });
    };

    useEffect(() => {
        if (initialNews && initialNews.length > 0) {
            setNews(initialNews);
            setLoading(initialLoading || false);
            return;
        }

        const fetchNews = async () => {
            try {
                setLoading(true);
                // Use the new simplified endpoint or the existing one
                const response = await api.get('/news/trending?limit=20');

                if (response.data.success && response.data.news) {
                    const formattedNews = formatNewsData(response.data.news);
                    setNews(formattedNews);
                } else {
                    setNews([]);
                }
            } catch (err) {
                console.error('Failed to fetch AI news:', err);
                setError(err.message);
                setNews([]); // No mock data fallback
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [initialNews, initialLoading]);

    // Auto-rotate featured article every 8 seconds
    useEffect(() => {
        if (news.length === 0) return;

        // Clear existing interval
        if (autoRotateIntervalRef.current) {
            clearInterval(autoRotateIntervalRef.current);
        }

        // Set up auto-rotation (only rotate through top 5 articles)
        const maxFeatured = Math.min(5, news.length);
        autoRotateIntervalRef.current = setInterval(() => {
            setFeaturedIndex((prev) => (prev + 1) % maxFeatured);
        }, 8000); // 8 seconds

        return () => {
            if (autoRotateIntervalRef.current) {
                clearInterval(autoRotateIntervalRef.current);
            }
        };
    }, [news]);

    // Reset featured index when news changes
    useEffect(() => {
        if (news.length > 0) {
            setFeaturedIndex(0);
        }
    }, [refreshKey, news.length]);

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            console.log('🔄 Refreshing AI news feed...');

            // Clear old news immediately for visual feedback
            setNews([]);
            setSelectedArticles(new Set()); // Reset selection
            setIsSelectionMode(false);

            const response = await api.post('/news/refresh');
            console.log('📰 Refresh response:', response.data);

            if (response.data.success && response.data.news) {
                const formattedNews = formatNewsData(response.data.news);
                console.log('📊 Formatted news count:', formattedNews.length);
                console.log('📰 First article:', formattedNews[0]?.headline);

                // Update news state and refresh key to force re-render
                setNews(formattedNews);
                setRefreshKey(prev => prev + 1); // Force carousel re-render

                showSuccess(`✅ Feed refreshed! Loaded ${formattedNews.length} articles`);
            } else {
                showError('No news data received');
            }
        } catch (error) {
            console.error('Refresh failed:', error);
            showError('Failed to refresh feed');
        } finally {
            setRefreshing(false);
        }
    };

    const isLoading = (initialLoading !== undefined ? initialLoading : loading) && !refreshing; // Don't show full skeleton on refresh, just button spinner
    const navigate = useNavigate();

    const handleReadArticle = (article) => {
        console.log('Read article:', article);
        if (article.url) {
            window.open(article.url, '_blank');
        }
    };

    const generateContentFromArticle = (article) => {
        return `Check out this latest AI news: "${article.headline}"\n\n${article.source} reports: ${article.bulletPoints[0]}\n\nSource: ${article.url || article.link}`;
    };

    const handleGeneratePost = (article) => {
        console.log('Generate post from:', article);
        setSelectedArticle(article);
        setGeneratedContent(generateContentFromArticle(article));
        setIsPreviewOpen(true);
    };

    const handleRegenerate = async () => {
        if (!selectedArticle) return;

        setIsGenerating(true);
        // Simulate AI delay for better UX
        setTimeout(() => {
            // Simple variation for now - in production this would call the AI API
            const variations = [
                `🔥 Hot off the press from ${selectedArticle.source}: ${selectedArticle.headline}\n\nKey takeaway: ${selectedArticle.bulletPoints[0]}\n\nRead more: ${selectedArticle.url}`,
                `🤖 AI News Update: "${selectedArticle.headline}"\n\nWhy it matters: ${selectedArticle.bulletPoints[0]}\n\n🔗 ${selectedArticle.url}`,
                `Breaking news in AI! ${selectedArticle.headline} just dropped. \n\n${selectedArticle.bulletPoints[0]}\n\nSource: ${selectedArticle.url}`
            ];
            const random = variations[Math.floor(Math.random() * variations.length)];
            setGeneratedContent(random);
            setIsGenerating(false);
        }, 1500);
    };

    const handlePostNow = async (platforms) => {
        if (!platforms || platforms.length === 0) {
            showError('Please select at least one platform');
            return;
        }

        try {
            setIsGenerating(true); // Re-use generating state for loading UI

            // Check auth first
            const authCheck = await api.get('/auth/verify');
            if (!authCheck.data?.user) {
                showError('Please login to post');
                return;
            }

            const response = await api.post('/post/now', {
                text: generatedContent,
                platforms: platforms,
                source: selectedArticle?.source || 'AI News',
                sourceUrl: selectedArticle?.url
            });

            if (response.data.success) {
                showSuccess('Posted successfully! 🚀');
                celebrateSuccess();
                setIsPreviewOpen(false);
            }
        } catch (error) {
            console.error('Posting failed:', error);
            const errorData = error.response?.data?.error;
            let errorMessage = 'Failed to post content';

            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (typeof errorData === 'object') {
                    errorMessage = errorData.message || errorData.code || JSON.stringify(errorData);
                }
            }

            showError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSchedule = (platforms) => {
        navigate('/create', {
            state: {
                initialContent: generatedContent,
                sourceUrl: selectedArticle?.url,
                type: 'news',
                schedule: true, // signal to create post page to open schedule
                platforms: platforms || []
            }
        });
    };

    const handleSave = (article) => {
        console.log('Save article:', article);
        // TODO: Save to user's saved items
    };

    // Selection Handlers
    const toggleSelection = (articleId) => {
        const newSelection = new Set(selectedArticles);
        if (newSelection.has(articleId)) {
            newSelection.delete(articleId);
        } else {
            newSelection.add(articleId);
        }
        setSelectedArticles(newSelection);
        setIsSelectionMode(newSelection.size > 0);
    };

    const handleSelectAll = () => {
        if (selectedArticles.size === news.length) {
            setSelectedArticles(new Set());
            setIsSelectionMode(false);
        } else {
            // Include featured article + remaining news
            const allIds = news.map(a => a.id);
            setSelectedArticles(new Set(allIds));
            setIsSelectionMode(true);
        }
    };

    // Initialize Bulk Schedule (Open Modal)
    const handleBulkSchedule = () => {
        if (selectedArticles.size === 0) return;
        setIsBulkModalOpen(true);
    };

    // Confirm Bulk Schedule (API Call)
    const handleConfirmBulkSchedule = async (platforms) => {
        try {
            setRefreshing(true); // Show loading
            setIsBulkModalOpen(false); // Close modal immediately
            // Filter get full article objects
            const articlesToSchedule = news.filter(a => selectedArticles.has(a.id));

            const response = await api.post('/ai-tools/schedule-now', {
                articles: articlesToSchedule,
                platforms: platforms // Pass selected platforms
            });

            if (response.data.success) {
                showSuccess(`Successfully scheduled ${response.data.scheduled} posts!`);
                celebrateSuccess();
                setSelectedArticles(new Set());
                setIsSelectionMode(false);
            } else {
                showError(response.data.error || 'Failed to schedule posts');
            }
        } catch (error) {
            console.error('Bulk schedule failed:', error);
            showError('Failed to schedule posts');
        } finally {
            setRefreshing(false);
        }
    };

    // Featured article navigation
    const handleFeaturedNext = () => {
        const maxFeatured = Math.min(5, news.length);
        setFeaturedIndex((prev) => (prev + 1) % maxFeatured);
        // Reset auto-rotate timer
        if (autoRotateIntervalRef.current) {
            clearInterval(autoRotateIntervalRef.current);
        }
        autoRotateIntervalRef.current = setInterval(() => {
            setFeaturedIndex((prev) => (prev + 1) % maxFeatured);
        }, 8000);
    };

    const handleFeaturedPrev = () => {
        const maxFeatured = Math.min(5, news.length);
        setFeaturedIndex((prev) => (prev - 1 + maxFeatured) % maxFeatured);
        // Reset auto-rotate timer
        if (autoRotateIntervalRef.current) {
            clearInterval(autoRotateIntervalRef.current);
        }
        autoRotateIntervalRef.current = setInterval(() => {
            setFeaturedIndex((prev) => (prev + 1) % maxFeatured);
        }, 8000);
    };

    // Get featured article
    const featuredArticle = news.length > 0 ? news[featuredIndex] : null;
    const remainingNews = news.length > 0 ? news.filter((_, idx) => idx !== featuredIndex) : [];

    if (isLoading) {
        return (
            <div className="mb-8 relative z-10">
                <div className="animate-pulse">
                    <div className="h-8 bg-white/10 rounded w-64 mb-4"></div>
                    <div className="h-96 bg-white/5 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    // If no news, don't fallback to mock data (User Request: "Real content always") 
    // Just show nothing or a simplified empty state if strictly no data.
    if (news.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8 relative z-10"
        >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent inline-flex items-center gap-2">
                        <span>📰</span>
                        <span>AI NEWS FEED</span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Latest updates from OpenAI, Anthropic, Google & AI ecosystem
                    </p>
                </div>

                <div className="flex gap-2">
                    {/* Select All Button */}
                    {news.length > 0 && (
                        <button
                            onClick={handleSelectAll}
                            className={`px-4 py-2 rounded-lg border transition-all text-sm font-medium ${selectedArticles.size === news.length
                                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                                }`}
                        >
                            {selectedArticles.size === news.length ? 'Deselect All' : 'Select All'}
                        </button>
                    )}

                    {/* Refresh Button replacing 'View All News' */}
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 hover:shadow-cyan-500/20 shadow-lg border border-gray-700 hover:border-cyan-500/30 transition-all text-sm font-medium text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <span className={`text-lg transition-transform duration-700 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}>
                            🔄
                        </span>
                        {refreshing ? 'Refreshing...' : 'Refresh Feed'}
                    </button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedArticles.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 backdrop-blur-xl border border-white/20 px-6 py-4 rounded-full shadow-2xl flex items-center gap-4"
                    >
                        <span className="text-white font-medium">{selectedArticles.size} articles selected</span>
                        <button
                            onClick={handleBulkSchedule} // Calls the new handleBulkSchedule to open modal
                            disabled={refreshing}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-full font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50"
                        >
                            {refreshing ? 'Scheduling...' : `Schedule ${selectedArticles.size} AI Posts`}
                        </button>
                        <button
                            onClick={() => {
                                setSelectedArticles(new Set());
                                setIsSelectionMode(false);
                            }}
                            className="text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Featured Hero Section (Netflix-style) */}
            {featuredArticle && (
                <div className="relative mb-8" style={{ minHeight: '400px' }}>
                    {/* Overlay selection for featured article */}
                    {isSelectionMode && (
                        <div className="absolute top-4 right-4 z-30">
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelection(featuredArticle.id);
                                }}
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${selectedArticles.has(featuredArticle.id) ? 'bg-cyan-500 border-cyan-500' : 'bg-black/40 border-white/60 hover:bg-black/60'
                                    }`}>
                                {selectedArticles.has(featuredArticle.id) && <span className="text-white font-bold text-xl">✓</span>}
                            </div>
                        </div>
                    )}

                    <AnimatePresence initial={false} mode="wait">
                        <motion.div
                            key={`featured-${featuredIndex}-${featuredArticle.headline?.substring(0, 20)}`}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.03 }}
                            transition={{
                                duration: 0.4,
                                ease: "easeOut",
                                opacity: { duration: 0.2 }
                            }}
                            className="w-full"
                        >
                            <FeaturedAINews
                                article={featuredArticle}
                                onReadArticle={() => handleReadArticle(featuredArticle)}
                                onGeneratePost={() => handleGeneratePost(featuredArticle)}
                                autoRotate={8000}
                                showNavigation={news.length > 1}
                            />
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Arrows (if more than 1 article) */}
                    {news.length > 1 && (
                        <>
                            <button
                                onClick={handleFeaturedPrev}
                                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110"
                                aria-label="Previous featured article"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={handleFeaturedNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110"
                                aria-label="Next featured article"
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
                                    onClick={() => {
                                        setFeaturedIndex(idx);
                                        // Reset auto-rotate timer
                                        if (autoRotateIntervalRef.current) {
                                            clearInterval(autoRotateIntervalRef.current);
                                        }
                                        const maxFeatured = Math.min(5, news.length);
                                        autoRotateIntervalRef.current = setInterval(() => {
                                            setFeaturedIndex((prev) => (prev + 1) % maxFeatured);
                                        }, 8000);
                                    }}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === featuredIndex
                                            ? 'bg-white w-6'
                                            : 'bg-white/40 hover:bg-white/60'
                                        }`}
                                    aria-label={`Go to featured article ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* More Trending AI News Section */}
            {remainingNews.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-white mb-4">More Trending AI News</h3>
                    <OverlappingCardCarousel key={refreshKey} arrowColor="white">
                        {remainingNews.map((article, index) => (
                            <NewsCard
                                key={article.id || index}
                                headline={article.headline}
                                summary={article.summary}
                                image={article.image}
                                source={article.source}
                                timestamp={article.timestamp}
                                sourceCount={article.sourceCount}
                                url={article.url}
                                isBreaking={article.isBreaking || false}
                                isTrending={article.isTrending}
                                isFeatured={false}
                                position="center"
                                onReadArticle={() => handleReadArticle(article)}
                                onGeneratePost={() => handleGeneratePost(article)}
                                onSave={() => handleSave(article)}
                                isSelected={selectedArticles.has(article.id)}
                                onToggleSelect={() => toggleSelection(article.id)}
                                isSelectionMode={isSelectionMode}
                            />
                        ))}
                    </OverlappingCardCarousel>
                </div>
            )}

            {/* Generate Post Preview Modal */}
            <GeneratePostPreview
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                article={selectedArticle}
                generatedContent={generatedContent}
                isGenerating={isGenerating}
                onRegenerate={handleRegenerate}
                onPostNow={handlePostNow}
                onSchedule={handleSchedule}
                connectedPlatforms={connectedPlatforms}
            />

            {/* Bulk Schedule Modal */}
            <BulkScheduleModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onConfirm={handleConfirmBulkSchedule}
                selectedCount={selectedArticles.size}
                connectedPlatforms={connectedPlatforms}
            />
        </motion.div>
    );
}
