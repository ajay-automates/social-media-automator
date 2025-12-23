import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, 
  FaCalendarAlt, 
  FaChevronUp, 
  FaClock, 
  FaCalendarWeek,
  FaTrash,
  FaCheckSquare,
  FaTimesCircle,
  FaCheckDouble,
  FaLinkedin,
  FaTwitter,
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaYoutube,
  FaReddit,
  FaDiscord,
  FaSlack,
  FaTelegram,
  FaPinterest,
  FaWhatsapp,
  FaMedium,
  FaTumblr
} from 'react-icons/fa';
import { SiMastodon, SiBluesky } from 'react-icons/si';

// Platform configuration
const PLATFORM_CONFIG = {
  linkedin: { Icon: FaLinkedin, color: '#0A66C2', name: 'LinkedIn' },
  twitter: { Icon: FaTwitter, color: '#1DA1F2', name: 'X' },
  instagram: { Icon: FaInstagram, color: '#E1306C', name: 'Instagram' },
  facebook: { Icon: FaFacebook, color: '#1877F2', name: 'Facebook' },
  tiktok: { Icon: FaTiktok, color: '#FE2C55', name: 'TikTok' },
  youtube: { Icon: FaYoutube, color: '#FF0000', name: 'YouTube' },
  reddit: { Icon: FaReddit, color: '#FF4500', name: 'Reddit' },
  discord: { Icon: FaDiscord, color: '#5865F2', name: 'Discord' },
  slack: { Icon: FaSlack, color: '#4A154B', name: 'Slack' },
  telegram: { Icon: FaTelegram, color: '#26A5E4', name: 'Telegram' },
  whatsapp: { Icon: FaWhatsapp, color: '#25D366', name: 'WhatsApp' },
  pinterest: { Icon: FaPinterest, color: '#E60023', name: 'Pinterest' },
  medium: { Icon: FaMedium, color: '#00AB6C', name: 'Medium' },
  tumblr: { Icon: FaTumblr, color: '#36465D', name: 'Tumblr' },
  mastodon: { Icon: SiMastodon, color: '#6364FF', name: 'Mastodon' },
  bluesky: { Icon: SiBluesky, color: '#1185FE', name: 'Bluesky' },
};

export default function BottomActionBar({ 
  onCreateClick, 
  onGenerateClick,
  onImproveClick,
  isGenerating = false,
  // Selection props
  selectionMode = false,
  selectedCount = 0,
  onToggleSelectionMode,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  isBulkDeleting = false,
  totalPosts = 0
}) {
  const [showGenerateMenu, setShowGenerateMenu] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['linkedin', 'twitter']);
  const [showPlatformSelection, setShowPlatformSelection] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);

  const handleGenerateOption = (mode) => {
    setSelectedMode(mode);
    setShowPlatformSelection(true);
    setShowGenerateMenu(false);
  };

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSelectAllPlatforms = () => {
    setSelectedPlatforms(Object.keys(PLATFORM_CONFIG));
  };

  const handleClearPlatforms = () => {
    setSelectedPlatforms([]);
  };

  const handleConfirmGenerate = (mode) => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }
    setShowPlatformSelection(false);
    onGenerateClick?.(mode, selectedPlatforms);
  };

  // Selection mode UI
  if (selectionMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="blaze-action-bar"
        style={{ 
          background: selectedCount > 0 ? '#1f2937' : 'white',
          borderColor: selectedCount > 0 ? '#374151' : '#e5e7eb'
        }}
      >
        {/* Selected count */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          color: selectedCount > 0 ? 'white' : '#374151',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <FaCheckSquare style={{ color: selectedCount > 0 ? '#10b981' : '#9ca3af' }} />
          <span>{selectedCount} of {totalPosts} selected</span>
        </div>

        {/* Divider */}
        <div style={{ 
          width: '1px', 
          height: '24px', 
          background: selectedCount > 0 ? '#4b5563' : '#e5e7eb' 
        }} />

        {/* Select All */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectAll}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            border: 'none',
            borderRadius: '8px',
            background: selectedCount > 0 ? '#374151' : '#f3f4f6',
            color: selectedCount > 0 ? 'white' : '#374151',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <FaCheckDouble style={{ fontSize: '12px' }} />
          Select All
        </motion.button>

        {/* Clear Selection */}
        {selectedCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClearSelection}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: 'none',
              borderRadius: '8px',
              background: '#374151',
              color: 'white',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <FaTimesCircle style={{ fontSize: '12px' }} />
            Clear
          </motion.button>
        )}

        {/* Divider */}
        {selectedCount > 0 && (
          <div style={{ 
            width: '1px', 
            height: '24px', 
            background: '#4b5563'
          }} />
        )}

        {/* Delete Selected */}
        {selectedCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBulkDelete}
            disabled={isBulkDeleting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              background: '#ef4444',
              color: 'white',
              fontSize: '13px',
              fontWeight: '500',
              cursor: isBulkDeleting ? 'not-allowed' : 'pointer',
              opacity: isBulkDeleting ? 0.7 : 1
            }}
          >
            <FaTrash style={{ fontSize: '12px' }} />
            {isBulkDeleting ? 'Deleting...' : `Delete ${selectedCount}`}
          </motion.button>
        )}

        {/* Exit Selection Mode */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onToggleSelectionMode}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            border: `1px solid ${selectedCount > 0 ? '#4b5563' : '#e5e7eb'}`,
            borderRadius: '8px',
            background: 'transparent',
            color: selectedCount > 0 ? '#9ca3af' : '#6b7280',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          Done
        </motion.button>
      </motion.div>
    );
  }

  // Normal mode UI
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="blaze-action-bar"
    >
      {/* Create Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="blaze-action-btn create"
        onClick={onCreateClick}
      >
        <FaPlus style={{ fontSize: '12px' }} />
        Create
      </motion.button>

      {/* Generate Posts Dropdown */}
      <div style={{ position: 'relative' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="blaze-action-btn regenerate"
          onClick={() => setShowGenerateMenu(!showGenerateMenu)}
          disabled={isGenerating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isGenerating ? 0.7 : 1
          }}
        >
          <FaCalendarAlt style={{ fontSize: '12px' }} />
          {isGenerating ? 'Generating...' : 'Generate Posts'}
          <FaChevronUp 
            style={{ 
              fontSize: '10px',
              transform: showGenerateMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }} 
          />
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showGenerateMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                bottom: '100%',
                right: '-40px',
                marginBottom: '8px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                overflow: 'hidden',
                width: '300px',
                zIndex: 100
              }}
            >
              {/* Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f3f4f6',
                background: '#f9fafb'
              }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  color: '#374151' 
                }}>
                  Generate AI Posts
                </h4>
                <p style={{ 
                  margin: '4px 0 0', 
                  fontSize: '11px', 
                  color: '#6b7280' 
                }}>
                  Each post includes AI-generated images
                </p>
              </div>

              {/* Option 1: 10 Posts Today */}
              <button
                onClick={() => handleGenerateOption('today_hourly')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  width: '100%',
                  padding: '14px 16px',
                  border: 'none',
                  background: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FaClock style={{ color: 'white', fontSize: '16px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '14px', 
                    color: '#1f2937',
                    marginBottom: '2px'
                  }}>
                    10 Posts Today
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    Posts scheduled 1 hour apart starting now
                  </div>
                </div>
              </button>

              {/* Divider */}
              <div style={{ height: '1px', background: '#f3f4f6' }} />

              {/* Option 2: Weekly Calendar */}
              <button
                onClick={() => handleGenerateOption('weekly')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  width: '100%',
                  padding: '14px 16px',
                  border: 'none',
                  background: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.background = 'white'}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FaCalendarWeek style={{ color: 'white', fontSize: '16px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    fontSize: '14px', 
                    color: '#1f2937',
                    marginBottom: '2px'
                  }}>
                    Weekly Calendar
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    21 posts (3 per day) for the next 7 days
                  </div>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Platform Selection Modal */}
        <AnimatePresence>
          {showPlatformSelection && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '24px'
              }}
              onClick={() => setShowPlatformSelection(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  maxWidth: '600px',
                  width: '100%',
                  maxHeight: '80vh',
                  overflowY: 'auto',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                    Select Platforms
                  </h3>
                  <button
                    onClick={() => setShowPlatformSelection(false)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '20px',
                      color: '#6b7280',
                      padding: '4px'
                    }}
                  >
                    ×
                  </button>
                </div>

                <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280' }}>
                  Select which platforms to generate posts for ({selectedPlatforms.length} selected)
                </p>

                {/* Select All / Clear */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button
                    onClick={handleSelectAllPlatforms}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: 'white',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      color: '#374151'
                    }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleClearPlatforms}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: 'white',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      color: '#374151'
                    }}
                  >
                    Clear All
                  </button>
                </div>

                {/* Platform Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  {Object.entries(PLATFORM_CONFIG).map(([id, config]) => {
                    const Icon = config.Icon;
                    const isSelected = selectedPlatforms.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => handlePlatformToggle(id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '16px 12px',
                          border: `2px solid ${isSelected ? config.color : '#e5e7eb'}`,
                          borderRadius: '12px',
                          background: isSelected ? `${config.color}10` : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = config.color;
                            e.currentTarget.style.background = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: config.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon style={{ color: 'white', fontSize: '20px' }} />
                        </div>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: isSelected ? '600' : '500',
                          color: isSelected ? config.color : '#374151'
                        }}>
                          {config.name}
                        </span>
                        {isSelected && (
                          <FaCheckSquare style={{ color: config.color, fontSize: '14px' }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowPlatformSelection(false)}
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      color: '#374151'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmGenerate(selectedMode)}
                    disabled={selectedPlatforms.length === 0}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      background: selectedPlatforms.length > 0 ? '#3b82f6' : '#d1d5db',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: selectedPlatforms.length > 0 ? 'pointer' : 'not-allowed',
                      color: 'white',
                      opacity: selectedPlatforms.length > 0 ? 1 : 0.6
                    }}
                  >
                    Generate ({selectedPlatforms.length} platforms)
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Improve Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="blaze-action-btn improve"
        onClick={onImproveClick}
      >
        <FaPlus style={{ fontSize: '12px', transform: 'rotate(45deg)' }} />
        Improve
      </motion.button>

      {/* Click outside to close */}
      {showGenerateMenu && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90
          }}
          onClick={() => setShowGenerateMenu(false)}
        />
      )}
    </motion.div>
  );
}
