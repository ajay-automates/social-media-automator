import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaChartBar, FaLinkedin, FaCalendarWeek, FaCog } from 'react-icons/fa';

const PRESETS = {
  balanced: {
    id: 'balanced',
    name: 'Balanced Mix',
    icon: FaChartBar,
    description: '2-3 posts per platform, optimized distribution',
    color: '#6366f1'
  },
  linkedin_focus: {
    id: 'linkedin_focus',
    name: 'LinkedIn Focus',
    icon: FaLinkedin,
    description: '5 LinkedIn posts, 2 others',
    color: '#0A66C2'
  },
  daily_all: {
    id: 'daily_all',
    name: 'Daily All Platforms',
    icon: FaCalendarWeek,
    description: '1 post per platform per day',
    color: '#10b981'
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    icon: FaCog,
    description: 'Choose your own distribution',
    color: '#6b7280'
  }
};

export default function PresetSelector({ selectedPreset, onSelectPreset, connectedPlatforms }) {
  const [showPresets, setShowPresets] = useState(false);

  const calculatePostCount = (presetId) => {
    switch (presetId) {
      case 'balanced':
        const balanced = { linkedin: 3, twitter: 7, instagram: 3, facebook: 2, tiktok: 3 };
        return connectedPlatforms.reduce((sum, p) => sum + (balanced[p] || 2), 0);
      case 'linkedin_focus':
        return connectedPlatforms.includes('linkedin') ? 7 : 0;
      case 'daily_all':
        return connectedPlatforms.length * 7;
      default:
        return 0;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowPresets(!showPresets)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: '#f3f4f6',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '500',
          color: '#374151',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <FaCog style={{ fontSize: '12px' }} />
        Preset: {PRESETS[selectedPreset]?.name || 'Custom'}
      </motion.button>

      {showPresets && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99,
              background: 'transparent'
            }}
            onClick={() => setShowPresets(false)}
          />
          
          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: '8px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
              padding: '8px',
              minWidth: '280px',
              zIndex: 100
            }}
          >
            {Object.values(PRESETS).map(preset => {
              const Icon = preset.icon;
              const postCount = calculatePostCount(preset.id);
              const isSelected = selectedPreset === preset.id;
              
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectPreset(preset.id);
                    setShowPresets(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    width: '100%',
                    padding: '12px',
                    border: 'none',
                    background: isSelected ? '#f3f4f6' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: preset.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon style={{ color: 'white', fontSize: '14px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937', marginBottom: '2px' }}>
                      {preset.name}
                      {isSelected && <span style={{ marginLeft: '6px', color: preset.color }}>✓</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      {preset.description}
                      {postCount > 0 && ` • ${postCount} posts`}
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        </>
      )}
    </div>
  );
}

