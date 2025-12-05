const axios = require('axios');
const xml2js = require('xml2js');

/**
 * Fetch latest AI news from multiple RSS sources
 * @returns {Promise<Array>} Array of news items { title, link, pubDate, source }
 */
async function fetchLatestAINews() {
    console.log('📰 Fetching latest AI news from RSS feeds...');

    const sources = [
        { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss/' },
        { name: 'Anthropic News', url: 'https://www.anthropic.com/news/rss' },
        { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/' },
        { name: 'DeepMind Blog', url: 'https://deepmind.google/blog/rss.xml' },
        { name: 'Microsoft AI', url: 'https://blogs.microsoft.com/ai/feed/' },
        { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
        { name: 'The Verge AI', url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml' },
        { name: 'Wired AI', url: 'https://www.wired.com/tag/artificial-intelligence/feed' },
        { name: 'Ars Technica AI', url: 'https://arstechnica.com/tag/artificial-intelligence/feed/' }
    ];

    let allNews = [];

    for (const source of sources) {
        try {
            const items = await parseRSS(source.url);
            console.log(`✅ Fetched ${items.length} items from ${source.name}`);

            // Add source info and normalize
            const normalizedItems = items.map(item => ({
                title: item.title ? item.title[0] : 'No Title',
                link: item.link ? item.link[0] : '',
                url: item.link ? item.link[0] : '', // Alias for compatibility
                pubDate: item.pubDate ? new Date(item.pubDate[0]) : new Date(),
                description: item.description ? item.description[0] : '',
                source: source.name
            }));

            allNews = [...allNews, ...normalizedItems];
        } catch (error) {
            console.error(`❌ Error fetching ${source.name}:`, error.message);
        }
    }

    // Filter for last 48 hours
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const recentNews = allNews.filter(item => item.pubDate >= twoDaysAgo);

    // Deduplicate by title (fuzzy match or exact)
    const uniqueNews = deduplicateNews(recentNews);

    console.log(`✨ Found ${uniqueNews.length} unique news items from the last 48 hours`);

    // Sort by date (newest first)
    return uniqueNews.sort((a, b) => b.pubDate - a.pubDate);
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
            timeout: 10000 // 10s timeout
        });

        const parser = new xml2js.Parser();
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
 * Deduplicate news items based on similar titles
 */
function deduplicateNews(items) {
    const unique = [];
    const titles = new Set();

    for (const item of items) {
        // Simple normalization: lowercase, remove special chars
        const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Check if we already have a very similar title
        // (This is a basic check, could be improved with Levenshtein distance if needed)
        if (!titles.has(normalizedTitle)) {
            titles.add(normalizedTitle);
            unique.push(item);
        }
    }

    return unique;
}

module.exports = {
    fetchLatestAINews
};
