const axios = require('axios');
const xml2js = require('xml2js');
const { extractImagesFromUrls } = require('./image-scraper');

/**
 * Fetch latest AI news from multiple RSS sources
 * @returns {Promise<Array>} Array of news items { title, link, pubDate, source }
 */
async function fetchLatestAINews() {
    console.log('📰 Fetching latest AI news from RSS feeds...');

    const sources = [
        // { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss/' }, // 403 Forbidden
        { name: 'Anthropic News', url: 'https://www.anthropic.com/index.xml' }, // Updated URL?
        { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/' },
        { name: 'DeepMind Blog', url: 'https://deepmind.google/blog/rss.xml' },
        // { name: 'Microsoft AI', url: 'https://blogs.microsoft.com/ai/feed/' }, // 403 Forbidden
        { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
        // { name: 'The Verge AI', url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml' }, // 404
        // { name: 'Wired AI', url: 'https://www.wired.com/tag/artificial-intelligence/feed' }, // 404
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
                description: item.description ? item.description[0].replace(/<[^>]*>/g, '') : '',
                image: extractImageFromItem(item),
                source: source.name
            }));

            allNews = [...allNews, ...normalizedItems];
        } catch (error) {
            console.error(`❌ Error fetching ${source.name}:`, error.message);
        }
    }

    // Filter for last 7 days (extended from 48 hours to get more variety)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentNews = allNews.filter(item => item.pubDate >= sevenDaysAgo);

    // Deduplicate by title (fuzzy match or exact)
    const uniqueNews = deduplicateNews(recentNews);

    console.log(`✨ Found ${uniqueNews.length} unique news items from the last 7 days`);

    // Extract images from URLs for articles without images
    const articlesNeedingImages = uniqueNews.filter(item => !item.image && item.url);
    if (articlesNeedingImages.length > 0) {
        console.log(`🖼️  Extracting images from ${articlesNeedingImages.length} article URLs...`);
        const itemsToScrape = articlesNeedingImages.map(item => ({ url: item.url, query: item.title }));
        const imageMap = await extractImagesFromUrls(itemsToScrape, 3); // 3 concurrent requests

        // Update articles with extracted images
        uniqueNews.forEach(item => {
            if (!item.image && imageMap.has(item.url)) {
                item.image = imageMap.get(item.url);
            }
        });

        const extractedCount = Array.from(imageMap.values()).filter(img => img !== null).length;
        console.log(`✅ Successfully extracted ${extractedCount} images from article pages`);
    }

    // Sort by date (newest first), then shuffle to show variety on refresh
    const sortedNews = uniqueNews.sort((a, b) => b.pubDate - a.pubDate);
    
    // Shuffle recent articles (last 3 days) to show different articles on refresh
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const veryRecent = sortedNews.filter(item => item.pubDate >= threeDaysAgo);
    const older = sortedNews.filter(item => item.pubDate < threeDaysAgo);
    
    // Shuffle very recent articles
    for (let i = veryRecent.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [veryRecent[i], veryRecent[j]] = [veryRecent[j], veryRecent[i]];
    }
    
    // Combine: shuffled recent + older articles
    return [...veryRecent, ...older];
}

/**
 * Extract image URL from RSS item
 * Supports: media:content, media:thumbnail, enclosure, and HTML img tags
 */
function extractImageFromItem(item) {
    try {
        // Try media:content (common in many feeds)
        if (item['media:content'] && item['media:content'][0] && item['media:content'][0].$) {
            const url = item['media:content'][0].$.url;
            if (url) return url;
        }

        // Try media:thumbnail
        if (item['media:thumbnail'] && item['media:thumbnail'][0] && item['media:thumbnail'][0].$) {
            const url = item['media:thumbnail'][0].$.url;
            if (url) return url;
        }

        // Try enclosure tag (podcasts and some news feeds)
        if (item.enclosure && item.enclosure[0] && item.enclosure[0].$) {
            const enclosure = item.enclosure[0].$;
            if (enclosure.type && enclosure.type.startsWith('image/')) {
                return enclosure.url;
            }
        }

        // Try to extract from description HTML
        if (item.description && item.description[0]) {
            const desc = item.description[0];
            // Look for img tags
            const imgMatch = desc.match(/<img[^>]+src="([^">]+)"/);
            if (imgMatch && imgMatch[1]) {
                return imgMatch[1];
            }
        }

        // Try content:encoded (WordPress feeds)
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

        // Configure parser to handle media namespaces
        const parser = new xml2js.Parser({
            explicitArray: true,
            tagNameProcessors: [xml2js.processors.stripPrefix] // This helps with media: prefix
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
