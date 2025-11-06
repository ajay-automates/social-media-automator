import React from 'react';
import { motion } from 'framer-motion';

/**
 * RoleBadge Component
 * Displays a glossy badge for user roles in the team collaboration system
 * @param {string} role - User role (owner/admin/editor/viewer)
 * @param {string} size - Badge size (sm/md/lg) - default: md
 */
export default function RoleBadge({ role, size = 'md' }) {
  // Role configurations with icons, colors, and gradients
  const roleConfig = {
    owner: {
      icon: '⭐',
      label: 'Owner',
      gradient: 'from-yellow-400 via-yellow-500 to-orange-500',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.5)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.7)]'
    },
    admin: {
      icon: '👑',
      label: 'Admin',
      gradient: 'from-purple-500 via-purple-600 to-pink-500',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.7)]'
    },
    editor: {
      icon: '✏️',
      label: 'Editor',
      gradient: 'from-blue-500 via-blue-600 to-cyan-500',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.7)]'
    },
    viewer: {
      icon: '👁️',
      label: 'Viewer',
      gradient: 'from-gray-400 via-gray-500 to-gray-600',
      glow: 'shadow-[0_0_15px_rgba(156,163,175,0.3)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(156,163,175,0.5)]'
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      text: 'text-xs',
      padding: 'px-2 py-0.5',
      icon: 'text-xs',
      gap: 'gap-1'
    },
    md: {
      text: 'text-sm',
      padding: 'px-3 py-1',
      icon: 'text-sm',
      gap: 'gap-1.5'
    },
    lg: {
      text: 'text-base',
      padding: 'px-4 py-2',
      icon: 'text-base',
      gap: 'gap-2'
    }
  };

  const config = roleConfig[role?.toLowerCase()] || roleConfig.viewer;
  const sizing = sizeConfig[size] || sizeConfig.md;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`
        inline-flex items-center ${sizing.gap}
        bg-gradient-to-r ${config.gradient}
        ${sizing.padding} rounded-full
        font-bold ${sizing.text} text-white
        ${config.glow} ${config.hoverGlow}
        transition-all duration-300
        backdrop-blur-sm
        cursor-default
        select-none
      `}
    >
      <span className={sizing.icon}>{config.icon}</span>
      <span>{config.label}</span>
    </motion.div>
  );
}

/**
 * RoleBadge with custom label (for team invitations)
 */
export function RoleBadgeWithLabel({ role, label, size = 'md' }) {
  const config = {
    owner: 'from-yellow-400 via-yellow-500 to-orange-500 shadow-[0_0_20px_rgba(251,191,36,0.5)]',
    admin: 'from-purple-500 via-purple-600 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]',
    editor: 'from-blue-500 via-blue-600 to-cyan-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    viewer: 'from-gray-400 via-gray-500 to-gray-600 shadow-[0_0_15px_rgba(156,163,175,0.3)]'
  };

  const sizeConfig = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const styling = config[role?.toLowerCase()] || config.viewer;
  const sizing = sizeConfig[size] || sizeConfig.md;

  return (
    <div
      className={`
        inline-block bg-gradient-to-r ${styling}
        ${sizing} rounded-full font-bold text-white
        backdrop-blur-sm
      `}
    >
      {label || role?.toUpperCase()}
    </div>
  );
}

