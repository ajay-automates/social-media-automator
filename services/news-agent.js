/**
 * News Agent Service
 * Fetches real-time news from Google News RSS (Free, no API key needed)
 * 5 Categories: Technology, Business, Sports, World, Lifestyle
 * 2 articles per category = 10 total articles
 * Smart fallback: 24h → 48h → 72h if insufficient news found
 */

const axios = require('axios');
const xml2js = require('xml2js');

/**
 * News Categories (New 5-category system)
 */
const NEWS_CATEGORIES = {
  technology: {
    label: 'Technology & Innovation',
    keywords: ['AI', 'technology', 'software', 'startup', 'innovation', 'crypto', 'app', 'digital'],
    rssQuery: 'technology OR AI OR software OR startup OR innovation'
  },
  business: {
    label: 'Business & Finance',
    keywords: ['business', 'stock', 'finance', 'economy', 'market', 'trading', 'investment', 'corporate'],
    rssQuery: 'business OR stock market OR finance OR economy OR corporate'
  },
  sports: {
    label: 'Sports & Entertainment',
    keywords: ['sports', 'cricket', 'football', 'entertainment', 'movies', 'music', 'game', 'match'],
    rssQuery: 'sports OR cricket OR football OR entertainment OR movies'
  },
  world: {
    label: 'World & Politics',
    keywords: ['politics', 'world', 'government', 'international', 'election', 'policy', 'global'],
    rssQuery: 'politics OR world news OR international OR government OR global'
  },
  lifestyle: {
    label: 'Lifestyle & Culture',
    keywords: ['health', 'science', 'culture', 'climate', 'wellness', 'fashion', 'food', 'travel'],
    rssQuery: 'health OR science OR culture OR climate OR wellness OR lifestyle'
  }
};

// Cache for news articles (expires every 30 minutes)
const newsCache = {
  data: {},
  timestamp: {},
  CACHE_DURATION: 30 * 60 * 1000 // 30 minutes
};

/**
 * Fetch news from Google News RSS
 * Completely free, no API key needed
 * @param {string} category - Category key
 * @param {number} hoursBack - How many hours back to search (24, 48, or 72)
 * @returns {Promise<Array>} Array of articles
 */
async function fetchGoogleNewsRSS(category, hoursBack = 24) {
  try {
    if (!NEWS_CATEGORIES[category]) {
      console.error(`❌ Unknown category: ${category}`);
      return [];
    }

    const query = NEWS_CATEGORIES[category].rssQuery;
    const timeFilter = hoursBack === 24 ? '7d' : hoursBack === 48 ? '7d' : '30d';

    // Google News RSS URL with time-based filtering
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

    console.log(`   🔍 Fetching ${category} news from Google (${hoursBack}h window)...`);

    const response = await axios.get(rssUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SocialMediaAutomator/1.0)'
      }
    });

    // Parse XML
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    if (!result.rss || !result.rss.channel || !result.rss.channel[0].item) {
      return [];
    }

    const items = result.rss.channel[0].item || [];
    const articles = items.map(item => {
      const pubDate = item.pubDate ? new Date(item.pubDate[0]) : new Date();
      const hoursOld = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);

      // Only include articles within the requested time window
      if (hoursOld > hoursBack) {
        return null;
      }

      return {
        title: item.title ? item.title[0] : 'No Title',
        description: item.description ? item.description[0].replace(/<[^>]*>/g, '').substring(0, 200) : '',
        url: item.link ? item.link[0] : '',
        source: item.source && item.source[0] && item.source[0].$ ? item.source[0].$.url : 'Google News',
        publishedAt: pubDate.toISOString(),
        category: category,
        hoursOld: Math.round(hoursOld)
      };
    }).filter(article => article !== null);

    console.log(`   ✅ Fetched ${articles.length} articles for ${category}`);
    return articles;

  } catch (error) {
    console.error(`❌ Error fetching Google News RSS for ${category}:`, error.message);
    return [];
  }
}

/**
 * Fetch news for a specific category with intelligent fallback
 * 24h → 48h → 72h
 * @param {string} category - Category key
 * @returns {Promise<Array>} Array of 2 articles for this category
 */
async function fetchNewsByCategoryWithFallback(category) {
  try {
    // Try 24 hours first
    let articles = await fetchGoogleNewsRSS(category, 24);

    // If less than 2 articles, try 48 hours
    if (articles.length < 2) {
      console.log(`   ⚠️  Only ${articles.length} articles in 24h, trying 48h...`);
      const articles48 = await fetchGoogleNewsRSS(category, 48);
      articles = [...new Map([...articles, ...articles48].map(item => [item.url, item])).values()];
    }

    // If still less than 2, try 72 hours
    if (articles.length < 2) {
      console.log(`   ⚠️  Only ${articles.length} articles in 48h, trying 72h...`);
      const articles72 = await fetchGoogleNewsRSS(category, 72);
      articles = [...new Map([...articles, ...articles72].map(item => [item.url, item])).values()];
    }

    // Return top 2 articles
    return articles.slice(0, 2);

  } catch (error) {
    console.error(`❌ Error fetching news for ${category}:`, error);
    return [];
  }
}

/**
 * Fetch all news articles (2 per category = 10 total)
 * Uses caching to avoid repeated API calls
 * @param {boolean} bypassCache - If true, fetch fresh data
 * @returns {Promise<Object>} News grouped by category
 */
async function fetchNewsByCategory(bypassCache = false) {
  try {
    console.log('\n📰 Fetching news from all categories...');

    // Check cache
    const cacheKey = 'allNews';
    if (!bypassCache && newsCache.data[cacheKey] && newsCache.timestamp[cacheKey]) {
      const cacheAge = Date.now() - newsCache.timestamp[cacheKey];
      if (cacheAge < newsCache.CACHE_DURATION) {
        console.log(`   💾 Using cached news (${Math.round(cacheAge / 60000)} minutes old)`);
        return newsCache.data[cacheKey];
      }
    }

    // Fetch news for all categories in parallel
    const categoryKeys = Object.keys(NEWS_CATEGORIES);
    const newsPromises = categoryKeys.map(cat => fetchNewsByCategoryWithFallback(cat));
    const allNews = await Promise.all(newsPromises);

    // Group by category
    const grouped = {};
    categoryKeys.forEach((category, index) => {
      grouped[category] = {
        label: NEWS_CATEGORIES[category].label,
        articles: allNews[index] || []
      };
    });

    // Update cache
    newsCache.data[cacheKey] = grouped;
    newsCache.timestamp[cacheKey] = Date.now();

    console.log(`   ✅ Fetched ${Object.values(grouped).reduce((sum, cat) => sum + cat.articles.length, 0)} total articles`);
    return grouped;

  } catch (error) {
    console.error('❌ Error fetching news by category:', error);

    // Return cached data if available, even if expired
    if (newsCache.data['allNews']) {
      console.log('   ⚠️  Using expired cached news');
      return newsCache.data['allNews'];
    }

    return {};
  }
}

/**
 * Get trending news (legacy function for compatibility)
 */
async function fetchTrendingNews(limit = 20) {
  try {
    console.log('\n📰 Fetching trending news...');

    const grouped = await fetchNewsByCategory();

    // Flatten and return articles
    const articles = [];
    for (const [category, data] of Object.entries(grouped)) {
      articles.push(...data.articles);
    }

    return articles.slice(0, limit);

  } catch (error) {
    console.error('❌ Error fetching trending news:', error);
    return [];
  }
}

/**
 * Search news for specific keyword
 */
async function searchNews(keyword, limit = 10) {
  try {
    console.log(`\n📰 Searching news for: "${keyword}"`);

    if (!keyword || keyword.trim().length === 0) {
      return {
        keyword,
        success: false,
        error: 'Invalid keyword'
      };
    }

    // Try to fetch using Google News RSS for the keyword
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`;

    const response = await axios.get(rssUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SocialMediaAutomator/1.0)'
      }
    });

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);

    const items = result.rss?.channel?.[0]?.item || [];
    const articles = items.slice(0, limit).map(item => ({
      title: item.title ? item.title[0] : 'No Title',
      description: item.description ? item.description[0].replace(/<[^>]*>/g, '').substring(0, 200) : '',
      url: item.link ? item.link[0] : '',
      source: 'Google News',
      publishedAt: item.pubDate ? new Date(item.pubDate[0]).toISOString() : new Date().toISOString()
    }));

    console.log(`   ✅ Found ${articles.length} articles about "${keyword}"`);

    return {
      keyword,
      success: true,
      articles: articles,
      count: articles.length
    };

  } catch (error) {
    console.error('❌ Error searching news:', error);
    return {
      keyword,
      success: false,
      error: error.message
    };
  }
}

/**
 * Clear news cache (useful for testing or forcing refresh)
 */
function clearNewsCache() {
  newsCache.data = {};
  newsCache.timestamp = {};
  console.log('✅ News cache cleared');
}

/**
 * Get news for a specific category
 * @param {string} category - The category to fetch news for
 * @param {number} limit - Maximum number of articles to return (default: 10)
 * @returns {Promise<Array>} Array of articles for the category
 */
async function getNewsByCategory(category, limit = 10) {
  try {
    // Always fetch fresh data when specifically requesting a category
    const grouped = await fetchNewsByCategory(true);

    if (grouped[category] && grouped[category].articles) {
      return grouped[category].articles.slice(0, limit);
    }

    return [];
  } catch (error) {
    console.error(`❌ Error getting news for category ${category}:`, error);
    return [];
  }
}

module.exports = {
  fetchTrendingNews,
  fetchNewsByCategory,
  searchNews,
  clearNewsCache,
  NEWS_CATEGORIES,
  fetchGoogleNewsRSS,
  fetchNewsByCategoryWithFallback,
  getNewsByCategory
};
