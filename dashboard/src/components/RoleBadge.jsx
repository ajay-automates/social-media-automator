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
      gradient: '',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.5)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.7)]'
    },
    admin: {
      icon: '👑',
      label: 'Admin',
      gradient: 'bg-[#22d3ee]',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.7)]'
    },
    editor: {
      icon: '✏️',
      label: 'Editor',
      gradient: 'bg-[#22d3ee]',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.5)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.7)]'
    },
    viewer: {
      icon: '👁️',
      label: 'Viewer',
      gradient: 'bg-[#18181b]',
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
        bg-[#22d3ee] ${config.gradient}
        ${sizing.padding} rounded-full
        font-bold ${sizing.text} text-white
        ${config.glow} ${config.hoverGlow}
        transition-all duration-300
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
    owner: ' shadow-[0_0_20px_rgba(251,191,36,0.5)]',
    admin: ' shadow-[0_0_20px_rgba(168,85,247,0.5)]',
    editor: ' shadow-[0_0_20px_rgba(59,130,246,0.5)]',
    viewer: ' shadow-[0_0_15px_rgba(156,163,175,0.3)]'
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
        inline-block bg-[#22d3ee] ${styling}
        ${sizing} rounded-full font-bold text-white
      `}
    >
      {label || role?.toUpperCase()}
    </div>
  );
}

