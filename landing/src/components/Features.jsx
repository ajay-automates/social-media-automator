import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { features } from '../data/features';

// Feature icon matching Hero section platform icons exactly
function FloatingFeature({ feature, index, position, isAvailable = true }) {
  const getGradient = (index) => {
    const gradients = [
      { bg: 'from-blue-400/90 via-blue-500/70 to-cyan-500/90' },
      { bg: 'from-purple-400/90 via-purple-500/70 to-pink-500/90' },
      { bg: 'from-green-400/90 via-emerald-500/70 to-teal-500/90' },
      { bg: 'from-orange-400/90 via-amber-500/70 to-yellow-500/90' },
      { bg: 'from-red-400/90 via-rose-500/70 to-pink-500/90' },
      { bg: 'from-indigo-400/90 via-violet-500/70 to-purple-500/90' },
      { bg: 'from-cyan-400/90 via-teal-500/70 to-blue-500/90' },
      { bg: 'from-fuchsia-400/90 via-pink-500/70 to-rose-500/90' },
    ];
    return gradients[index % gradients.length];
  };

  const gradient = getGradient(index);

  return (
    <div
      key={feature.id}
      style={{
        position: 'absolute',
        ...position,
      }}
      className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br ${gradient.bg} shadow-xl cursor-pointer group flex items-center justify-center border-2 border-white/20`}
    >
      <div className="w-full h-full flex items-center justify-center">
        {typeof feature.icon === 'function' ? (
          <feature.icon 
            className="text-3xl lg:text-4xl text-white drop-shadow-lg pointer-events-none" 
          />
        ) : (
          <span className="text-3xl lg:text-4xl text-white drop-shadow-lg pointer-events-none">{feature.icon}</span>
        )}
      </div>
      {/* Tooltip on hover */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[60]">
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
          {feature.title}
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  // Positions matching Hero section distribution pattern - spread across entire area
  const availablePositions = [
    { top: '2%', left: '2%' },      // 1
    { top: '5%', right: '3%' },     // 2
    { top: '10%', left: '10%' },    // 3
    { top: '13%', right: '10%' },   // 4
    { top: '18%', left: '3%' },     // 5
    { top: '21%', right: '6%' },    // 6
    { top: '26%', left: '15%' },    // 7
    { top: '29%', right: '2%' },    // 8
    { top: '34%', left: '22%' },    // 9
    { top: '37%', right: '15%' },   // 10
    { top: '42%', left: '6%' },     // 11
    { top: '45%', right: '20%' },   // 12
  ];

  // Coming Soon features - continuation of pattern
  const comingSoonPositions = [
    { top: '50%', left: '18%' },    // 13
    { top: '53%', right: '5%' },    // 14
    { top: '58%', left: '26%' },    // 15
    { top: '61%', right: '12%' },   // 16
    { top: '66%', left: '11%' },    // 17
    { top: '69%', right: '22%' },   // 18
  ];

  return (
    <section id="features" className="relative py-40 bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50 overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,rgb(0,0,0)_1px,transparent_0)] bg-[length:32px_32px]" />

      <div className="container mx-auto px-6 relative z-10 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-32"
        >

          <motion.h2
            className="text-5xl md:text-6xl lg:text-7xl font-black text-netflix-red mb-6 leading-tight font-netflix"
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
            <span className="text-netflix-red font-netflix">to <em className="not-italic text-netflix-red font-bold font-netflix">Dominate</em> Social Media</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="text-lg md:text-xl text-netflix-red max-w-3xl mx-auto font-netflix"
          >
            <span className="text-green-600 font-semibold">12 features available now</span> •{' '}
            <span className="text-purple-600 font-semibold">6 coming soon</span> •{' '}
            <span className="text-blue-600 font-semibold">20+ platforms</span>
          </motion.p>
        </motion.div>

        {/* Floating Features Container - Same as Hero Section */}
        <div className="relative h-[500px] lg:h-[700px] mb-32 overflow-visible">
          {/* All Features Floating Together */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative w-full h-full"
          >
            {/* Available Now Features */}
            {features.available.map((feature, index) => (
              <FloatingFeature
                key={feature.id}
                feature={feature}
                index={index}
                position={availablePositions[index] || availablePositions[index % availablePositions.length]}
                isAvailable={true}
              />
            ))}
            
            {/* Coming Soon Features */}
            {features.futureSuite.map((feature, index) => (
              <FloatingFeature
                key={feature.id}
                feature={feature}
                index={index + features.available.length}
                position={comingSoonPositions[index] || comingSoonPositions[index % comingSoonPositions.length]}
                isAvailable={false}
              />
            ))}
            
            {/* Decorative element like Hero section */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
