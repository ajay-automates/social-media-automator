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
    const [error, setError] = useState(null);

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

    // Mock data for fallback - PERPLEXITY-STYLE DATA
    const mockNews = [
        {
            id: 1,
            headline: 'OpenAI Releases GPT-5 with Major Performance Improvements',
            summary: 'GPT-5 brings 3x speed boost, 50% cost reduction, and new vision capabilities to AI applications. Available to all API users immediately.',
            image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
            source: 'OpenAI',
            timestamp: '1h ago',
            sourceCount: 58,
            isTrending: true,
            isBreaking: true,
            url: 'https://openai.com/blog/gpt-5'
        },
        {
            id: 2,
            headline: 'Google Gemini Ultra Surpasses Human Performance on 57 Benchmarks',
            summary: 'Gemini Ultra achieves state-of-the-art results across math, coding, and reasoning tasks, marking a significant milestone in AI development.',
            image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
            source: 'Google',
            timestamp: '5h ago',
            sourceCount: 72,
            isTrending: true,
            isBreaking: false,
            url: 'https://blog.google/technology/ai/gemini-ultra'
        },
        {
            id: 3,
            headline: 'Meta Unveils Llama 3: Open-Source AI Model Rivals Proprietary Giants',
            summary: 'Llama 3 offers competitive performance with GPT-4 and Claude while being fully open-source with commercial licensing.',
            image: 'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?w=800&h=400&fit=crop',
            source: 'Meta',
            timestamp: '9h ago',
            sourceCount: 45,
            isTrending: true,
            isFeatured: true,
            url: 'https://ai.meta.com/blog/llama-3'
        },
        {
            id: 4,
            headline: 'Anthropic Announces Claude 4 with Enhanced Safety Features',
            summary: 'Claude 4 introduces constitutional AI improvements and better alignment, making it safer for enterprise deployments.',
            image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=400&fit=crop',
            source: 'Anthropic',
            timestamp: '12h ago',
            sourceCount: 34,
            isTrending: false,
            isFeatured: false,
            url: 'https://anthropic.com/claude-4'
        }
    ];

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
                    // Flatten the categorized news object
                    let allArticles = [];
                    if (Array.isArray(response.data.news)) {
                        allArticles = response.data.news;
                    } else {
                        Object.values(response.data.news).forEach(category => {
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
                    const formattedNews = uniqueArticles.slice(0, 20).map((article, index) => {
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

                    setNews(formattedNews.length > 0 ? formattedNews : mockNews);
                } else {
                    setNews(mockNews);
                }
            } catch (err) {
                console.error('Failed to fetch AI news:', err);
                setNews(mockNews);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [initialNews, initialLoading]);

    const displayNews = news.length > 0 ? news : mockNews;
    const isLoading = initialLoading !== undefined ? initialLoading : loading;
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
                <Link
                    to="/ai-news"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm inline-flex items-center gap-1 transition-colors"
                >
                    <span>View All News</span>
                    <span>→</span>
                </Link>
            </div>

            {/* Overlapping Cards Carousel */}
            <OverlappingCardCarousel arrowColor="white">
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
