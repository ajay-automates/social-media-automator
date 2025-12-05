import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import OverlappingCardCarousel from './OverlappingCardCarousel';
import NewsCard from './NewsCard';

/**
 * AINewsFeedSection - Container for AI news with overlapping card layout
 * 
 * Props:
 * - news: array of AI news objects
 * - loading: boolean
 */
export default function AINewsFeedSection({ news = [], loading = false }) {
    // Mock data for development
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
            headline: 'Anthropic Releases Claude 4: The Most Helpful AI Assistant Yet',
            source: 'Anthropic',
            timestamp: '3h ago',
            bulletPoints: [
                'Enhanced constitutional AI for safer responses',
                'Better long-form content generation',
                'Improved code generation and debugging',
                'Extended context to 500K tokens'
            ],
            isTrending: false
        },
        {
            id: 3,
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
            id: 4,
            headline: 'Microsoft Copilot Gets Major Upgrade with GPT-4 Turbo Integration',
            source: 'Microsoft',
            timestamp: '7h ago',
            bulletPoints: [
                'Faster response times with GPT-4 Turbo',
                'Better code completion and suggestions',
                'Enhanced natural language to SQL capabilities',
                'New plugins for Office 365 integration'
            ],
            isTrending: false
        },
        {
            id: 5,
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

    const displayNews = news.length > 0 ? news : mockNews;

    const handleReadArticle = (article) => {
        console.log('Read article:', article);
        // TODO: Open article in modal or new tab
    };

    const handleGeneratePost = (article) => {
        console.log('Generate post from:', article);
        // TODO: Navigate to create post with AI-generated content
    };

    const handleSave = (article) => {
        console.log('Save article:', article);
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
