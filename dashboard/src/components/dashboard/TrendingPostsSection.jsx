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

    // Mock data for fallback - RICH DETAILED DATA
    const mockPosts = [
        {
            id: 1,
            platform: 'twitter',
            author: 'elonmusk',
            timestamp: '2h ago',
            content: 'AI will change everything over the next 5 years. The advancements in reasoning and multimodal capabilities are absolutely insane. Stay ahead of the curve or get left behind. The future is here. 🚀',
            engagement: {
                likes: 89012,
                retweets: 12891,
                comments: 45234,
                views: 2100000
            },
            viralScore: 9.2,
            topReply: 'This is exactly what we needed. The speed improvements alone are game-changing for developers.',
            hashtags: ['AI', 'Technology', 'FutureTech', 'Innovation'],
            isBreaking: false,
            url: 'https://twitter.com/elonmusk/status/123'
        },
        {
            id: 2,
            platform: 'reddit',
            author: 'AIResearcher',
            timestamp: '4h ago',
            content: 'OpenAI just released GPT-5 preview and it\'s absolutely insane. The multimodal capabilities are beyond anything I\'ve seen. It can now understand context across images, videos, and text simultaneously. This is a massive leap forward. Thread below 🧵',
            engagement: {
                likes: 23400,
                retweets: 8900,
                comments: 15600,
                views: 847000
            },
            viralScore: 8.7,
            topReply: 'Finally, affordable AI that actually works. This changes everything for startups.',
            hashtags: ['OpenAI', 'GPT5', 'MachineLearning', 'AI'],
            isBreaking: true,
            url: 'https://reddit.com/r/artificial/comments/123'
        },
        {
            id: 3,
            platform: 'twitter',
            author: 'sama',
            timestamp: '6h ago',
            content: 'We\'ve been working on something special. GPT-5 brings 3x speed improvements, 50% cost reduction, and capabilities that will blow your mind. Available to all API users starting today. The AI revolution accelerates. 🎯',
            engagement: {
                likes: 156000,
                retweets: 34200,
                comments: 67800,
                views: 3500000
            },
            viralScore: 9.8,
            topReply: 'This is huge! The cost reduction alone makes AI accessible to everyone now.',
            hashtags: ['OpenAI', 'GPT5', 'AI', 'TechNews'],
            isBreaking: true,
            url: 'https://twitter.com/sama/status/456'
        },
        {
            id: 4,
            platform: 'linkedin',
            author: 'satyanadella',
            timestamp: '8h ago',
            content: 'Excited to announce our partnership with OpenAI to bring GPT-5 to Microsoft 365. This will transform how millions of people work every day. Productivity is about to get a massive upgrade. 💼',
            engagement: {
                likes: 45000,
                retweets: 8900,
                comments: 12300,
                views: 980000
            },
            viralScore: 8.5,
            topReply: 'Can\'t wait to see this integrated into Teams and Outlook!',
            hashtags: ['Microsoft', 'AI', 'Productivity', 'Innovation'],
            isBreaking: false,
            url: 'https://linkedin.com/posts/satyanadella-123'
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
                        viralScore={post.viralScore || 0}
                        topReply={post.topReply}
                        hashtags={post.hashtags || []}
                        url={post.url}
                        isBreaking={post.isBreaking || false}
                        isFeatured={index === 1} // Center card is featured
                        position={index === 0 ? 'left' : index === 1 ? 'center' : index === 2 ? 'right' : 'center'}
                        onViewPost={() => handleViewPost(post)}
                        onGeneratePost={() => console.log('Generate post from:', post)}
                        onSave={() => handleSave(post)}
                    />
                ))}
            </OverlappingCardCarousel>
        </motion.div>
    );
}
