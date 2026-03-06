import { motion } from 'framer-motion';
import {
  FaLinkedin,
  FaTwitter,
  FaTiktok,
  FaYoutube,
  FaReddit,
  FaDiscord,
  FaSlack,
  FaTelegram,
  FaPinterest,
  FaMedium,
  FaTumblr
} from 'react-icons/fa';
import { SiMastodon, SiBluesky } from 'react-icons/si';

const platformConfig = {
  linkedin: { Icon: FaLinkedin, gradient: 'bg-[#22d3ee]', name: 'LinkedIn' },
  twitter: { Icon: FaTwitter, gradient: '', name: 'Twitter/X' },
  tiktok: { Icon: FaTiktok, gradient: 'from-black', name: 'TikTok' },
  youtube: { Icon: FaYoutube, gradient: '', name: 'YouTube' },
  reddit: { Icon: FaReddit, gradient: '', name: 'Reddit' },
  discord: { Icon: FaDiscord, gradient: '', name: 'Discord' },
  slack: { Icon: FaSlack, gradient: 'bg-[#22d3ee]', name: 'Slack' },
  telegram: { Icon: FaTelegram, gradient: '', name: 'Telegram' },
  pinterest: { Icon: FaPinterest, gradient: '', name: 'Pinterest' },
  medium: { Icon: FaMedium, gradient: 'bg-[#18181b]', name: 'Medium' },
  devto: { Icon: FaMedium, gradient: ' to-black', name: 'Dev.to' },
  tumblr: { Icon: FaTumblr, gradient: 'bg-[#22d3ee]', name: 'Tumblr' },
  mastodon: { Icon: SiMastodon, gradient: 'bg-[#22d3ee]', name: 'Mastodon' },
  bluesky: { Icon: SiBluesky, gradient: 'bg-[#22d3ee]', name: 'Bluesky' },
};

export default function PlatformChip({ 
  platform, 
  selected = false, 
  onClick = null,
  size = 'md' 
}) {
  const config = platformConfig[platform] || { 
    Icon: FaTwitter, 
    gradient: 'bg-[#18181b]', 
    name: platform 
  };

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  const iconSizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  const IconComponent = config.Icon;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ 
        scale: 1.1, 
        y: -5,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.95 }}
      className={`relative ${sizeClasses[size]} rounded-2xl bg-[#111113] ${config.gradient} cursor-pointer border-2 transition-all ${
        selected ? 'border-white ring-4 ring-white/20' : 'border-white/[0.08] hover:border-white/40'
      }`}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl  opacity-0 group-hover:opacity-60 transition-opacity"
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
      <motion.div
        animate={{
          rotate: selected ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          duration: 2,
          repeat: selected ? Infinity : 0,
        }}
        className="relative z-10"
      >
        <IconComponent className={`${iconSizeClasses[size]} text-white`} />
      </motion.div>

      {/* Selected checkmark */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  );
}

