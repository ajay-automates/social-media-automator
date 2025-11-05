import { motion } from 'framer-motion';

export default function FeatureMarquee({ features, direction = 'left', speed = 40 }) {
  // Duplicate features for seamless loop
  const duplicatedFeatures = [...features, ...features];

  const getGradientClass = (index) => {
    const gradients = [
      'from-blue-500 via-cyan-400 to-blue-600',
      'from-purple-500 via-pink-400 to-purple-600',
      'from-green-500 via-emerald-400 to-green-600',
      'from-orange-500 via-yellow-400 to-orange-600',
      'from-red-500 via-rose-400 to-red-600',
      'from-indigo-500 via-violet-400 to-indigo-600',
      'from-teal-500 via-cyan-400 to-teal-600',
      'from-pink-500 via-fuchsia-400 to-pink-600',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="relative overflow-hidden py-4">
      <motion.div
        className="flex gap-4"
        animate={{
          x: direction === 'left' ? [0, -50 + '%'] : [-50 + '%', 0],
        }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {duplicatedFeatures.map((feature, index) => (
          <motion.div
            key={`${feature.id}-${index}`}
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 group cursor-pointer"
          >
            <div className="relative">
              {/* Static glow - no animation */}
              <div className={`absolute inset-0 bg-gradient-to-r ${getGradientClass(index)} rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity`} />
              
              {/* Main content */}
              <div className={`relative bg-gradient-to-br ${getGradientClass(index)} p-4 rounded-2xl shadow-2xl border border-white/20 min-w-[140px]`}>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">
                    {feature.icon}
                  </span>
                  <span className="text-sm font-bold text-white text-center leading-tight">
                    {feature.title}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

