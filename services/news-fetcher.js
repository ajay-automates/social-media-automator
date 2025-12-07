const axios = require('axios');
const xml2js = require('xml2js');
const { extractImagesFromUrls } = require('./image-scraper');

/**
 * Comprehensive AI News Fetcher
 * Fetches from 25+ RSS sources and APIs for maximum variety
 */

// ========== RSS FEED SOURCES (FREE, NO API KEY NEEDED) ==========
const RSS_SOURCES = [
    // Major AI Companies (Official Blogs)
    { name: 'Anthropic News', url: 'https://www.anthropic.com/index.xml', priority: 'high' },
    { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', priority: 'high' },
    { name: 'DeepMind Blog', url: 'https://deepmind.google/blog/rss.xml', priority: 'high' },
    { name: 'Meta AI Research', url: 'https://ai.meta.com/blog/feed/', priority: 'high' },
    
    // Tech News Sites (AI Sections)
    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', priority: 'high' },
    { name: 'Ars Technica AI', url: 'https://arstechnica.com/tag/artificial-intelligence/feed/', priority: 'high' },
    { name: 'ZDNet AI', url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml', priority: 'high' },
    { name: 'VentureBeat AI', url: 'https://venturebeat.com/ai/feed/', priority: 'high' },
    { name: 'The Verge AI', url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', priority: 'medium' },
    { name: 'CNET AI', url: 'https://www.cnet.com/rss/news/artificial-intelligence/', priority: 'medium' },
    
    // AI-Focused Publications
    { name: 'MIT Technology Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/', priority: 'high' },
    { name: 'AI Business', url: 'https://www.aibusiness.com/rss.xml', priority: 'medium' },
    { name: 'AI News', url: 'https://www.artificialintelligence-news.com/feed/', priority: 'medium' },
    { name: 'Machine Learning Mastery', url: 'https://machinelearningmastery.com/feed/', priority: 'medium' },
    
    // Developer & Research Communities
    { name: 'Towards Data Science', url: 'https://towardsdatascience.com/feed', priority: 'medium' },
    { name: 'Analytics Vidhya', url: 'https://www.analyticsvidhya.com/blog/feed/', priority: 'medium' },
    { name: 'KDnuggets', url: 'https://www.kdnuggets.com/feed', priority: 'medium' },
    
    // News Aggregators (AI Tags)
    { name: 'Google News AI', url: 'https://news.google.com/rss/search?q=artificial+intelligence+AI&hl=en-US&gl=US&ceid=US:en', priority: 'high' },
    { name: 'Yahoo News AI', url: 'https://news.yahoo.com/rss/technology/artificial-intelligence', priority: 'medium' },
    
    // Additional Tech Sources
    { name: 'Wired AI', url: 'https://www.wired.com/tag/artificial-intelligence/feed', priority: 'low' },
    { name: 'Engadget AI', url: 'https://www.engadget.com/rss.xml', priority: 'low' }, // General tech, filters AI later
    { name: 'Gizmodo AI', url: 'https://gizmodo.com/rss', priority: 'low' },
    
    // Research & Academic
    { name: 'arXiv AI', url: 'https://arxiv.org/rss/cs.AI', priority: 'medium' }, // Academic papers
    { name: 'IEEE Spectrum AI', url: 'https://spectrum.ieee.org/rss/topic/artificial-intelligence/fulltext', priority: 'medium' },
];

// ========== API SOURCES (OPTIONAL, FREE TIERS) ==========
const NEWS_API_KEY = process.env.NEWS_API_KEY; // Optional: Get free key from newsapi.org (100 requests/day)

/**
 * Fetch latest AI news from ALL sources (RSS + APIs)
 * Uses parallel fetching for speed
 * Rotates sources on each refresh for variety
 */
async function fetchLatestAINews() {
    console.log('📰 Fetching AI news from 25+ sources...');
    const startTime = Date.now();
    
    let allNews = [];
    const fetchPromises = [];
    
    // Rotate RSS sources based on timestamp for variety
    const timestamp = Date.now();
    const rotationOffset = Math.floor((timestamp / (1000 * 60 * 5)) % RSS_SOURCES.length); // Rotate every 5 minutes
    
    // Prioritize sources: high priority first, then rotate
    const sortedSources = [
        ...RSS_SOURCES.filter(s => s.priority === 'high'),
        ...RSS_SOURCES.filter(s => s.priority === 'medium'),
        ...RSS_SOURCES.filter(s => s.priority === 'low')
    ];
    
    // Rotate sources for variety
    const rotatedSources = [
        ...sortedSources.slice(rotationOffset),
        ...sortedSources.slice(0, rotationOffset)
    ];
    
    console.log(`🔄 Source rotation offset: ${rotationOffset} (changes every 5 min)`);
    
    // Fetch from RSS feeds in parallel (batch of 10 at a time for speed)
    const batchSize = 10;
    for (let i = 0; i < rotatedSources.length; i += batchSize) {
        const batch = rotatedSources.slice(i, i + batchSize);
        const batchPromises = batch.map(source => 
            fetchRSSSource(source).catch(err => {
                console.error(`❌ ${source.name}: ${err.message}`);
                return [];
            })
        );
        
        const batchResults = await Promise.all(batchPromises);
        allNews = [...allNews, ...batchResults.flat()];
        
        // Small delay between batches to avoid overwhelming servers
        if (i + batchSize < rotatedSources.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    // Fetch from NewsAPI if key is available (optional)
    if (NEWS_API_KEY) {
        try {
            const newsApiArticles = await fetchNewsAPI();
            allNews = [...allNews, ...newsApiArticles];
            console.log(`✅ Fetched ${newsApiArticles.length} articles from NewsAPI`);
        } catch (error) {
            console.error('❌ NewsAPI error:', error.message);
        }
    }
    
    const fetchTime = Date.now() - startTime;
    console.log(`⏱️  Fetched ${allNews.length} total articles in ${fetchTime}ms`);
    
    // Filter for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentNews = allNews.filter(item => item.pubDate >= thirtyDaysAgo);
    
    // Deduplicate
    const uniqueNews = deduplicateNews(recentNews);
    console.log(`✨ Found ${uniqueNews.length} unique news items from the last 30 days`);
    
    // Extract images for articles without images (limit to 10 concurrent)
    const articlesNeedingImages = uniqueNews.filter(item => !item.image && item.url).slice(0, 20);
    if (articlesNeedingImages.length > 0) {
        console.log(`🖼️  Extracting images from ${articlesNeedingImages.length} article URLs...`);
        const itemsToScrape = articlesNeedingImages.map(item => ({ url: item.url, query: item.title }));
        const imageMap = await extractImagesFromUrls(itemsToScrape, 5); // 5 concurrent requests
        
        uniqueNews.forEach(item => {
            if (!item.image && imageMap.has(item.url)) {
                item.image = imageMap.get(item.url);
            }
        });
        
        const extractedCount = Array.from(imageMap.values()).filter(img => img !== null).length;
        console.log(`✅ Successfully extracted ${extractedCount} images`);
    }
    
    // Sort by date (newest first)
    const sortedNews = uniqueNews.sort((a, b) => b.pubDate - a.pubDate);
    
    // Group by recency and shuffle each group
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const last24h = sortedNews.filter(item => item.pubDate >= oneDayAgo);
    const last3Days = sortedNews.filter(item => item.pubDate >= threeDaysAgo && item.pubDate < oneDayAgo);
    const last7Days = sortedNews.filter(item => item.pubDate >= sevenDaysAgo && item.pubDate < threeDaysAgo);
    const last30Days = sortedNews.filter(item => item.pubDate < sevenDaysAgo);
    
    // Shuffle each group with timestamp-based seed (ensures different order each refresh)
    const shuffleGroup = (arr) => {
        const shuffled = [...arr];
        const seed = Date.now() % 100000;
        for (let i = shuffled.length - 1; i > 0; i--) {
            const random = ((seed + i) * 9301 + 49297) % 233280;
            const j = Math.floor((random / 233280) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };
    
    const shuffled24h = shuffleGroup(last24h);
    const shuffled3Days = shuffleGroup(last3Days);
    const shuffled7Days = shuffleGroup(last7Days);
    const shuffled30Days = shuffleGroup(last30Days);
    
    const totalShuffled = shuffled24h.length + shuffled3Days.length + shuffled7Days.length + shuffled30Days.length;
    console.log(`🎲 Shuffled: ${shuffled24h.length} (24h) + ${shuffled3Days.length} (3d) + ${shuffled7Days.length} (7d) + ${shuffled30Days.length} (30d) = ${totalShuffled} total`);
    
    // Combine: recent shuffled + older shuffled
    return [...shuffled24h, ...shuffled3Days, ...shuffled7Days, ...shuffled30Days];
}

/**
 * Fetch from a single RSS source
 */
async function fetchRSSSource(source) {
    try {
        const items = await parseRSS(source.url);
        
        // Filter for AI-related content (for general tech feeds)
        const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'llm', 'gpt', 'claude', 'chatbot', 'automation'];
        const filteredItems = source.priority === 'low' 
            ? items.filter(item => {
                const title = (item.title?.[0] || '').toLowerCase();
                const desc = (item.description?.[0] || '').toLowerCase();
                return aiKeywords.some(keyword => title.includes(keyword) || desc.includes(keyword));
            })
            : items;
        
        if (filteredItems.length === 0) return [];
        
        const normalizedItems = filteredItems.map(item => ({
            title: item.title ? item.title[0] : 'No Title',
            link: item.link ? item.link[0] : '',
            url: item.link ? item.link[0] : '',
            pubDate: item.pubDate ? new Date(item.pubDate[0]) : new Date(),
            description: item.description ? item.description[0].replace(/<[^>]*>/g, '').substring(0, 200) : '',
            image: extractImageFromItem(item),
            source: source.name
        }));
        
        console.log(`✅ ${source.name}: ${normalizedItems.length} articles`);
        return normalizedItems;
    } catch (error) {
        // Silently fail for individual sources (don't spam console)
        return [];
    }
}

/**
 * Fetch from NewsAPI (optional, free tier: 100 requests/day)
 * Get free API key from: https://newsapi.org/
 */
async function fetchNewsAPI() {
    if (!NEWS_API_KEY) return [];
    
    try {
        const response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
                q: 'artificial intelligence OR AI OR machine learning OR deep learning',
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: 20,
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 30 days
            },
            headers: {
                'X-API-Key': NEWS_API_KEY
            },
            timeout: 10000
        });
        
        if (!response.data.articles) return [];
        
        return response.data.articles.map(article => ({
            title: article.title || 'No Title',
            link: article.url || '',
            url: article.url || '',
            pubDate: article.publishedAt ? new Date(article.publishedAt) : new Date(),
            description: article.description || '',
            image: article.urlToImage || null,
            source: `NewsAPI: ${article.source?.name || 'Unknown'}`
        }));
    } catch (error) {
        if (error.response?.status === 429) {
            console.warn('⚠️  NewsAPI rate limit reached (free tier: 100/day)');
        }
        return [];
    }
}

/**
 * Parse RSS feed URL
 */
async function parseRSS(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 8000 // 8s timeout (faster)
        });

        const parser = new xml2js.Parser({
            explicitArray: true,
            tagNameProcessors: [xml2js.processors.stripPrefix]
        });
        const result = await parser.parseStringPromise(response.data);

        if (!result.rss || !result.rss.channel || !result.rss.channel[0].item) {
            return [];
        }

        return result.rss.channel[0].item;
    } catch (error) {
        throw error;
    }
}

/**
 * Extract image URL from RSS item
 */
function extractImageFromItem(item) {
    try {
        // Try media:content
        if (item['media:content'] && item['media:content'][0] && item['media:content'][0].$) {
            const url = item['media:content'][0].$.url;
            if (url) return url;
        }

        // Try media:thumbnail
        if (item['media:thumbnail'] && item['media:thumbnail'][0] && item['media:thumbnail'][0].$) {
            const url = item['media:thumbnail'][0].$.url;
            if (url) return url;
        }

        // Try enclosure
        if (item.enclosure && item.enclosure[0] && item.enclosure[0].$) {
            const enclosure = item.enclosure[0].$;
            if (enclosure.type && enclosure.type.startsWith('image/')) {
                return enclosure.url;
            }
        }

        // Try description HTML
        if (item.description && item.description[0]) {
            const desc = item.description[0];
            const imgMatch = desc.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch && imgMatch[1]) {
                return imgMatch[1];
            }
        }

        // Try content:encoded
        if (item['content:encoded'] && item['content:encoded'][0]) {
            const content = item['content:encoded'][0];
            const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch && imgMatch[1]) {
                return imgMatch[1];
            }
        }

        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Deduplicate news items based on similar titles
 */
function deduplicateNews(items) {
    const unique = [];
    const titles = new Set();
    const urls = new Set();

    for (const item of items) {
        // Normalize title
        const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Check URL first (more reliable)
        if (item.url && urls.has(item.url)) {
            continue;
        }
        
        // Check title similarity
        if (titles.has(normalizedTitle)) {
            continue;
        }

        titles.add(normalizedTitle);
        if (item.url) urls.add(item.url);
        unique.push(item);
    }

    return unique;
}

module.exports = {
    fetchLatestAINews
};
