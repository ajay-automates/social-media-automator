import { motion } from 'framer-motion';
import { useState } from 'react';

export default function FeatureCard({ feature, index }) {
  const [isHovered, setIsHovered] = useState(false);

  const getGradientClass = () => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-yellow-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-cyan-500',
      'from-pink-500 to-rose-500',
      'from-yellow-500 to-orange-500',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group cursor-pointer"
    >
      <div className="flex flex-col items-center text-center">
        {/* Floating Icon with Glow */}
        <motion.div
          whileHover={{ scale: 1.15, y: -10 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative mb-4"
        >
          {/* Animated glow ring */}
          <motion.div
            animate={{
              scale: isHovered ? [1, 1.2, 1] : 1,
              opacity: isHovered ? [0.5, 0.8, 0.5] : 0.3,
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 bg-gradient-to-r ${getGradientClass()} rounded-full blur-2xl -z-10`}
            style={{ width: '120%', height: '120%', left: '-10%', top: '-10%' }}
          />
          
          {/* Icon container */}
          <motion.div
            animate={{
              rotate: isHovered ? 360 : 0,
            }}
            transition={{ duration: 0.8 }}
            className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${getGradientClass()} flex items-center justify-center shadow-2xl`}
          >
            <span className="text-4xl">{feature.icon}</span>
          </motion.div>

          {/* Pulsing ring */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className={`absolute inset-0 border-2 border-white/30 rounded-full`}
          />
        </motion.div>

        {/* Title */}
        <motion.h3
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          className="text-lg font-bold text-white mb-2"
        >
          {feature.title}
        </motion.h3>

        {/* Animated description that expands */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: isHovered ? 'auto' : 0,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <p className="text-sm text-gray-400 leading-relaxed px-4 pb-2">
            {feature.description}
          </p>
        </motion.div>

        {/* Status indicator line */}
        <motion.div
          initial={{ width: '0%' }}
          animate={{
            width: isHovered ? '100%' : '40%',
          }}
          transition={{ duration: 0.3 }}
          className={`h-0.5 bg-gradient-to-r ${getGradientClass()} rounded-full mt-2`}
        />
      </div>
    </motion.div>
  );
}
