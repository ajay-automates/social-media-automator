import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';
import { platforms, allPlatforms } from '../data/features';

export default function Stats() {
  const stats = [
    {
      value: 20,
      suffix: '+',
      label: 'Platforms Supported',
      icon: '🌐',
      color: 'from-blue-500 to-cyan-500',
      description: '10 working now, more coming soon'
    },
    {
      value: 10000,
      suffix: '+',
      label: 'Posts Published',
      icon: '📝',
      color: 'from-purple-500 to-pink-500',
      description: 'Content shared worldwide'
    },
    {
      value: 99,
      suffix: '%',
      label: 'Uptime',
      icon: '⚡',
      color: 'from-green-500 to-emerald-500',
      description: 'Always available when you need it'
    },
    {
      value: 500,
      suffix: '+',
      label: 'Happy Customers',
      icon: '😊',
      color: 'from-yellow-500 to-orange-500',
      description: 'Growing every day'
    },
  ];

  return (
    <section className="relative py-32 bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <span className="text-green-600 font-semibold text-sm uppercase tracking-wider px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-gray-200/50">
              📊 By The Numbers
            </span>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Proven{' '}
            <span className="text-gradient">Results</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Real metrics from real users making an impact
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -10, scale: 1.05 }}
              className="relative group"
            >
              <div className="bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-2xl p-8 text-center hover:bg-white/90 transition-all shadow-lg">
                {/* Animated gradient background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`}
                  whileHover={{ scale: 1.05 }}
                />

                {/* Icon */}
                <motion.div
                  className="text-6xl mb-4"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.2,
                  }}
                >
                  {stat.icon}
                </motion.div>

                {/* Counter */}
                <div className={`text-5xl font-bold mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  <AnimatedCounter
                    end={stat.value}
                    suffix={stat.suffix}
                    duration={2500}
                  />
                </div>

                {/* Label */}
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  {stat.label}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600">
                  {stat.description}
                </p>

                {/* Pulse indicator */}
                <motion.div
                  className={`absolute top-4 right-4 w-3 h-3 bg-gradient-to-r ${stat.color} rounded-full`}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Platform Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-3xl p-8 md:p-12 shadow-lg"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6">
            Integrated with 20+ Platforms
          </h3>
          <p className="text-gray-700 text-center mb-8">
            <span className="text-green-600 font-semibold">✅ 10 Working Now</span> •
            <span className="text-blue-600 font-semibold">⏳ 5 Pending Approval</span> •
            <span className="text-purple-600 font-semibold">🚀 5 Coming Soon</span>
          </p>

          {/* Working Now Platforms */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-green-600 text-center mb-4">✅ Working Now - Instant Access</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {platforms.working.map((platform, index) => {
                const PlatformIcon = platform.Icon;
                return (
                  <motion.div
                    key={platform.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: index * 0.03, duration: 0.4 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${platform.color} hover:shadow-2xl transition-all cursor-pointer border-2 border-green-400/50 motion-safe:transform will-change-transform`}
                  >
                    <PlatformIcon className="text-3xl text-white drop-shadow-lg" />
                    <span className="text-xs font-semibold text-white text-center">{platform.name}</span>
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">NOW</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Pending Approval Platforms */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-blue-600 text-center mb-4">⏳ Pending Platform Approval</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {platforms.pending.map((platform, index) => {
                const PlatformIcon = platform.Icon;
                return (
                  <motion.div
                    key={platform.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: index * 0.03, duration: 0.4 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${platform.color} hover:shadow-2xl transition-all cursor-pointer opacity-75 border-2 border-blue-400/30 motion-safe:transform will-change-transform`}
                  >
                    <PlatformIcon className="text-3xl text-white drop-shadow-lg" />
                    <span className="text-xs font-semibold text-white text-center">{platform.name}</span>
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">SOON</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Coming Soon Platforms */}
          <div>
            <h4 className="text-lg font-bold text-purple-600 text-center mb-4">🚀 Coming Soon</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {platforms.comingSoon.map((platform, index) => {
                const PlatformIcon = platform.Icon;
                return (
                  <motion.div
                    key={platform.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: index * 0.03, duration: 0.4 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${platform.color} hover:shadow-2xl transition-all cursor-pointer opacity-50 border-2 border-purple-400/20 motion-safe:transform will-change-transform`}
                  >
                    <PlatformIcon className="text-3xl text-white drop-shadow-lg" />
                    <span className="text-xs font-semibold text-white text-center">{platform.name}</span>
                    <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">2025</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-6 text-gray-600 text-sm"
          >
            + More platforms added every month
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

