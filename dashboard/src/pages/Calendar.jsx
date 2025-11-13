import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import PlatformChip from '../components/ui/PlatformChip';
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
  FaFilter,
  FaDownload,
  FaSearch,
  FaTimes
} from 'react-icons/fa';
import { SiMastodon, SiBluesky } from 'react-icons/si';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/calendar-ios.css';

// Platform configuration with colors
const PLATFORM_CONFIG = {
  linkedin: { Icon: FaLinkedin, color: '#0A66C2', bgColor: 'rgba(10, 102, 194, 0.2)' },
  twitter: { Icon: FaTwitter, color: '#1DA1F2', bgColor: 'rgba(29, 161, 242, 0.2)' },
  instagram: { Icon: FaInstagram, color: '#E1306C', bgColor: 'rgba(225, 48, 108, 0.2)' },
  facebook: { Icon: FaFacebook, color: '#1877F2', bgColor: 'rgba(24, 119, 242, 0.2)' },
  tiktok: { Icon: FaTiktok, color: '#FE2C55', bgColor: 'rgba(254, 44, 85, 0.2)' },
  youtube: { Icon: FaYoutube, color: '#FF0000', bgColor: 'rgba(255, 0, 0, 0.2)' },
  reddit: { Icon: FaReddit, color: '#FF4500', bgColor: 'rgba(255, 69, 0, 0.2)' },
  discord: { Icon: FaDiscord, color: '#5865F2', bgColor: 'rgba(88, 101, 242, 0.2)' },
  slack: { Icon: FaSlack, color: '#4A154B', bgColor: 'rgba(74, 21, 75, 0.2)' },
  telegram: { Icon: FaTelegram, color: '#26A5E4', bgColor: 'rgba(38, 165, 228, 0.2)' },
  whatsapp: { Icon: FaWhatsapp, color: '#25D366', bgColor: 'rgba(37, 211, 102, 0.2)' },
  pinterest: { Icon: FaPinterest, color: '#E60023', bgColor: 'rgba(230, 0, 35, 0.2)' },
  medium: { Icon: FaMedium, color: '#00AB6C', bgColor: 'rgba(0, 171, 108, 0.2)' },
  devto: { Icon: FaMedium, color: '#0A0A0A', bgColor: 'rgba(10, 10, 10, 0.2)' },
  tumblr: { Icon: FaTumblr, color: '#36465D', bgColor: 'rgba(54, 70, 93, 0.2)' },
  mastodon: { Icon: SiMastodon, color: '#6364FF', bgColor: 'rgba(99, 100, 255, 0.2)' },
  bluesky: { Icon: SiBluesky, color: '#1185FE', bgColor: 'rgba(17, 133, 254, 0.2)' },
};

// Setup date-fns localizer
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Setup drag and drop
const DnDCalendar = withDragAndDrop(BigCalendar);

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [view, setView] = useState('month');
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [showFilters, setShowFilters] = useState(false);

  const allPlatforms = Object.keys(PLATFORM_CONFIG);
  const allStatuses = ['queued', 'scheduled', 'posted', 'failed'];

  useEffect(() => {
    loadScheduledPosts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, searchQuery, selectedPlatforms, selectedStatuses, dateRange]);

  const loadScheduledPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/scheduled');
      
      if (response.data.success) {
        const formattedEvents = response.data.posts.map(post => ({
          ...post,
          start: new Date(post.start),
          end: new Date(post.end)
        }));
        
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error('Error loading scheduled posts:', err);
      showError('Failed to load scheduled posts');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.text?.toLowerCase().includes(query) ||
        event.platforms?.some(p => p.toLowerCase().includes(query))
      );
    }

    // Platform filter
    if (selectedPlatforms.length > 0) {
      filtered = filtered.filter(event =>
        event.platforms?.some(p => selectedPlatforms.includes(p))
      );
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(event =>
        selectedStatuses.includes(event.status)
      );
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999); // Include end of day
      
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate >= start && eventDate <= end;
      });
    }

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPlatforms([]);
    setSelectedStatuses([]);
    setDateRange({ start: null, end: null });
  };

  const togglePlatformFilter = (platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const toggleStatusFilter = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Caption', 'Platforms', 'Status'];
    const rows = filteredEvents.map(event => [
      format(event.start, 'yyyy-MM-dd'),
      format(event.start, 'HH:mm'),
      `"${event.text?.replace(/"/g, '""') || ''}"`,
      event.platforms?.join(', ') || '',
      event.status || 'queued'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calendar_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    showSuccess(`Exported ${filteredEvents.length} posts to CSV`);
  };

  // iCal Export
  const exportToICal = () => {
    const icalEvents = filteredEvents.map(event => {
      const startDate = format(event.start, "yyyyMMdd'T'HHmmss");
      const endDate = format(event.end, "yyyyMMdd'T'HHmmss");
      const platforms = event.platforms?.join(', ') || '';
      
      return [
        'BEGIN:VEVENT',
        `UID:${event.id}@socialmediaautomator.com`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:Post to ${platforms}`,
        `DESCRIPTION:${event.text?.replace(/\n/g, '\\n') || ''}`,
        `STATUS:${event.status?.toUpperCase() || 'CONFIRMED'}`,
        'END:VEVENT'
      ].join('\r\n');
    }).join('\r\n');

    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Social Media Automator//Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      icalEvents,
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calendar_export_${format(new Date(), 'yyyy-MM-dd')}.ics`;
    link.click();

    showSuccess(`Exported ${filteredEvents.length} posts to iCal`);
  };

  // Drag and Drop Rescheduling
  const handleEventDrop = async ({ event, start, end }) => {
    try {
      // Update locally first for instant feedback
      const updatedEvents = events.map(e =>
        e.id === event.id ? { ...e, start, end } : e
      );
      setEvents(updatedEvents);

      // Update on backend
      await api.put(`/posts/${event.id}/reschedule`, {
        schedule_time: start.toISOString()
      });

      showSuccess('Post rescheduled successfully!');
    } catch (err) {
      console.error('Error rescheduling post:', err);
      showError('Failed to reschedule post');
      // Revert on error
      loadScheduledPosts();
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

  // Custom event styling with platform colors
  const eventStyleGetter = (event) => {
    const primaryPlatform = event.platforms?.[0];
    const config = PLATFORM_CONFIG[primaryPlatform];
    
    if (config) {
      return {
        style: {
          backgroundColor: config.bgColor,
          borderLeft: `4px solid ${config.color}`,
          color: '#ffffff'
        }
      };
    }
    
    return {
      style: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderLeft: '4px solid #8b5cf6',
        color: '#ffffff'
      }
    };
  };

  // Custom Toolbar - iOS Dark
  const CustomToolbar = ({ label, onView, view: currentView }) => {
    return (
      <div className="rbc-toolbar-custom py-6 px-4 bg-[#1c1c1e] border-b border-[#38383a]">
        <div className="flex justify-center mb-5">
          <h2 className="ios-month-title">{label}</h2>
        </div>

        <div className="flex justify-center gap-2">
          {['month', 'week', 'day', 'agenda'].map(v => (
            <motion.button
              key={v}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onView(v)}
              className={`ios-view-button ${currentView === v ? 'active' : ''}`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  const activeFilterCount = 
    (searchQuery ? 1 : 0) +
    selectedPlatforms.length +
    selectedStatuses.length +
    (dateRange.start && dateRange.end ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#000000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - iOS Dark */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3" style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
              letterSpacing: '-0.5px'
            }}>
              📅 Calendar
            </h1>
            <p className="text-[#98989d] mt-2 text-sm font-medium">
              {filteredEvents.length !== events.length 
                ? `${filteredEvents.length} of ${events.length} posts`
                : `${events.length} scheduled posts`
              }
            </p>
          </div>
        <div className="flex gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`relative ios-button ${showFilters ? '' : 'ios-button-secondary'} flex items-center gap-2`}
          >
            <FaFilter className="text-sm" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-white text-[#007aff] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportToCSV}
            disabled={filteredEvents.length === 0}
            className="ios-button ios-button-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaDownload className="text-sm" />
            CSV
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportToICal}
            disabled={filteredEvents.length === 0}
            className="ios-button ios-button-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaDownload className="text-sm" />
            iCal
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadScheduledPosts}
            className="ios-button ios-button-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </motion.button>
        </div>
      </div>

      {/* Filter Panel - iOS Style */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 ios-filter-panel overflow-hidden"
          >
            {/* Search - iOS Style */}
            <div className="mb-5">
              <label className="ios-filter-label flex items-center gap-2">
                <FaSearch className="text-xs" />
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by caption or platform..."
                  className="ios-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c7c7cc] hover:text-[#8e8e93] transition"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* Platform Filter - iOS Style */}
            <div className="mb-5">
              <label className="ios-filter-label">
                Platforms {selectedPlatforms.length > 0 && `(${selectedPlatforms.length})`}
              </label>
              <div className="flex flex-wrap gap-2">
                {allPlatforms.map(platform => {
                  const config = PLATFORM_CONFIG[platform];
                  const Icon = config.Icon;
                  const isSelected = selectedPlatforms.includes(platform);
                  
                  return (
                    <motion.button
                      key={platform}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => togglePlatformFilter(platform)}
                      className={`ios-platform-chip ${isSelected ? 'selected' : ''}`}
                    >
                      <Icon className="text-sm" />
                      <span className="capitalize">{platform}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Status Filter - iOS Style */}
            <div className="mb-5">
              <label className="ios-filter-label">
                Status {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
              </label>
              <div className="flex flex-wrap gap-2">
                {allStatuses.map(status => {
                  const isSelected = selectedStatuses.includes(status);
                  
                  return (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleStatusFilter(status)}
                      className={`ios-platform-chip ${isSelected ? 'selected' : ''}`}
                    >
                      <span className="capitalize">{status}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Date Range Filter - iOS Style */}
            <div className="mb-5">
              <label className="ios-filter-label">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8e8e93] mb-1 font-medium">Start</label>
                  <input
                    type="date"
                    value={dateRange.start || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="ios-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8e8e93] mb-1 font-medium">End</label>
                  <input
                    type="date"
                    value={dateRange.end || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="ios-input text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters Button - iOS Style */}
            {activeFilterCount > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearFilters}
                className="w-full ios-button ios-button-secondary text-[#ff3b30] flex items-center justify-center gap-2"
                style={{ color: '#ff3b30' }}
              >
                <FaTimes />
                Clear All Filters ({activeFilterCount})
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Container - iOS Dark */}
      <div className="relative bg-[#1c1c1e] rounded-2xl shadow-lg border border-[#38383a] overflow-hidden" style={{
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
      }}>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-[#38383a] border-t-[#0a84ff] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#98989d] font-medium">Loading calendar...</p>
          </div>
        ) : filteredEvents.length === 0 && events.length > 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2" style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
            }}>No Posts Match Filters</h3>
            <p className="text-[#98989d] mb-6 font-medium">Try adjusting your filters or clearing them</p>
            <button
              onClick={clearFilters}
              className="ios-button"
            >
              Clear Filters
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold text-white mb-2" style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
            }}>No Scheduled Posts</h3>
            <p className="text-[#98989d] mb-6 font-medium">Schedule a post to see it on the calendar</p>
            <a
              href="/create"
              className="inline-block ios-button"
            >
              Create a Scheduled Post
            </a>
          </div>
        ) : (
          <div className="relative" style={{ height: '700px', overflow: 'visible' }}>
            <DnDCalendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              onSelectEvent={handleSelectEvent}
              onEventDrop={handleEventDrop}
              eventPropGetter={eventStyleGetter}
              view={view}
              onView={setView}
              views={['month', 'week', 'day', 'agenda']}
              className="calendar-ios"
              resizable={false}
              draggableAccessor={() => true}
              components={{
                toolbar: CustomToolbar,
                event: ({ event }) => {
                  const platforms = event.platforms || [];
                  
                  const handleMouseEnter = (e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPreviewPosition({
                      x: rect.left + rect.width / 2,
                      y: rect.bottom + 10
                    });
                    setHoveredEvent(event);
                  };
                  
                  return (
                    <div 
                      className="rbc-event-custom relative cursor-move"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={(e) => {
                        // Only clear if we're actually leaving the event
                        const relatedTarget = e.relatedTarget;
                        if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
                          setHoveredEvent(null);
                        }
                      }}
                      title="Drag to reschedule"
                    >
                      <div className="flex items-center gap-1.5 justify-center py-1">
                        {platforms.slice(0, 3).map((platform, idx) => {
                          const config = PLATFORM_CONFIG[platform];
                          if (!config) return null;
                          const PlatformIcon = config.Icon;
                          return (
                            <PlatformIcon 
                              key={idx} 
                              className="text-white drop-shadow-lg" 
                              style={{ fontSize: '1.4rem' }}
                            />
                          );
                        })}
                        {platforms.length > 3 && (
                          <span className="text-white text-xs font-bold">+{platforms.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Hover Preview Portal - iOS Dark */}
      {hoveredEvent && createPortal(
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
          <div className="bg-[#2c2c2e] rounded-2xl p-5 w-[340px] pointer-events-auto border border-[#48484a]" style={{
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.4)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
          }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#98989d] text-xs font-semibold uppercase tracking-wide">
                {hoveredEvent.start.toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            
            <div className="mb-4">
              <p className="text-white text-sm leading-relaxed" style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {hoveredEvent.text}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {hoveredEvent.platforms?.slice(0, 4).map(p => {
                const config = PLATFORM_CONFIG[p];
                if (!config) return null;
                const PlatformIcon = config.Icon;
                return (
                  <span 
                    key={p} 
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: `${config.color}30`,
                      color: config.color,
                      border: `1px solid ${config.color}60`
                    }}
                  >
                    <PlatformIcon style={{ fontSize: '0.75rem' }} />
                    {p}
                  </span>
                );
              })}
              {hoveredEvent.platforms?.length > 4 && (
                <span className="text-xs text-[#98989d] px-2.5 py-1">
                  +{hoveredEvent.platforms.length - 4}
                </span>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-[#38383a] text-xs text-[#98989d] font-medium">
              💡 Drag to reschedule • Click for details
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Event Detail Modal - iOS Style */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 ios-modal-overlay flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ios-modal max-w-2xl w-full"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
            }}
          >
            {/* Modal Header - iOS Style */}
            <div className="ios-modal-header">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="ios-modal-title">Scheduled Post</h2>
                  <p className="text-[#98989d] text-sm mt-1 font-medium">
                    {selectedEvent.start.toLocaleString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-[#98989d] hover:text-white transition p-2"
                >
                  <span className="text-2xl">✕</span>
                </button>
              </div>
            </div>

            {/* Modal Content - iOS Style */}
            <div className="ios-modal-content space-y-5">
              {/* Caption - Dark */}
              <div>
                <label className="ios-filter-label">Caption</label>
                <div className="bg-[#2c2c2e] border border-[#38383a] text-white rounded-xl px-4 py-3 whitespace-pre-wrap text-sm" style={{ lineHeight: '1.5' }}>
                  {selectedEvent.text}
                </div>
              </div>

              {/* Platforms - Dark */}
              <div>
                <label className="ios-filter-label">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.platforms?.map(platform => {
                    const config = PLATFORM_CONFIG[platform];
                    if (!config) return null;
                    const Icon = config.Icon;
                    return (
                      <span
                        key={platform}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border"
                        style={{
                          backgroundColor: `${config.color}20`,
                          borderColor: `${config.color}60`,
                          color: config.color
                        }}
                      >
                        <Icon />
                        {platform}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Media */}
              {selectedEvent.image_url && (
                <div>
                  <label className="ios-filter-label">Attached Media</label>
                  <img 
                    src={selectedEvent.image_url} 
                    alt="Post media" 
                    className="w-full rounded-xl border border-[#38383a]"
                  />
                </div>
              )}

              {/* Actions - Dark */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    // Clone the post
                    const state = {
                      clonedCaption: selectedEvent.text,
                      clonedPlatforms: selectedEvent.platforms || [],
                      clonedImageUrl: selectedEvent.image_url
                    };
                    window.location.href = `/create?clone=${JSON.stringify(state)}`;
                  }}
                  className="flex-1 bg-[#5ac8fa] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#6ad8ff] transition"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  📋 Clone
                </button>
                <button
                  onClick={handleDeletePost}
                  className="flex-1 bg-[#ff453a] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#ff6259] transition"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  Delete Post
                </button>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 ios-button-secondary px-6 py-3"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      </div>
    </div>
  );
}
