import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import OverlappingCardCarousel from './OverlappingCardCarousel';
import TrendingCard from './TrendingCard';

/**
 * TrendingPostsSection - Container for trending posts with overlapping card layout
 * 
 * Props:
 * - posts: array of trending post objects (optional override)
 * - loading: boolean (optional override)
 */
export default function TrendingPostsSection({ posts: initialPosts, loading: initialLoading }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Mock data for fallback
    const mockPosts = [
        {
            id: 1,
            platform: 'twitter',
            author: 'Elon Musk',
            timestamp: '2h ago',
            content: 'Just shipped a major update to Grok AI. The new reasoning capabilities are mind-blowing. This changes everything. 🚀',
            engagement: { likes: 45200, retweets: 12300, score: 98 }
        },
        {
            id: 2,
            platform: 'reddit',
            author: 'u/AIResearcher',
            timestamp: '4h ago',
            content: 'OpenAI just released GPT-5 preview and it\'s absolutely insane. The multimodal capabilities are beyond anything I\'ve seen. Thread below 🧵',
            engagement: { likes: 23400, retweets: 8900, score: 95 }
        },
        {
            id: 3,
            platform: 'tiktok',
            author: '@techguru',
            timestamp: '6h ago',
            content: 'This AI tool just automated my entire workflow. I\'m literally saving 20 hours per week now. Link in bio! #ProductivityHack #AI',
            engagement: { likes: 89000, retweets: 15600, score: 92 }
        }
    ];

    useEffect(() => {
        // If posts are provided via props, use them
        if (initialPosts && initialPosts.length > 0) {
            setPosts(initialPosts);
            setLoading(initialLoading || false);
            return;
        }

        const fetchTrends = async () => {
            try {
                setLoading(true);
                const response = await api.get('/trends/live?limit=10');

                if (response.data.success && response.data.trends && response.data.trends.length > 0) {
                    // Map live trends to post format
                    const formattedTrends = response.data.trends.map((trend, index) => ({
                        id: index,
                        platform: trend.source || 'web',
                        author: trend.source === 'reddit' ? `r/${trend.category || 'all'}` : 'Google Trends',
                        timestamp: 'Trending Now',
                        content: trend.topic,
                        limit_content: true, // Flag to indicate we might want to limit content length or styling
                        url: trend.url,
                        engagement: {
                            likes: trend.volume || 0,
                            retweets: 0,
                            score: trend.score || 80
                        }
                    }));
                    setPosts(formattedTrends);
                } else {
                    // Fallback to mock if API returns empty
                    setPosts(mockPosts);
                }
            } catch (err) {
                console.error('Failed to fetch live trends:', err);
                setPosts(mockPosts);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTrends();
    }, [initialPosts, initialLoading]);

    const displayPosts = posts.length > 0 ? posts : mockPosts;
    const isLoading = initialLoading !== undefined ? initialLoading : loading;

    const handleViewPost = (post) => {
        console.log('View post:', post);
        if (post.url) {
            window.open(post.url, '_blank');
        }
    };

    const handleSave = (post) => {
        console.log('Save post:', post);
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
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 relative z-10"
        >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent inline-flex items-center gap-2">
                        <span>🔥</span>
                        <span>TRENDING POSTS</span>
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Discover what's going viral across Twitter, Reddit, TikTok & more
                    </p>
                </div>
                {/* <Link
                    to="/viral-posts"
                    className="text-orange-400 hover:text-orange-300 font-semibold text-sm inline-flex items-center gap-1 transition-colors"
                >
                    <span>View All Viral</span>
                    <span>→</span>
                </Link> */}
            </div>

            {/* Overlapping Cards Carousel */}
            <OverlappingCardCarousel arrowColor="white">
                {displayPosts.map((post, index) => (
                    <TrendingCard
                        key={post.id}
                        platform={post.platform}
                        author={post.author}
                        timestamp={post.timestamp}
                        content={post.content}
                        engagement={post.engagement}
                        isFeatured={index === 1} // Center card is featured
                        position={index === 0 ? 'left' : index === 1 ? 'center' : index === 2 ? 'right' : 'center'}
                        onViewPost={() => handleViewPost(post)}
                        onSave={() => handleSave(post)}
                    />
                ))}
            </OverlappingCardCarousel>
        </motion.div>
    );
}
