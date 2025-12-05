import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import OverlappingCardCarousel from './OverlappingCardCarousel';
import NewsCard from './NewsCard';

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

    // Mock data for fallback
    const mockNews = [
        {
            id: 1,
            headline: 'OpenAI Announces GPT-5 with Revolutionary Reasoning Capabilities',
            source: 'OpenAI',
            timestamp: '1h ago',
            bulletPoints: [
                'Advanced multi-step reasoning across complex problems',
                '10x larger context window (1M tokens)',
                'Native multimodal understanding (text, image, audio, video)',
                'Improved factual accuracy and reduced hallucinations'
            ],
            isTrending: true
        },
        {
            id: 2,
            headline: 'Google Gemini Ultra Surpasses Human Performance on 57 Benchmarks',
            source: 'Google',
            timestamp: '5h ago',
            bulletPoints: [
                'State-of-the-art performance across math, coding, and reasoning',
                'Native multimodal training from the ground up',
                'Efficient scaling with reduced compute requirements',
                'Integration with Google Workspace products'
            ],
            isTrending: true
        },
        {
            id: 3,
            headline: 'Meta Unveils Llama 3: Open-Source AI Model Rivals Proprietary Giants',
            source: 'Meta',
            timestamp: '9h ago',
            bulletPoints: [
                'Fully open-source with commercial licensing',
                'Competitive performance with GPT-4 and Claude',
                'Optimized for efficient inference on consumer hardware',
                'Strong multilingual capabilities across 100+ languages'
            ],
            isTrending: true
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
                            source: article.source || 'AI News',
                            timestamp: timestamp,
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

    const handleGeneratePost = (article) => {
        console.log('Generate post from:', article);
        navigate('/create-post', {
            state: {
                initialContent: `Check out this latest AI news: "${article.headline}"\n\n${article.source} reports: ${article.bulletPoints[0]}\n\nSource: ${article.url}`,
                sourceUrl: article.url,
                type: 'news'
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
                        source={article.source}
                        timestamp={article.timestamp}
                        bulletPoints={article.bulletPoints}
                        isTrending={article.isTrending}
                        isFeatured={index === 1} // Center card is featured
                        position={index === 0 ? 'left' : index === 1 ? 'center' : index === 2 ? 'right' : 'center'}
                        onReadArticle={() => handleReadArticle(article)}
                        onGeneratePost={() => handleGeneratePost(article)}
                        onSave={() => handleSave(article)}
                    />
                ))}
            </OverlappingCardCarousel>
        </motion.div>
    );
}
