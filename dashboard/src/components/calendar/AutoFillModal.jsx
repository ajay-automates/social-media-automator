import { motion, AnimatePresence } from 'framer-motion';
import { FaMagic, FaTimes, FaStar } from 'react-icons/fa';

export default function AutoFillModal({ isOpen, onClose, onAccept, connectedPlatforms }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  color: '#6b7280',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <FaTimes style={{ fontSize: '16px' }} />
              </button>

              {/* Icon */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <FaMagic style={{ fontSize: '28px', color: 'white' }} />
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
                marginBottom: '12px'
              }}>
                Fill Your Week Automatically?
              </h2>

              {/* Description */}
              <p style={{
                fontSize: '15px',
                color: '#6b7280',
                lineHeight: '1.6',
                marginBottom: '24px'
              }}>
                We can automatically schedule posts across your {connectedPlatforms.length} connected platform{connectedPlatforms.length > 1 ? 's' : ''} for the next 7 days with a balanced distribution.
              </p>

              {/* Benefits */}
              <div style={{
                background: '#f9fafb',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <FaStar style={{ color: '#6366f1', fontSize: '16px', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                      Balanced Distribution
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      2-3 posts per platform, optimized for engagement
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <FaStar style={{ color: '#6366f1', fontSize: '16px', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                      AI-Generated Content
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Fresh posts with images, tailored to each platform
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <FaStar style={{ color: '#6366f1', fontSize: '16px', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>
                      One-Click Setup
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Your entire week scheduled in seconds
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                >
                  Maybe Later
                </button>
                <button
                  onClick={onAccept}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <FaMagic style={{ fontSize: '12px' }} />
                  Fill My Week
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

