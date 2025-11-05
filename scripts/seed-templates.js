/**
 * Seed Templates Script
 * Creates 15 professional social media templates
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
    platforms: ['linkedin', 'twitter', 'instagram'],
    category: 'engagement',
    tags: ['welcome', 'community', 'engagement']
  },
  {
    name: "Product Launch Announcement",
    description: "Exciting product launch with key features",
    text: "🚀 BIG NEWS! We're launching {{product_name}} today!\n\n{{description}}\n\n✨ Key benefits:\n• Feature 1\n• Feature 2\n• Feature 3\n\nLearn more: {{link}}",
    platforms: ['linkedin', 'twitter', 'instagram', 'facebook'],
    category: 'promotional',
    tags: ['launch', 'product', 'announcement']
  },
  {
    name: "Monday Motivation",
    description: "Inspirational quote to start the week",
    text: "☀️ Monday Motivation\n\n'{{quote}}' - {{author}}\n\nWhat are your goals for this week? Share below! 💪",
    platforms: ['linkedin', 'twitter', 'instagram'],
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
    platforms: ['instagram', 'facebook', 'tiktok'],
    category: 'personal',
    tags: ['bts', 'behind-the-scenes', 'company-culture']
  },
  {
    name: "Customer Testimonial",
    description: "Showcase positive customer feedback",
    text: "⭐ TESTIMONIAL ALERT\n\n\"{{testimonial}}\" - {{customer_name}}, {{customer_title}}\n\nWant results like this? {{call_to_action}}",
    platforms: ['linkedin', 'twitter', 'facebook'],
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
    platforms: ['instagram', 'facebook', 'twitter'],
    category: 'engagement',
    tags: ['weekend', 'fun', 'poll']
  },
  {
    name: "Flash Sale",
    description: "Urgent promotional offer announcement",
    text: "⚡ FLASH SALE ALERT ⚡\n\n{{discount}}% OFF {{product_name}}\n⏰ Ends: {{end_date}}\n\nDon't miss out! Use code: {{coupon_code}}\n{{link}}",
    platforms: ['twitter', 'instagram', 'facebook', 'telegram'],
    category: 'promotional',
    tags: ['sale', 'discount', 'urgent']
  },
  {
    name: "Team Spotlight",
    description: "Highlight team members and company culture",
    text: "👏 Team Spotlight: {{employee_name}}\n\nRole: {{role}}\nFavorite thing about work: {{favorite_thing}}\n\nWe're lucky to have {{employee_name}} on our team! 💙",
    platforms: ['linkedin', 'instagram'],
    category: 'personal',
    tags: ['team', 'culture', 'spotlight']
  },
  {
    name: "Milestone Celebration",
    description: "Celebrate company achievements",
    text: "🎊 MILESTONE ACHIEVED!\n\nWe just hit {{milestone}}! 🚀\n\nThank you to everyone who made this possible. This is just the beginning!\n\n{{gratitude_message}}",
    platforms: ['linkedin', 'twitter', 'instagram', 'facebook'],
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
    platforms: ['linkedin', 'twitter', 'instagram', 'facebook'],
    category: 'seasonal',
    tags: ['holiday', 'greeting', 'seasonal']
  },
  {
    name: "Webinar/Event Invitation",
    description: "Invite audience to upcoming events",
    text: "📅 EVENT ALERT!\n\n{{event_name}}\n📆 {{date}} at {{time}}\n\n{{description}}\n\nRegister now: {{registration_link}}\nLimited spots available! 🎟️",
    platforms: ['linkedin', 'twitter', 'facebook', 'slack'],
    category: 'announcement',
    tags: ['event', 'webinar', 'invitation']
  }
];

async function seedTemplates() {
  try {
    console.log('🌱 Starting template seeding...\n');

    // Get the first user from the database
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      
      // Try to get from auth.users instead
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError || !authUsers.users || authUsers.users.length === 0) {
        console.error('❌ No users found. Please create a user account first.');
        process.exit(1);
      }
      
      const userId = authUsers.users[0].id;
      console.log(`✅ Found user: ${userId}\n`);
      
      await insertTemplates(userId);
      return;
    }

    if (!users || users.length === 0) {
      console.error('❌ No users found. Please create a user account first.');
      process.exit(1);
    }

    const userId = users[0].id;
    console.log(`✅ Found user: ${userId}\n`);

    await insertTemplates(userId);

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

  console.log('\n' + '='.repeat(50));
  console.log(`🎉 Template Seeding Complete!`);
  console.log(`✅ Success: ${successCount} templates`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} templates`);
  }
  console.log('='.repeat(50) + '\n');

  console.log('📝 Next steps:');
  console.log('   1. Open http://localhost:5173/templates');
  console.log('   2. Refresh the page');
  console.log('   3. See all your new templates! 🚀');
  console.log('');
}

// Run the script
seedTemplates();

