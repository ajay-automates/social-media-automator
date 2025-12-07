import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { allPlatforms } from '../data/features';

// Show ALL platforms (20 total)
const platformsToShow = allPlatforms;

// Position configuration for floating platform icons - 20 positions, well distributed across the entire area
const platformPositions = [
  { top: '2%', left: '2%' },      // 1. LinkedIn
  { top: '5%', right: '3%' },      // 2. Twitter/X
  { top: '10%', left: '10%' },     // 3. Telegram
  { top: '13%', right: '10%' },    // 4. Slack
  { top: '18%', left: '3%' },      // 5. Discord
  { top: '21%', right: '6%' },     // 6. Reddit
  { top: '26%', left: '15%' },     // 7. Dev.to
  { top: '29%', right: '2%' },     // 8. Tumblr
  { top: '34%', left: '22%' },     // 9. Mastodon
  { top: '37%', right: '15%' },    // 10. Bluesky
  { top: '42%', left: '6%' },      // 11. YouTube
  { top: '45%', right: '20%' },    // 12. Instagram
  { top: '50%', left: '18%' },     // 13. Facebook
  { top: '53%', right: '5%' },     // 14. Pinterest
  { top: '58%', left: '26%' },     // 15. TikTok
  { top: '61%', right: '12%' },    // 16. Threads
  { top: '66%', left: '11%' },     // 17. WhatsApp
  { top: '69%', right: '22%' },    // 18. Snapchat
  { top: '74%', left: '4%' },      // 19. Twitch
  { top: '77%', right: '8%' },     // 20. Quora
];

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const iconVariants = {
    hidden: { scale: 0, opacity: 0, rotate: -10 },
    visible: (i) => ({
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        delay: i * 0.08 + 0.3,
        duration: 0.6,
        ease: "backOut",
      },
    }),
  };

  const floatAnimation = {
    y: [0, -15, 0],
    transition: {
      duration: 3 + Math.random() * 2, // Random duration between 3-5s for variety
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white pt-20">
      {/* Soft gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100/30 via-purple-100/20 to-cyan-100/30" />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,rgb(0,0,0)_1px,transparent_0)] bg-[length:32px_32px]" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10 max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-12 lg:gap-16 items-center"
        >
          {/* LEFT SIDE: Floating Platform Icons (60%) */}
          <motion.div
            variants={itemVariants}
            className="relative h-[500px] lg:h-[700px] hidden lg:block overflow-visible"
          >
            {platformsToShow.map((platform, i) => {
              const PlatformIcon = platform.Icon;
              const position = platformPositions[i] || platformPositions[i % platformPositions.length];
              
              if (!PlatformIcon) {
                console.warn(`Missing icon for platform: ${platform.name}`);
                return null;
              }
              
              return (
                <motion.div
                  key={`${platform.name}-${i}`}
                  custom={i}
                  variants={iconVariants}
                  animate={floatAnimation}
                  style={{
                    position: 'absolute',
                    ...position,
                  }}
                  className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br ${platform.color} shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex items-center justify-center border-2 border-white/20`}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                >
                  <PlatformIcon 
                    className="text-3xl lg:text-4xl text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                      {platform.name}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
          </motion.div>

          {/* RIGHT SIDE: Content (40%) */}
          <motion.div variants={itemVariants} className="space-y-8 text-center lg:text-left">
            {/* Tagline */}
            <motion.p
              variants={itemVariants}
              className="text-sm md:text-base text-gray-600 font-medium uppercase tracking-wider"
            >
              Not a tool. Not a platform. A <em className="not-italic font-bold text-purple-600">solution</em>.
            </motion.p>

            {/* Main Headline with Emphasis */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900"
            >
              Finally, a place to{' '}
              <em className="not-italic bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent font-bold">
                automate
              </em>{' '}
              your social media
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Post to <strong className="text-gray-900">20+ platforms</strong> at once.{' '}
              Generate <strong className="text-gray-900">AI captions & images</strong> with Claude & Stability AI.{' '}
              Schedule weeks in advance. Save <strong className="text-gray-900">20+ hours</strong> per week.
            </motion.p>

            {/* CTA Section */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4"
            >
              {/* Primary CTA */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-semibold text-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
                >
                  Join 3,000+ creators
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </Link>
              </motion.div>

              {/* Secondary CTA */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition-all shadow-md hover:shadow-lg"
                >
                  See how it works
                </a>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-gray-500 pt-4"
            >
              {['No credit card required', '14-day free trial', 'Cancel anytime'].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-green-500 text-lg">✓</span>
                  <span>{text}</span>
                </div>
              ))}
            </motion.div>

            {/* Social Proof */}
            <motion.div
              variants={itemVariants}
              className="pt-6 text-sm text-gray-500"
            >
              <p>Your automation is your own space on the internet.</p>
            </motion.div>
          </motion.div>

          {/* Mobile: Show platform icons grid */}
          <motion.div
            variants={itemVariants}
            className="lg:hidden relative min-h-[400px] flex items-center justify-center py-8"
          >
            <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
              {platformsToShow.map((platform, i) => {
                const PlatformIcon = platform.Icon;
                return (
                  <motion.div
                    key={platform.name}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${platform.color} shadow-lg flex items-center justify-center border-2 border-white/20`}
                  >
                    <PlatformIcon 
                      className="text-xl text-white drop-shadow-lg"
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gray-400 rounded-full flex items-start justify-center p-2"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
