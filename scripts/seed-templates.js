/**
 * Seed Templates Script
 * Creates professional social media templates
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const templates = [
  {
    name: "Welcome New Followers",
    description: "Warm welcome message for new community members",
    text: "Welcome to our community! 🎉 We're thrilled to have you here. Follow along for {{topic}} tips, insights, and exclusive content. What brought you here today? 👇",
    platforms: ['linkedin', 'twitter'],
    category: 'engagement',
    tags: ['welcome', 'community', 'engagement']
  },
  {
    name: "Product Launch Announcement",
    description: "Exciting product launch with key features",
    text: "🚀 BIG NEWS! We're launching {{product_name}} today!\n\n{{description}}\n\n✨ Key benefits:\n• Feature 1\n• Feature 2\n• Feature 3\n\nLearn more: {{link}}",
    platforms: ['linkedin', 'twitter'],
    category: 'promotional',
    tags: ['launch', 'product', 'announcement']
  },
  {
    name: "Monday Motivation",
    description: "Inspirational quote to start the week",
    text: "☀️ Monday Motivation\n\n'{{quote}}' - {{author}}\n\nWhat are your goals for this week? Share below! 💪",
    platforms: ['linkedin', 'twitter'],
    category: 'engagement',
    tags: ['motivation', 'monday', 'inspiration']
  },
  {
    name: "Tip of the Day",
    description: "Daily educational tip for your audience",
    text: "💡 {{day}} Tip:\n\n{{tip_content}}\n\nTry this today and let us know your results! 🎯\n\n#TipOfTheDay #{{niche}}",
    platforms: ['linkedin', 'twitter'],
    category: 'educational',
    tags: ['tips', 'education', 'daily']
  },
  {
    name: "Behind the Scenes",
    description: "Share exclusive BTS content with followers",
    text: "🎬 Behind the scenes at {{company}}!\n\n{{description}}\n\nWant to see more BTS content? Let us know! 👇",
    platforms: ['tiktok', 'youtube'],
    category: 'personal',
    tags: ['bts', 'behind-the-scenes', 'company-culture']
  },
  {
    name: "Customer Testimonial",
    description: "Showcase positive customer feedback",
    text: "⭐ TESTIMONIAL ALERT\n\n\"{{testimonial}}\" - {{customer_name}}, {{customer_title}}\n\nWant results like this? {{call_to_action}}",
    platforms: ['linkedin', 'twitter'],
    category: 'promotional',
    tags: ['testimonial', 'social-proof', 'customer-success']
  },
  {
    name: "How-To Guide",
    description: "Step-by-step educational content",
    text: "📚 How to {{topic}}:\n\n1️⃣ {{step1}}\n2️⃣ {{step2}}\n3️⃣ {{step3}}\n\nSave this for later! Bookmark →\n\nQuestions? Drop them below! 👇",
    platforms: ['linkedin', 'youtube', 'reddit'],
    category: 'educational',
    tags: ['how-to', 'tutorial', 'guide']
  },
  {
    name: "Industry News Share",
    description: "Share and comment on industry news",
    text: "📰 Industry Update:\n\n{{news_headline}}\n\n💭 My take: {{your_opinion}}\n\nWhat do you think? Comment below!",
    platforms: ['linkedin', 'twitter', 'reddit'],
    category: 'educational',
    tags: ['news', 'industry', 'commentary']
  },
  {
    name: "Weekend Vibes",
    description: "Fun weekend engagement post",
    text: "🎉 Weekend Vibes!\n\nWhat are your plans this weekend?\nA) Relax 😌\nB) Work on side projects 💼\nC) Adventure time! 🌄\nD) Other (comment!) 👇",
    platforms: ['twitter', 'telegram'],
    category: 'engagement',
    tags: ['weekend', 'fun', 'poll']
  },
  {
    name: "Flash Sale",
    description: "Urgent promotional offer announcement",
    text: "⚡ FLASH SALE ALERT ⚡\n\n{{discount}}% OFF {{product_name}}\n⏰ Ends: {{end_date}}\n\nDon't miss out! Use code: {{coupon_code}}\n{{link}}",
    platforms: ['twitter', 'telegram'],
    category: 'promotional',
    tags: ['sale', 'discount', 'urgent']
  },
  {
    name: "Team Spotlight",
    description: "Highlight team members and company culture",
    text: "👏 Team Spotlight: {{employee_name}}\n\nRole: {{role}}\nFavorite thing about work: {{favorite_thing}}\n\nWe're lucky to have {{employee_name}} on our team! 💙",
    platforms: ['linkedin'],
    category: 'personal',
    tags: ['team', 'culture', 'spotlight']
  },
  {
    name: "Milestone Celebration",
    description: "Celebrate company achievements",
    text: "🎊 MILESTONE ACHIEVED!\n\nWe just hit {{milestone}}! 🚀\n\nThank you to everyone who made this possible. This is just the beginning!\n\n{{gratitude_message}}",
    platforms: ['linkedin', 'twitter'],
    category: 'announcement',
    tags: ['milestone', 'celebration', 'achievement']
  },
  {
    name: "Question of the Day",
    description: "Drive engagement with daily questions",
    text: "❓ Question of the Day:\n\n{{question}}\n\nI'll go first: {{your_answer}}\n\nYour turn! Drop your answer below 👇",
    platforms: ['linkedin', 'twitter', 'reddit'],
    category: 'engagement',
    tags: ['question', 'discussion', 'engagement']
  },
  {
    name: "Holiday Greeting",
    description: "Seasonal holiday wishes",
    text: "🎄 Happy {{holiday}}!\n\n{{custom_message}}\n\nFrom our team to yours, wishing you {{wishes}}! ✨",
    platforms: ['linkedin', 'twitter'],
    category: 'seasonal',
    tags: ['holiday', 'greeting', 'seasonal']
  },
  {
    name: "Webinar/Event Invitation",
    description: "Invite audience to upcoming events",
    text: "📅 EVENT ALERT!\n\n{{event_name}}\n📆 {{date}} at {{time}}\n\n{{description}}\n\nRegister now: {{registration_link}}\nLimited spots available! 🎟️",
    platforms: ['linkedin', 'twitter', 'slack'],
    category: 'announcement',
    tags: ['event', 'webinar', 'invitation']
  },
  {
    name: "Blog/Article Promotion",
    description: "Share and promote blog posts or articles",
    text: "📖 NEW ARTICLE!\n\n{{article_title}}\n\n{{excerpt}}\n\nRead the full post: {{link}}\n\n#{{topic}} #{{industry}}",
    platforms: ['linkedin', 'twitter'],
    category: 'promotional',
    tags: ['blog', 'article', 'content-marketing']
  },
  {
    name: "Case Study Highlight",
    description: "Showcase customer success story",
    text: "📊 CASE STUDY: {{company_name}}\n\nChallenge: {{challenge}}\nSolution: {{solution}}\nResult: {{result_metric}}\n\nRead the full story: {{link}}",
    platforms: ['linkedin', 'twitter'],
    category: 'promotional',
    tags: ['case-study', 'social-proof', 'success-story']
  },
  {
    name: "Before & After Showcase",
    description: "Show transformation or improvement",
    text: "🔄 BEFORE & AFTER\n\nBefore: {{before_description}}\nAfter: {{after_description}}\n\nResults: {{transformation_results}}\n\nReady to transform? {{cta}}\n{{link}}",
    platforms: ['tiktok', 'youtube'],
    category: 'promotional',
    tags: ['before-after', 'transformation', 'results']
  },
  {
    name: "User-Generated Content Request",
    description: "Encourage followers to create content",
    text: "📸 WE WANT YOUR CONTENT!\n\nTag us in {{content_type}} featuring {{your_product}}!\n\nUse #{{hashtag}} for a chance to be featured\n\nLet's see your {{thing}}! 👇\n{{cta}}",
    platforms: ['twitter', 'tiktok'],
    category: 'engagement',
    tags: ['ugc', 'user-generated', 'engagement']
  },
  {
    name: "Job Opening Announcement",
    description: "Recruit talent with engaging posts",
    text: "🎯 WE'RE HIRING!\n\nPosition: {{job_title}}\nLocation: {{location}}\nType: {{job_type}}\n\n{{brief_description}}\n\nApply here: {{apply_link}}\n\n#Hiring #{{industry}}",
    platforms: ['linkedin', 'twitter'],
    category: 'announcement',
    tags: ['hiring', 'recruitment', 'jobs']
  },
  {
    name: "Thought Leadership / Hot Take",
    description: "Share bold opinions and insights",
    text: "🔥 HOT TAKE:\n\n{{opinion}}\n\nHere's why: {{explanation}}\n\nAm I crazy? Let me know your thoughts! 👇\n#{{industry}} #{{topic}}",
    platforms: ['linkedin', 'twitter'],
    category: 'engagement',
    tags: ['thought-leadership', 'opinion', 'insights']
  },
  {
    name: "Partnership Announcement",
    description: "Announce collaboration or partnership",
    text: "🤝 PARTNERSHIP ALERT!\n\nWe're excited to announce a partnership with {{partner_name}}!\n\n{{partnership_details}}\n\nThis means {{benefits_for_audience}}\n\nLearn more: {{link}}",
    platforms: ['linkedin', 'twitter'],
    category: 'announcement',
    tags: ['partnership', 'collaboration', 'announcement']
  },
  {
    name: "Community Member Spotlight",
    description: "Celebrate community members",
    text: "⭐ COMMUNITY SPOTLIGHT!\n\nMeet {{member_name}}, a {{what_makes_them_special}}!\n\n\"{{their_quote}}\"\n\nShoutout to {{member_name}} for {{their_contribution}}! 🎉\n\nYou could be featured next! {{cta}}",
    platforms: ['linkedin', 'twitter'],
    category: 'personal',
    tags: ['community', 'spotlight', 'appreciation']
  },
  {
    name: "Product Update / Feature Release",
    description: "Announce new features or improvements",
    text: "🆕 NEW FEATURE ALERT!\n\n{{feature_name}} is now available!\n\nWhat it does: {{feature_description}}\n\nBenefits:\n• {{benefit1}}\n• {{benefit2}}\n• {{benefit3}}\n\nGet started: {{link}}",
    platforms: ['linkedin', 'twitter'],
    category: 'announcement',
    tags: ['product-update', 'feature', 'release']
  },
  {
    name: "Customer Appreciation Post",
    description: "Thank and celebrate customers",
    text: "💝 THANK YOU!\n\nWe're grateful for {{what_customers_do}}.\n\nYou make {{positive_impact}} possible.\n\nAs a thank you, {{special_offer_or_benefit}}\n\n{{cta}}\n#{{hashtag}}",
    platforms: ['twitter', 'linkedin'],
    category: 'engagement',
    tags: ['appreciation', 'gratitude', 'customer-love']
  },
  {
    name: "Limited Time Offer",
    description: "Create urgency with time-sensitive deals",
    text: "⏰ LIMITED TIME OFFER\n\n{{offer_description}}\n\n🎁 {{specific_benefit}}\n💰 {{price_or_discount}}\n📅 Ends: {{end_date}}\n\nGrab yours now: {{link}}\n\nDon't miss out! #{{hashtag}}",
    platforms: ['twitter', 'telegram'],
    category: 'promotional',
    tags: ['limited-offer', 'urgency', 'deal']
  },
  {
    name: "Educational Thread / Series",
    description: "Share multi-part educational content",
    text: "🧵 THREAD: {{topic}}\n\nToday we're diving into {{topic}}. Here's what you need to know:\n\n1️⃣ {{point1}}\n2️⃣ {{point2}}\n3️⃣ {{point3}}\n4️⃣ {{point4}}\n\nSave this for reference! {{cta}}\n#{{hashtag}}",
    platforms: ['twitter', 'linkedin'],
    category: 'educational',
    tags: ['thread', 'educational', 'series']
  },
  {
    name: "Crisis / Service Disruption Notice",
    description: "Communicate issues professionally",
    text: "⚠️ SERVICE NOTICE\n\nWe wanted to inform you of {{issue}}.\n\nWhat's happening: {{explanation}}\nWhen: {{timeline}}\nWhat we're doing: {{solution}}\n\nWe appreciate your patience. Questions? {{contact_info}}",
    platforms: ['linkedin', 'twitter'],
    category: 'announcement',
    tags: ['crisis-communication', 'notice', 'transparency']
  },
  {
    name: "Follower Milestone Celebration",
    description: "Celebrate reaching follower milestones",
    text: "🎉 {{follower_count}} FOLLOWERS!\n\nWe hit {{milestone}}! Thank you {{followers}}!\n\nThis means {{what_it_means}}.\n\nTo celebrate: {{special_offer_or_content}}\n\n{{gratitude_message}}\n💙",
    platforms: ['twitter', 'tiktok'],
    category: 'announcement',
    tags: ['milestone', 'followers', 'gratitude']
  }
];

async function seedTemplates() {
  try {
    console.log('🌱 Starting template seeding for all users...\n');

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError || !authUsers.users || authUsers.users.length === 0) {
      console.error('❌ No users found. Please create a user account first.');
      process.exit(1);
    }

    console.log(`Found ${authUsers.users.length} users. Seeding templates for each...\n`);

    let totalSuccess = 0;
    let totalError = 0;

    for (const user of authUsers.users) {
      console.log(`\n📧 Processing user: ${user.email}`);
      const result = await insertTemplates(user.id);
      totalSuccess += result.success;
      totalError += result.error;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 ALL USERS SEEDED!`);
    console.log(`✅ Total Success: ${totalSuccess} templates`);
    if (totalError > 0) {
      console.log(`❌ Total Errors: ${totalError} templates`);
    }
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

async function insertTemplates(userId) {
  let successCount = 0;
  let errorCount = 0;

  for (const template of templates) {
    try {
      const { data, error } = await supabase
        .from('post_templates')
        .insert([{
          user_id: userId,
          name: template.name,
          description: template.description,
          text: template.text,
          platforms: template.platforms,
          category: template.category,
          tags: template.tags,
          use_count: 0,
          is_favorite: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create "${template.name}":`, error.message);
        errorCount++;
      } else {
        console.log(`✅ Created: ${template.name} (ID: ${data.id})`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error creating "${template.name}":`, err.message);
      errorCount++;
    }
  }

  console.log(`  ✅ Success: ${successCount} | ❌ Failed: ${errorCount}`);

  return { success: successCount, error: errorCount };
}

// Run the script
seedTemplates();
