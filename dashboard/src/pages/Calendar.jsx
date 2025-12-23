import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addWeeks, subWeeks, addDays } from 'date-fns';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import { NoScheduledEmpty } from '../components/ui/EmptyState';
import BlazeWeekView from '../components/calendar/BlazeWeekView';
import CalendarListView from '../components/calendar/CalendarListView';
import PostPreviewModal from '../components/calendar/PostPreviewModal';
import BottomActionBar from '../components/calendar/BottomActionBar';
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
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaPlus,
  FaCheckSquare
} from 'react-icons/fa';
import { SiMastodon, SiBluesky } from 'react-icons/si';
import '../styles/calendar-blaze.css';

// Platform configuration with colors
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

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // View state
  const [viewType, setViewType] = useState('week');
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const allPlatforms = Object.keys(PLATFORM_CONFIG);
  const allStatuses = ['queued', 'scheduled', 'posted', 'failed'];

  useEffect(() => {
    loadScheduledPosts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, searchQuery, selectedPlatforms, selectedStatuses]);

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

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPlatforms([]);
    setSelectedStatuses([]);
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

  // Navigation
  const navigateWeek = (direction) => {
    setCurrentDate(prev => 
      direction > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get week range for display - start from today
  const getWeekRange = () => {
    const start = currentDate; // Start from today
    const end = addDays(start, 6); // 7 days total (today + 6 more days)
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  // Event handlers
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleDeletePost = async (event) => {
    if (!event) return;

    if (!confirm('Are you sure you want to delete this scheduled post?')) {
      return;
    }

    try {
      await api.delete(`/queue/${event.id}`);
      showSuccess('Scheduled post deleted');
      setShowEventModal(false);
      setSelectedEvent(null);
      loadScheduledPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      showError('Failed to delete post');
    }
  };

  const handleClonePost = (event) => {
    const state = {
      clonedCaption: event.text,
      clonedPlatforms: event.platforms || [],
      clonedImageUrl: event.image_url
    };
    window.location.href = `/create?clone=${JSON.stringify(state)}`;
  };

  // Multi-select handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedPostIds(new Set()); // Clear selection when exiting
    }
  };

  const togglePostSelection = (postId) => {
    setSelectedPostIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const selectAllPosts = () => {
    const allIds = new Set(filteredEvents.map(e => e.id));
    setSelectedPostIds(allIds);
  };

  const clearSelection = () => {
    setSelectedPostIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedPostIds.size === 0) return;

    const count = selectedPostIds.size;
    if (!confirm(`Are you sure you want to delete ${count} selected post${count > 1 ? 's' : ''}?`)) {
      return;
    }

    setIsBulkDeleting(true);
    let deleted = 0;
    let failed = 0;

    try {
      // Delete posts one by one (or could batch if API supports it)
      for (const postId of selectedPostIds) {
        try {
          await api.delete(`/queue/${postId}`);
          deleted++;
        } catch (err) {
          console.error(`Failed to delete post ${postId}:`, err);
          failed++;
        }
      }

      if (deleted > 0) {
        showSuccess(`Successfully deleted ${deleted} post${deleted > 1 ? 's' : ''}`);
      }
      if (failed > 0) {
        showError(`Failed to delete ${failed} post${failed > 1 ? 's' : ''}`);
      }

      // Clear selection and refresh
      setSelectedPostIds(new Set());
      setSelectionMode(false);
      loadScheduledPosts();
    } catch (err) {
      console.error('Bulk delete error:', err);
      showError('Failed to delete posts');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Navigate between posts
  const navigatePost = (direction) => {
    if (!selectedEvent || filteredEvents.length === 0) return;

    const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.start) - new Date(b.start));
    const currentIndex = sortedEvents.findIndex(e => e.id === selectedEvent.id);

    if (currentIndex === -1) return;

    let newIndex = currentIndex + direction;

    if (newIndex < 0) newIndex = sortedEvents.length - 1;
    if (newIndex >= sortedEvents.length) newIndex = 0;

    setSelectedEvent(sortedEvents[newIndex]);
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

  // State for generating posts
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);

  useEffect(() => {
    checkBusinessProfile();
  }, []);

  const checkBusinessProfile = async () => {
    try {
      const response = await api.get('/business/profile');
      setHasBusinessProfile(response.data.success && response.data.hasProfile);
    } catch (err) {
      console.error('Error checking business profile:', err);
    }
  };

  // Schedule AI Posts with mode selection and platform selection
  const handleGeneratePosts = async (scheduleMode = 'default', platforms = ['linkedin', 'twitter'], sourceType = 'ai_news', customUrl = null) => {
    try {
      if (!platforms || platforms.length === 0) {
        showError('Please select at least one platform');
        return;
      }

      setIsGenerating(true);
      
      const postCount = scheduleMode === 'weekly' ? 21 : 10;
      const modeLabel = scheduleMode === 'weekly' 
        ? 'weekly calendar (21 posts, 3 per day)' 
        : scheduleMode === 'today_hourly'
          ? '10 posts today (1 hour apart)'
          : '10 posts for tomorrow';
      
      const sourceLabel = sourceType === 'business' 
        ? 'from your business profile' 
        : sourceType === 'custom_url'
          ? `from ${customUrl}`
          : 'AI News posts';
      
      showSuccess(`🎨 Generating ${modeLabel} ${sourceLabel} for ${platforms.length} platform(s) with AI images...`);

      const requestBody = {
        scheduleMode,
        platforms,
        useBusinessProfile: sourceType === 'business',
        url: sourceType === 'custom_url' ? customUrl : undefined
      };

      const response = await api.post('/ai-tools/schedule-now', requestBody);

      if (response.data.success) {
        showSuccess(`✅ Successfully scheduled ${response.data.scheduled || postCount} posts for ${platforms.length} platform(s) with images!`);
        loadScheduledPosts();
      } else {
        showError(response.data.error || 'Failed to schedule posts');
      }
    } catch (err) {
      console.error('Error scheduling posts:', err);
      showError(err.response?.data?.error || 'Failed to schedule posts');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedPlatforms.length +
    selectedStatuses.length;

  return (
    <div className="blaze-calendar">
      {/* Header */}
      <div className="blaze-header">
        <div className="blaze-header-left">
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <FaSearch style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              fontSize: '14px'
            }} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                width: '200px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Calendar Title */}
          <h1 className="blaze-title">Scheduled Posts</h1>

          {/* Navigation - Only show for week view */}
          {viewType === 'week' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="blaze-nav-btn" onClick={() => navigateWeek(-1)}>
                  <FaChevronLeft style={{ fontSize: '12px' }} />
                </button>
                <button className="blaze-today-btn" onClick={goToToday}>
                  Today
                </button>
                <button className="blaze-nav-btn" onClick={() => navigateWeek(1)}>
                  <FaChevronRight style={{ fontSize: '12px' }} />
                </button>
              </div>

              {/* Week Range Display */}
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151',
                minWidth: '180px'
              }}>
                {getWeekRange()}
              </span>
            </>
          )}
        </div>

        <div className="blaze-header-right">
          {/* View Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              className="blaze-dropdown-btn"
              onClick={() => setShowViewDropdown(!showViewDropdown)}
            >
              {viewType === 'week' ? 'Week View' : viewType === 'list' ? 'List View' : 'Day View'}
              <FaChevronDown />
            </button>
            
            {showViewDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: '4px',
                zIndex: 50,
                minWidth: '120px'
              }}>
                {['Week', 'List'].map(v => (
                  <button
                    key={v}
                    onClick={() => {
                      setViewType(v.toLowerCase());
                      setShowViewDropdown(false);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 12px',
                      textAlign: 'left',
                      border: 'none',
                      background: viewType === v.toLowerCase() ? '#f3f4f6' : 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {v} View
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div style={{ position: 'relative' }}>
            <button 
              className="blaze-dropdown-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter style={{ fontSize: '12px' }} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {activeFilterCount}
                </span>
              )}
              <FaChevronDown />
            </button>

            {/* Filter Dropdown */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="blaze-filter-dropdown"
                >
                  {/* Platform Filter */}
                  <div className="blaze-filter-section">
                    <div className="blaze-filter-label">Platforms</div>
                    <div className="blaze-filter-chips">
                      {allPlatforms.slice(0, 8).map(platform => {
                        const config = PLATFORM_CONFIG[platform];
                        const Icon = config.Icon;
                        const isSelected = selectedPlatforms.includes(platform);

                        return (
                          <button
                            key={platform}
                            onClick={() => togglePlatformFilter(platform)}
                            className={`blaze-filter-chip ${isSelected ? 'selected' : ''}`}
                          >
                            <Icon style={{ fontSize: '12px' }} />
                            <span style={{ textTransform: 'capitalize' }}>{platform}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="blaze-filter-section">
                    <div className="blaze-filter-label">Status</div>
                    <div className="blaze-filter-chips">
                      {allStatuses.map(status => {
                        const isSelected = selectedStatuses.includes(status);

                        return (
                          <button
                            key={status}
                            onClick={() => toggleStatusFilter(status)}
                            className={`blaze-filter-chip ${isSelected ? 'selected' : ''}`}
                          >
                            <span style={{ textTransform: 'capitalize' }}>{status}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        marginTop: '8px'
                      }}
                    >
                      Clear All Filters
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Select Posts */}
          <button 
            className="blaze-dropdown-btn"
            onClick={toggleSelectionMode}
            style={{
              background: selectionMode ? '#3b82f6' : undefined,
              color: selectionMode ? 'white' : undefined,
              borderColor: selectionMode ? '#3b82f6' : undefined,
              fontWeight: selectionMode ? '600' : '500'
            }}
            title={selectionMode ? 'Click to exit selection mode' : 'Click to select posts for bulk actions'}
          >
            <FaCheckSquare style={{ fontSize: '14px' }} />
            {selectionMode ? `${selectedPostIds.size} Selected` : 'Select Posts'}
          </button>

          {/* Create New */}
          <button 
            className="blaze-create-btn"
            onClick={() => window.location.href = '/create'}
          >
            <FaPlus style={{ fontSize: '12px' }} />
            Create New
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div style={{ paddingBottom: '100px' }}>
        {loading ? (
          <div className="blaze-loading" style={{ minHeight: '600px' }}>
            <div className="blaze-spinner"></div>
            <p style={{ marginTop: '16px' }}>Loading calendar...</p>
          </div>
        ) : filteredEvents.length === 0 && events.length > 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '400px',
            padding: '48px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
              No Posts Match Filters
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>
              Try adjusting your filters or clearing them
            </p>
            <button
              onClick={clearFilters}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: '48px' }}>
            <NoScheduledEmpty onSchedule={() => window.location.href = '/create'} />
          </div>
        ) : viewType === 'list' ? (
          <div style={{ padding: '24px' }}>
            <CalendarListView
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              platformConfig={PLATFORM_CONFIG}
            />
          </div>
        ) : (
          <BlazeWeekView
            events={filteredEvents}
            currentDate={currentDate}
            onSelectEvent={handleSelectEvent}
            onNavigate={setCurrentDate}
            selectionMode={selectionMode}
            selectedPostIds={selectedPostIds}
            onToggleSelection={togglePostSelection}
          />
        )}
      </div>

      {/* Post Preview Modal */}
      <PostPreviewModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        onDelete={handleDeletePost}
        onClone={handleClonePost}
        onNavigate={navigatePost}
        totalEvents={filteredEvents.length}
      />

      {/* Bottom Action Bar */}
      <BottomActionBar
        onCreateClick={() => window.location.href = '/create'}
        onGenerateClick={handleGeneratePosts}
        onImproveClick={() => showSuccess('Improve feature coming soon!')}
        isGenerating={isGenerating}
        hasBusinessProfile={hasBusinessProfile}
        // Selection props
        selectionMode={selectionMode}
        selectedCount={selectedPostIds.size}
        onToggleSelectionMode={toggleSelectionMode}
        onSelectAll={selectAllPosts}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDelete}
        isBulkDeleting={isBulkDeleting}
        totalPosts={filteredEvents.length}
      />

      {/* Close dropdowns when clicking outside */}
      {(showViewDropdown || showFilters) && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40
          }}
          onClick={() => {
            setShowViewDropdown(false);
            setShowFilters(false);
          }}
        />
      )}
    </div>
  );
}
