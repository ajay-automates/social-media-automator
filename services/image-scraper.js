const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Search for a relevant image using Bing Image Search (Thumbnail API)
 * This acts as a fallback when direct scraping is blocked (e.g. 403 Forbidden)
 */
async function searchBingImage(query) {
    if (!query) return null;
    try {
        // Append 'AI news' to context
        const encodedQuery = encodeURIComponent(query);
        // Bing Thumbnail API - unofficial but highly reliable for fallbacks
        // w=800, h=450 (16:9 aspect ratio approx)
        const imageUrl = `https://tse2.mm.bing.net/th?q=${encodedQuery}&w=800&h=450&c=7&rs=1&p=0`;
        return imageUrl;
    } catch (error) {
        console.error('Bing fallback failed:', error.message);
        return null;
    }
}

/**
 * Extract Open Graph image from a URL
 * Fast and reliable - just parses meta tags
 */
async function extractImageFromUrl(url, fallbackQuery = null) {
    try {
        // Fetch the HTML with a timeout and robust headers
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 8000,
            maxRedirects: 3
        });

        // Parse HTML
        const $ = cheerio.load(response.data);

        // Try Open Graph image first (most reliable)
        let imageUrl = $('meta[property="og:image"]').attr('content');

        // Fallback to Twitter card image
        if (!imageUrl) {
            imageUrl = $('meta[name="twitter:image"]').attr('content');
        }

        // Fallback to article image
        if (!imageUrl) {
            imageUrl = $('meta[property="article:image"]').attr('content');
        }

        // Fallback to first large image in content
        if (!imageUrl) {
            const firstImg = $('article img, .article img, .post img, .content img').first();
            imageUrl = firstImg.attr('src');
        }

        // Make sure URL is absolute
        if (imageUrl && !imageUrl.startsWith('http')) {
            const urlObj = new URL(url);
            imageUrl = new URL(imageUrl, urlObj.origin).href;
        }

        return imageUrl || null;

    } catch (error) {
        // If blocking or error occurs, and we have a fallback query, use Bing
        if (fallbackQuery) {
            try {
                // console.log(`Scraping failed for ${url}, trying Bing fallback for "${fallbackQuery}"...`);
                return await searchBingImage(fallbackQuery);
            } catch (k) {
                return null;
            }
        }
        return null;
    }
}

/**
 * Batch extract images from multiple URLs with concurrency limit
 * Accepts array of URL strings OR objects { url, query }
 */
async function extractImagesFromUrls(items, concurrency = 3) {
    const results = new Map();

    // Process in batches to avoid overwhelming servers
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);

        const promises = batch.map(async (item) => {
            const url = typeof item === 'string' ? item : item.url;
            const query = typeof item === 'object' ? item.query : null;

            // If item is just URL, we can't use fallback efficiently unless we deduce title (impossible)
            // But news-fetcher will pass object
            const image = await extractImageFromUrl(url, query);
            return { url, image };
        });

        const batchResults = await Promise.all(promises);
        batchResults.forEach(({ url, image }) => {
            results.set(url, image);
        });
    }

    return results;
}

module.exports = {
    extractImageFromUrl,
    extractImagesFromUrls
};
