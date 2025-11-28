import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { features, allFeatures } from '../data/features';

function Feature3D({ feature, index }) {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Simplified motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Reduced spring config for better performance
  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const getGradient = (index) => {
    const gradients = [
      { bg: 'from-blue-400/80 via-blue-500/60 to-cyan-500/80', shadow: 'rgba(59, 130, 246, 0.5)' },
      { bg: 'from-purple-400/80 via-purple-500/60 to-pink-500/80', shadow: 'rgba(168, 85, 247, 0.5)' },
      { bg: 'from-green-400/80 via-emerald-500/60 to-teal-500/80', shadow: 'rgba(16, 185, 129, 0.5)' },
      { bg: 'from-orange-400/80 via-amber-500/60 to-yellow-500/80', shadow: 'rgba(251, 146, 60, 0.5)' },
      { bg: 'from-red-400/80 via-rose-500/60 to-pink-500/80', shadow: 'rgba(239, 68, 68, 0.5)' },
      { bg: 'from-indigo-400/80 via-violet-500/60 to-purple-500/80', shadow: 'rgba(99, 102, 241, 0.5)' },
      { bg: 'from-cyan-400/80 via-teal-500/60 to-blue-500/80', shadow: 'rgba(6, 182, 212, 0.5)' },
      { bg: 'from-fuchsia-400/80 via-pink-500/60 to-rose-500/80', shadow: 'rgba(232, 121, 249, 0.5)' },
    ];
    return gradients[index % gradients.length];
  };

  const gradient = getGradient(index);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      className="group relative motion-safe:transform"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative"
      >
        {/* 3D Shadow Layer - Only show on hover for performance */}
        <motion.div
          style={{
            transform: "translateZ(-30px)",
            background: gradient.shadow,
          }}
          animate={{
            opacity: isHovered ? 0.6 : 0,
            scale: isHovered ? 1.05 : 0.95,
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-3xl blur-xl will-change-opacity"
        />

        {/* Main 3D Box */}
        <motion.div
          animate={{
            minHeight: isHovered ? '180px' : '140px',
          }}
          style={{
            transform: isHovered ? "translateZ(30px)" : "translateZ(0px)",
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative bg-gradient-to-br ${gradient.bg} backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl overflow-hidden will-change-transform`}
        >
          {/* Static glossy shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>

          {/* 3D Icon Layer */}
          <motion.div
            style={{
              transform: isHovered ? "translateZ(20px)" : "translateZ(0px)",
            }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <div className="text-5xl mb-3 drop-shadow-md">
              {feature.icon}
            </div>

            <h3 className="text-base font-bold text-white leading-tight mb-2 drop-shadow-sm">
              {feature.title}
            </h3>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-white/95 leading-relaxed mt-2 pt-2 border-t border-white/20 font-medium">
                    {feature.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Badge */}
            {feature.status === 'available' ? (
              <div className="absolute top-2 right-2">
                <div className="bg-green-500/90 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">NOW</div>
              </div>
            ) : (
              <div className="absolute top-2 right-2">
                <div className="bg-purple-500/90 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">SOON</div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative py-40 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
      {/* Static gradient background - no animation */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute w-full h-full"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)',
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Smooth Header Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-24"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-6"
          >
            <motion.span
              animate={{
                boxShadow: [
                  '0 0 20px rgba(59, 130, 246, 0.5)',
                  '0 0 40px rgba(168, 85, 247, 0.8)',
                  '0 0 20px rgba(59, 130, 246, 0.5)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block text-white font-bold text-sm uppercase tracking-widest px-8 py-3 rounded-full backdrop-blur-2xl border border-white/30"
            >
              ✨ Complete Feature Suite
            </motion.span>
          </motion.div>

          <motion.h2
            className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <motion.span
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="inline-block text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #3b82f6)',
                backgroundSize: '300% 100%',
              }}
            >
              Everything You Need
            </motion.span>
            <br />
            <span className="text-white">to Dominate Social Media</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto"
          >
            <span className="text-green-400 font-semibold">12 features available now</span> •
            <span className="text-purple-400 font-semibold">6 coming soon</span> •
            <span className="text-blue-400 font-semibold">20+ platforms</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-sm text-purple-400 mt-4"
          >
            ✨ Hover over any feature for interactive 3D preview
          </motion.p>
        </motion.div>

        {/* Available Now Features */}
        <div className="max-w-7xl mx-auto mb-12">
          <h3 className="text-2xl font-bold text-green-400 text-center mb-8">✅ Available Now</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8 mb-16">
            {features.available.map((feature, index) => (
              <Feature3D key={feature.id} feature={feature} index={index} />
            ))}
          </div>
        </div>

        {/* Future Suite Features */}
        <div className="max-w-7xl mx-auto mb-20">
          <h3 className="text-2xl font-bold text-purple-400 text-center mb-4">🚀 Future Suite - Coming Soon</h3>
          <p className="text-center text-gray-400 mb-8">Advanced features in development</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
            {features.futureSuite.map((feature, index) => (
              <Feature3D key={feature.id} feature={feature} index={index} />
            ))}
          </div>
        </div>

        {/* Smooth CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center"
        >
          <motion.a
            href="/auth.html"
            whileHover={{
              scale: 1.05,
              transition: { duration: 0.3, ease: "easeOut" }
            }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-4 px-12 py-6 rounded-2xl font-bold text-xl text-white shadow-2xl relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                backgroundSize: '200% 200%',
              }}
            />
            <span className="relative z-10">Try 12 Features - Available Now!</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-2xl relative z-10"
            >
              →
            </motion.span>
          </motion.a>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-gray-500 mt-6 text-sm"
          >
            No credit card required • Start in 30 seconds
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
