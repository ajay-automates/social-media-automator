import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import OverlappingCardCarousel from './OverlappingCardCarousel';
import TrendingCard from './TrendingCard';

/**
 * TrendingPostsSection - Container for trending posts with overlapping card layout
 * 
 * Props:
 * - posts: array of trending post objects
 * - loading: boolean
 */
export default function TrendingPostsSection({ posts = [], loading = false }) {
    // Mock data for development
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
        },
        {
            id: 4,
            platform: 'twitter',
            author: 'Sam Altman',
            timestamp: '8h ago',
            content: 'The future of AI is not about replacing humans, it\'s about augmenting human capabilities. Excited for what\'s coming next.',
            engagement: { likes: 67800, retweets: 19200, score: 97 }
        },
        {
            id: 5,
            platform: 'reddit',
            author: 'u/MachineLearning',
            timestamp: '10h ago',
            content: 'Just tested the new Claude 4 and wow... the context window improvements are game-changing for long-form content creation.',
            engagement: { likes: 34500, retweets: 11200, score: 94 }
        }
    ];

    const displayPosts = posts.length > 0 ? posts : mockPosts;

    const handleViewPost = (post) => {
        console.log('View post:', post);
        // TODO: Open post in modal or new tab
    };

    const handleSave = (post) => {
        console.log('Save post:', post);
        // TODO: Save to user's saved items
    };

    if (loading) {
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
                <Link
                    to="/viral-posts"
                    className="text-orange-400 hover:text-orange-300 font-semibold text-sm inline-flex items-center gap-1 transition-colors"
                >
                    <span>View All Viral</span>
                    <span>→</span>
                </Link>
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
