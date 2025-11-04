import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';
import { platforms } from '../data/features';

export default function Stats() {
  const stats = [
    {
      value: 25,
      suffix: '+',
      label: 'Platforms Supported',
      icon: '🌐',
      color: 'from-blue-500 to-cyan-500',
      description: 'Post to all major social networks'
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
    <section className="relative py-32 bg-gray-950">
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
            <span className="text-green-400 font-semibold text-sm uppercase tracking-wider px-4 py-2 rounded-full glass">
              📊 By The Numbers
            </span>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Proven{' '}
            <span className="text-gradient">Results</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
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
              <div className="glass rounded-2xl p-8 text-center hover:bg-white/15 transition-all">
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
                <div className="text-lg font-semibold text-white mb-2">
                  {stat.label}
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400">
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
          className="glass rounded-3xl p-8 md:p-12"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
            Integrated with 25+ Platforms
          </h3>
          <p className="text-gray-400 text-center mb-8">
            Connect and post to all major social networks simultaneously
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-4">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.15, y: -5 }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${platform.color} hover:shadow-2xl transition-all cursor-pointer`}
              >
                <span className="text-3xl">{platform.icon}</span>
                <span className="text-xs font-semibold text-white text-center">{platform.name}</span>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-6 text-gray-500 text-sm"
          >
            + More platforms added every month
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

