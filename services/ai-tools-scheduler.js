const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
const { schedulePost } = require('./scheduler');
const { generatePostVariations } = require('./ai');

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
 * Generate and schedule 10 posts about AI tools for the day
 */
async function scheduleAIToolsPosts() {
    console.log('🤖 Starting daily AI tools post generation...');

    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY not configured');
        }

        // Get user ID
        const userId = await getDefaultUserId();
        if (!userId) {
            throw new Error('No user found to schedule posts for');
        }
        console.log(`👤 Scheduling posts for user ID: ${userId}`);

        // 1. Generate list of 10 unique AI tools/topics for today
        const tools = await generateDailyAIToolsList();

        console.log(`📋 Generated ${tools.length} AI tools to post about:`, tools.map(t => t.name).join(', '));

        // 2. Calculate schedule times (spread throughout the day)
        const scheduleTimes = calculateScheduleTimes(tools.length);

        // 3. Generate content and schedule each post
        for (let i = 0; i < tools.length; i++) {
            const tool = tools[i];
            const scheduledTime = scheduleTimes[i];

            try {
                console.log(`✍️ Generating content for tool: ${tool.name} (${i + 1}/${tools.length})`);

                // Generate post content
                const postContent = await generateToolPostContent(tool);

                // Create post object
                const postData = {
                    user_id: userId,
                    text: postContent.linkedin, // Default to LinkedIn version for main text
                    platforms: ['linkedin', 'twitter'], // Default platforms
                    schedule_time: scheduledTime,
                    post_metadata: {
                        auto_generated: true,
                        content_type: 'ai_tools',
                        tool_name: tool.name,
                        category: tool.category,
                        variations: postContent
                    }
                };

                console.log(`📅 Scheduling post for ${tool.name} at ${scheduledTime.toLocaleTimeString()}`);

                // Actually schedule the post
                await schedulePost(postData);
                console.log(`✅ Successfully scheduled post for ${tool.name}`);

            } catch (error) {
                console.error(`❌ Error generating/scheduling post for ${tool.name}:`, error.message);
            }
        }

        console.log('✅ Daily AI tools scheduling completed!');
        return true;

    } catch (error) {
        console.error('❌ Error in scheduleAIToolsPosts:', error);
        return false;
    }
}

/**
 * Generate a list of 10 trending/useful AI tools using Claude
 */
const { fetchLatestAINews } = require('./news-fetcher');

/**
 * Generate a list of 10 trending/useful AI tools using real-time news + Claude
 */
async function generateDailyAIToolsList() {
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });

    // 1. Fetch real-time news
    const newsItems = await fetchLatestAINews();

    // Format news for the prompt
    const newsContext = newsItems.slice(0, 30).map((item, index) =>
        `${index + 1}. [${item.source}] ${item.title} (${item.pubDate.toISOString().split('T')[0]})`
    ).join('\n');

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    console.log(`🧠 Asking Claude to select best topics from ${newsItems.length} news items...`);

    const prompt = `You are an expert AI trend analyst.
  
  Today is ${today}.
  
  Here is a list of the LATEST AI news and tool launches from the last 48 hours:
  
  ${newsContext}
  
  TASK: Select the 10 most significant/interesting AI tools or updates from this list to share on social media.
  
  Requirements:
  1. Prioritize "Tools" and "Launches" over general business news (e.g., "Company X raises money" is less interesting than "Company X launches Tool Y").
  2. If the list doesn't have enough "Tools", include major AI news updates that are relevant to users.
  3. Ensure variety in the selection.
  4. If you absolutely cannot find 10 good items in the provided list, you may supplement with VERY RECENT (last 48h) major AI news you know about that might be missing, but prioritize the provided list.
  
  Return ONLY a JSON array with this format:
  [
    {
      "name": "Tool/News Title",
      "category": "Category Name",
      "hook": "Why it's interesting/valuable",
      "source_link": "URL if available (or empty string)" 
    }
  ]`;

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        temperature: 0.5, // Lower temperature for more factual selection
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
 * Calculate 10 posting times distributed throughout the day (8 AM to 8 PM)
 */
function calculateScheduleTimes(count) {
    const times = [];
    const startHour = 8; // 8 AM
    const endHour = 20;  // 8 PM
    const totalMinutes = (endHour - startHour) * 60;
    const interval = totalMinutes / (count - 1); // Evenly spaced

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1); // Schedule for tomorrow
    tomorrow.setSeconds(0);
    tomorrow.setMilliseconds(0);

    for (let i = 0; i < count; i++) {
        const minutesToAdd = Math.floor(i * interval);
        const postTime = new Date(tomorrow);
        postTime.setHours(startHour, 0, 0, 0);
        postTime.setMinutes(postTime.getMinutes() + minutesToAdd);

        // Add some random jitter (±15 mins) so it looks natural
        const jitter = Math.floor(Math.random() * 30) - 15;
        postTime.setMinutes(postTime.getMinutes() + jitter);

        times.push(postTime);
    }

    return times;
}

module.exports = {
    scheduleAIToolsPosts,
    generateDailyAIToolsList,
    generateToolPostContent
};
