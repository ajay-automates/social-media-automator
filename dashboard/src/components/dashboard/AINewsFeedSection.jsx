import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import OverlappingCardCarousel from './OverlappingCardCarousel';
import NewsCard from './NewsCard';
import GeneratePostPreview from './GeneratePostPreview';
import { celebrateSuccess } from '../../utils/animations';
import { showSuccess, showError } from '../../components/ui/Toast';

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

    // Preview Modal State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [connectedPlatforms, setConnectedPlatforms] = useState([]);

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

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            console.log('🔄 Refreshing AI news feed...');
            
            // Clear old news immediately for visual feedback
            setNews([]);
            
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

    // REAL DATA ONLY: news array directly
    const displayNews = news;
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
    if (displayNews.length === 0) {
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

            {/* Overlapping Cards Carousel */}
            <OverlappingCardCarousel key={refreshKey} arrowColor="white">
                {displayNews.map((article, index) => (
                    <NewsCard
                        key={article.id}
                        headline={article.headline}
                        summary={article.summary}
                        image={article.image}
                        source={article.source}
                        timestamp={article.timestamp}
                        sourceCount={article.sourceCount}
                        url={article.url}
                        isBreaking={article.isBreaking || false}
                        isTrending={article.isTrending}
                        isFeatured={article.isFeatured || index === 0}
                        position={index === 0 ? 'left' : index === 1 ? 'center' : index === 2 ? 'right' : 'center'}
                        onReadArticle={() => handleReadArticle(article)}
                        onGeneratePost={() => handleGeneratePost(article)}
                        onSave={() => handleSave(article)}
                    />
                ))}
            </OverlappingCardCarousel>

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
        </motion.div>
    );
}
