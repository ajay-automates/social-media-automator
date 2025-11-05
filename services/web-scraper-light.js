/**
 * Lightweight Web Scraper Service
 * Uses axios + cheerio for simple HTML scraping (no browser required)
 * Much lighter than Playwright - ideal for Railway deployment
 */

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape content from a web page using cheerio (lightweight, no browser)
 * @param {string} url - URL to scrape
 * @returns {Promise<string>} - Scraped text content
 */
async function scrapeWebContent(url) {
  try {
    console.log(`🌐 Starting lightweight web scrape for: ${url}`);
    
    // Fetch the HTML
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SocialMediaAutomatorBot/1.0)',
      },
      timeout: 30000, // 30 second timeout
      maxRedirects: 5
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, style, noscript, nav, header, footer, aside, iframe, audio, video').remove();
    $('.navigation, .menu, .sidebar, .comments, .related-posts, .social-share, .advertisement').remove();
    
    // Get page title
    const pageTitle = $('title').text().trim() || 
                     $('meta[property="og:title"]').attr('content') || 
                     $('h1').first().text().trim() || 
                     'Untitled';
    
    console.log(`📄 Page title: ${pageTitle}`);
    
    // Try multiple content selectors in order of preference
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.post-body',
      '.article-body',
      '#content',
      '#main-content',
      '.main-content'
    ];
    
    let extractedText = '';
    
    // Try each selector
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text()
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();
        
        if (text.length > 100) {
          extractedText = text;
          console.log(`✅ Content extracted using selector: ${selector} (${text.length} chars)`);
          break;
        }
      }
    }
    
    // Fallback: Get all paragraphs if no content found
    if (!extractedText || extractedText.length < 100) {
      console.log('📝 Using paragraph extraction as fallback...');
      const paragraphs = $('p').map((i, el) => $(el).text().trim()).get();
      extractedText = paragraphs
        .filter(p => p.length > 20)
        .join('\n\n')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    // Final fallback: Get body text
    if (!extractedText || extractedText.length < 50) {
      console.log('📄 Using body text as last resort...');
      extractedText = $('body').text()
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    }
    
    if (!extractedText || extractedText.length < 50) {
      throw new Error('Could not extract sufficient content from the webpage');
    }
    
    // Limit content length to avoid token limits
    const maxLength = 10000;
    if (extractedText.length > maxLength) {
      extractedText = extractedText.substring(0, maxLength) + '...';
    }
    
    // Create formatted result
    const result = `TITLE: ${pageTitle}\n\nCONTENT:\n${extractedText}`;
    
    console.log(`✅ Successfully scraped content: ${result.length} characters`);
    return result;
    
  } catch (error) {
    console.error('❌ Web scraping error:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'ENOTFOUND') {
      throw new Error('URL not found. Please check the URL and try again.');
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error('Request timed out. The website may be slow or unavailable.');
    } else if (error.response?.status === 403 || error.response?.status === 401) {
      throw new Error('Access denied. The website is blocking automated requests.');
    } else if (error.response?.status === 404) {
      throw new Error('Page not found (404). Please check the URL.');
    } else {
      throw new Error(`Failed to scrape webpage: ${error.message}`);
    }
  }
}

/**
 * Check if a URL is a YouTube URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if YouTube URL
 */
function isYouTubeUrl(url) {
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=)/,
    /(?:youtu\.be\/)/,
    /(?:youtube\.com\/embed\/)/,
    /(?:youtube\.com\/v\/)/,
    /(?:youtube\.com\/shorts\/)/
  ];
  
  return youtubePatterns.some(pattern => pattern.test(url));
}

module.exports = {
  scrapeWebContent,
  isYouTubeUrl
};

