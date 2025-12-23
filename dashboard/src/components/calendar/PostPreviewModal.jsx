import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
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
  FaTumblr,
  FaTimes,
  FaTrash,
  FaCopy,
  FaEdit,
  FaArrowLeft,
  FaArrowRight
} from 'react-icons/fa';
import { SiMastodon, SiBluesky } from 'react-icons/si';
import SocialPreview from './SocialPreview';

// All platforms available for preview
const PREVIEW_PLATFORMS = [
  { id: 'linkedin', Icon: FaLinkedin, color: '#0A66C2', name: 'LinkedIn' },
  { id: 'twitter', Icon: FaTwitter, color: '#1DA1F2', name: 'X' },
  { id: 'instagram', Icon: FaInstagram, color: '#E1306C', name: 'Instagram' },
  { id: 'facebook', Icon: FaFacebook, color: '#1877F2', name: 'Facebook' },
  { id: 'tiktok', Icon: FaTiktok, color: '#FE2C55', name: 'TikTok' },
  { id: 'youtube', Icon: FaYoutube, color: '#FF0000', name: 'YouTube' },
  { id: 'reddit', Icon: FaReddit, color: '#FF4500', name: 'Reddit' },
  { id: 'discord', Icon: FaDiscord, color: '#5865F2', name: 'Discord' },
  { id: 'slack', Icon: FaSlack, color: '#4A154B', name: 'Slack' },
  { id: 'telegram', Icon: FaTelegram, color: '#26A5E4', name: 'Telegram' },
  { id: 'whatsapp', Icon: FaWhatsapp, color: '#25D366', name: 'WhatsApp' },
  { id: 'pinterest', Icon: FaPinterest, color: '#E60023', name: 'Pinterest' },
  { id: 'medium', Icon: FaMedium, color: '#00AB6C', name: 'Medium' },
  { id: 'tumblr', Icon: FaTumblr, color: '#36465D', name: 'Tumblr' },
  { id: 'mastodon', Icon: SiMastodon, color: '#6364FF', name: 'Mastodon' },
  { id: 'bluesky', Icon: SiBluesky, color: '#1185FE', name: 'Bluesky' },
];

export default function PostPreviewModal({
  event,
  isOpen,
  onClose,
  onDelete,
  onClone,
  onNavigate,
  totalEvents
}) {
  const [selectedPlatform, setSelectedPlatform] = useState('linkedin');

  if (!isOpen || !event) return null;

  // Get platforms from event or default to selected
  const eventPlatforms = event.platforms || ['linkedin'];
  
  // Get post status
  const getStatusLabel = () => {
    switch (event.status) {
      case 'posted': return 'Posted';
      case 'failed': return 'Failed';
      case 'scheduled': return 'Scheduled';
      default: return 'Draft';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="blaze-modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="blaze-modal"
          onClick={e => e.stopPropagation()}
        >
          {/* Platform Sidebar */}
          <div className="blaze-modal-sidebar" style={{
            width: '90px',
            background: '#f9fafb',
            borderRight: '1px solid #e5e7eb',
            padding: '20px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            overflowY: 'auto',
            maxHeight: '90vh'
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              whiteSpace: 'nowrap'
            }}>
              View as
            </span>
            {PREVIEW_PLATFORMS.map(platform => {
              const Icon = platform.Icon;
              const isActive = selectedPlatform === platform.id;
              const isAvailable = eventPlatforms.includes(platform.id);
              
              return (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  title={platform.name}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isActive ? `3px solid ${platform.color}` : '2px solid #e5e7eb',
                    background: isActive 
                      ? `${platform.color}15` 
                      : isAvailable 
                        ? '#ffffff' 
                        : '#f3f4f6',
                    opacity: isAvailable ? 1 : 0.5,
                    boxShadow: isActive ? `0 0 0 4px ${platform.color}20` : '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && isAvailable) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.transform = 'scale(1.08)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = isAvailable ? '#ffffff' : '#f3f4f6';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = isActive ? `0 0 0 4px ${platform.color}20` : '0 1px 2px rgba(0,0,0,0.05)';
                    }
                  }}
                >
                  <Icon 
                    style={{ 
                      color: isActive ? platform.color : isAvailable ? '#374151' : '#9ca3af',
                      fontSize: '28px',
                      display: 'block',
                      width: '28px',
                      height: '28px'
                    }} 
                  />
                </button>
              );
            })}
          </div>

          {/* Modal Content */}
          <div className="blaze-modal-content">
            {/* Header */}
            <div className="blaze-modal-header">
              <div className="blaze-modal-title-row">
                {/* Platform icons */}
                <div className="blaze-modal-platforms">
                  {eventPlatforms.slice(0, 4).map((p, idx) => {
                    const platform = PREVIEW_PLATFORMS.find(pl => pl.id === p);
                    if (!platform) return null;
                    const Icon = platform.Icon;
                    return (
                      <div
                        key={idx}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: platform.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon style={{ color: 'white', fontSize: '12px' }} />
                      </div>
                    );
                  })}
                </div>
                
                {/* Title */}
                <span className="blaze-modal-title">
                  {event.text?.split('\n')[0]?.substring(0, 40) || 'Untitled Post'}
                  {event.text?.split('\n')[0]?.length > 40 ? '...' : ''}
                </span>
                
                {/* Status badge */}
                <span className="blaze-draft-badge">{getStatusLabel()}</span>
              </div>

              <button className="blaze-modal-close" onClick={onClose}>
                <FaTimes />
              </button>
            </div>

            {/* Social Preview */}
            <SocialPreview
              platform={selectedPlatform}
              text={event.text}
              imageUrl={event.image_url}
              scheduledTime={event.start}
              username={event.platform_username || 'Your Account'}
            />

            {/* Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              {/* Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => onNavigate?.(-1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  <FaArrowLeft style={{ fontSize: '10px' }} />
                  Previous
                </button>
                <button
                  onClick={() => onNavigate?.(1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Next
                  <FaArrowRight style={{ fontSize: '10px' }} />
                </button>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => onClone?.(event)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#10b981',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  <FaCopy style={{ fontSize: '12px' }} />
                  Clone
                </button>
                <button
                  onClick={() => onDelete?.(event)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#ef4444',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  <FaTrash style={{ fontSize: '12px' }} />
                  Delete
                </button>
              </div>
            </div>

            {/* Schedule info */}
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#f9fafb',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#6b7280'
            }}>
              <strong style={{ color: '#374151' }}>Scheduled:</strong>{' '}
              {format(new Date(event.start), 'EEEE, MMMM d, yyyy')} at{' '}
              {format(new Date(event.start), 'h:mm a')}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

