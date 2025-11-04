import { motion } from 'framer-motion';
import FeatureMarquee from './FeatureMarquee';
import { features } from '../data/features';

export default function Features() {
  // Split features into 3 rows
  const row1 = features.slice(0, 8);
  const row2 = features.slice(8, 16);
  const row3 = features.slice(16, 24);

  return (
    <section id="features" className="relative py-20 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-3"
          >
            <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full glass">
              ✨ Features
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-3">
            Everything You Need to{' '}
            <span className="text-gradient">Dominate</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            24 powerful features that save you 20+ hours per week
          </p>
        </motion.div>

        {/* Scrolling Feature Marquees */}
        <div className="space-y-6 mb-12">
          {/* Row 1 - Scroll Right */}
          <FeatureMarquee features={row1} direction="left" speed={60} />
          
          {/* Row 2 - Scroll Left */}
          <FeatureMarquee features={row2} direction="right" speed={50} />
          
          {/* Row 3 - Scroll Right */}
          <FeatureMarquee features={row3} direction="left" speed={55} />
        </div>

        {/* Interactive Feature Explorer */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-8 max-w-4xl mx-auto mb-12"
        >
          <h3 className="text-2xl font-bold text-white text-center mb-4">
            🎯 Complete Feature Arsenal
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-2"
              >
                <span className="text-green-400 text-lg">✓</span>
                <span>{feature.title}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <motion.a
            href="/auth.html"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all"
          >
            Get Access to All 24 Features
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
