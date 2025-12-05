const axios = require('axios');
const xml2js = require('xml2js');

async function parseRSS(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        return result.rss.channel[0].item;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return [];
    }
}

async function testFeeds() {
    console.log('📰 Testing News Sources...\n');

    // 1. Product Hunt RSS (Main feed, category filtering might be client-side or different URL)
    console.log('--- Product Hunt RSS (Main) ---');
    const phItems = await parseRSS('https://www.producthunt.com/feed');

    if (phItems && phItems.length > 0) {
        console.log(`Found ${phItems.length} items. Top 3:`);
        phItems.slice(0, 3).forEach(item => {
            console.log(`- [${new Date(item.pubDate).toLocaleDateString()}] ${item.title}: ${item.link}`);
        });
    } else {
        console.log('No items found or error.');
    }

    // 2. TechCrunch AI
    console.log('\n--- TechCrunch AI ---');
    const tcItems = await parseRSS('https://techcrunch.com/category/artificial-intelligence/feed/');

    if (tcItems && tcItems.length > 0) {
        console.log(`Found ${tcItems.length} items. Top 3:`);
        tcItems.slice(0, 3).forEach(item => {
            console.log(`- [${new Date(item.pubDate).toLocaleDateString()}] ${item.title}: ${item.link}`);
        });
    } else {
        console.log('No items found or error.');
    }

    // 3. Google News RSS (AI Tools last 48h)
    console.log('\n--- Google News RSS (AI Tools last 48h) ---');
    const gnItems = await parseRSS('https://news.google.com/rss/search?q=new+AI+tools+when:2d&hl=en-US&gl=US&ceid=US:en');

    if (gnItems && gnItems.length > 0) {
        console.log(`Found ${gnItems.length} items. Top 3:`);
        gnItems.slice(0, 3).forEach(item => {
            console.log(`- [${new Date(item.pubDate).toLocaleDateString()}] ${item.title}: ${item.link}`);
        });
    } else {
        console.log('No items found or error.');
    }
}

testFeeds();
