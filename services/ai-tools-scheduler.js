const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const { schedulePost } = require('./scheduler');
const { generatePostVariations } = require('./ai');
const { scrapeWebContent } = require('./web-scraper-light'); // Import scraper
const { generateImage } = require('./ai-image'); // Import image generation
const cloudinaryService = require('./cloudinary'); // Import cloudinary for upload

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// AI Tool Categories to ensure variety
const AI_CATEGORIES = [
    'Productivity & Writing',
    'Image & Video Generation',
    'Coding & Development',
    'Marketing & SEO',
    'Audio & Voice',
    'Research & Data',
    'Business Automation',
    'Design & UI/UX',
    '3D & Animation',
    'Education & Learning'
];

/**
 * Get the default user ID to schedule posts for
 * In a real app, this would be based on subscription/configuration
 */
async function getDefaultUserId() {
    try {
        // Try getting from user_accounts first (more reliable as it implies active social accounts)
        const { data: accounts, error: accountsError } = await supabase
            .from('user_accounts')
            .select('user_id')
            .limit(1);

        if (!accountsError && accounts && accounts.length > 0) {
            return accounts[0].user_id;
        }

        // Fallback to users table
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1)
            .single();

        if (error) {
            console.error('❌ Error fetching default user:', error.message);
            return null;
        }

        return data?.id;
    } catch (error) {
        console.error('❌ Error in getDefaultUserId:', error.message);
        return null;
    }
}

/**
 * Generate and schedule posts about AI tools (or business topics from URL)
 * @param {string} specificUserId - Optional user ID to schedule for
 * @param {string} sourceUrl - Optional URL to generate posts from
 * @param {Array} articles - Optional list of specific articles to schedule
 * @param {Array} targetPlatforms - Optional list of platforms to schedule for (default: linkedin, twitter)
 * @param {string} scheduleMode - Scheduling mode: 'default' (10 tomorrow), 'today_hourly' (10 today), 'weekly' (21 posts over 7 days)
 * @param {Object} businessProfile - Optional business profile to use for content generation
 */
async function scheduleAIToolsPosts(specificUserId = null, sourceUrl = null, articles = null, targetPlatforms = null, scheduleMode = 'default', businessProfile = null) {
    console.log(`🤖 Starting post generation...${sourceUrl ? ` (Source: ${sourceUrl})` : ''}${articles ? ` (Articles: ${articles.length})` : ''}${targetPlatforms ? ` (Platforms: ${targetPlatforms.join(', ')})` : ''} [Mode: ${scheduleMode}]`);

    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY not configured');
        }

        // Get user ID - use specific user if provided, otherwise get default
        const userId = specificUserId || await getDefaultUserId();
        if (!userId) {
            throw new Error('No user found to schedule posts for');
        }
        console.log(`👤 Scheduling posts for user ID: ${userId}`);

        // Determine how many posts to generate based on mode
        const postCount = scheduleMode === 'weekly' ? 7 : 7; // Reduced from 21/10 to 7 to save costs (one post per day)
        
        // 1. Generate list of topics
        let tools = [];

        if (articles && Array.isArray(articles) && articles.length > 0) {
            // Context: Specific articles provided (Bulk Schedule)
            console.log(`📰 Using ${articles.length} provided articles...`);
            tools = articles.map(article => ({
                name: article.headline,
                category: 'AI News',
                hook: article.summary,
                source_link: article.url || article.link
            }));
        } else if (businessProfile) {
            // Context: Business Profile provided
            console.log(`🏢 Generating posts from business profile: ${businessProfile.business_name}`);
            tools = await generateBusinessProfileTopics(businessProfile, postCount);
        } else if (sourceUrl) {
            // Context: Business/Website URL provided
            console.log(`🌐 Scraping content from: ${sourceUrl}`);
            const content = await scrapeWebContent(sourceUrl);
            console.log(`🧠 Analyzing content to extract business topics...`);
            tools = await generateBusinessTopicsFromContent(content, sourceUrl, postCount);
        } else {
            // Context: Default AI News
            tools = await generateDailyAIToolsList(postCount);
        }

        console.log(`📋 Generated ${tools.length} topics to post about:`, tools.map(t => t.name).join(', '));

        // 2. Calculate schedule times based on mode
        console.log(`📅 Calculating schedule times for mode: ${scheduleMode}, count: ${tools.length}`);
        const scheduleTimes = calculateScheduleTimes(tools.length, scheduleMode);
        console.log(`📅 Generated ${scheduleTimes.length} schedule times`);
        
        // Log first few and last few times for verification
        if (scheduleTimes.length > 0) {
            console.log(`   First 3 times:`, scheduleTimes.slice(0, 3).map(t => t.toLocaleString()));
            console.log(`   Last 3 times:`, scheduleTimes.slice(-3).map(t => t.toLocaleString()));
        }

        // 3. Generate content and schedule each post
        let scheduled = 0;
        let failed = 0;

        // Determine platforms to use
        const platformsToUse = targetPlatforms && targetPlatforms.length > 0
            ? targetPlatforms
            : ['linkedin', 'twitter'];

        for (let i = 0; i < tools.length; i++) {
            const tool = tools[i];
            const scheduledTime = scheduleTimes[i];

            try {
                console.log(`✍️ Generating content for tool: ${tool.name} (${i + 1}/${tools.length})`);

                // Generate post content
                let postContent;
                if (businessProfile) {
                    // Use business profile context
                    postContent = await generateBusinessProfilePostContent(tool, businessProfile);
                } else if (sourceUrl && !articles) { // Only use business logic if scraping URL, not if using news articles with URLs
                    postContent = await generateBusinessPostContent(tool, sourceUrl);
                } else {
                    postContent = await generateToolPostContent(tool);
                }

                // 🎨 Generate image for the post
                let imageUrl = null;
                try {
                    console.log(`🎨 [${i + 1}/${tools.length}] Generating image for: ${tool.name}`);
                    const imagePrompt = generateImagePrompt(tool, sourceUrl);
                    console.log(`📝 Image prompt: ${imagePrompt.substring(0, 100)}...`);
                    
                    // Add timeout to image generation (30 seconds max)
                    const imagePromise = generateImage(imagePrompt, 'digital-art');
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Image generation timeout after 30s')), 30000)
                    );
                    
                    const imageResult = await Promise.race([imagePromise, timeoutPromise]);
                    
                    console.log(`📊 Image generation completed:`, {
                        success: imageResult?.success,
                        hasImageUrl: !!imageResult?.imageUrl,
                        provider: imageResult?.provider,
                        imageUrlLength: imageResult?.imageUrl?.length || 0
                    });
                    
                    if (imageResult && imageResult.success && imageResult.imageUrl) {
                        // If it's a Pollinations URL, use directly; otherwise upload to Cloudinary
                        if (imageResult.imageUrl.startsWith('https://image.pollinations.ai')) {
                            imageUrl = imageResult.imageUrl;
                            console.log(`✅ Image generated (Pollinations): ${imageUrl.substring(0, 100)}...`);
                        } else if (imageResult.imageUrl.startsWith('data:')) {
                            // Base64 image - upload to Cloudinary
                            console.log(`📤 Uploading base64 image to Cloudinary (${Math.round(imageResult.imageUrl.length / 1024)}KB)...`);
                            const uploadResult = await cloudinaryService.uploadImage(imageResult.imageUrl);
                            if (uploadResult && uploadResult.url) {
                                imageUrl = uploadResult.url;
                                console.log(`✅ Image uploaded to Cloudinary: ${imageUrl}`);
                            } else {
                                console.warn(`⚠️ Cloudinary upload failed:`, uploadResult);
                            }
                        } else if (imageResult.imageUrl.startsWith('http')) {
                            // Direct URL (from other providers)
                            imageUrl = imageResult.imageUrl;
                            console.log(`✅ Image generated (${imageResult.provider}): ${imageUrl.substring(0, 100)}...`);
                        } else {
                            console.warn(`⚠️ Unexpected image URL format: ${imageResult.imageUrl.substring(0, 50)}`);
                        }
                    } else {
                        console.warn(`⚠️ Image generation returned no image. Result:`, {
                            success: imageResult?.success,
                            error: imageResult?.error,
                            hasImageUrl: !!imageResult?.imageUrl
                        });
                    }
                } catch (imgError) {
                    console.error(`❌ Image generation error for ${tool.name}:`, imgError.message);
                    if (imgError.stack) {
                        console.error(`❌ Error stack:`, imgError.stack);
                    }
                    // Continue without image - post will still be scheduled
                }
                
                // Log final image status
                if (imageUrl) {
                    console.log(`✅ Post will include image: ${imageUrl.substring(0, 80)}...`);
                } else {
                    console.warn(`⚠️ Post will be created WITHOUT image`);
                }

                // Create post object
                const postData = {
                    user_id: userId,
                    text: postContent.linkedin, // Default to LinkedIn version for main text
                    platforms: platformsToUse,
                    schedule_time: scheduledTime,
                    image_url: imageUrl, // Include generated image
                    post_metadata: {
                        auto_generated: true,
                        content_type: sourceUrl ? 'business_promo' : 'ai_tools',
                        tool_name: tool.name,
                        category: tool.category,
                        source_url: sourceUrl || tool.source_link,
                        variations: postContent,
                        image_generated: !!imageUrl
                    }
                };

                console.log(`📅 Scheduling post for ${tool.name} at ${scheduledTime.toLocaleTimeString()}${imageUrl ? ' (with image)' : ' (NO IMAGE)'}`);
                console.log(`📋 Post data:`, {
                    hasText: !!postData.text,
                    hasImageUrl: !!postData.image_url,
                    imageUrl: postData.image_url ? postData.image_url.substring(0, 80) + '...' : 'null',
                    platforms: postData.platforms,
                    scheduleTime: postData.schedule_time
                });

                // Actually schedule the post
                const scheduleResult = await schedulePost(postData);
                if (scheduleResult.success) {
                    console.log(`✅ Successfully scheduled post for ${tool.name}${imageUrl ? ' with image' : ' (no image)'}`);
                    scheduled++;
                } else {
                    console.error(`❌ Failed to schedule post:`, scheduleResult.error);
                    failed++;
                }

            } catch (error) {
                console.error(`❌ Error generating/scheduling post for ${tool.name}:`, error.message);
                failed++;
            }
        }

        console.log('✅ Daily AI tools scheduling completed!');
        console.log(`📊 Results: ${scheduled} scheduled, ${failed} failed`);

        return {
            success: true,
            scheduled,
            failed,
            total: tools.length
        };

    } catch (error) {
        console.error('❌ Error in scheduleAIToolsPosts:', error);
        return {
            success: false,
            error: error.message,
            scheduled: 0,
            failed: 0
        };
    }
}

/**
 * Generate a list of 10 trending/useful AI tools using Claude
 */
const { fetchLatestAINews } = require('./news-fetcher');

/**
 * Generate a list of trending/useful AI tools using real-time news + Claude
 * @param {number} count - Number of topics to generate (default 10)
 */
async function generateDailyAIToolsList(count = 10) {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });

    // 1. Fetch real-time news
    const newsItems = await fetchLatestAINews();

    // Format news for the prompt - get more items for weekly mode
    const newsToInclude = Math.min(newsItems.length, count > 10 ? 50 : 30);
    const newsContext = newsItems.slice(0, newsToInclude).map((item, index) =>
        `${index + 1}. [${item.source}] ${item.title} (${item.pubDate.toISOString().split('T')[0]})`
    ).join('\n');

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    console.log(`🧠 Asking Claude to select ${count} best topics from ${newsItems.length} news items...`);

    const prompt = `You are an expert AI trend analyst.
  
  Today is ${today}.
  
  Here is a list of the LATEST AI news and tool launches from the last 48 hours:
  
  ${newsContext}
  
  TASK: Select the ${count} most significant/interesting AI tools or updates from this list to share on social media.
  
  Requirements:
  1. Prioritize "Tools" and "Launches" over general business news (e.g., "Company X raises money" is less interesting than "Company X launches Tool Y").
  2. If the list doesn't have enough "Tools", include major AI news updates that are relevant to users.
  3. Ensure variety in the selection - cover different categories like productivity, image generation, coding, marketing, etc.
  4. If you cannot find ${count} good items in the provided list, supplement with VERY RECENT (last 48h) major AI news you know about.
  5. Each topic should be unique and offer different value to the audience.
  
  Return ONLY a JSON array with ${count} items in this format:
  [
    {
      "name": "Tool/News Title",
      "category": "Category Name",
      "hook": "Why it's interesting/valuable",
      "source_link": "URL if available (or empty string)" 
    }
  ]`;

    const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022', // Use Haiku for topic selection (80% cheaper, still accurate)
        max_tokens: 1000, // Reduced from 2000 - topics are short JSON arrays
        temperature: 0.3, // Lower temperature for more factual selection
        messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();

    try {
        const tools = JSON.parse(jsonText);

        // Merge back links if Claude didn't include them but we have them
        // (This is a best-effort matching)
        tools.forEach(tool => {
            if (!tool.source_link) {
                const match = newsItems.find(n => n.title.includes(tool.name) || tool.name.includes(n.title));
                if (match) {
                    tool.source_link = match.link;
                }
            }
        });

        return tools;
    } catch (e) {
        console.error('Error parsing Claude response:', e);
        throw e;
    }
}

/**
 * Generate specific post content for a tool
 */
async function generateToolPostContent(tool) {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `Create an engaging social media post about this AI tool/news:
  
  Topic: ${tool.name}
  Category: ${tool.category}
  Angle: ${tool.hook}
  Link: ${tool.source_link || 'No link provided'}
  
  Create 2 versions:
  1. LinkedIn: Professional, informative, structured (bullet points), value-driven. 150-250 words. MUST include the link at the end or in the text.
  2. Twitter: Punchy, viral hook, under 280 chars, 1-2 hashtags. MUST include the link.
  
  Return ONLY valid JSON:
  {
    "linkedin": "...",
    "twitter": "..."
  }`;

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonText);
}

/**
 * Generate image prompt based on tool/topic
 */
function generateImagePrompt(tool, sourceUrl) {
    const category = tool.category?.toLowerCase() || '';
    const name = tool.name || 'AI technology';
    
    // Base prompt elements
    let prompt = '';
    
    if (sourceUrl) {
        // Business/website content - more professional
        prompt = `Professional business concept visualization for "${name}", modern corporate design, clean minimalist style, technology and innovation theme, professional color palette, no text`;
    } else if (category.includes('coding') || category.includes('development')) {
        prompt = `Futuristic coding and development concept, holographic code visualization, ${name}, neon blue and purple, tech aesthetic, clean modern design, no text`;
    } else if (category.includes('image') || category.includes('video') || category.includes('design')) {
        prompt = `Creative digital art concept for ${name}, vibrant colors, artistic visualization, modern design tool aesthetic, gradient background, no text`;
    } else if (category.includes('productivity') || category.includes('writing')) {
        prompt = `Productivity and efficiency concept, ${name}, modern workspace visualization, clean minimalist, floating UI elements, soft lighting, no text`;
    } else if (category.includes('marketing') || category.includes('seo')) {
        prompt = `Digital marketing and growth concept, ${name}, data visualization, modern charts and analytics, professional blue tones, no text`;
    } else if (category.includes('audio') || category.includes('voice')) {
        prompt = `Audio and sound technology concept, ${name}, sound waves visualization, modern audio interface, purple and blue gradient, no text`;
    } else {
        // Default AI/tech theme
        prompt = `Modern AI technology concept for ${name}, futuristic neural network visualization, clean tech aesthetic, blue and purple gradient, professional, no text`;
    }
    
    return prompt;
}

/**
 * Calculate posting times based on schedule mode
 * @param {number} count - Number of posts
 * @param {string} mode - 'default' (tomorrow), 'today_hourly' (today 1hr gaps), 'weekly' (3/day for 7 days)
 */
function calculateScheduleTimes(count, mode = 'default') {
    const times = [];
    const now = new Date();
    
    if (mode === 'today_hourly') {
        // 10 posts today, starting from next hour, 1 hour apart
        const startTime = new Date(now);
        startTime.setMinutes(0, 0, 0);
        startTime.setHours(startTime.getHours() + 1); // Start from next full hour
        
        for (let i = 0; i < count; i++) {
            const postTime = new Date(startTime);
            postTime.setHours(postTime.getHours() + i);
            
            // Add small random jitter (0-10 mins)
            const jitter = Math.floor(Math.random() * 10);
            postTime.setMinutes(jitter);
            
            times.push(postTime);
        }
    } else if (mode === 'weekly') {
        // 21 posts over 7 days (3 per day at 9am, 1pm, 6pm)
        // Always start from tomorrow to ensure all posts are in the future
        const postHours = [9, 13, 18]; // 9 AM, 1 PM, 6 PM
        
        // Calculate tomorrow's date at midnight
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        console.log(`📅 Weekly calendar: Starting from ${tomorrow.toLocaleDateString()}`);
        
        // Generate 21 posts (3 per day for 7 days)
        for (let day = 0; day < 7 && times.length < count; day++) {
            for (let slot = 0; slot < 3 && times.length < count; slot++) {
                // Create a new date for this specific day
                const postTime = new Date(tomorrow);
                postTime.setDate(tomorrow.getDate() + day);
                postTime.setHours(postHours[slot], 0, 0, 0);
                postTime.setSeconds(0, 0);
                postTime.setMilliseconds(0);
                
                // Add random jitter (±15 mins) to make it look natural
                const jitter = Math.floor(Math.random() * 30) - 15;
                postTime.setMinutes(postTime.getMinutes() + jitter);
                
                // Ensure time is in the future
                if (postTime > now) {
                    times.push(postTime);
                } else {
                    // If somehow in the past (shouldn't happen), add 1 hour
                    postTime.setHours(postTime.getHours() + 1);
                    times.push(postTime);
                }
            }
        }
        
        // Sort times to ensure chronological order
        times.sort((a, b) => a.getTime() - b.getTime());
        
        console.log(`📅 Weekly calendar: Generated ${times.length} posts`);
        if (times.length > 0) {
            console.log(`   First post: ${times[0].toLocaleString()}`);
            console.log(`   Last post: ${times[times.length - 1].toLocaleString()}`);
            
            // Log distribution by day
            const byDay = {};
            times.forEach(t => {
                const dayKey = t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                byDay[dayKey] = (byDay[dayKey] || 0) + 1;
            });
            console.log(`   Distribution:`);
            Object.entries(byDay).forEach(([day, cnt]) => {
                console.log(`     ${day}: ${cnt} posts`);
            });
        }
    } else {
        // Default: spread throughout tomorrow (8 AM to 8 PM)
        const startHour = 8;
        const endHour = 20;
        const totalMinutes = (endHour - startHour) * 60;
        const interval = count > 1 ? totalMinutes / (count - 1) : totalMinutes;
        
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setSeconds(0);
        tomorrow.setMilliseconds(0);
        
        for (let i = 0; i < count; i++) {
            const minutesToAdd = Math.floor(i * interval);
            const postTime = new Date(tomorrow);
            postTime.setHours(startHour, 0, 0, 0);
            postTime.setMinutes(postTime.getMinutes() + minutesToAdd);
            
            // Add random jitter (±15 mins)
            const jitter = Math.floor(Math.random() * 30) - 15;
            postTime.setMinutes(postTime.getMinutes() + jitter);
            
            times.push(postTime);
        }
    }
    
    return times;
}

/**
 * Generate business topics/hooks from scraped content
 * @param {string} content - Scraped website content
 * @param {string} sourceUrl - Source URL
 * @param {number} count - Number of topics to generate (default 10)
 */
async function generateBusinessTopicsFromContent(content, sourceUrl, count = 10) {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `You are an expert social media strategist.

CONTEXT:
We need to create ${count} distinct, engaging social media posts to promote a business based on their website content.

WEBSITE CONTENT:
${content.substring(0, 15000)}

TASK:
Analyze the content and identify ${count} UNIQUE angles, value propositions, features, or topics to write about. 
Each item should focus on a different aspect to avoid repetition (e.g., services overview, specific problem solved, customer results, brand story, team expertise, unique methodology, case studies, testimonials, FAQs, industry insights, etc.).

Return ONLY a JSON array with ${count} items in this format:
[
  {
    "name": "Topic Title (e.g., 'Save Time Feature', 'Consulting Services')",
    "category": "Topic Category (e.g., Product Feature, Case Study, Thought Leadership)",
    "hook": "The core angle/hook for this post (e.g., 'Stop wasting hours on X...')",
    "source_link": "${sourceUrl}" 
  }
]`;

    const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022', // Use Haiku for topic extraction (80% cheaper)
        max_tokens: 1500, // Reduced from 2500 - topics are concise JSON
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();

    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.error('Error parsing business topics JSON:', e);
        throw e; // Or fallback
    }
}

/**
 * Generate post content for a specific business topic
 */
async function generateBusinessPostContent(topic, sourceUrl) {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `Create a high-converting social media post for this business topic:

Topic: ${topic.name}
Category: ${topic.category}
Angle/Hook: ${topic.hook}
Link to Include: ${sourceUrl}

Create 2 versions:
1. LinkedIn: Professional yet persuasive. Focus on value and problem/solution. Use bullet points if helpful. 150-200 words. MUST include the Call to Action and Link at the end.
2. Twitter: Punchy, engaging, under 280 chars. 1-2 hashtags. MUST include the Link.

Return ONLY valid JSON:
{
  "linkedin": "...",
  "twitter": "..."
}`;

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonText);
}

/**
 * Generate topics from business profile
 * @param {Object} businessProfile - Business profile object
 * @param {number} count - Number of topics to generate
 */
async function generateBusinessProfileTopics(businessProfile, count = 10) {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });

    const contentThemes = businessProfile.content_themes || [];
    const products = businessProfile.key_products_services || [];
    const features = businessProfile.key_features_benefits || [];
    const industry = businessProfile.industry || 'general';
    
    const prompt = `You are a social media content strategist for ${businessProfile.business_name}.

BUSINESS INFORMATION:
- Business Name: ${businessProfile.business_name}
- Industry: ${industry}
- Tagline: ${businessProfile.tagline || 'N/A'}
- Description: ${businessProfile.description || 'N/A'}
- Value Proposition: ${businessProfile.value_proposition || 'N/A'}
- Target Audience: ${businessProfile.target_audience || 'N/A'}
- Products/Services: ${products.join(', ') || 'N/A'}
- Key Features/Benefits: ${features.join(', ') || 'N/A'}
- Content Themes: ${contentThemes.join(', ') || 'general business'}
- Brand Voice: ${businessProfile.brand_voice || 'professional'}
- Website: ${businessProfile.website_url || 'N/A'}

TASK: Generate ${count} diverse social media post topics about this business. Each topic should:
1. Be relevant to the business and its industry
2. Align with the content themes: ${contentThemes.join(', ') || 'general business'}
3. Match the brand voice: ${businessProfile.brand_voice || 'professional'}
4. Be engaging and valuable to the target audience: ${businessProfile.target_audience || 'general audience'}
5. Cover different aspects: product updates, tips, behind-the-scenes, customer stories, industry insights, etc.

Return ONLY a JSON array of objects with this exact structure:
[
  {
    "name": "Topic title (max 60 chars)",
    "category": "One of: ${contentThemes.join(', ') || 'product_updates, tips, industry_news'}",
    "hook": "Brief description/angle for the post (1-2 sentences)",
    "source_link": "${businessProfile.website_url || ''}"
  },
  ...
]

Generate exactly ${count} topics. Make them diverse and engaging.`;

    try {
        const message = await anthropic.messages.create({
            model: 'claude-3-5-haiku-20241022', // Use Haiku for topic generation (80% cheaper)
            max_tokens: 2000, // Reduced from 4000 - topics are concise JSON
            temperature: 0.7, // Slightly lower for more consistent topics
            messages: [{ role: 'user', content: prompt }]
        });

        const text = message.content[0].text.trim();
        const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
        const topics = JSON.parse(jsonText);
        
        // Ensure we have exactly count topics
        return Array.isArray(topics) ? topics.slice(0, count) : [];
    } catch (error) {
        console.error('❌ Error generating business profile topics:', error);
        // Fallback: generate generic topics based on business info
        return generateFallbackBusinessTopics(businessProfile, count);
    }
}

/**
 * Generate fallback business topics if AI fails
 */
function generateFallbackBusinessTopics(businessProfile, count) {
    const topics = [];
    const products = businessProfile.key_products_services || [];
    const features = businessProfile.key_features_benefits || [];
    
    // Generate topics based on available info
    if (products.length > 0) {
        products.forEach((product, idx) => {
            if (topics.length < count) {
                topics.push({
                    name: `Introducing ${product}`,
                    category: 'product_updates',
                    hook: `Learn more about ${product} and how it can help you.`,
                    source_link: businessProfile.website_url || ''
                });
            }
        });
    }
    
    if (features.length > 0) {
        features.forEach((feature, idx) => {
            if (topics.length < count) {
                topics.push({
                    name: `Why ${feature} Matters`,
                    category: 'tips',
                    hook: `Discover how ${feature} can benefit your business.`,
                    source_link: businessProfile.website_url || ''
                });
            }
        });
    }
    
    // Fill remaining with generic topics
    const genericTopics = [
        { name: `Welcome to ${businessProfile.business_name}`, category: 'behind_scenes', hook: `Learn more about what we do.` },
        { name: `Industry Insights from ${businessProfile.business_name}`, category: 'industry_news', hook: `Stay updated with the latest trends.` },
        { name: `Tips from ${businessProfile.business_name}`, category: 'tips', hook: `Expert advice to help you succeed.` }
    ];
    
    genericTopics.forEach(topic => {
        if (topics.length < count) {
            topic.source_link = businessProfile.website_url || '';
            topics.push(topic);
        }
    });
    
    return topics.slice(0, count);
}

/**
 * Generate post content from business profile topic
 * @param {Object} topic - Topic object
 * @param {Object} businessProfile - Business profile object
 */
async function generateBusinessProfilePostContent(topic, businessProfile) {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });

    const platforms = ['linkedin', 'twitter', 'instagram', 'facebook'];
    const brandVoice = businessProfile.brand_voice || 'professional';
    const toneDesc = businessProfile.tone_description || '';
    const tagline = businessProfile.tagline || '';
    const valueProp = businessProfile.value_proposition || '';
    const website = businessProfile.website_url || '';
    const ctaText = businessProfile.cta_text || 'Learn more';
    const autoCTA = businessProfile.auto_include_cta !== false;
    const preferredHashtags = businessProfile.preferred_hashtags || [];
    const avoidWords = businessProfile.avoid_words || [];

    const prompt = `You are a social media content creator for ${businessProfile.business_name}.

BUSINESS CONTEXT:
- Business Name: ${businessProfile.business_name}
- Tagline: ${tagline}
- Value Proposition: ${valueProp}
- Industry: ${businessProfile.industry || 'general'}
- Target Audience: ${businessProfile.target_audience || 'general'}
- Brand Voice: ${brandVoice}
- Tone Description: ${toneDesc}
- Website: ${website}
- Products/Services: ${(businessProfile.key_products_services || []).join(', ')}
- Key Features: ${(businessProfile.key_features_benefits || []).join(', ')}

POST TOPIC:
- Title: ${topic.name}
- Category: ${topic.category}
- Hook/Angle: ${topic.hook}

CONTENT REQUIREMENTS:
1. Create engaging social media posts for: ${platforms.join(', ')}
2. Match the brand voice: ${brandVoice}${toneDesc ? ` (${toneDesc})` : ''}
3. ${autoCTA ? `Include a call-to-action: "${ctaText}"` : 'No CTA needed'}
4. ${website ? `Include website link naturally: ${website}` : ''}
5. ${preferredHashtags.length > 0 ? `Use these hashtags when appropriate: ${preferredHashtags.join(', ')}` : 'Use relevant hashtags'}
6. ${avoidWords.length > 0 ? `NEVER use these words: ${avoidWords.join(', ')}` : ''}
7. Make it authentic and valuable to the target audience
8. Reference the business naturally (don't over-promote)

PLATFORM-SPECIFIC GUIDELINES:
- LinkedIn: Professional, 150-300 words, industry insights, value-driven
- Twitter/X: Concise, engaging, under 280 chars, can be more casual
- Instagram: Visual-friendly, 100-200 words, emojis appropriate, storytelling
- Facebook: Conversational, 100-250 words, community-focused

Return ONLY valid JSON (no markdown, no code blocks):
{
  "linkedin": "LinkedIn post text...",
  "twitter": "Twitter post text...",
  "instagram": "Instagram post text...",
  "facebook": "Facebook post text..."
}`;

    try {
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            temperature: 0.8,
            messages: [{ role: 'user', content: prompt }]
        });

        const text = message.content[0].text.trim();
        const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error('❌ Error generating business profile post content:', error);
        // Fallback: simple post
        const basePost = `${topic.name}\n\n${topic.hook}${website ? `\n\n${website}` : ''}${autoCTA ? `\n\n${ctaText}` : ''}`;
        return {
            linkedin: basePost,
            twitter: basePost.substring(0, 280),
            instagram: basePost,
            facebook: basePost
        };
    }
}

module.exports = {
    scheduleAIToolsPosts,
    generateDailyAIToolsList,
    generateToolPostContent
};
