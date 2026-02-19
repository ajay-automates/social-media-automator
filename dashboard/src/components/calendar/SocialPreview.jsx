import { format } from 'date-fns';
import {
  FaHeart,
  FaComment,
  FaShare,
  FaRetweet,
  FaBookmark,
  FaPaperPlane,
  FaEllipsisH,
  FaRegComment,
  FaRegHeart
} from 'react-icons/fa';

// LinkedIn Preview
function LinkedInPreview({ text, imageUrl, username, scheduledTime }) {
  return (
    <div className="blaze-social-preview" style={{ maxWidth: '500px' }}>
      {/* Header */}
      <div className="blaze-social-header">
        <div className="blaze-social-avatar">
          {username?.charAt(0)?.toUpperCase() || 'B'}
        </div>
        <div className="blaze-social-user">
          <div className="blaze-social-username">{username || 'Account Not Connected'}</div>
          <div className="blaze-social-meta">
            <span>1m</span>
            <span>•</span>
            <span>Edited</span>
            <span>•</span>
            <FaGlobe style={{ fontSize: '10px' }} />
          </div>
        </div>
        <FaEllipsisH style={{ color: '#6b7280', cursor: 'pointer' }} />
      </div>

      {/* Body */}
      <div className="blaze-social-body">
        <p className="blaze-social-text">{text}</p>
      </div>

      {/* Image */}
      {imageUrl && (
        <img src={imageUrl} alt="Post" className="blaze-social-image" />
      )}

      {/* Actions */}
      <div className="blaze-social-actions">
        <div className="blaze-social-action">
          <FaThumbsUp />
          <span>Like</span>
        </div>
        <div className="blaze-social-action">
          <FaRegComment />
          <span>Comment</span>
        </div>
        <div className="blaze-social-action">
          <FaRetweet />
          <span>Repost</span>
        </div>
        <div className="blaze-social-action">
          <FaPaperPlane />
          <span>Send</span>
        </div>
      </div>
    </div>
  );
}

// Twitter/X Preview
function TwitterPreview({ text, imageUrl, username, scheduledTime }) {
  return (
    <div className="blaze-social-preview" style={{ maxWidth: '500px' }}>
      {/* Header */}
      <div className="blaze-social-header">
        <div className="blaze-social-avatar" style={{ borderRadius: '50%' }}>
          {username?.charAt(0)?.toUpperCase() || 'X'}
        </div>
        <div className="blaze-social-user">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="blaze-social-username">{username || 'Your Account'}</span>
            <span style={{ color: '#9ca3af', fontSize: '14px' }}>@{username?.toLowerCase().replace(/\s/g, '') || 'handle'}</span>
          </div>
          <div className="blaze-social-meta">
            <span>Just now</span>
          </div>
        </div>
        <FaEllipsisH style={{ color: '#6b7280', cursor: 'pointer' }} />
      </div>

      {/* Body */}
      <div className="blaze-social-body">
        <p className="blaze-social-text">{text}</p>
      </div>

      {/* Image */}
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt="Post" 
          className="blaze-social-image" 
          style={{ borderRadius: '16px', margin: '0 16px 16px' }}
        />
      )}

      {/* Actions */}
      <div className="blaze-social-actions" style={{ justifyContent: 'space-around' }}>
        <div className="blaze-social-action">
          <FaRegComment />
          <span>0</span>
        </div>
        <div className="blaze-social-action">
          <FaRetweet />
          <span>0</span>
        </div>
        <div className="blaze-social-action">
          <FaRegHeart />
          <span>0</span>
        </div>
        <div className="blaze-social-action">
          <FaBookmark />
        </div>
        <div className="blaze-social-action">
          <FaShare />
        </div>
      </div>
    </div>
  );
}

// Main SocialPreview Component
export default function SocialPreview({
  platform,
  text,
  imageUrl,
  username,
  scheduledTime
}) {
  const props = { text, imageUrl, username, scheduledTime };

  switch (platform) {
    case 'twitter':
      return <TwitterPreview {...props} />;
    case 'linkedin':
      return <LinkedInPreview {...props} />;
    case 'tiktok':
    case 'youtube':
    case 'reddit':
    case 'discord':
    case 'slack':
    case 'telegram':
    case 'pinterest':
    case 'medium':
    case 'tumblr':
    case 'mastodon':
    case 'bluesky':
    default:
      // For platforms without specific preview, use LinkedIn-style preview
      return <LinkedInPreview {...props} />;
  }
}

