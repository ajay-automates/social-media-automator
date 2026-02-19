import {
  FaLinkedin,
  FaTwitter,
  FaTiktok,
  FaYoutube,
  FaReddit,
  FaDiscord,
  FaSlack,
  FaTelegram,
  FaPinterest,
  FaMedium,
  FaQuora,
  FaTumblr,
  FaMicrophone,
  FaRocket,
  FaCalendarAlt,
  FaChartBar,
  FaHashtag,
  FaBox,
  FaUsers,
  FaFileAlt,
  FaLink,
  FaComments,
  FaBullseye,
  FaDollarSign,
  FaImages,
  FaSync,
  FaFlask
} from 'react-icons/fa';
import { SiBluesky, SiMastodon } from 'react-icons/si';
import { HiOutlineSparkles, HiOutlineCalendar, HiOutlineChartBar, HiOutlineTag, HiOutlineCube, HiOutlineUserGroup, HiOutlineDocumentText, HiOutlineLink, HiOutlineChatBubbleLeftRight, HiOutlineCurrencyDollar, HiOutlinePhoto } from 'react-icons/hi2';

// Split features into Available Now vs Future Suite
export const features = {
  available: [
    {
      id: 1,
      title: "Multi-Platform Posting",
      description: "Post to 20+ platforms simultaneously—LinkedIn, Twitter, Telegram, Slack, Discord, Reddit, Dev.to, Tumblr, Mastodon, Bluesky, YouTube. More platforms coming soon.",
      icon: FaRocket,
      status: "available"
    },
    {
      id: 2,
      title: "AI Caption Generator",
      description: "Claude Sonnet 4 AI-powered captions tailored to each platform. Get 3 variations in seconds with platform-specific tone and hashtags.",
      icon: HiOutlineSparkles,
      status: "available"
    },
    {
      id: 3,
      title: "AI Image Generation",
      description: "Create stunning visuals with Stability AI. Generate custom images for every post without designers.",
      icon: HiOutlinePhoto,
      status: "available"
    },
    {
      id: 4,
      title: "Smart Scheduling",
      description: "AI-powered optimal posting times. Schedule weeks in advance with intelligent timing. Set it and forget it—automation handles the rest.",
      icon: HiOutlineCalendar,
      status: "available"
    },
    {
      id: 5,
      title: "Analytics Dashboard",
      description: "Real-time analytics across all platforms. Track engagement, reach, and post performance with beautiful charts.",
      icon: HiOutlineChartBar,
      status: "available"
    },
    {
      id: 6,
      title: "AI Hashtag Generator",
      description: "AI-powered hashtag research. Get trending, relevant hashtags for every platform. Boost discoverability automatically.",
      icon: HiOutlineTag,
      status: "available"
    },
    {
      id: 7,
      title: "Bulk CSV Upload",
      description: "Upload hundreds of posts at once with CSV. Perfect for agencies and content batching workflows. Schedule entire months in minutes.",
      icon: HiOutlineCube,
      status: "available"
    },
    {
      id: 8,
      title: "Content Calendar",
      description: "Visual drag-and-drop calendar. Plan your entire content strategy. Color-coded by platform and content type.",
      icon: FaCalendarAlt,
      status: "available"
    },
    {
      id: 9,
      title: "Team Collaboration",
      description: "Multi-user workspace with 4 roles (Owner, Admin, Editor, Viewer). Approval workflows and activity logging for agencies.",
      icon: HiOutlineUserGroup,
      status: "available"
    },
    {
      id: 10,
      title: "Post Templates",
      description: "Save and reuse your best-performing posts. 15+ pre-built templates included. Create unlimited custom templates.",
      icon: HiOutlineDocumentText,
      status: "available"
    },
    {
      id: 11,
      title: "Carousel Creator",
      description: "Design multi-image carousels for LinkedIn. Templates, drag-and-drop builder, auto-sizing for platforms.",
      icon: FaImages,
      status: "available"
    },
    {
      id: 12,
      title: "Content from URL",
      description: "Extract content from any URL or YouTube video. AI generates captions from transcripts and web pages automatically.",
      icon: HiOutlineLink,
      status: "available"
    }
  ],
  futureSuite: [
    {
      id: 13,
      title: "Content Recycling",
      description: "Automatically repurpose top-performing content. AI rewrites and schedules your best posts for maximum reach.",
      icon: FaSync,
      status: "coming"
    },
    {
      id: 14,
      title: "A/B Testing",
      description: "Test multiple versions of posts. AI analyzes performance and recommends winners. Optimize engagement automatically.",
      icon: FaFlask,
      status: "coming"
    },
    {
      id: 15,
      title: "Social Listening",
      description: "Monitor keywords, mentions, and competitors. Get alerts for opportunities to engage and respond.",
      icon: FaMicrophone,
      status: "coming"
    },
    {
      id: 16,
      title: "Auto-Reply AI",
      description: "AI-powered comment and DM responses. Handle customer support 24/7. Maintain your brand voice automatically.",
      icon: HiOutlineChatBubbleLeftRight,
      status: "coming"
    },
    {
      id: 17,
      title: "Competitor Analysis",
      description: "Track competitor posting strategies. See what works for them. AI suggests content ideas based on trends.",
      icon: FaBullseye,
      status: "coming"
    },
    {
      id: 18,
      title: "ROI Tracking",
      description: "Track revenue from social media. UTM parameters, conversion tracking, attribution models. See your true social ROI.",
      icon: HiOutlineCurrencyDollar,
      status: "coming"
    }
  ]
};

// Flat array for components that need it
export const allFeatures = [...features.available, ...features.futureSuite];

// Platform status categories
export const platforms = {
  working: [
    { name: "LinkedIn", Icon: FaLinkedin, color: "from-blue-500 to-blue-600", status: "working" },
    { name: "Twitter/X", Icon: FaTwitter, color: "from-sky-400 to-sky-600", status: "working" },
    { name: "Telegram", Icon: FaTelegram, color: "from-cyan-400 to-cyan-500", status: "working" },
    { name: "Slack", Icon: FaSlack, color: "from-purple-500 to-pink-500", status: "working" },
    { name: "Discord", Icon: FaDiscord, color: "from-indigo-500 to-indigo-600", status: "working" },
    { name: "Reddit", Icon: FaReddit, color: "from-orange-500 to-orange-600", status: "working" },
    { name: "Dev.to", Icon: FaMedium, color: "from-gray-900 to-black", status: "working" },
    { name: "Tumblr", Icon: FaTumblr, color: "from-indigo-600 to-blue-600", status: "working" },
    { name: "Mastodon", Icon: SiMastodon, color: "from-purple-600 to-purple-700", status: "working" },
    { name: "Bluesky", Icon: SiBluesky, color: "from-blue-400 to-blue-500", status: "working" },
    { name: "YouTube", Icon: FaYoutube, color: "from-red-600 to-red-700", status: "working" }
  ],
  pending: [
    { name: "Pinterest", Icon: FaPinterest, color: "from-red-500 to-red-600", status: "pending" },
    { name: "TikTok", Icon: FaTiktok, color: "from-black to-cyan-500", status: "pending" }
  ],
  comingSoon: [
    { name: "Quora", Icon: FaQuora, color: "from-red-600 to-red-700", status: "coming" }
  ]
};

// Flat array for components that need it
export const allPlatforms = [...platforms.working, ...platforms.pending, ...platforms.comingSoon];
