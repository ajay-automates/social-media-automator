const axios = require('axios');
const xml2js = require('xml2js');
const { extractImagesFromUrls } = require('./image-scraper');

/**
 * Comprehensive AI News Fetcher
 * Fetches from 30+ RSS sources and APIs for maximum variety
 */

// ========== RSS FEED SOURCES (FREE, NO API KEY NEEDED) ==========
const RSS_SOURCES = [
    // Major AI Companies (Official Blogs)
    { name: 'Anthropic News', url: 'https://www.anthropic.com/index.xml', priority: 'high' },
    { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', priority: 'high' },
    { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/', priority: 'high' },
    { name: 'DeepMind Blog', url: 'https://deepmind.google/blog/rss.xml', priority: 'high' },
    { name: 'Meta AI Research', url: 'https://ai.meta.com/blog/feed/', priority: 'high' },
    { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', priority: 'high' },

    // Tech News Sites (AI Sections)
    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', priority: 'high' },
    { name: 'Ars Technica AI', url: 'https://arstechnica.com/tag/artificial-intelligence/feed/', priority: 'high' },
    { name: 'ZDNet AI', url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml', priority: 'high' },
    { name: 'VentureBeat AI', url: 'https://venturebeat.com/ai/feed/', priority: 'high' },
    { name: 'The Verge AI', url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', priority: 'medium' },
    { name: 'CNET AI', url: 'https://www.cnet.com/rss/news/artificial-intelligence/', priority: 'medium' },

    // AI-Focused Publications
    { name: 'MIT Technology Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/', priority: 'high' },
    { name: 'AI News', url: 'https://www.artificialintelligence-news.com/feed/', priority: 'medium' },

    // AI Newsletters
    { name: "Ben's Bites", url: 'https://bensbites.beehiiv.com/feed', priority: 'high' },
    { name: 'Superhuman AI', url: 'https://www.superhuman.ai/feed', priority: 'high' },

    // Product Hunt (AI launches)
    { name: 'Product Hunt AI', url: 'https://www.producthunt.com/feed', priority: 'medium' },

    // News Aggregators
    { name: 'Google News AI', url: 'https://news.google.com/rss/search?q=artificial+intelligence+AI&hl=en-US&gl=US&ceid=US:en', priority: 'high' },

    // Additional Tech Sources (low — filtered for AI keywords post-fetch)
    { name: 'Wired AI', url: 'https://www.wired.com/tag/artificial-intelligence/feed', priority: 'low' },
    { name: 'Engadget AI', url: 'https://www.engadget.com/rss.xml', priority: 'low' },
    { name: 'Gizmodo AI', url: 'https://gizmodo.com/rss', priority: 'low' },

    // Research & Engineering (kept, lower priority)
    { name: 'IEEE Spectrum AI', url: 'https://spectrum.ieee.org/rss/topic/artificial-intelligence/fulltext', priority: 'low' },

    // AI Twitter/X influencers via Nitter RSS (instances may go down — silently skipped on failure)
    { name: 'Twitter: Santiago Valdarrama', url: 'https://nitter.net/svpino/rss', priority: 'low' },
    { name: 'Twitter: Bindu Reddy', url: 'https://nitter.net/bindureddy/rss', priority: 'low' },
    { name: 'Twitter: The Rundown AI', url: 'https://nitter.net/TheRundownAI/rss', priority: 'low' },
    { name: 'Twitter: AI For Success', url: 'https://nitter.net/ai_for_success/rss', priority: 'low' },
];

// ========== API SOURCES ==========
const NEWS_API_KEY = process.env.NEWS_API_KEY; // Optional: newsapi.org (100 req/day free)

/**
 * Fetch latest AI news from ALL sources (RSS + GitHub + HN + Reddit + NewsAPI)
 */
async function fetchLatestAINews() {
    console.log('📰 Fetching AI news from 30+ sources...');
    const startTime = Date.now();

    let allNews = [];

    // --- RSS feeds ---
    const timestamp = Date.now();
    const rotationOffset = Math.floor((timestamp / (1000 * 60 * 5)) % RSS_SOURCES.length);

    const sortedSources = [
        ...RSS_SOURCES.filter(s => s.priority === 'high'),
        ...RSS_SOURCES.filter(s => s.priority === 'medium'),
        ...RSS_SOURCES.filter(s => s.priority === 'low')
    ];
    const rotatedSources = [
        ...sortedSources.slice(rotationOffset),
        ...sortedSources.slice(0, rotationOffset)
    ];

    console.log(`🔄 Source rotation offset: ${rotationOffset} (changes every 5 min)`);

    const batchSize = 10;
    for (let i = 0; i < rotatedSources.length; i += batchSize) {
        const batch = rotatedSources.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(source =>
                fetchRSSSource(source).catch(() => [])
            )
        );
        allNews = [...allNews, ...batchResults.flat()];

        if (i + batchSize < rotatedSources.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    // --- GitHub Trending (no API key needed) ---
    try {
        const ghNews = await fetchGitHubTrending();
        allNews = [...allNews, ...ghNews];
        console.log(`✅ GitHub Trending: ${ghNews.length} repos`);
    } catch (err) {
        console.error('❌ GitHub Trending:', err.message);
    }

    // --- Hacker News ---
    try {
        const hnNews = await fetchHackerNews();
        allNews = [...allNews, ...hnNews];
        console.log(`✅ Hacker News: ${hnNews.length} posts`);
    } catch (err) {
        console.error('❌ Hacker News:', err.message);
    }

    // --- Reddit AI subs ---
    try {
        const redditNews = await fetchRedditAI();
        allNews = [...allNews, ...redditNews];
        console.log(`✅ Reddit AI: ${redditNews.length} posts`);
    } catch (err) {
        console.error('❌ Reddit AI:', err.message);
    }

    // --- NewsAPI (optional) ---
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

    // Extract images for articles without images
    const articlesNeedingImages = uniqueNews.filter(item => !item.image && item.url).slice(0, 20);
    if (articlesNeedingImages.length > 0) {
        console.log(`🖼️  Extracting images from ${articlesNeedingImages.length} article URLs...`);
        const itemsToScrape = articlesNeedingImages.map(item => ({ url: item.url, query: item.title }));
        const imageMap = await extractImagesFromUrls(itemsToScrape, 5);

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

    // Group by recency and shuffle each group for variety
    const oneDayAgo = new Date(); oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const last24h = sortedNews.filter(item => item.pubDate >= oneDayAgo);
    const last3Days = sortedNews.filter(item => item.pubDate >= threeDaysAgo && item.pubDate < oneDayAgo);
    const last7Days = sortedNews.filter(item => item.pubDate >= sevenDaysAgo && item.pubDate < threeDaysAgo);
    const last30Days = sortedNews.filter(item => item.pubDate < sevenDaysAgo);

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

    console.log(`🎲 Shuffled: ${shuffled24h.length} (24h) + ${shuffled3Days.length} (3d) + ${shuffled7Days.length} (7d) + ${shuffled30Days.length} (30d)`);

    return [...shuffled24h, ...shuffled3Days, ...shuffled7Days, ...shuffled30Days];
}

/**
 * Fetch GitHub Trending AI repos (no auth required for search API)
 */
async function fetchGitHubTrending() {
    const queries = [
        'ai language:python',
        'llm language:python'
    ];

    const results = await Promise.all(queries.map(q =>
        axios.get('https://api.github.com/search/repositories', {
            params: { q, sort: 'stars', order: 'desc', per_page: 10 },
            headers: {
                'Accept': 'application/vnd.github+json',
                'User-Agent': 'social-media-automator'
            },
            timeout: 8000
        }).catch(() => null)
    ));

    const items = [];
    const seen = new Set();

    for (const res of results) {
        if (!res?.data?.items) continue;
        for (const repo of res.data.items) {
            if (seen.has(repo.html_url)) continue;
            seen.add(repo.html_url);
            items.push({
                title: `⭐ ${repo.full_name} — ${repo.description || 'AI project on GitHub'}`,
                link: repo.html_url,
                url: repo.html_url,
                pubDate: new Date(repo.updated_at),
                description: `${repo.description || ''} | ⭐ ${repo.stargazers_count.toLocaleString()} stars | ${repo.language || 'Python'}`,
                image: null,
                source: 'GitHub Trending'
            });
        }
    }

    return items;
}

/**
 * Fetch Hacker News top AI Stories
 */
async function fetchHackerNews() {
    const [topStories, freshStories] = await Promise.all([
        // High-engagement general stories (points > 200)
        axios.get('https://hn.algolia.com/api/v1/search', {
            params: { tags: 'story', numericFilters: 'points>200', hitsPerPage: 15 },
            timeout: 8000
        }).catch(() => null),
        // Fresh AI-specific stories (points > 50)
        axios.get('https://hn.algolia.com/api/v1/search_by_date', {
            params: { tags: 'story', query: 'AI', numericFilters: 'points>50', hitsPerPage: 15 },
            timeout: 8000
        }).catch(() => null)
    ]);

    const aiKeywords = ['ai', 'llm', 'gpt', 'claude', 'gemini', 'openai', 'anthropic', 'machine learning',
        'deep learning', 'neural', 'chatbot', 'model', 'agent', 'inference', 'fine-tun'];

    const normalize = (hit) => ({
        title: hit.title || 'HN Post',
        link: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        pubDate: hit.created_at ? new Date(hit.created_at) : new Date(),
        description: `🔶 ${hit.points || 0} points · ${hit.num_comments || 0} comments on Hacker News`,
        image: null,
        source: 'Hacker News'
    });

    const items = [];
    const seen = new Set();

    for (const res of [topStories, freshStories]) {
        if (!res?.data?.hits) continue;
        for (const hit of res.data.hits) {
            if (!hit.title) continue;
            const titleLower = hit.title.toLowerCase();
            const isAI = aiKeywords.some(kw => titleLower.includes(kw));
            if (!isAI) continue;
            const key = hit.url || hit.objectID;
            if (seen.has(key)) continue;
            seen.add(key);
            items.push(normalize(hit));
        }
    }

    return items;
}

/**
 * Fetch hot posts from AI-focused Reddit communities
 */
async function fetchRedditAI() {
    const subreddits = [
        'ChatGPT',
        'LocalLLaMA',
        'singularity',
        'artificial',
        'MachineLearning'
    ];

    const results = await Promise.all(subreddits.map(sub =>
        axios.get(`https://www.reddit.com/r/${sub}/hot.json`, {
            params: { limit: 10 },
            headers: {
                'User-Agent': 'social-media-automator/1.0'
            },
            timeout: 8000
        }).catch(() => null)
    ));

    const items = [];
    const seen = new Set();

    for (const res of results) {
        if (!res?.data?.data?.children) continue;
        for (const child of res.data.data.children) {
            const post = child.data;
            if (post.stickied || post.score < 10) continue;
            const url = post.url?.startsWith('http') ? post.url : `https://reddit.com${post.permalink}`;
            if (seen.has(url)) continue;
            seen.add(url);
            items.push({
                title: post.title,
                link: `https://reddit.com${post.permalink}`,
                url: url,
                pubDate: new Date(post.created_utc * 1000),
                description: `🔼 ${post.score.toLocaleString()} upvotes · r/${post.subreddit} · ${post.num_comments} comments`,
                image: post.thumbnail?.startsWith('http') ? post.thumbnail : null,
                source: `Reddit r/${post.subreddit}`
            });
        }
    }

    return items;
}

/**
 * Fetch from a single RSS source
 */
async function fetchRSSSource(source) {
    try {
        const items = await parseRSS(source.url);

        // Filter for AI-related content only for low-priority general feeds
        const aiKeywords = ['ai', 'artificial intelligence', 'machine learning', 'deep learning',
            'neural network', 'llm', 'gpt', 'claude', 'chatbot', 'automation',
            'openai', 'anthropic', 'gemini', 'copilot', 'agent'];
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
        // Silently fail for individual sources
        return [];
    }
}

/**
 * Fetch from NewsAPI (optional, free tier: 100 req/day)
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
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            headers: { 'X-API-Key': NEWS_API_KEY },
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
            timeout: 8000
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
        if (item['media:content']?.[0]?.$?.url) return item['media:content'][0].$.url;
        if (item['media:thumbnail']?.[0]?.$?.url) return item['media:thumbnail'][0].$.url;

        if (item.enclosure?.[0]?.$) {
            const enc = item.enclosure[0].$;
            if (enc.type?.startsWith('image/')) return enc.url;
        }

        const descHtml = item.description?.['0'] || '';
        const contentHtml = item['content:encoded']?.['0'] || '';
        for (const html of [descHtml, contentHtml]) {
            const m = html.match(/<img[^>]+src="([^">]+)"/);
            if (m?.[1]) return m[1];
        }

        return null;
    } catch { return null; }
}

/**
 * Deduplicate news items based on URL and title
 */
function deduplicateNews(items) {
    const unique = [];
    const titles = new Set();
    const urls = new Set();

    for (const item of items) {
        const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (item.url && urls.has(item.url)) continue;
        if (titles.has(normalizedTitle)) continue;
        titles.add(normalizedTitle);
        if (item.url) urls.add(item.url);
        unique.push(item);
    }

    return unique;
}

module.exports = { fetchLatestAINews };
