import { motion } from 'framer-motion';

const platformConfig = {
  linkedin: { icon: '💼', gradient: 'from-blue-500 to-blue-600', name: 'LinkedIn' },
  twitter: { icon: '𝕏', gradient: 'from-gray-900 to-black', name: 'Twitter/X' },
  instagram: { icon: '📸', gradient: 'from-pink-500 to-purple-500', name: 'Instagram' },
  facebook: { icon: '📘', gradient: 'from-blue-600 to-blue-700', name: 'Facebook' },
  tiktok: { icon: '🎵', gradient: 'from-black to-cyan-500', name: 'TikTok' },
  youtube: { icon: '▶️', gradient: 'from-red-600 to-red-700', name: 'YouTube' },
  reddit: { icon: '🔴', gradient: 'from-orange-500 to-orange-600', name: 'Reddit' },
  discord: { icon: '💬', gradient: 'from-indigo-500 to-indigo-600', name: 'Discord' },
  slack: { icon: '💼', gradient: 'from-purple-500 to-pink-500', name: 'Slack' },
  telegram: { icon: '✈️', gradient: 'from-cyan-400 to-cyan-500', name: 'Telegram' },
  whatsapp: { icon: '💚', gradient: 'from-green-500 to-green-600', name: 'WhatsApp' },
  pinterest: { icon: '📌', gradient: 'from-red-500 to-red-600', name: 'Pinterest' },
};

export default function PlatformChip({ 
  platform, 
  selected = false, 
  onClick = null,
  size = 'md' 
}) {
  const config = platformConfig[platform] || { 
    icon: '🌐', 
    gradient: 'from-gray-500 to-gray-600', 
    name: platform 
  };

  const sizeClasses = {
    sm: 'p-2 text-2xl',
    md: 'p-4 text-3xl',
    lg: 'p-6 text-4xl',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ 
        scale: 1.1, 
        y: -5,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.95 }}
      className={`relative ${sizeClasses[size]} rounded-2xl bg-gradient-to-br ${config.gradient} shadow-lg cursor-pointer border-2 transition-all ${
        selected ? 'border-white ring-4 ring-white/20' : 'border-white/20 hover:border-white/40'
      }`}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity"
        animate={{
          scale: selected ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        style={{
          background: `linear-gradient(135deg, ${config.gradient})`,
        }}
      />

      {/* Icon */}
      <motion.span
        animate={{
          rotate: selected ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          duration: 2,
          repeat: selected ? Infinity : 0,
        }}
        className="relative z-10"
      >
        {config.icon}
      </motion.span>

      {/* Selected checkmark */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  );
}

