const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extract Open Graph image from a URL
 * Fast and reliable - just parses meta tags
 */
async function extractImageFromUrl(url) {
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
            timeout: 8000, // Increased timeout
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
        console.error(`Failed to extract image from ${url}:`, error.message);
        return null;
    }
}

/**
 * Batch extract images from multiple URLs with concurrency limit
 */
async function extractImagesFromUrls(urls, concurrency = 3) {
    const results = new Map();

    // Process in batches to avoid overwhelming servers
    for (let i = 0; i < urls.length; i += concurrency) {
        const batch = urls.slice(i, i + concurrency);
        const promises = batch.map(async (url) => {
            const image = await extractImageFromUrl(url);
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
