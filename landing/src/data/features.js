import { 
  FaLinkedin, 
  FaTwitter, 
  FaInstagram, 
  FaFacebook, 
  FaTiktok, 
  FaYoutube, 
  FaReddit, 
  FaDiscord, 
  FaSlack, 
  FaTelegram,
  FaWhatsapp,
  FaPinterest,
  FaMedium,
  FaSnapchat,
  FaTwitch,
  FaQuora,
  FaTumblr,
  FaVk,
  FaLine,
  FaWeixin,
  FaMicrophone
} from 'react-icons/fa';
import { SiThreads, SiBluesky, SiMastodon, SiVimeo } from 'react-icons/si';

export const features = [
  {
    id: 1,
    title: "Multi-Platform Posting",
    description: "Post to 25+ platforms simultaneously—LinkedIn, Twitter, Instagram, Facebook, TikTok, YouTube, Reddit, Discord, Slack, Telegram, WhatsApp, Pinterest, Medium, Threads, Mastodon, Bluesky, and more. Grow your reach 25x faster.",
    icon: "🚀",
    size: "large",
    video: null
  },
  {
    id: 2,
    title: "AI Caption Generator",
    description: "Claude Sonnet 4 AI-powered captions tailored to each platform. Get 3 variations in seconds with platform-specific tone and hashtags.",
    icon: "🤖",
    size: "medium",
    video: null
  },
  {
    id: 3,
    title: "AI Video Generation",
    description: "Create stunning AI videos with Sora, Veo, Kling, and RunwayML. Generate professional video content from text prompts in minutes.",
    icon: "🎬",
    size: "large",
    video: null
  },
  {
    id: 4,
    title: "AI Image Generation",
    description: "Create stunning visuals with Stable Diffusion, DALL-E 3, Midjourney API. Generate custom images for every post without designers.",
    icon: "🎨",
    size: "large",
    video: null
  },
  {
    id: 5,
    title: "Smart Scheduling",
    description: "AI-powered optimal posting times. Schedule weeks in advance with intelligent timing. Set it and forget it—automation handles the rest.",
    icon: "📅",
    size: "medium",
    video: null
  },
  {
    id: 6,
    title: "Analytics Dashboard",
    description: "Real-time analytics across all platforms. Track engagement, reach, clicks, conversions. AI-powered insights and recommendations.",
    icon: "📊",
    size: "medium",
    video: null
  },
  {
    id: 7,
    title: "Content Recycling",
    description: "Automatically repurpose top-performing content. AI rewrites and schedules your best posts for maximum reach and engagement.",
    icon: "♻️",
    size: "medium",
    video: null
  },
  {
    id: 8,
    title: "Hashtag Generator",
    description: "AI-powered hashtag research. Get trending, relevant hashtags for every platform. Boost discoverability and reach automatically.",
    icon: "🏷️",
    size: "medium",
    video: null
  },
  {
    id: 9,
    title: "Bulk CSV Upload",
    description: "Upload hundreds of posts at once with CSV. Perfect for agencies and content batching workflows. Schedule entire months in minutes.",
    icon: "📦",
    size: "medium",
    video: null
  },
  {
    id: 10,
    title: "Content Calendar",
    description: "Visual drag-and-drop calendar. Plan your entire content strategy. Color-coded by platform and content type.",
    icon: "🗓️",
    size: "medium",
    video: null
  },
  {
    id: 11,
    title: "Team Collaboration",
    description: "Multi-user workspace with roles and permissions. Approval workflows, comments, and real-time collaboration for agencies.",
    icon: "👥",
    size: "medium",
    video: null
  },
  {
    id: 12,
    title: "A/B Testing",
    description: "Test multiple versions of posts. AI analyzes performance and recommends winners. Optimize engagement automatically.",
    icon: "🧪",
    size: "medium",
    video: null
  },
  {
    id: 13,
    title: "URL Shortener",
    description: "Custom branded short links. Track clicks, geography, devices. Retargeting pixels included for every link.",
    icon: "🔗",
    size: "medium",
    video: null
  },
  {
    id: 14,
    title: "RSS Auto-Post",
    description: "Auto-post from any RSS feed or blog. AI rewrites content for each platform. Perfect for content curation and sharing.",
    icon: "📡",
    size: "medium",
    video: null
  },
  {
    id: 15,
    title: "Social Listening",
    description: "Monitor keywords, mentions, and competitors across all platforms. Get alerts for opportunities to engage and respond.",
    icon: "👂",
    size: "medium",
    video: null
  },
  {
    id: 16,
    title: "Auto-Reply AI",
    description: "AI-powered comment and DM responses. Handle customer support 24/7. Maintain your brand voice automatically.",
    icon: "💬",
    size: "medium",
    video: null
  },
  {
    id: 17,
    title: "Competitor Analysis",
    description: "Track competitor posting strategies. See what works for them. AI suggests content ideas based on trending topics.",
    icon: "🎯",
    size: "medium",
    video: null
  },
  {
    id: 18,
    title: "White Label",
    description: "Rebrand the entire platform as your own. Custom domain, logo, colors. Perfect for agencies selling social media management.",
    icon: "🏷️",
    size: "medium",
    video: null
  },
  {
    id: 19,
    title: "API Access",
    description: "Full REST API and webhooks. Build custom integrations. Connect to your existing tools and workflows seamlessly.",
    icon: "⚙️",
    size: "medium",
    video: null
  },
  {
    id: 20,
    title: "Video Editing",
    description: "Built-in video editor. Add captions, trim, crop, filters. Optimize for each platform's requirements automatically.",
    icon: "✂️",
    size: "medium",
    video: null
  },
  {
    id: 21,
    title: "Story Scheduler",
    description: "Schedule Instagram, Facebook, and Snapchat Stories. Automatic posting for 24-hour content across all platforms.",
    icon: "📱",
    size: "medium",
    video: null
  },
  {
    id: 22,
    title: "Carousel Creator",
    description: "Design multi-image carousels for Instagram and LinkedIn. Templates, drag-and-drop builder, auto-sizing for platforms.",
    icon: "🎠",
    size: "medium",
    video: null
  },
  {
    id: 23,
    title: "Influencer Database",
    description: "Access 10M+ influencers. Search by niche, engagement, audience. Manage outreach campaigns and track collaborations.",
    icon: "⭐",
    size: "medium",
    video: null
  },
  {
    id: 24,
    title: "ROI Tracking",
    description: "Track revenue from social media. UTM parameters, conversion tracking, attribution models. See your true social ROI.",
    icon: "💰",
    size: "medium",
    video: null
  }
];

export const platforms = [
  { name: "LinkedIn", Icon: FaLinkedin, color: "from-blue-500 to-blue-600" },
  { name: "Twitter/X", Icon: FaTwitter, color: "from-sky-400 to-sky-600" },
  { name: "Instagram", Icon: FaInstagram, color: "from-pink-500 to-purple-500" },
  { name: "Facebook", Icon: FaFacebook, color: "from-blue-600 to-blue-700" },
  { name: "TikTok", Icon: FaTiktok, color: "from-black to-cyan-500" },
  { name: "YouTube", Icon: FaYoutube, color: "from-red-600 to-red-700" },
  { name: "Reddit", Icon: FaReddit, color: "from-orange-500 to-orange-600" },
  { name: "Discord", Icon: FaDiscord, color: "from-indigo-500 to-indigo-600" },
  { name: "Slack", Icon: FaSlack, color: "from-purple-500 to-pink-500" },
  { name: "Telegram", Icon: FaTelegram, color: "from-cyan-400 to-cyan-500" },
  { name: "WhatsApp", Icon: FaWhatsapp, color: "from-green-500 to-green-600" },
  { name: "Pinterest", Icon: FaPinterest, color: "from-red-500 to-red-600" },
  { name: "Medium", Icon: FaMedium, color: "from-gray-700 to-gray-800" },
  { name: "Threads", Icon: SiThreads, color: "from-black to-gray-900" },
  { name: "Snapchat", Icon: FaSnapchat, color: "from-yellow-400 to-yellow-500" },
  { name: "Mastodon", Icon: SiMastodon, color: "from-purple-600 to-purple-700" },
  { name: "Bluesky", Icon: SiBluesky, color: "from-blue-400 to-blue-500" },
  { name: "Tumblr", Icon: FaTumblr, color: "from-indigo-600 to-blue-600" },
  { name: "Twitch", Icon: FaTwitch, color: "from-purple-500 to-purple-600" },
  { name: "Vimeo", Icon: SiVimeo, color: "from-teal-500 to-teal-600" },
  { name: "Quora", Icon: FaQuora, color: "from-red-600 to-red-700" },
  { name: "Line", Icon: FaLine, color: "from-green-400 to-green-500" },
  { name: "WeChat", Icon: FaWeixin, color: "from-green-600 to-green-700" },
  { name: "VK", Icon: FaVk, color: "from-blue-500 to-blue-600" },
  { name: "Clubhouse", Icon: FaMicrophone, color: "from-yellow-600 to-orange-600" }
];

