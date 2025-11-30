import { motion } from 'framer-motion';
import AnimatedText from './AnimatedText';
import GradientBlobs from './GradientBlobs';
import { platforms } from '../data/features';

export default function Hero() {
  // Show first 6 working platforms
  const floatingPlatforms = platforms.working.slice(0, 6);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const platformVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.1 + 0.5,
        duration: 0.5,
        ease: "backOut",
      },
    }),
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <GradientBlobs />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center"
        >
          {/* Main Headline */}
          <motion.div variants={itemVariants} className="mb-6">
            <h1 className="text-6xl md:text-8xl font-bold mb-4 leading-tight">
              <span className="block">Automate Your</span>
              <span className="block text-gradient">
                <AnimatedText
                  texts={[
                    'Social Media',
                    'Content Strategy',
                    'Marketing',
                    'Growth'
                  ]}
                  className="inline-block"
                />
              </span>
              <span className="block">in Minutes</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Post to <span className="text-blue-400 font-semibold">20+ platforms</span> at once.
            <span className="text-green-400 font-semibold">Working now</span>, 5+ coming soon.
            Generate <span className="text-purple-400 font-semibold">AI captions & images</span> with Claude & Stability AI.
            Schedule weeks in advance. Save <span className="text-pink-400 font-semibold">20+ hours</span> per week.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <motion.a
              href="/auth"
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-xl font-bold text-lg overflow-hidden"
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
            </motion.a>

            <motion.a
              href="#features"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass text-white px-10 py-5 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors"
            >
              See Features
            </motion.a>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-6 justify-center text-sm text-gray-400 mb-16"
          >
            {['No credit card required', '14-day free trial', 'Cancel anytime'].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-green-400 text-lg">✓</span>
                <span>{text}</span>
              </div>
            ))}
          </motion.div>


          {/* Scroll Indicator */}
        </motion.div>
      </div>
    </section>
  );
}

