import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

/**
 * NotificationBell Component
 * Shows pending approvals count and dropdown with notifications
 */
export default function NotificationBell() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      const response = await api.get('/notifications/count');
      if (response.data.success) {
        setNotificationCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
      // Silently fail for viewers
      setNotificationCount(0);
    }
  };

  // Fetch pending approvals
  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await api.get('/posts/pending-approvals');
      if (response.data.success) {
        const formattedNotifications = response.data.approvals.map(approval => ({
          id: approval.id,
          type: 'approval_request',
          title: 'Post awaiting approval',
          message: `${approval.submitter.name} submitted a post for review`,
          postId: approval.post_id,
          post: approval.post,
          timestamp: new Date(approval.submitted_at),
          read: false
        }));
        setNotifications(formattedNotifications);
      }
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Toggle dropdown and fetch notifications
  const handleBellClick = () => {
    if (!showDropdown && notificationCount > 0) {
      fetchPendingApprovals();
    }
    setShowDropdown(!showDropdown);
  };

  // Navigate to approvals page
  const handleNotificationClick = (notification) => {
    setShowDropdown(false);
    navigate('/approvals');
  };

  // View all approvals
  const handleViewAll = () => {
    setShowDropdown(false);
    navigate('/approvals');
  };

  if (notificationCount === 0) {
    return null; // Don't show bell if no notifications
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <motion.button
        onClick={handleBellClick}
        className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Bell SVG Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Notification Count Badge */}
        {notificationCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
            style={{
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)'
            }}
          >
            {notificationCount > 9 ? '9+' : notificationCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-gray-800/95 backdrop-blur-xl border-2 border-purple-500/30 rounded-xl shadow-2xl overflow-hidden z-50"
            style={{
              boxShadow: '0 0 40px rgba(168, 85, 247, 0.3)'
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
              <h3 className="text-white font-bold text-lg">
                Pending Approvals ({notificationCount})
              </h3>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400">
                  <p>No pending approvals</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700/50">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">✏️</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm">
                            {notification.title}
                          </p>
                          <p className="text-gray-300 text-xs mt-0.5">
                            {notification.message}
                          </p>
                          {notification.post && (
                            <p className="text-gray-400 text-xs mt-1 truncate">
                              "{notification.post.text?.substring(0, 50)}..."
                            </p>
                          )}
                          <p className="text-gray-500 text-xs mt-1">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>

                        {/* Unread Indicator */}
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="bg-gray-900/50 px-4 py-3 border-t border-gray-700/50">
                <button
                  onClick={handleViewAll}
                  className="w-full text-center text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
                >
                  View All Approvals →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to format timestamps
function formatTimestamp(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // seconds

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

