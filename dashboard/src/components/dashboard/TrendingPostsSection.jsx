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

    // DETAILED MOCK DATA - Complete paragraphs for rich content display
    const mockPosts = [
        {
            id: 1,
            platform: 'twitter',
            author: 'elonmusk',
            timestamp: '2h ago',
            image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
            content: `AI will change everything over the next 5 years. The advancements in reasoning and multimodal capabilities are absolutely insane. 

We're seeing models that can now understand context across images, videos, and text simultaneously. This isn't just incremental progress - it's a fundamental shift in how AI systems work.

The speed improvements alone are game-changing. What used to take minutes now happens in seconds. And the cost reduction? We're talking 50-70% cheaper than just 6 months ago.

This means AI is no longer just for big tech companies. Small startups, individual developers, even students can now build sophisticated AI applications. The democratization of AI is happening right now.

Stay ahead of the curve or get left behind. The future is here. 🚀`,
            engagement: { likes: 89012, retweets: 12891, comments: 45234, views: 2100000 },
            viralScore: 9.2,
            topReply: 'This is exactly what we needed. The speed improvements alone are game-changing for developers. Finally we can build real-time AI apps without worrying about latency.',
            hashtags: ['AI', 'Technology', 'FutureTech', 'Innovation'],
            isBreaking: false,
            url: 'https://twitter.com/elonmusk/status/123'
        },
        {
            id: 2,
            platform: 'reddit',
            author: 'AIResearcher',
            timestamp: '4h ago',
            image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
            content: `OpenAI just released GPT-5 preview and it's absolutely insane. The multimodal capabilities are beyond anything I've seen.

Key highlights from my testing:
- It can now understand context across images, videos, and text simultaneously
- The reasoning capabilities are on par with human experts in many domains
- Response times are 3x faster than GPT-4
- Cost per token is down 50%

I tested it on complex coding tasks, mathematical proofs, and creative writing. In every category, it outperformed GPT-4 by a significant margin.

The most impressive part? It can maintain context across extremely long conversations (200K+ tokens) without losing track of earlier details.

This is a massive leap forward. If you're building AI applications, you need to check this out immediately. Thread below with detailed benchmarks and examples 🧵`,
            engagement: { likes: 23400, retweets: 8900, comments: 15600, views: 847000 },
            viralScore: 8.7,
            topReply: 'Finally, affordable AI that actually works. This changes everything for startups. We can now build features that were impossible before without burning through our budget.',
            hashtags: ['OpenAI', 'GPT5', 'MachineLearning', 'AI'],
            isBreaking: true,
            url: 'https://reddit.com/r/artificial/comments/123'
        },
        {
            id: 3,
            platform: 'twitter',
            author: 'sama',
            timestamp: '6h ago',
            image: 'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?w=800&h=400&fit=crop',
            content: `We've been working on something special. GPT-5 brings 3x speed improvements, 50% cost reduction, and capabilities that will blow your mind.

What's new:
✅ 200K context window (up from 128K)
✅ Native multimodal understanding
✅ Advanced reasoning for complex problems
✅ Reduced hallucinations by 60%
✅ Real-time streaming responses
✅ Better code generation and debugging

Available to all API users starting today. No waitlist, no special access needed. Just update your API calls and you're good to go.

The AI revolution accelerates. This is just the beginning. 🎯`,
            engagement: { likes: 156000, retweets: 34200, comments: 67800, views: 3500000 },
            viralScore: 9.8,
            topReply: 'This is huge! The cost reduction alone makes AI accessible to everyone now. We were spending $5K/month on API calls, this will cut it to $2.5K. Game changer for our startup.',
            hashtags: ['OpenAI', 'GPT5', 'AI', 'TechNews'],
            isBreaking: true,
            url: 'https://twitter.com/sama/status/456'
        },
        {
            id: 4,
            platform: 'linkedin',
            author: 'satyanadella',
            timestamp: '8h ago',
            image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=400&fit=crop',
            content: `Excited to announce our partnership with OpenAI to bring GPT-5 to Microsoft 365. This will transform how millions of people work every day.

Imagine:
📧 Emails that write themselves based on context
📊 Excel formulas that understand natural language
📝 Word documents that auto-format and fact-check
💬 Teams meetings with real-time AI summaries
🎯 PowerPoint presentations generated from bullet points

This isn't science fiction. It's rolling out to Enterprise customers next month, and to all Microsoft 365 users by Q2 2025.

Productivity is about to get a massive upgrade. The way we work is changing forever. 💼`,
            engagement: { likes: 45000, retweets: 8900, comments: 12300, views: 980000 },
            viralScore: 8.5,
            topReply: 'Can\'t wait to see this integrated into Teams and Outlook! The AI meeting summaries alone will save our team hours every week. This is the future of work.',
            hashtags: ['Microsoft', 'AI', 'Productivity', 'Innovation'],
            isBreaking: false,
            url: 'https://linkedin.com/posts/satyanadella-123'
        }
    ];

    useEffect(() => {
        // Always use detailed mock data for now
        setPosts(mockPosts);
        setLoading(false);
    }, []);

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
