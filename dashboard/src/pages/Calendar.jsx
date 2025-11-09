import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
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
  FaTelegram
} from 'react-icons/fa';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar-glossy.css';

// Setup date-fns localizer
const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const PLATFORM_ICONS = {
  linkedin: { Icon: FaLinkedin, color: '#0077B5' },
  twitter: { Icon: FaTwitter, color: '#1DA1F2' },
  instagram: { Icon: FaInstagram, color: '#E4405F' },
  facebook: { Icon: FaFacebook, color: '#1877F2' },
  tiktok: { Icon: FaTiktok, color: '#000000' },
  youtube: { Icon: FaYoutube, color: '#FF0000' },
  reddit: { Icon: FaReddit, color: '#FF4500' },
  discord: { Icon: FaDiscord, color: '#5865F2' },
  slack: { Icon: FaSlack, color: '#4A154B' },
  telegram: { Icon: FaTelegram, color: '#0088CC' }
};

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [view, setView] = useState('month');
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadScheduledPosts();
  }, []);

  const loadScheduledPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/scheduled');
      
      if (response.data.success) {
        // Convert schedule_time to Date objects
        const formattedEvents = response.data.posts.map(post => ({
          ...post,
          start: new Date(post.start),
          end: new Date(post.end)
        }));
        
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error('Error loading scheduled posts:', err);
      console.error('Error details:', err.response?.data);
      showError('Failed to load scheduled posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDeletePost = async () => {
    if (!selectedEvent) return;
    
    if (!confirm('Are you sure you want to delete this scheduled post?')) {
      return;
    }

    try {
      await api.delete(`/queue/${selectedEvent.id}`);
      showSuccess('Scheduled post deleted');
      setShowEventModal(false);
      setSelectedEvent(null);
      loadScheduledPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      showError('Failed to delete post');
    }
  };

  // Custom event styling - Make events VISIBLE
  const eventStyleGetter = (event) => {
    // Don't override - let CSS handle all styling for consistency
    return {
      style: {
        // CSS in calendar-glossy.css handles all styling
      }
    };
  };

  // Custom Toolbar: Month Name in Center, No Today/Back/Next buttons
  const CustomToolbar = ({ label, onView, view }) => {
    return (
      <div className="rbc-toolbar-custom mb-8">
        {/* Month Name - CENTERED */}
        <div className="flex justify-center mb-6">
          <h2 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 text-transparent bg-clip-text drop-shadow-[0_0_30px_rgba(139,92,246,0.8)]">
            {label}
          </h2>
        </div>

        {/* View Buttons - Centered */}
        <div className="flex justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onView('month')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              view === 'month'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-gray-900 dark:text-white shadow-blue-500/50'
                : 'bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-700/60'
            }`}
          >
            📅 Month
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onView('week')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              view === 'week'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-gray-900 dark:text-white shadow-blue-500/50'
                : 'bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-700/60'
            }`}
          >
            📊 Week
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onView('day')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              view === 'day'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-gray-900 dark:text-white shadow-blue-500/50'
                : 'bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-700/60'
            }`}
          >
            📆 Day
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onView('agenda')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
              view === 'agenda'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-gray-900 dark:text-white shadow-blue-500/50'
                : 'bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-gray-700/60'
            }`}
          >
            📋 Agenda
          </motion.button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Simplified Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="text-4xl">📅</span>
            Post Calendar
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Scheduled posts: {events.length}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={loadScheduledPosts}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-gray-900 dark:text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </motion.button>
      </div>

      {/* Calendar Container */}
      <div className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-2xl border-2 border-white/20 rounded-2xl shadow-2xl p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Loading calendar...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Scheduled Posts</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">Schedule a post to see it on the calendar</p>
            <a
              href="/create-post"
              className="group/btn relative inline-block bg-gradient-to-r from-blue-600/40 to-purple-600/40 backdrop-blur-xl border-2 border-blue-400/40 text-gray-900 dark:text-white px-8 py-4 rounded-xl hover:from-blue-600/50 hover:to-purple-600/50 font-semibold transition-all shadow-xl hover:shadow-blue-500/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              <span className="relative">Create a Scheduled Post</span>
            </a>
          </div>
        ) : (
          <div className="relative" style={{ height: '700px', overflow: 'visible' }}>
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              view={view}
              onView={setView}
              views={['month', 'week', 'day', 'agenda']}
              className="calendar-custom"
              components={{
                event: ({ event }) => {
                  // Get platform icons for this event
                  const platforms = event.platforms || [];
                  
                  const handleMouseEnter = (e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPreviewPosition({
                      x: rect.left + rect.width / 2,
                      y: rect.bottom + 10 // 10px below the event
                    });
                    setHoveredEvent(event);
                  };
                  
                  return (
                    <div 
                      className="rbc-event-custom relative"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={() => setHoveredEvent(null)}
                    >
                      {/* Show ONLY Platform Icons */}
                      <div className="flex items-center gap-1.5 justify-center py-1">
                        {platforms.slice(0, 3).map((platform, idx) => {
                          const config = PLATFORM_ICONS[platform];
                          if (!config) return null;
                          const PlatformIcon = config.Icon;
                          return (
                            <PlatformIcon 
                              key={idx} 
                              className="text-gray-900 dark:text-white drop-shadow-lg" 
                              style={{ fontSize: '1.4rem' }}
                            />
                          );
                        })}
                        {platforms.length > 3 && (
                          <span className="text-gray-900 dark:text-white text-xs font-bold">+{platforms.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                }
              }}
              toolbar={CustomToolbar}
            />
          </div>
        )}
      </div>

      {/* Hover Preview Portal - Rendered Outside Calendar DOM */}
      {hoveredEvent && createPortal(
        <>
          {/* White Preview Popup - Positioned near the event */}
          <div 
            className="fixed pointer-events-none"
            style={{
              left: `${previewPosition.x}px`,
              top: `${previewPosition.y}px`,
              transform: 'translateX(-50%)',
              zIndex: 999999
            }}
            onMouseEnter={() => setHoveredEvent(hoveredEvent)}
            onMouseLeave={() => setHoveredEvent(null)}
          >
            <div 
              className="bg-white backdrop-blur-2xl border-4 border-purple-500/40 rounded-2xl p-6 shadow-2xl shadow-purple-900/60 w-[380px] pointer-events-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-gray-900 font-black text-xl flex items-center gap-2">
                  <span className="text-3xl">📝</span>
                  Post Preview
                </p>
                <p className="text-sm text-purple-600 font-bold bg-purple-50 px-3 py-1.5 rounded-lg">
                  {hoveredEvent.start.toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200 p-5 rounded-xl mb-5 shadow-inner">
                <p className="text-gray-800 text-base leading-relaxed font-medium">
                  {hoveredEvent.text}
                </p>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-500 text-xs font-black uppercase tracking-wider mb-3">Platforms:</p>
                <div className="flex flex-wrap gap-2.5">
                  {hoveredEvent.platforms?.map(p => {
                    const config = PLATFORM_ICONS[p];
                    if (!config) return null;
                    const PlatformIcon = config.Icon;
                    return (
                      <span 
                        key={p} 
                        className="inline-flex items-center gap-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-gray-900 dark:text-white px-4 py-2 rounded-xl font-black shadow-lg hover:shadow-xl transition-all uppercase"
                      >
                        <PlatformIcon style={{ fontSize: '1.1rem' }} />
                        {p}
                      </span>
                    );
                  })}
                </div>
              </div>
              
              <div className="pt-4 border-t-2 border-purple-200 text-xs text-purple-700 flex items-center gap-2 bg-purple-50 px-4 py-3 rounded-xl">
                <span>💡</span>
                <span className="font-bold">Click event to view full details or delete</span>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-2xl border-2 border-white/20 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 backdrop-blur-lg border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Post Details</h2>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                    {selectedEvent.start.toLocaleString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-900 dark:text-white transition p-2"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Caption */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Caption</label>
                <div className="bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-gray-900 dark:text-white rounded-xl px-4 py-3 whitespace-pre-wrap">
                  {selectedEvent.text}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.platforms?.map(platform => {
                    const config = PLATFORM_ICONS[platform];
                    if (!config) return null;
                    const PlatformIcon = config.Icon;
                    
                    return (
                      <span
                        key={platform}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 backdrop-blur-sm border border-white/20 text-gray-200 rounded-lg text-sm"
                      >
                        <PlatformIcon className="text-lg" style={{ color: config.color }} />
                        {platform}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Media */}
              {selectedEvent.image_url && (
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">Attached Media</label>
                  <img 
                    src={selectedEvent.image_url} 
                    alt="Post media" 
                    className="w-full rounded-xl border-2 border-gray-600/50"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleDeletePost}
                  className="group relative flex-1 bg-red-600/30 backdrop-blur-lg border-2 border-red-400/30 text-gray-900 dark:text-white px-6 py-3 rounded-xl hover:bg-red-600/40 font-semibold transition-all shadow-lg hover:shadow-red-500/30 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  <span className="relative">🗑️ Delete Post</span>
                </button>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="group relative flex-1 bg-gray-800/60 backdrop-blur-lg border-2 border-white/20 text-gray-200 px-6 py-3 rounded-xl hover:bg-gray-700/60 font-semibold transition-all shadow-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  <span className="relative">Close</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
