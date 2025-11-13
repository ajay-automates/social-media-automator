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
import '../styles/calendar-glossy.css';

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

  // Custom Toolbar
  const CustomToolbar = ({ label, onView, view: currentView }) => {
    return (
      <div className="rbc-toolbar-custom mb-8">
        <div className="flex justify-center mb-6">
          <h2 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 text-transparent bg-clip-text drop-shadow-[0_0_30px_rgba(139,92,246,0.8)]">
            {label}
          </h2>
        </div>

        <div className="flex justify-center gap-3">
          {['month', 'week', 'day', 'agenda'].map(v => (
            <motion.button
              key={v}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onView(v)}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                currentView === v
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-blue-500/50'
                  : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60'
              }`}
            >
              {v === 'month' && '📅'} {v === 'week' && '📊'} {v === 'day' && '📆'} {v === 'agenda' && '📋'} {v.charAt(0).toUpperCase() + v.slice(1)}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-4xl">📅</span>
            Post Calendar
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {filteredEvents.length !== events.length 
              ? `Showing ${filteredEvents.length} of ${events.length} posts`
              : `${events.length} scheduled posts`
            }
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`relative px-5 py-2.5 rounded-lg font-semibold transition flex items-center gap-2 ${
              showFilters
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/60'
            }`}
          >
            <FaFilter />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToCSV}
            disabled={filteredEvents.length === 0}
            className="bg-green-600/80 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-600 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaDownload />
            CSV
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToICal}
            disabled={filteredEvents.length === 0}
            className="bg-blue-600/80 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaDownload />
            iCal
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadScheduledPosts}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </motion.button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-gray-900/50 backdrop-blur-lg border border-white/10 rounded-xl p-6 overflow-hidden"
          >
            {/* Search */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                <FaSearch className="inline mr-2" />
                Search Posts
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by caption or platform..."
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* Platform Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                Filter by Platform ({selectedPlatforms.length} selected)
              </label>
              <div className="flex flex-wrap gap-2">
                {allPlatforms.map(platform => {
                  const config = PLATFORM_CONFIG[platform];
                  const Icon = config.Icon;
                  const isSelected = selectedPlatforms.includes(platform);
                  
                  return (
                    <motion.button
                      key={platform}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => togglePlatformFilter(platform)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${
                        isSelected
                          ? 'text-white shadow-lg'
                          : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
                      }`}
                      style={isSelected ? {
                        backgroundColor: config.bgColor,
                        borderLeft: `3px solid ${config.color}`
                      } : {}}
                    >
                      <Icon />
                      {platform}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Status Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                Filter by Status ({selectedStatuses.length} selected)
              </label>
              <div className="flex flex-wrap gap-2">
                {allStatuses.map(status => {
                  const isSelected = selectedStatuses.includes(status);
                  const statusColors = {
                    queued: 'from-blue-600 to-cyan-600',
                    scheduled: 'from-purple-600 to-pink-600',
                    posted: 'from-green-600 to-emerald-600',
                    failed: 'from-red-600 to-orange-600'
                  };
                  
                  return (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleStatusFilter(status)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                        isSelected
                          ? `bg-gradient-to-r ${statusColors[status]} text-white shadow-lg`
                          : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                Filter by Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {activeFilterCount > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearFilters}
                className="w-full bg-red-600/80 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                <FaTimes />
                Clear All Filters ({activeFilterCount})
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Container */}
      <div className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-2xl border-2 border-white/20 rounded-2xl shadow-2xl p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">Loading calendar...</p>
          </div>
        ) : filteredEvents.length === 0 && events.length > 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-3">No Posts Match Filters</h3>
            <p className="text-gray-300 mb-6">Try adjusting your filters or clearing them</p>
            <button
              onClick={clearFilters}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold text-white mb-3">No Scheduled Posts</h3>
            <p className="text-gray-300 mb-6">Schedule a post to see it on the calendar</p>
            <a
              href="/create"
              className="group/btn relative inline-block bg-gradient-to-r from-blue-600/40 to-purple-600/40 backdrop-blur-xl border-2 border-blue-400/40 text-white px-8 py-4 rounded-xl hover:from-blue-600/50 hover:to-purple-600/50 font-semibold transition-all shadow-xl hover:shadow-blue-500/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              <span className="relative">Create a Scheduled Post</span>
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
              className="calendar-custom"
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
                      onMouseLeave={() => setHoveredEvent(null)}
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

      {/* Hover Preview Portal */}
      {hoveredEvent && createPortal(
        <div 
          className="fixed pointer-events-none"
          style={{
            left: `${previewPosition.x}px`,
            top: `${previewPosition.y}px`,
            transform: 'translateX(-50%)',
            zIndex: 999999
          }}
        >
          <div className="bg-white backdrop-blur-2xl border-4 border-purple-500/40 rounded-2xl p-6 shadow-2xl shadow-purple-900/60 w-[380px] pointer-events-auto">
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
                  const config = PLATFORM_CONFIG[p];
                  if (!config) return null;
                  const PlatformIcon = config.Icon;
                  return (
                    <span 
                      key={p} 
                      className="inline-flex items-center gap-2 text-sm text-white px-4 py-2 rounded-xl font-black shadow-lg hover:shadow-xl transition-all uppercase"
                      style={{
                        background: `linear-gradient(135deg, ${config.color}dd, ${config.color}99)`
                      }}
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
              <span className="font-bold">Drag to reschedule • Click to view/delete</span>
            </div>
          </div>
        </div>,
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
                  <h2 className="text-2xl font-bold text-white">Scheduled Post Details</h2>
                  <p className="text-gray-300 text-sm mt-1">
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
                  className="text-gray-400 hover:text-white transition p-2"
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
                <div className="bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 whitespace-pre-wrap">
                  {selectedEvent.text}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Platforms</label>
                <div className="flex flex-wrap gap-3">
                  {selectedEvent.platforms?.map(platform => (
                    <PlatformChip
                      key={platform}
                      platform={platform}
                      selected={true}
                      size="sm"
                    />
                  ))}
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
                  className="group relative flex-1 bg-red-600/30 backdrop-blur-lg border-2 border-red-400/30 text-white px-6 py-3 rounded-xl hover:bg-red-600/40 font-semibold transition-all shadow-lg hover:shadow-red-500/30 overflow-hidden"
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
