/**
 * Web Scraper Service
 * Scrapes content from general websites using Crawlee and Playwright
 * Provides flexible content extraction with common selectors
 */

const { PlaywrightCrawler, Configuration } = require('crawlee');

/**
 * Scrape content from a web page
 * @param {string} url - URL to scrape
 * @returns {Promise<string>} - Scraped text content
 */
async function scrapeWebContent(url) {
  try {
    console.log(`🌐 Starting web scrape for: ${url}`);
    
    let scrapedContent = '';
    let pageTitle = '';
    
    // Configure storage location to avoid triggering nodemon
    const config = new Configuration({
      persistStorage: false, // Don't persist storage to avoid file watchers
    });
    
    const crawler = new PlaywrightCrawler({
      // Use headless mode for better performance
      launchContext: {
        launchOptions: {
          headless: true,
        },
      },
      
      // Set timeouts
      requestHandlerTimeoutSecs: 60,
      navigationTimeoutSecs: 60,
      
      // Request handler
      async requestHandler({ page, request, log }) {
        log.info(`Processing ${request.url}...`);
        
        // Wait for the page to load
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
          log.warning('Network idle timeout, continuing anyway...');
        });
        
        // Additional wait for dynamic content (JavaScript-rendered sites)
        await page.waitForTimeout(2000);
        
        // Try to wait for common content indicators
        await Promise.race([
          page.waitForSelector('article', { timeout: 5000 }).catch(() => null),
          page.waitForSelector('main', { timeout: 5000 }).catch(() => null),
          page.waitForSelector('.content', { timeout: 5000 }).catch(() => null),
          page.waitForSelector('.article', { timeout: 5000 }).catch(() => null),
        ]).catch(() => {
          log.warning('Content selectors not found, proceeding anyway...');
        });
        
        // Get page title
        pageTitle = await page.title();
        log.info(`Page title: ${pageTitle}`);
        
        // General content extraction strategy
        // Try multiple selectors to cover most websites
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
          '.main-content',
          '.main-story',
          '.newspaper',
          '.news-grid',
          'body'
        ];
        
        let extractedText = '';
        
        // Try each selector until we find content
        for (const selector of contentSelectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              // Extract text content, removing scripts and styles
              const text = await page.evaluate((el, sel) => {
                // Remove script and style tags
                const scripts = el.querySelectorAll('script, style, noscript, audio, video');
                scripts.forEach(script => script.remove());
                
                // Remove navigation, header, footer, sidebar elements, audio players
                const noise = el.querySelectorAll('nav, header, footer, aside, .sidebar, .navigation, .menu, .comments, .related-posts, .audio-player, .social-icons, .footer-content, .audio-nav-tabs, .edition-info');
                noise.forEach(elem => elem.remove());
                
                // Special handling for news sites with multiple articles
                if (sel === '.newspaper' || sel === 'main' || sel === '.news-grid') {
                  // Extract all articles
                  const articles = el.querySelectorAll('article, .article');
                  if (articles.length > 0) {
                    let allArticles = [];
                    articles.forEach(article => {
                      const headline = article.querySelector('h2, h3, .headline, .main-headline');
                      const description = article.querySelector('p, .description, .main-description');
                      
                      if (headline) {
                        let articleText = headline.textContent.trim();
                        if (description) {
                          articleText += ' - ' + description.textContent.trim();
                        }
                        allArticles.push(articleText);
                      }
                    });
                    
                    if (allArticles.length > 0) {
                      return allArticles.join('\n\n');
                    }
                  }
                }
                
                // Get text content
                let text = el.innerText || el.textContent || '';
                
                // Clean up whitespace
                text = text
                  .replace(/\s+/g, ' ')
                  .replace(/\n\s*\n/g, '\n')
                  .trim();
                
                return text;
              }, element, selector);
              
              if (text && text.length > 100) {
                extractedText = text;
                log.info(`✅ Content extracted using selector: ${selector} (${text.length} chars)`);
                break;
              }
            }
          } catch (error) {
            log.warning(`Selector ${selector} failed: ${error.message}`);
          }
        }
        
        // If no content found with selectors, try getting all paragraphs
        if (!extractedText || extractedText.length < 100) {
          log.info('Trying paragraph extraction as fallback...');
          extractedText = await page.evaluate(() => {
            const paragraphs = Array.from(document.querySelectorAll('p'));
            return paragraphs
              .map(p => p.innerText || p.textContent || '')
              .filter(text => text.length > 20)
              .join('\n\n')
              .replace(/\s+/g, ' ')
              .trim();
          });
        }
        
        // If still no content, get body text as last resort
        if (!extractedText || extractedText.length < 100) {
          log.info('Using body text as last resort...');
          extractedText = await page.evaluate(() => {
            // Remove noise elements
            const noise = document.querySelectorAll('script, style, noscript, nav, header, footer, aside');
            noise.forEach(elem => elem.remove());
            
            return document.body.innerText || document.body.textContent || '';
          });
        }
        
        scrapedContent = extractedText;
        log.info(`✅ Final content length: ${scrapedContent.length} characters`);
      },
      
      // Error handler
      failedRequestHandler({ request, log }) {
        log.error(`Request ${request.url} failed after retries`);
      },
      
      // Limit concurrency to 1 since we're only scraping one URL
      maxConcurrency: 1,
      
      // Retry failed requests
      maxRequestRetries: 2,
    });
    
    // Run the crawler
    await crawler.run([url]);
    
    if (!scrapedContent || scrapedContent.length < 50) {
      throw new Error('Could not extract sufficient content from the webpage');
    }
    
    // Create a formatted result with title and content
    const result = pageTitle 
      ? `TITLE: ${pageTitle}\n\nCONTENT:\n${scrapedContent}`
      : scrapedContent;
    
    console.log(`✅ Successfully scraped content: ${result.length} characters`);
    return result;
    
  } catch (error) {
    console.error('❌ Web scraping error:', error);
    throw new Error(`Failed to scrape webpage: ${error.message}`);
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
