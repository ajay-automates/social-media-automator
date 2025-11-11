/**
 * News Agent Service
 * Fetches real-time news from multiple sources (NewsAPI, RSS feeds, etc.)
 * Categorizes news and provides trending information by category
 */

const axios = require('axios');

const NEWS_CATEGORIES = {
  ai: { label: 'AI & Technology', keywords: ['artificial intelligence', 'AI', 'machine learning', 'GPT', 'neural', 'deep learning', 'LLM'] },
  stocks: { label: 'Stocks & Finance', keywords: ['stock market', 'crypto', 'bitcoin', 'nasdaq', 'market', 'trading', 'investment', 'finance'] },
  sports: { label: 'Sports', keywords: ['sports', 'cricket', 'football', 'soccer', 'basketball', 'tennis', 'game', 'match'] },
  technology: { label: 'Technology', keywords: ['tech', 'software', 'app', 'startup', 'cloud', 'data', 'digital'] },
  business: { label: 'Business & Economy', keywords: ['business', 'company', 'economy', 'industry', 'corporate', 'entrepreneur'] },
  entertainment: { label: 'Entertainment', keywords: ['movie', 'music', 'celebrity', 'film', 'show', 'entertainment', 'actor'] }
};

/**
 * Fetch news from NewsAPI
 * Free tier: 100 requests/day, limited to 30-day old articles
 */
async function fetchFromNewsAPI(query = 'news', category = null) {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.log('   ⚠️  NEWS_API_KEY not configured');
      return [];
    }

    const searchQuery = query && query !== 'news' ? query : 'trending OR breaking';
    const url = `https://newsapi.org/v2/everything`;

    const params = {
      q: searchQuery,
      sortBy: 'publishedAt',
      language: 'en',
      pageSize: 20,
      apiKey: apiKey
    };

    const response = await axios.get(url, { params, timeout: 8000 });

    if (!response.data.articles) {
      return [];
    }

    return response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      urlToImage: article.urlToImage,
      source: article.source.name,
      publishedAt: article.publishedAt,
      author: article.author,
      content: article.content
    }));

  } catch (error) {
    console.error('❌ NewsAPI fetch error:', error.message);
    return [];
  }
}

/**
 * Fetch trending news from multiple sources
 * Falls back to mock data if APIs unavailable
 */
async function fetchTrendingNews(limit = 20) {
  try {
    console.log('\n📰 Fetching trending news from all sources...');

    // Try NewsAPI first
    let articles = [];

    if (process.env.NEWS_API_KEY) {
      articles = await fetchFromNewsAPI('trending OR breaking');
      console.log(`   ✅ Fetched ${articles.length} articles from NewsAPI`);
    }

    // If no articles from API, use mock data for demo
    if (articles.length === 0) {
      console.log('   📝 Using mock news data for demonstration');
      articles = generateMockNews();
    }

    // Filter to limit
    return articles.slice(0, limit);

  } catch (error) {
    console.error('❌ Error fetching trending news:', error);
    return generateMockNews();
  }
}

/**
 * Generate mock news data for testing
 */
function generateMockNews() {
  const now = new Date();
  const mockArticles = [
    {
      title: 'Latest AI Breakthrough: New Language Model Reaches Human-Level Performance',
      description: 'Researchers announce significant advancement in artificial intelligence with new model surpassing previous benchmarks',
      url: 'https://www.techcrunch.com/ai/',
      source: 'TechCrunch',
      publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      category: 'ai'
    },
    {
      title: 'Stock Market Hits Record High as Tech Stocks Surge',
      description: 'Major tech companies post strong earnings leading to market rally',
      url: 'https://www.bloomberg.com/markets',
      source: 'Bloomberg',
      publishedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      category: 'stocks'
    },
    {
      title: 'Cricket World Cup: India Wins Thrilling Semi-Final Match',
      description: 'India advances to finals with spectacular victory in high-scoring encounter',
      url: 'https://www.espncricinfo.com/',
      source: 'ESPNcricinfo',
      publishedAt: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
      category: 'sports'
    },
    {
      title: 'Major Tech Company Announces Revolutionary Product Launch',
      description: 'New device combines AI and quantum computing for unprecedented capabilities',
      url: 'https://www.theverge.com/tech',
      source: 'The Verge',
      publishedAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      category: 'technology'
    },
    {
      title: 'Global Economic Summit Focuses on AI Regulation',
      description: 'World leaders discuss framework for responsible AI development and deployment',
      url: 'https://www.bloomberg.com/news',
      source: 'Bloomberg',
      publishedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      category: 'business'
    },
    {
      title: 'Blockchain Technology Reshapes Supply Chain Management',
      description: 'Companies adopt distributed ledger technology for enhanced transparency',
      url: 'https://www.coindesk.com/',
      source: 'CoinDesk',
      publishedAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
      category: 'stocks'
    }
  ];

  return mockArticles;
}

/**
 * Categorize articles by keywords
 */
function categorizeArticles(articles) {
  return articles.map(article => {
    const title = (article.title || '').toLowerCase();
    const description = (article.description || '').toLowerCase();
    const combinedText = `${title} ${description}`;

    // Find best matching category
    let bestCategory = 'technology';
    let bestMatch = 0;

    for (const [catKey, catData] of Object.entries(NEWS_CATEGORIES)) {
      const matches = catData.keywords.filter(keyword =>
        combinedText.includes(keyword.toLowerCase())
      ).length;

      if (matches > bestMatch) {
        bestMatch = matches;
        bestCategory = catKey;
      }
    }

    return {
      ...article,
      category: bestCategory,
      categoryLabel: NEWS_CATEGORIES[bestCategory].label
    };
  });
}

/**
 * Get news by category
 */
async function getNewsByCategory(category = null, limit = 20) {
  try {
    console.log(`\n📰 Fetching news${category ? ` for category: ${category}` : ''}`);

    let articles = await fetchTrendingNews(100);
    articles = categorizeArticles(articles);

    if (category && NEWS_CATEGORIES[category]) {
      articles = articles.filter(a => a.category === category);
    }

    // Group by category
    const grouped = {};
    for (const [catKey, catData] of Object.entries(NEWS_CATEGORIES)) {
      grouped[catKey] = {
        label: catData.label,
        articles: articles.filter(a => a.category === catKey).slice(0, 4)
      };
    }

    console.log(`   ✅ Categorized articles by topic`);

    return grouped;

  } catch (error) {
    console.error('❌ Error getting news by category:', error);
    return {};
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

    const articles = await fetchFromNewsAPI(keyword, null);
    const categorized = categorizeArticles(articles);

    console.log(`   ✅ Found ${categorized.length} articles about "${keyword}"`);

    return {
      keyword,
      success: true,
      articles: categorized.slice(0, limit),
      count: categorized.length
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

module.exports = {
  fetchTrendingNews,
  getNewsByCategory,
  searchNews,
  NEWS_CATEGORIES,
  categorizeArticles
};
