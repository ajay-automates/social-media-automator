import { useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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
  FaWordpress,
  FaPlay,
  FaEnvelope,
  FaFileAlt,
  FaCheck
} from 'react-icons/fa';
import { SiMastodon, SiBluesky } from 'react-icons/si';

// Platform configuration
const PLATFORM_CONFIG = {
  linkedin: { Icon: FaLinkedin, color: '#0A66C2', name: 'LinkedIn' },
  twitter: { Icon: FaTwitter, color: '#1DA1F2', name: 'X' },
  instagram: { Icon: FaInstagram, color: '#E1306C', name: 'Instagram' },
  facebook: { Icon: FaFacebook, color: '#1877F2', name: 'Facebook' },
  tiktok: { Icon: FaTiktok, color: '#000000', name: 'TikTok' },
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
  wordpress: { Icon: FaWordpress, color: '#21759B', name: 'WordPress' },
};

// Post type configuration
const POST_TYPE_CONFIG = {
  blog: { Icon: FaWordpress, label: 'Blog', color: '#21759B' },
  email: { Icon: FaEnvelope, label: 'Email', color: '#F59E0B' },
  post: { Icon: FaFileAlt, label: 'Post', color: '#6366F1' },
};

// Get post type from platforms
function getPostType(platforms) {
  if (!platforms || platforms.length === 0) return 'post';
  if (platforms.includes('medium') || platforms.includes('wordpress')) return 'blog';
  return 'post';
}

// Get title/headline from text
function getPostTitle(text) {
  if (!text) return 'Untitled Post';
  // Try to get first line as title
  const firstLine = text.split('\n')[0];
  // Remove hashtags and trim
  const cleanTitle = firstLine.replace(/#\w+/g, '').trim();
  // Limit length
  if (cleanTitle.length > 50) {
    return cleanTitle.substring(0, 50) + '...';
  }
  return cleanTitle || 'Untitled Post';
}

// Post Card Component
function PostCard({ 
  event, 
  onClick, 
  selectionMode, 
  isSelected, 
  onToggleSelection 
}) {
  const platforms = event.platforms || [];
  const primaryPlatform = platforms[0];
  const config = PLATFORM_CONFIG[primaryPlatform];
  const PrimaryIcon = config?.Icon || FaFileAlt;
  
  const postType = getPostType(platforms);
  const typeConfig = POST_TYPE_CONFIG[postType];
  const TypeIcon = typeConfig.Icon;
  
  const title = getPostTitle(event.text);
  const time = format(new Date(event.start), 'h:mma').toLowerCase();
  const hasVideo = event.video_url || event.media_type === 'video';

  const handleClick = (e) => {
    if (selectionMode) {
      e.stopPropagation();
      onToggleSelection(event.id);
    } else {
      onClick(event);
    }
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onToggleSelection(event.id);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="blaze-post-card"
      onClick={handleClick}
      style={{
        position: 'relative',
        borderColor: isSelected ? '#3b82f6' : undefined,
        background: isSelected ? '#eff6ff' : undefined,
        boxShadow: isSelected ? '0 0 0 2px #3b82f6' : undefined
      }}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div
          onClick={handleCheckboxClick}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            border: isSelected ? 'none' : '2px solid #d1d5db',
            background: isSelected ? '#3b82f6' : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.15s ease'
          }}
        >
          {isSelected && (
            <FaCheck style={{ color: 'white', fontSize: '12px' }} />
          )}
        </div>
      )}

      {/* Header: Platform Icon + Type + Time */}
      <div className="blaze-post-header">
        <div className="blaze-post-platform">
          <div 
            className="blaze-platform-icon"
            style={{ backgroundColor: config?.color || '#6366F1' }}
          >
            <PrimaryIcon className="text-white" style={{ fontSize: '12px' }} />
          </div>
          <div className="blaze-post-type">
            <TypeIcon style={{ fontSize: '10px' }} />
            <span>{typeConfig.label}</span>
          </div>
        </div>
        <span className="blaze-post-time" style={{ marginRight: selectionMode ? '28px' : 0 }}>
          {time}
        </span>
      </div>
      
      {/* Title */}
      <h4 className="blaze-post-title">{title}</h4>
      
      {/* Preview Text */}
      {event.text && (
        <p className="blaze-post-preview">
          {event.text.substring(0, 100)}
          {event.text.length > 100 ? '... more' : ''}
        </p>
      )}
      
      {/* Image */}
      {event.image_url && (
        <div className="blaze-post-image-container">
          <img 
            src={event.image_url} 
            alt="Post preview" 
            className="blaze-post-image"
          />
          {hasVideo && (
            <div className="blaze-video-indicator">
              <FaPlay style={{ fontSize: '14px', marginLeft: '2px' }} />
            </div>
          )}
        </div>
      )}
      
      {/* Footer: Platform Icons + Connect */}
      <div className="blaze-post-footer">
        <div className="blaze-platform-icons">
          {platforms.slice(0, 4).map((platform, idx) => {
            const pConfig = PLATFORM_CONFIG[platform];
            if (!pConfig) return null;
            const PIcon = pConfig.Icon;
            return (
              <div
                key={idx}
                className="blaze-platform-badge"
                style={{ backgroundColor: pConfig.color }}
                title={pConfig.name}
              >
                <PIcon className="text-white" style={{ fontSize: '10px' }} />
              </div>
            );
          })}
          {platforms.length > 4 && (
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              +{platforms.length - 4}
            </span>
          )}
        </div>
        {event.status === 'draft' && (
          <button className="blaze-connect-btn">Connect</button>
        )}
      </div>
    </motion.div>
  );
}

// Day Column Component
function DayColumn({ 
  date, 
  events, 
  onSelectEvent,
  selectionMode,
  selectedPostIds,
  onToggleSelection
}) {
  const dayEvents = events.filter(event => 
    isSameDay(new Date(event.start), date)
  ).sort((a, b) => new Date(a.start) - new Date(b.start));
  
  const isCurrentDay = isToday(date);
  
  return (
    <div className="blaze-day-column">
      <div className={`blaze-day-header ${isCurrentDay ? 'today' : ''}`}>
        <div className={`blaze-day-date ${isCurrentDay ? 'today' : ''}`}>
          {format(date, 'MMM d')}
        </div>
        <div className="blaze-day-name">
          {format(date, 'EEE')}
        </div>
      </div>
      
      <div className="blaze-day-posts">
        <AnimatePresence>
          {dayEvents.length > 0 ? (
            dayEvents.map(event => (
              <PostCard 
                key={event.id} 
                event={event} 
                onClick={onSelectEvent}
                selectionMode={selectionMode}
                isSelected={selectedPostIds?.has(event.id)}
                onToggleSelection={onToggleSelection}
              />
            ))
          ) : (
            <div className="blaze-empty-day">
              <div className="blaze-empty-icon">📝</div>
              <p className="blaze-empty-text">No posts</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Main BlazeWeekView Component
export default function BlazeWeekView({ 
  events, 
  currentDate, 
  onSelectEvent,
  onNavigate,
  selectionMode = false,
  selectedPostIds = new Set(),
  onToggleSelection
}) {
  // Calculate week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);
  
  return (
    <div className="blaze-week-container">
      <div className="blaze-week-grid">
        {weekDays.map((date, idx) => (
          <DayColumn
            key={idx}
            date={date}
            events={events}
            onSelectEvent={onSelectEvent}
            selectionMode={selectionMode}
            selectedPostIds={selectedPostIds}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>
    </div>
  );
}
