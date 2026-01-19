const { createClient } = require('@supabase/supabase-js');
const { schedulePost } = require('./scheduler');
const { generatePostVariations } = require('./ai');
const { scrapeWebContent } = require('./web-scraper-light'); // Import scraper
const { generateImage } = require('./ai-image'); // Import image generation
const cloudinaryService = require('./cloudinary'); // Import cloudinary for upload
const { makeAICall } = require('./ai-wrapper'); // Use AI wrapper with cost tracking
const { generateSmartScheduleTimes } = require('./smart-scheduling'); // Smart scheduling

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
 * @param {string} preset - Optional preset name ('balanced_mix', 'linkedin_focus', 'daily_all', 'custom')
 * @param {Object} distribution - Optional distribution object mapping platform to post count
 * @param {number} weekOffset - Week offset: 0 = current week, 1 = next week (days 8-14)
 */
async function scheduleAIToolsPosts(specificUserId = null, sourceUrl = null, articles = null, targetPlatforms = null, scheduleMode = 'default', businessProfile = null, preset = null, distribution = null, weekOffset = 0) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🤖 STARTING POST GENERATION`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📋 Parameters:`);
    console.log(`   User ID: ${specificUserId || 'default'}`);
    console.log(`   Source URL: ${sourceUrl || 'none'}`);
    console.log(`   Articles: ${articles?.length || 0}`);
    console.log(`   Platforms: ${targetPlatforms ? targetPlatforms.join(', ') : 'default'}`);
    console.log(`   Schedule Mode: ${scheduleMode}`);
    console.log(`   Business Profile: ${businessProfile ? businessProfile.business_name : 'none'}`);

    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY not configured');
        }

        // Get user ID - use specific user if provided, otherwise get default
        const userId = specificUserId || await getDefaultUserId();
        if (!userId) {
            throw new Error('No user found to schedule posts for');
        }
        console.log(`\n👤 Using user ID: ${userId}`);

        // Determine how many posts to generate based on mode
        // Weekly: (platforms × 7 days) = one post per platform per day
        // Daily: 5 posts total (all for today)
        const platformsToUse = targetPlatforms && targetPlatforms.length > 0
            ? targetPlatforms
            : ['linkedin', 'twitter'];
        
        const postCount = scheduleMode === 'weekly' 
            ? platformsToUse.length * 7  // One post per platform per day for 7 days
            : scheduleMode === 'today_hourly'
                ? 5  // Daily: 5 posts total
                : 5;  // Default: 5 posts total
        
        console.log(`\n📊 Post Count Calculation:`);
        console.log(`   Schedule Mode: ${scheduleMode}`);
        console.log(`   Platforms: ${platformsToUse.join(', ')} (${platformsToUse.length} platforms)`);
        console.log(`   Calculated Post Count: ${postCount}`);
        console.log(`   Expected: ${scheduleMode === 'weekly' ? `${platformsToUse.length} platforms × 7 days` : '5 posts for today'}`);
        
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

        console.log(`\n📋 Topic Generation Results:`);
        console.log(`   Requested: ${postCount} topics`);
        console.log(`   Generated: ${tools.length} topics`);
        if (tools.length > 0) {
            console.log(`   Topics: ${tools.map((t, i) => `${i + 1}. ${t.name}`).join(', ')}`);
        }

        // Validate we have enough topics
        if (tools.length < postCount) {
            console.warn(`\n⚠️ WARNING: Only generated ${tools.length} topics but need ${postCount}. This may result in fewer posts.`);
        } else if (tools.length > postCount) {
            console.log(`\n✅ Generated ${tools.length} topics (more than needed, will use first ${postCount})`);
        } else {
            console.log(`\n✅ Perfect! Generated exactly ${tools.length} topics as requested.`);
        }

        // 2. Calculate schedule times based on mode
        // IMPORTANT: Use postCount (expected) not tools.length (actual) to ensure we generate enough times
        // Even if fewer topics were generated, we still want the right number of schedule times
        const expectedScheduleCount = Math.max(tools.length, postCount);
        
        console.log(`\n📅 Calculating Schedule Times:`);
        console.log(`   Mode: ${scheduleMode}`);
        console.log(`   Topic Count: ${tools.length}`);
        console.log(`   Requested Count: ${postCount}`);
        console.log(`   Schedule Times to Generate: ${expectedScheduleCount} (using max of topics vs requested)`);
        
        // Use smart scheduling if preset is provided, otherwise use default
        const scheduleTimes = preset === 'balanced_mix' && platformsToUse.length > 0
            ? generateSmartScheduleTimes(expectedScheduleCount, scheduleMode, platformsToUse, weekOffset)
            : calculateScheduleTimes(expectedScheduleCount, scheduleMode, weekOffset);
        console.log(`   Generated: ${scheduleTimes.length} schedule times`);
        
        if (scheduleTimes.length > 0) {
            console.log(`   First: ${scheduleTimes[0].toLocaleString()}`);
            console.log(`   Last: ${scheduleTimes[scheduleTimes.length - 1].toLocaleString()}`);
        }
        
        // Log first few and last few times for verification
        if (scheduleTimes.length > 0) {
            console.log(`   First 3 times:`, scheduleTimes.slice(0, 3).map(t => t.toLocaleString()));
            console.log(`   Last 3 times:`, scheduleTimes.slice(-3).map(t => t.toLocaleString()));
        }

        // 3. Generate content and schedule each post
        let scheduled = 0;
        let failed = 0;

        // Determine platforms to use (already calculated above)
        // platformsToUse is already defined in the postCount calculation section

        if (scheduleMode === 'weekly') {
            // Weekly mode: Generate one post per platform per day
            // Pattern: Day 1 (all platforms), Day 2 (all platforms), etc.
            console.log(`\n📝 Starting Weekly Mode Post Generation:`);
            console.log(`   Tools available: ${tools.length}`);
            console.log(`   Schedule times available: ${scheduleTimes.length}`);
            console.log(`   Platforms: ${platformsToUse.join(', ')} (${platformsToUse.length} platforms)`);
            console.log(`   Expected posts: ${postCount} (${platformsToUse.length} platforms × 7 days)`);
            const expectedIterations = Math.min(tools.length, scheduleTimes.length);
            console.log(`   Will iterate: ${expectedIterations} times\n`);
            
            if (expectedIterations < postCount) {
                console.warn(`   ⚠️ WARNING: Will only process ${expectedIterations} posts instead of ${postCount}`);
                console.warn(`      Reason: ${tools.length < postCount ? `Only ${tools.length} topics generated` : `Only ${scheduleTimes.length} schedule times generated`}`);
            }
            
            let postIndex = 0;
            
            for (let day = 0; day < 7; day++) {
                for (let platformIndex = 0; platformIndex < platformsToUse.length; platformIndex++) {
                    if (postIndex >= tools.length || postIndex >= scheduleTimes.length) {
                        console.log(`   ⚠️ Stopping at day ${day + 1}, platform ${platformIndex + 1}: postIndex ${postIndex} >= tools.length ${tools.length} or scheduleTimes.length ${scheduleTimes.length}`);
                        break;
                    }
                    
                    const tool = tools[postIndex];
                    const scheduledTime = scheduleTimes[postIndex];
                    const platform = platformsToUse[platformIndex];
                    
                    try {
                        console.log(`✍️ [Day ${day + 1}, ${platform}] Generating content for: ${tool.name} (${postIndex + 1}/${tools.length})`);

                        // Generate post content
                        let postContent;
                        if (businessProfile) {
                            postContent = await generateBusinessProfilePostContent(tool, businessProfile);
                        } else if (sourceUrl && !articles) {
                            postContent = await generateBusinessPostContent(tool, sourceUrl);
                        } else {
                            postContent = await generateToolPostContent(tool);
                        }

                        // Get platform-specific content
                        const text = postContent[platform] || postContent.linkedin || postContent.twitter || Object.values(postContent)[0];

                        if (!text || text.trim() === '') {
                            console.warn(`⚠️ No content for ${tool.name} on ${platform}, skipping...`);
                            failed++;
                            postIndex++;
                            continue;
                        }

                        // Generate image only once per tool (first platform), reuse for others
                        let imageUrl = null;
                        if (platformIndex === 0) {
                            try {
                                console.log(`🎨 [Day ${day + 1}] Generating image for: ${tool.name}`);
                                const imagePrompt = generateImagePrompt(tool, sourceUrl);
                                const imagePromise = generateImage(imagePrompt, 'digital-art');
                                const timeoutPromise = new Promise((_, reject) => 
                                    setTimeout(() => reject(new Error('Image generation timeout after 30s')), 30000)
                                );
                                
                                const imageResult = await Promise.race([imagePromise, timeoutPromise]);
                                
                                if (imageResult && imageResult.success && imageResult.imageUrl) {
                                    if (imageResult.imageUrl.startsWith('https://image.pollinations.ai')) {
                                        imageUrl = imageResult.imageUrl;
                                    } else if (imageResult.imageUrl.startsWith('data:')) {
                                        const uploadResult = await cloudinaryService.uploadImage(imageResult.imageUrl);
                                        if (uploadResult && uploadResult.url) {
                                            imageUrl = uploadResult.url;
                                        }
                                    } else if (imageResult.imageUrl.startsWith('http')) {
                                        imageUrl = imageResult.imageUrl;
                                    }
                                }
                            } catch (imgError) {
                                console.error(`❌ Image generation error:`, imgError.message);
                            }
                        }

                        const postData = {
                            user_id: userId,
                            text: text.trim(),
                            platforms: [platform], // Single platform per post in weekly mode
                            schedule_time: scheduledTime.toISOString(),
                            image_url: imageUrl,
                            status: 'queued',
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

                        console.log(`📅 Scheduling ${platform} post for "${tool.name}" at ${scheduledTime.toLocaleString()}`);

                        const scheduleResult = await schedulePost(postData);
                        if (scheduleResult.success) {
                            scheduled++;
                        } else {
                            console.error(`❌ Failed to schedule:`, scheduleResult.error);
                            failed++;
                        }

                        postIndex++;
                    } catch (error) {
                        console.error(`❌ Error:`, error.message);
                        failed++;
                        postIndex++;
                    }
                }
            }
        } else {
            // Daily mode: Generate 5 posts, each goes to all selected platforms
            console.log(`\n📝 Starting Daily Mode Post Generation:`);
            console.log(`   Tools available: ${tools.length}`);
            console.log(`   Schedule times available: ${scheduleTimes.length}`);
            console.log(`   Platforms: ${platformsToUse.join(', ')}`);
            console.log(`   Expected posts: ${postCount}`);
            
            const maxIterations = Math.min(tools.length, scheduleTimes.length, postCount);
            console.log(`   Will iterate: ${maxIterations} times\n`);
            
            for (let i = 0; i < maxIterations; i++) {
                const tool = tools[i];
                const scheduledTime = scheduleTimes[i];

                console.log(`\n[${i + 1}/${maxIterations}] Processing: ${tool.name}`);
                console.log(`   Scheduled time: ${scheduledTime.toLocaleString()}`);

                try {
                    console.log(`   ✍️ Generating content...`);

                    // Generate post content
                    let postContent;
                    if (businessProfile) {
                        postContent = await generateBusinessProfilePostContent(tool, businessProfile);
                    } else if (sourceUrl && !articles) {
                        postContent = await generateBusinessPostContent(tool, sourceUrl);
                    } else {
                        postContent = await generateToolPostContent(tool);
                    }

                    console.log(`   ✅ Content generated, keys: ${Object.keys(postContent).join(', ')}`);

                    // Get platform-specific content (use LinkedIn as default)
                    const text = postContent.linkedin || postContent.twitter || Object.values(postContent)[0];

                    if (!text || text.trim() === '') {
                        console.warn(`   ⚠️ No content generated for ${tool.name}, skipping...`);
                        failed++;
                        continue;
                    }

                    console.log(`   📝 Text length: ${text.trim().length} characters`);

                    // Generate image
                    let imageUrl = null;
                    try {
                        console.log(`   🎨 Generating image...`);
                        const imagePrompt = generateImagePrompt(tool, sourceUrl);
                        const imagePromise = generateImage(imagePrompt, 'digital-art');
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Image generation timeout after 30s')), 30000)
                        );
                        
                        const imageResult = await Promise.race([imagePromise, timeoutPromise]);
                        
                        if (imageResult && imageResult.success && imageResult.imageUrl) {
                            if (imageResult.imageUrl.startsWith('https://image.pollinations.ai')) {
                                imageUrl = imageResult.imageUrl;
                            } else if (imageResult.imageUrl.startsWith('data:')) {
                                const uploadResult = await cloudinaryService.uploadImage(imageResult.imageUrl);
                                if (uploadResult && uploadResult.url) {
                                    imageUrl = uploadResult.url;
                                }
                            } else if (imageResult.imageUrl.startsWith('http')) {
                                imageUrl = imageResult.imageUrl;
                            }
                            console.log(`   ✅ Image generated: ${imageUrl ? 'Yes' : 'No'}`);
                        } else {
                            console.log(`   ⚠️ Image generation returned no image`);
                        }
                    } catch (imgError) {
                        console.error(`   ❌ Image generation error:`, imgError.message);
                    }

                    const postData = {
                        user_id: userId,
                        text: text.trim(),
                        platforms: platformsToUse, // All selected platforms for daily mode
                        schedule_time: scheduledTime.toISOString(),
                        image_url: imageUrl,
                        status: 'queued',
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

                    console.log(`   📅 Scheduling post...`);
                    console.log(`      Platforms: ${platformsToUse.join(', ')}`);
                    console.log(`      Has image: ${!!imageUrl}`);

                    const scheduleResult = await schedulePost(postData);
                    if (scheduleResult.success) {
                        scheduled++;
                        console.log(`   ✅ Successfully scheduled! (Total: ${scheduled})`);
                    } else {
                        console.error(`   ❌ Failed to schedule:`, scheduleResult.error);
                        failed++;
                    }

                } catch (error) {
                    console.error(`   ❌ Error generating/scheduling post:`, error.message);
                    console.error(`   Stack:`, error.stack);
                    failed++;
                }
            }
            
            console.log(`\n📊 Daily Mode Loop Complete:`);
            console.log(`   Processed: ${maxIterations} posts`);
            console.log(`   Scheduled: ${scheduled}`);
            console.log(`   Failed: ${failed}`);
        }

        // Invalidate cache after scheduling posts to ensure dashboard stats update
        if (userId && scheduled > 0) {
            const cache = require('./cache');
            cache.invalidateUserCacheByCategory(userId, ['analytics', 'platform_stats', 'post_history']);
            console.log(`🗑️  Invalidated cache for user ${userId} to refresh dashboard stats`);
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ SCHEDULING COMPLETED`);
        console.log(`${'='.repeat(60)}`);
        console.log(`📊 Final Results:`);
        console.log(`   Total Topics Generated: ${tools.length}`);
        console.log(`   Posts Successfully Scheduled: ${scheduled}`);
        console.log(`   Posts Failed: ${failed}`);
        console.log(`   Expected: ${postCount}`);
        console.log(`   Success Rate: ${tools.length > 0 ? ((scheduled / tools.length) * 100).toFixed(1) : 0}%`);
        
        if (scheduled < postCount) {
            console.warn(`\n⚠️ WARNING: Only scheduled ${scheduled} posts but expected ${postCount}`);
            console.warn(`   Possible reasons:`);
            console.warn(`   - Not enough topics generated (got ${tools.length}, needed ${postCount})`);
            console.warn(`   - Errors during content generation`);
            console.warn(`   - Errors during scheduling`);
        } else {
            console.log(`\n✅ Success! Scheduled ${scheduled} posts as expected.`);
        }
        console.log(`${'='.repeat(60)}\n`);

        return {
            success: true,
            scheduled,
            failed,
            total: tools.length,
            expected: postCount
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
    // Using AI wrapper with cost tracking

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

    // Increase max_tokens based on count (more topics = more tokens needed)
    const maxTokens = Math.max(1000, count * 150); // At least 150 tokens per topic
    
    const message = await makeAICall({
        model: 'claude-3-5-haiku-20241022', // Use Haiku for topic selection (80% cheaper, still accurate)
        max_tokens: Math.min(maxTokens, 4000), // Cap at 4000, but scale with count
        temperature: 0.3, // Lower temperature for more factual selection
        messages: [{ role: 'user', content: prompt }],
        taskType: 'topic_selection',
        feature: 'calendar_topic_selection'
    });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();

    try {
        let tools = JSON.parse(jsonText);
        
        // Ensure we have an array
        if (!Array.isArray(tools)) {
            console.error('❌ AI returned non-array:', tools);
            tools = [];
        }

        console.log(`📋 AI returned ${tools.length} topics (requested ${count})`);

        // If we got fewer topics than requested, try to supplement from news items
        if (tools.length < count && newsItems.length > tools.length) {
            console.log(`⚠️ Only got ${tools.length} topics, supplementing from news items...`);
            const usedNames = new Set(tools.map(t => t.name.toLowerCase()));
            
            for (const newsItem of newsItems) {
                if (tools.length >= count) break;
                if (usedNames.has(newsItem.title.toLowerCase())) continue;
                
                tools.push({
                    name: newsItem.title,
                    category: 'AI News',
                    hook: newsItem.description || newsItem.title,
                    source_link: newsItem.link || newsItem.url || ''
                });
                usedNames.add(newsItem.title.toLowerCase());
            }
            
            console.log(`✅ After supplementing: ${tools.length} topics`);
        }

        // If still not enough, duplicate some topics with variations
        if (tools.length < count && tools.length > 0) {
            console.log(`⚠️ Still only have ${tools.length} topics, creating variations...`);
            const originalCount = tools.length;
            while (tools.length < count && tools.length < originalCount * 3) {
                const sourceTool = tools[tools.length % originalCount];
                tools.push({
                    name: `${sourceTool.name} (Part ${Math.floor(tools.length / originalCount) + 1})`,
                    category: sourceTool.category,
                    hook: sourceTool.hook,
                    source_link: sourceTool.source_link
                });
            }
        }

        // Ensure we have exactly the requested count (or as close as possible)
        tools = tools.slice(0, count);
        
        console.log(`✅ Final topic count: ${tools.length} (requested: ${count})`);

        // Merge back links if Claude didn't include them but we have them
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
        console.error('❌ Error parsing Claude response:', e);
        console.error('Response text:', text.substring(0, 500));
        
        // Fallback: Use news items directly
        console.log('🔄 Falling back to news items directly...');
        const fallbackTools = newsItems.slice(0, count).map(item => ({
            name: item.title,
            category: 'AI News',
            hook: item.description || item.title,
            source_link: item.link || item.url || ''
        }));
        
        return fallbackTools;
    }
}

/**
 * Generate specific post content for a tool
 */
async function generateToolPostContent(tool) {
    // Using AI wrapper with cost tracking

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

    const message = await makeAICall({
        model: 'claude-3-5-haiku-20241022', // Use cheapest model
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
        taskType: 'simple',
        feature: 'calendar_post_content'
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
 * @param {number} weekOffset - Week offset: 0 = current week, 1 = next week (days 8-14)
 */
function calculateScheduleTimes(count, mode = 'default', weekOffset = 0) {
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
        // Weekly mode: One post per platform per day for 7 days
        // Count represents total posts (platforms × 7)
        // We need to distribute them: Day 1 (all platforms), Day 2 (all platforms), etc.
        // Default time: 10 AM each day (can be customized)
        const defaultHour = 10; // 10 AM
        
        // Calculate start date based on weekOffset
        // weekOffset 0 = current week (tomorrow + 0 days = tomorrow)
        // weekOffset 1 = next week (tomorrow + 7 days = next week)
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() + 1 + (weekOffset * 7)); // Tomorrow + weekOffset weeks
        startDate.setHours(0, 0, 0, 0);
        
        const weekLabel = weekOffset === 0 ? 'this week' : 'next week';
        console.log(`📅 Weekly calendar (${weekLabel}): Starting from ${startDate.toLocaleDateString()}, generating ${count} posts`);
        
        // Generate times: one per platform per day
        // Pattern: Day 1 (platform1, platform2, platform3), Day 2 (platform1, platform2, platform3), etc.
        for (let day = 0; day < 7; day++) {
            for (let platformIndex = 0; platformIndex < Math.ceil(count / 7) && times.length < count; platformIndex++) {
                const postTime = new Date(startDate);
                postTime.setDate(startDate.getDate() + day);
                postTime.setHours(defaultHour, 0, 0, 0);
                postTime.setSeconds(0, 0);
                postTime.setMilliseconds(0);
                
                // Add small jitter per platform (±30 mins) so posts aren't at exact same time
                const jitter = Math.floor(Math.random() * 60) - 30;
                postTime.setMinutes(postTime.getMinutes() + jitter);
                
                // Ensure time is in the future
                if (postTime > now) {
                    times.push(postTime);
                } else {
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
        // Default (daily mode): spread throughout TODAY (8 AM to 8 PM)
        // Start from next hour if current time is before 8 AM, otherwise start from now
        const startHour = 8;
        const endHour = 20;
        const totalMinutes = (endHour - startHour) * 60;
        const interval = count > 1 ? totalMinutes / (count - 1) : totalMinutes;
        
        const today = new Date(now);
        today.setSeconds(0);
        today.setMilliseconds(0);
        
        // If it's already past 8 AM today, start from next hour
        // Otherwise start from 8 AM today
        const currentHour = today.getHours();
        const startTime = currentHour >= startHour 
            ? new Date(today.getTime() + 60 * 60 * 1000) // Next hour
            : new Date(today);
        
        if (currentHour < startHour) {
            startTime.setHours(startHour, 0, 0, 0);
        } else {
            startTime.setMinutes(0, 0, 0);
        }
        
        for (let i = 0; i < count; i++) {
            const minutesToAdd = Math.floor(i * interval);
            const postTime = new Date(startTime);
            postTime.setMinutes(postTime.getMinutes() + minutesToAdd);
            
            // Ensure we don't go past endHour
            if (postTime.getHours() >= endHour) {
                postTime.setHours(endHour - 1, 59, 0, 0);
            }
            
            // Add random jitter (±15 mins)
            const jitter = Math.floor(Math.random() * 30) - 15;
            postTime.setMinutes(postTime.getMinutes() + jitter);
            
            // Ensure time is in the future
            if (postTime > now) {
                times.push(postTime);
            } else {
                // If in the past, add 1 hour
                postTime.setHours(postTime.getHours() + 1);
                times.push(postTime);
            }
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
    // Using AI wrapper with cost tracking

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

        // Increase max_tokens based on count
        const maxTokens = Math.max(1500, count * 200);
        
        const message = await makeAICall({
            model: 'claude-3-5-haiku-20241022', // Use Haiku for topic extraction (80% cheaper)
            max_tokens: Math.min(maxTokens, 4000), // Scale with count, cap at 4000
            temperature: 0.7,
            messages: [{ role: 'user', content: prompt }],
            taskType: 'topic_selection',
            feature: 'business_topic_extraction'
        });

    const text = message.content[0].text.trim();
    const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();

    try {
        let topics = JSON.parse(jsonText);
        
        if (!Array.isArray(topics)) {
            console.error('❌ AI returned non-array:', topics);
            topics = [];
        }
        
        console.log(`📋 AI returned ${topics.length} topics (requested ${count})`);
        
        // Ensure we have the requested count
        if (topics.length < count) {
            console.warn(`⚠️ Only got ${topics.length} topics, expected ${count}`);
            // Try to create variations or duplicate
            while (topics.length < count && topics.length > 0) {
                const sourceTopic = topics[topics.length % topics.length];
                topics.push({
                    name: `${sourceTopic.name} - Variation`,
                    category: sourceTopic.category,
                    hook: sourceTopic.hook,
                    source_link: sourceTopic.source_link || sourceUrl
                });
            }
        }
        
        return topics.slice(0, count);
    } catch (e) {
        console.error('❌ Error parsing business topics JSON:', e);
        console.error('Response text:', text.substring(0, 500));
        throw e;
    }
}

/**
 * Generate post content for a specific business topic
 */
async function generateBusinessPostContent(topic, sourceUrl) {
    // Using AI wrapper with cost tracking

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

    const message = await makeAICall({
        model: 'claude-3-5-haiku-20241022', // Use cheapest model
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
        taskType: 'simple',
        feature: 'calendar_post_content'
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
    // Using AI wrapper with cost tracking

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
        // Increase max_tokens based on count
        const maxTokens = Math.max(2000, count * 200);
        
        const message = await makeAICall({
            model: 'claude-3-5-haiku-20241022', // Use Haiku for topic generation (80% cheaper)
            max_tokens: Math.min(maxTokens, 4000), // Scale with count, cap at 4000
            temperature: 0.7, // Slightly lower for more consistent topics
            messages: [{ role: 'user', content: prompt }],
            taskType: 'topic_selection',
            feature: 'business_profile_topics'
        });

        const text = message.content[0].text.trim();
        const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
        
        let topics;
        try {
            topics = JSON.parse(jsonText);
        } catch (e) {
            console.error('❌ Error parsing business profile topics:', e);
            topics = [];
        }
        
        if (!Array.isArray(topics)) {
            console.error('❌ AI returned non-array:', topics);
            topics = [];
        }
        
        console.log(`📋 AI returned ${topics.length} topics (requested ${count})`);
        
        // Ensure we have the requested count
        if (topics.length < count) {
            console.warn(`⚠️ Only got ${topics.length} topics, creating variations...`);
            const originalCount = topics.length;
            
            // Create variations from existing topics
            while (topics.length < count && topics.length < originalCount * 3) {
                const sourceTopic = topics[topics.length % originalCount];
                topics.push({
                    name: `${sourceTopic.name} - Additional Angle`,
                    category: sourceTopic.category,
                    hook: sourceTopic.hook,
                    source_link: sourceTopic.source_link || businessProfile.website_url || ''
                });
            }
        }
        
        // Ensure we have exactly count topics
        return topics.slice(0, count);
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
    // Using AI wrapper with cost tracking

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
        const message = await makeAICall({
            model: 'claude-3-5-haiku-20241022', // Use cheapest model
            max_tokens: 2000,
            temperature: 0.8,
            messages: [{ role: 'user', content: prompt }],
            taskType: 'simple',
            feature: 'business_profile_post_content'
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
