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
import PlatformDistributionChart from '../components/calendar/PlatformDistributionChart';
import AutoFillModal from '../components/calendar/AutoFillModal';
import {
  FaLinkedin,
  FaTwitter,
  FaFilter,
  FaDownload,
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaPlus,
  FaCheckSquare,
  FaMagic
} from 'react-icons/fa';
import '../styles/calendar-blaze.css';

// Platform configuration with colors
const PLATFORM_CONFIG = {
  linkedin: { Icon: FaLinkedin, color: '#0A66C2', name: 'LinkedIn' },
  twitter: { Icon: FaTwitter, color: '#1DA1F2', name: 'X' },
};
const SUPPORTED_PLATFORMS = Object.keys(PLATFORM_CONFIG);

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
      console.log('📅 Loading scheduled posts...');
      const response = await api.get('/posts/scheduled');
      console.log('📅 API Response:', response.data);

      if (response.data && response.data.success) {
        const posts = response.data.posts || [];
        console.log(`📅 Found ${posts.length} scheduled posts`);
        
        const formattedEvents = posts
          .map(post => {
            const supportedPlatforms = (post.platforms || []).filter(platform => SUPPORTED_PLATFORMS.includes(platform));

            if (supportedPlatforms.length === 0) return null;

            // Ensure dates are properly parsed
            const startDate = post.start ? new Date(post.start) : new Date();
            const endDate = post.end ? new Date(post.end) : startDate;

            return {
              ...post,
              platforms: supportedPlatforms,
              start: startDate,
              end: endDate
            };
          })
          .filter(Boolean);

        console.log('📅 Formatted events:', formattedEvents.length);
        setEvents(formattedEvents);
      } else {
        console.warn('📅 API returned non-success response:', response.data);
        setEvents([]);
      }
    } catch (err) {
      console.error('❌ Error loading scheduled posts:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      // Show more detailed error message
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load scheduled posts';
      showError(errorMsg);
      setEvents([]); // Set empty array on error
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
  const [calendarDays, setCalendarDays] = useState(7);
  const [calendarPlatforms, setCalendarPlatforms] = useState(['linkedin', 'twitter']);
  const [calendarNiches, setCalendarNiches] = useState('SaaS, AI, productivity');
  
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  
  // Auto-fill modal state
  const [showAutoFillModal, setShowAutoFillModal] = useState(false);

  useEffect(() => {
    checkBusinessProfile();
    fetchConnectedPlatforms();
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem('calendar_autofill_seen');
    
    // Check if calendar is empty and user hasn't seen auto-fill
    if (!seen && events.length === 0 && !loading && connectedPlatforms.length > 0) {
      setTimeout(() => {
        setShowAutoFillModal(true);
      }, 1000); // Show after 1 second
    }
  }, [events.length, loading, connectedPlatforms.length]);


  const fetchConnectedPlatforms = async () => {
    try {
      const response = await api.get('/accounts');
      const accounts = response.data?.accounts || response.data || [];
      const platforms = [...new Set(accounts.map(acc => acc.platform).filter(Boolean))];
      setConnectedPlatforms(platforms);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      setConnectedPlatforms([]);
    }
  };


  const checkBusinessProfile = async () => {
    try {
      const response = await api.get('/business/profile');
      setHasBusinessProfile(response.data.success && response.data.hasProfile);
    } catch (err) {
      console.error('Error checking business profile:', err);
    }
  };

  // Calculate balanced mix distribution
  const calculateBalancedMix = (platforms) => {
    const distribution = {};
    
    // Priority-based distribution (posts per week)
    const priority = {
      linkedin: 3,      // 3 posts/week (Mon/Wed/Fri)
      twitter: 7,      // Daily posts
    };

    platforms.forEach(platform => {
      distribution[platform] = priority[platform] || 2; // Default: 2 posts/week
    });

    return distribution;
  };

  // Check if current week (next 7 days) already has posts scheduled
  const checkCurrentWeekHasPosts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = addDays(today, 7);
    
    const postsInCurrentWeek = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today && eventDate < nextWeek;
    });
    
    // Consider week "filled" if there are at least 5 posts (threshold)
    return postsInCurrentWeek.length >= 5;
  };

  // Fill My Week - Balanced mix across all connected platforms
  const handleFillWeek = async (connectedPlatforms, weekOffset = 0) => {
    try {
      if (!connectedPlatforms || connectedPlatforms.length === 0) {
        showError('No platforms connected. Please connect platforms first.');
        return;
      }

      setIsGenerating(true);
      
      // Balanced Mix Preset: 2-3 posts per platform over 7 days
      const balancedMix = calculateBalancedMix(connectedPlatforms);
      const totalPosts = Object.values(balancedMix).reduce((sum, count) => sum + count, 0);
      
      const weekLabel = weekOffset === 0 ? 'this week' : 'next week';
      showSuccess(`🎨 Generating ${totalPosts} posts across ${connectedPlatforms.length} platform(s) for ${weekLabel} with balanced distribution...`);

      const requestBody = {
        scheduleMode: 'weekly',
        platforms: connectedPlatforms,
        useBusinessProfile: false, // Can be made configurable later
        preset: 'balanced_mix',
        distribution: balancedMix,
        weekOffset: weekOffset // 0 = current week, 1 = next week
      };

      const response = await api.post('/ai-tools/schedule-now', requestBody);

      if (response.data.success) {
        const successMessage = weekOffset === 0 
          ? `✅ Successfully scheduled ${response.data.scheduled || totalPosts} posts! Your week is ready! 🎉`
          : `✅ Successfully scheduled ${response.data.scheduled || totalPosts} posts for next week! 🎉`;
        showSuccess(successMessage);
        loadScheduledPosts();
      } else {
        showError(response.data.error || 'Failed to schedule posts');
      }
    } catch (err) {
      console.error('Error filling week:', err);
      showError(err.response?.data?.error || 'Failed to fill week');
    } finally {
      setIsGenerating(false);
    }
  };


  // Handle auto-fill modal accept
  const handleAutoFillAccept = async () => {
    localStorage.setItem('calendar_autofill_seen', 'true');
    setShowAutoFillModal(false);
    await handleFillWeek(connectedPlatforms);
  };

  // Handle auto-fill modal close
  const handleAutoFillClose = () => {
    localStorage.setItem('calendar_autofill_seen', 'true');
    setShowAutoFillModal(false);
  };

  // Schedule AI Posts with mode selection and platform selection
  const handleGeneratePosts = async (scheduleMode = 'default', platforms = ['linkedin', 'twitter'], sourceType = 'ai_news', customUrl = null) => {
    try {
      if (!platforms || platforms.length === 0) {
        showError('Please select at least one platform');
        return;
      }

      setIsGenerating(true);
      
      // Weekly: (platforms × 7 days), Daily: 5 posts
      const postCount = scheduleMode === 'weekly' 
        ? platforms.length * 7  // One post per platform per day for 7 days
        : 5;  // Daily: 5 posts total
      const modeLabel = scheduleMode === 'weekly' 
        ? `5 posts today (${postCount} posts)` 
        : scheduleMode === 'today_hourly'
          ? '5 posts today (1 hour apart)'
          : '5 posts for today';
      
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

  const toggleCalendarPlatform = (platform) => {
    setCalendarPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerateContentCalendar = async () => {
    if (calendarPlatforms.length === 0) {
      showError('Please select at least one platform');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post('/content-agent/generate', {
        days: calendarDays,
        platforms: calendarPlatforms,
        niches: calendarNiches.split(',').map(niche => niche.trim()).filter(Boolean)
      });

      if (!response.data.success) {
        showError(response.data.error || 'Failed to generate content calendar');
        return;
      }

      const posts = response.data.posts || [];
      let scheduled = 0;

      for (const post of posts) {
        try {
          await api.post(`/content-agent/approve/${post.id}`);
          scheduled++;
        } catch (error) {
          console.error(`Failed to schedule generated post ${post.id}:`, error);
        }
      }

      showSuccess(`Generated and scheduled ${scheduled}/${posts.length} posts`);
      await loadScheduledPosts();
    } catch (err) {
      console.error('Content calendar generation failed:', err);
      showError(err.response?.data?.error || 'Failed to generate content calendar');
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

      {/* Content Calendar Generator */}
      <div style={{ padding: '0 24px 20px 24px' }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)',
          gap: '20px',
          alignItems: 'end'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#ecfeff',
                color: '#0891b2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FaMagic />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                  Generate Content Calendar
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>
                  Create and schedule a batch of LinkedIn/X posts.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                  Days
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[7, 14, 30].map(days => (
                    <button
                      key={days}
                      onClick={() => setCalendarDays(days)}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: calendarDays === days ? '1px solid #0891b2' : '1px solid #e5e7eb',
                        background: calendarDays === days ? '#ecfeff' : '#fff',
                        color: calendarDays === days ? '#0891b2' : '#374151',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {days}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                  Platforms
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {SUPPORTED_PLATFORMS.map(platform => {
                    const config = PLATFORM_CONFIG[platform];
                    const Icon = config.Icon;
                    const selected = calendarPlatforms.includes(platform);

                    return (
                      <button
                        key={platform}
                        onClick={() => toggleCalendarPlatform(platform)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: selected ? `1px solid ${config.color}` : '1px solid #e5e7eb',
                          background: selected ? '#f8fafc' : '#fff',
                          color: selected ? config.color : '#6b7280',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Icon style={{ fontSize: '13px' }} />
                        {config.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px' }}>
                  Niches
                </label>
                <input
                  type="text"
                  value={calendarNiches}
                  onChange={(e) => setCalendarNiches(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateContentCalendar}
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: 'none',
              background: isGenerating ? '#94a3b8' : '#06b6d4',
              color: '#08111f',
              fontWeight: 800,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaMagic />
            {isGenerating ? 'Generating calendar...' : `Generate ${calendarDays}-Day Calendar`}
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div style={{ paddingBottom: '100px' }}>
        {/* Platform Distribution Chart - Show when there are posts */}
        {!loading && events.length > 0 && viewType === 'week' && (
          <div style={{ padding: '0 24px 16px 24px' }}>
            <PlatformDistributionChart 
              events={events}
              platformConfig={PLATFORM_CONFIG}
            />
          </div>
        )}
        
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

      {/* Auto-Fill Modal */}
      <AutoFillModal
        isOpen={showAutoFillModal}
        onClose={handleAutoFillClose}
        onAccept={handleAutoFillAccept}
        connectedPlatforms={connectedPlatforms}
      />


      {/* Bottom Action Bar */}
      <BottomActionBar
        onCreateClick={() => window.location.href = '/create'}
        onGenerateClick={handleGeneratePosts}
        onImproveClick={() => showSuccess('Improve feature coming soon!')}
        isGenerating={isGenerating}
        hasBusinessProfile={hasBusinessProfile}
        events={events}
        checkCurrentWeekHasPosts={checkCurrentWeekHasPosts}
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
