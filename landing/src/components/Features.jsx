import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { features } from '../data/features';

function Feature3D({ feature, index }) {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

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
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.8,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      className="group relative"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
        className="relative"
      >
        {/* 3D Shadow Layer */}
        <motion.div
          style={{
            transform: "translateZ(-50px)",
          }}
          animate={{
            opacity: isHovered ? 0.8 : 0.4,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 rounded-3xl blur-2xl"
          style={{
            background: gradient.shadow,
          }}
        />

        {/* Main 3D Box - Expands on hover */}
        <motion.div
          animate={{
            height: isHovered ? 'auto' : 'auto',
            minHeight: isHovered ? '200px' : '140px',
          }}
          style={{
            transform: isHovered ? "translateZ(50px)" : "translateZ(0px)",
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`relative bg-gradient-to-br ${gradient.bg} backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl overflow-hidden`}
        >
          {/* Smooth flowing gradient overlay */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.15) 0%, transparent 50%)',
              ],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* 3D Icon Layer */}
          <motion.div
            style={{
              transform: isHovered ? "translateZ(30px)" : "translateZ(0px)",
            }}
            transition={{ duration: 0.4 }}
            className="relative z-10"
          >
            <motion.div
              className="text-6xl mb-4"
              animate={{
                y: [0, -8, 0],
                rotateZ: isHovered ? [0, 5, -5, 0] : 0,
              }}
              transition={{
                y: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.1,
                },
                rotateZ: {
                  duration: 0.6,
                  ease: "easeInOut",
                }
              }}
            >
              {feature.icon}
            </motion.div>

            {/* Title Layer */}
            <h3 className="text-base font-bold text-white leading-tight mb-2">
              {feature.title}
            </h3>

            {/* Description expands inside box */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-white/90 leading-relaxed mt-2 pt-2 border-t border-white/20">
                    {feature.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3D Depth Lines */}
            <motion.div
              style={{
                transform: "translateZ(10px)",
              }}
              className="absolute bottom-3 right-3"
            >
              <motion.div
                className="w-3 h-3 bg-white/60 rounded-full"
                animate={{
                  scale: isHovered ? [1, 1.5, 1] : 1,
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </motion.div>

          {/* Layered depth cards in 3D */}
          <AnimatePresence>
            {isHovered && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    transform: "translateZ(-20px)",
                  }}
                  className="absolute inset-2 bg-white/5 rounded-2xl"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    transform: "translateZ(-40px)",
                  }}
                  className="absolute inset-4 bg-white/5 rounded-xl"
                />
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative py-40 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
      {/* Smooth animated waves background */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute w-full h-full"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
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
            24 powerful features • 25+ platforms • AI-powered automation
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

        {/* 3D Interactive Grid */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
            {features.map((feature, index) => (
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
            <span className="relative z-10">Experience All 24 Features</span>
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
