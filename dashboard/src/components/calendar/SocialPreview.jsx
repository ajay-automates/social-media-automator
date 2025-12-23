import { format } from 'date-fns';
import {
  FaHeart,
  FaComment,
  FaShare,
  FaRetweet,
  FaBookmark,
  FaThumbsUp,
  FaPaperPlane,
  FaEllipsisH,
  FaGlobe,
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

// Instagram Preview
function InstagramPreview({ text, imageUrl, username, scheduledTime }) {
  return (
    <div className="blaze-social-preview" style={{ maxWidth: '400px' }}>
      {/* Header */}
      <div className="blaze-social-header">
        <div 
          className="blaze-social-avatar" 
          style={{ 
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            padding: '2px'
          }}
        >
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {username?.charAt(0)?.toUpperCase() || 'I'}
          </div>
        </div>
        <div className="blaze-social-user">
          <div className="blaze-social-username" style={{ fontWeight: '600' }}>
            {username?.toLowerCase().replace(/\s/g, '_') || 'your_account'}
          </div>
        </div>
        <FaEllipsisH style={{ color: '#262626', cursor: 'pointer' }} />
      </div>

      {/* Image (required for Instagram) */}
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt="Post" 
          className="blaze-social-image"
          style={{ aspectRatio: '1/1', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          aspectRatio: '1/1',
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: '14px'
        }}>
          No image attached
        </div>
      )}

      {/* Actions */}
      <div className="blaze-social-actions" style={{ borderTop: 'none', paddingTop: '12px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <FaRegHeart style={{ fontSize: '24px', cursor: 'pointer' }} />
          <FaRegComment style={{ fontSize: '24px', cursor: 'pointer' }} />
          <FaPaperPlane style={{ fontSize: '22px', cursor: 'pointer' }} />
        </div>
        <FaBookmark style={{ fontSize: '22px', cursor: 'pointer', marginLeft: 'auto' }} />
      </div>

      {/* Likes */}
      <div style={{ padding: '0 16px 8px', fontWeight: '600', fontSize: '14px' }}>
        0 likes
      </div>

      {/* Caption */}
      <div style={{ padding: '0 16px 16px' }}>
        <span style={{ fontWeight: '600', marginRight: '8px', fontSize: '14px' }}>
          {username?.toLowerCase().replace(/\s/g, '_') || 'your_account'}
        </span>
        <span style={{ fontSize: '14px', color: '#262626' }}>
          {text?.substring(0, 100)}{text?.length > 100 ? '...' : ''}
        </span>
      </div>
    </div>
  );
}

// Facebook Preview
function FacebookPreview({ text, imageUrl, username, scheduledTime }) {
  return (
    <div className="blaze-social-preview" style={{ maxWidth: '500px' }}>
      {/* Header */}
      <div className="blaze-social-header">
        <div className="blaze-social-avatar" style={{ borderRadius: '50%', background: '#1877F2', color: 'white' }}>
          {username?.charAt(0)?.toUpperCase() || 'F'}
        </div>
        <div className="blaze-social-user">
          <div className="blaze-social-username">{username || 'Your Page'}</div>
          <div className="blaze-social-meta">
            <span>Just now</span>
            <span>•</span>
            <FaGlobe style={{ fontSize: '10px' }} />
          </div>
        </div>
        <FaEllipsisH style={{ color: '#65676b', cursor: 'pointer' }} />
      </div>

      {/* Body */}
      <div className="blaze-social-body">
        <p className="blaze-social-text">{text}</p>
      </div>

      {/* Image */}
      {imageUrl && (
        <img src={imageUrl} alt="Post" className="blaze-social-image" />
      )}

      {/* Reaction bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        color: '#65676b',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            display: 'flex',
            marginLeft: '-4px'
          }}>
            <span style={{ 
              background: '#1877F2', 
              borderRadius: '50%', 
              width: '18px', 
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white'
            }}>
              <FaThumbsUp style={{ color: 'white', fontSize: '10px' }} />
            </span>
          </div>
          <span>0</span>
        </div>
        <span>0 comments • 0 shares</span>
      </div>

      {/* Actions */}
      <div className="blaze-social-actions" style={{ justifyContent: 'space-around' }}>
        <div className="blaze-social-action">
          <FaThumbsUp />
          <span>Like</span>
        </div>
        <div className="blaze-social-action">
          <FaRegComment />
          <span>Comment</span>
        </div>
        <div className="blaze-social-action">
          <FaShare />
          <span>Share</span>
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
    case 'instagram':
      return <InstagramPreview {...props} />;
    case 'facebook':
      return <FacebookPreview {...props} />;
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
    case 'whatsapp':
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

