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

    useEffect(() => {
        if (initialPosts && initialPosts.length > 0) {
            setPosts(initialPosts);
            setLoading(initialLoading || false);
            return;
        }

        const fetchTrends = async () => {
            try {
                setLoading(true);
                // Fetch real trending data
                const response = await api.get('/trends');

                if (response.data.success && response.data.trends) {
                    const formattedTrends = response.data.trends.map((trend, index) => ({
                        id: index,
                        platform: trend.source || 'web',
                        author: trend.source || 'Trend',
                        timestamp: 'Today',
                        image: null, // Trends API typically returns topics, not images yet
                        content: trend.topic,
                        engagement: {
                            likes: trend.volume || 0,
                            retweets: 0,
                            comments: 0,
                            views: trend.volume || 0
                        },
                        viralScore: trend.score || 0,
                        topReply: '',
                        hashtags: [trend.category || 'trending'],
                        isBreaking: (trend.score || 0) > 90,
                        url: trend.url // REAL URL from trend source
                    }));

                    setPosts(formattedTrends);
                } else {
                    setPosts([]);
                }
            } catch (err) {
                console.error('Failed to fetch trending posts:', err);
                setError(err.message);
                setPosts([]); // Real content only - no mock fallback
            } finally {
                setLoading(false);
            }
        };

        fetchTrends();
    }, [initialPosts, initialLoading]);

    const displayPosts = posts;
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

    // Only show if we have real content
    if (displayPosts.length === 0) {
        return null;
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
                        Discover what's going viral across Web, Reddit & Google
                    </p>
                </div>
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
                        image={post.image}
                        engagement={post.engagement}
                        viralScore={post.viralScore || 0}
                        topReply={post.topReply}
                        hashtags={post.hashtags || []}
                        url={post.url}
                        isBreaking={post.isBreaking || false}
                        isFeatured={index === 1}
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
