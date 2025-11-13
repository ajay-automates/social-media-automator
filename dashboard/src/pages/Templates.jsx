import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import PlatformChip from '../components/ui/PlatformChip';

const CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: '📋' },
  { id: 'promotional', name: 'Promotional', icon: '🎯' },
  { id: 'educational', name: 'Educational', icon: '📚' },
  { id: 'engagement', name: 'Engagement', icon: '💬' },
  { id: 'announcement', name: 'Announcements', icon: '📢' },
  { id: 'personal', name: 'Personal', icon: '👤' },
  { id: 'seasonal', name: 'Seasonal', icon: '🎄' },
  { id: 'general', name: 'General', icon: '✨' }
];

const AVAILABLE_PLATFORMS = ['linkedin', 'twitter', 'instagram', 'facebook', 'tiktok', 'telegram', 'slack', 'discord', 'reddit', 'youtube'];

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [stats, setStats] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewVariables, setPreviewVariables] = useState({});
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [importing, setImporting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    text: '',
    image_url: '',
    platforms: [],
    category: 'general',
    tags: []
  });

  useEffect(() => {
    fetchTemplates();
    fetchStats();
  }, [selectedCategory, searchQuery]);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sort', 'created_at');
      params.append('order', 'desc');

      const response = await api.get(`/templates?${params}`);
      
      // Handle both response formats:
      // 1. Direct array response: [template1, template2, ...]
      // 2. Object with templates property: { templates: [...], count: X }
      let templates = [];
      if (Array.isArray(response.data)) {
        templates = response.data;
      } else if (response.data && Array.isArray(response.data.templates)) {
        templates = response.data.templates;
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where data is an array but not in the expected format
        templates = response.data;
      }
      
      setTemplates(templates);
      
      // Log for debugging
      console.log('Fetched templates:', templates);
      
    } catch (error) {
      console.error('Error fetching templates:', error);
      const errorMessage = error.response?.data?.error || 
                         error.message || 
                         'Failed to load templates. Please try again.';
      toast.error(errorMessage);
      setTemplates([]); // Ensure templates is always an array
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const response = await api.get('/templates/stats');

      // Handle different response formats
      let statsData = {};
      if (response.data && response.data.stats) {
        // Format: { stats: { ... } }
        statsData = response.data.stats;
      } else if (response.data && typeof response.data === 'object') {
        // Format: { total: X, favorites: Y, ... }
        statsData = response.data;
      }

      // Set default values for all required stats
      setStats({
        total: 0,
        favorites: 0,
        totalUses: 0,
        mostUsed: [],
        categories: {},
        ...statsData
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats on error
      setStats({
        total: 0,
        favorites: 0,
        totalUses: 0,
        mostUsed: [],
        categories: {}
      });

      // Only show error toast if this isn't the initial load
      if (templates.length === 0) {
        toast.error('Failed to load template statistics');
      }
    }
  }

async function handleSaveTemplate() {
  try {
    // Validate required fields
    if (!formData.name?.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!formData.text?.trim()) {
      toast.error('Template content is required');
      return;
    }
    if (!formData.platforms || formData.platforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    // Prepare the data to match backend expectations
    const templateData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      text: formData.text.trim(),
      image_url: formData.imageUrl || null, // Match backend field name
      platforms: formData.platforms,
      category: formData.category || 'general',
      tags: Array.isArray(formData.tags) ? formData.tags : []
    };

    const loadingToast = toast.loading(editingTemplate ? 'Updating template...' : 'Creating template...');

    try {
      let response;
      if (editingTemplate) {
        response = await api.put(`/templates/${editingTemplate.id}`, templateData);
      } else {
        response = await api.post('/templates', templateData);
      }
      
      toast.success(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!', { id: loadingToast });
      setShowModal(false);
      resetForm();
      await Promise.all([fetchTemplates(), fetchStats()]);
    } catch (error) {
      console.error('API Error:', error);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         'Failed to save template. Please try again.';
      toast.error(errorMessage, { id: loadingToast });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error('An unexpected error occurred. Please try again.');
  }
}

  async function handleDeleteTemplate(id) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.delete(`/templates/${id}`);
      toast.success('Template deleted successfully!');
      fetchTemplates();
      fetchStats();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  }

  async function handleDuplicateTemplate(id) {
    try {
      await api.post(`/templates/${id}/duplicate`);
      toast.success('Template duplicated successfully!');
      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  }

  async function handleToggleFavorite(id) {
    try {
      await api.post(`/templates/${id}/favorite`);
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    }
  }

  function handleEditTemplate(template) {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      text: template.text,
      image_url: template.image_url || '',
      platforms: template.platforms,
      category: template.category,
      tags: template.tags || []
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      text: '',
      image_url: '',
      platforms: [],
      category: 'general',
      tags: []
    });
    setEditingTemplate(null);
  }

  function togglePlatform(platform) {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  }

  async function handleExportTemplates() {
    try {
      const response = await api.get('/templates/export?format=json');
      if (response.data.templates) {
        const dataStr = JSON.stringify(response.data.templates, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `templates-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${response.data.templates.length} template(s)`);
      }
    } catch (error) {
      toast.error('Failed to export templates');
      console.error(error);
    }
  }

  async function handleImportTemplates(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      const fileContent = await file.text();
      const templates = JSON.parse(fileContent);

      if (!Array.isArray(templates)) {
        toast.error('Invalid file format. Expected array of templates.');
        return;
      }

      const response = await api.post('/templates/import', { templates });

      if (response.data.success) {
        toast.success(`${response.data.summary.successful} template(s) imported successfully`);
        setShowImportModal(false);
        fetchTemplates();
      } else {
        toast.error(`Import completed with ${response.data.summary.failed} error(s)`);
      }
    } catch (error) {
      toast.error('Failed to import templates. Please ensure the file is valid JSON.');
      console.error(error);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  }

  function handlePreviewTemplate(template) {
    setPreviewTemplate(template);
    setShowPreviewModal(true);
    setPreviewVariables({});
  }

  const filteredTemplates = templates.filter(t => {
    // Filter by favorites
    if (showFavoritesOnly && !t.is_favorite) return false;

    // Filter by selected platforms
    if (selectedPlatformFilter.length > 0) {
      const hasPlatform = selectedPlatformFilter.some(p => t.platforms?.includes(p));
      if (!hasPlatform) return false;
    }

    return true;
  });

  // Sort templates
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortBy === 'use_count') {
      return b.use_count - a.use_count;
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      // created_at (default)
      return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Compute dynamic stats based on filtered/sorted templates
  const computedStats = useMemo(() => {
    return {
      total: sortedTemplates.length,
      favorites: sortedTemplates.filter(t => t.is_favorite).length,
      totalUses: sortedTemplates.reduce((sum, t) => sum + (t.use_count || 0), 0),
      mostUsed: [...sortedTemplates].sort((a, b) => (b.use_count || 0) - (a.use_count || 0)).slice(0, 5)
    };
  }, [sortedTemplates]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 relative">
        <div className="group relative bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-8 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 via-blue-300 to-pink-300 bg-clip-text text-transparent">
              Post Templates
            </h1>
            <p className="text-gray-200 mt-3 text-lg">Save and reuse your best-performing posts</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="group relative bg-gradient-to-br from-blue-600/20 to-blue-900/20 backdrop-blur-2xl border-2 border-blue-400/30 rounded-2xl shadow-2xl shadow-blue-500/20 p-6 hover:scale-105 hover:shadow-blue-500/40 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          <div className="absolute inset-0 bg-blue-500/5 blur-xl"></div>
          <div className="relative">
            <div className="text-4xl font-bold text-blue-300">{computedStats.total}</div>
            <div className="text-sm text-blue-200 mt-2 font-medium">Total Templates</div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 backdrop-blur-2xl border-2 border-yellow-400/30 rounded-2xl shadow-2xl shadow-yellow-500/20 p-6 hover:scale-105 hover:shadow-yellow-500/40 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          <div className="absolute inset-0 bg-yellow-500/5 blur-xl"></div>
          <div className="relative">
            <div className="text-4xl font-bold text-yellow-300">{computedStats.favorites}</div>
            <div className="text-sm text-yellow-200 mt-2 font-medium">Favorites</div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-green-600/20 to-green-900/20 backdrop-blur-2xl border-2 border-green-400/30 rounded-2xl shadow-2xl shadow-green-500/20 p-6 hover:scale-105 hover:shadow-green-500/40 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          <div className="absolute inset-0 bg-green-500/5 blur-xl"></div>
          <div className="relative">
            <div className="text-4xl font-bold text-green-300">{computedStats.totalUses}</div>
            <div className="text-sm text-green-200 mt-2 font-medium">Total Uses</div>
          </div>
        </div>
        <div className="group relative bg-gradient-to-br from-purple-600/20 to-purple-900/20 backdrop-blur-2xl border-2 border-purple-400/30 rounded-2xl shadow-2xl shadow-purple-500/20 p-6 hover:scale-105 hover:shadow-purple-500/40 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          <div className="absolute inset-0 bg-purple-500/5 blur-xl"></div>
          <div className="relative">
            <div className="text-4xl font-bold text-purple-300">
              {computedStats.mostUsed && computedStats.mostUsed.length > 0 ? computedStats.mostUsed[0]?.use_count || 0 : 0}
            </div>
            <div className="text-sm text-purple-200 mt-2 font-medium">Most Used</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="group relative bg-gradient-to-br from-gray-900/40 to-gray-800/40 backdrop-blur-2xl border-2 border-white/20 rounded-2xl shadow-2xl p-6 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-5 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 placeholder:text-gray-400 transition-all shadow-lg"
              />
            </div>

            {/* Create Button */}
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="group/btn relative bg-gradient-to-r from-blue-600/40 to-purple-600/40 backdrop-blur-xl border-2 border-blue-400/40 text-white px-6 py-3 rounded-xl hover:from-blue-600/50 hover:to-purple-600/50 font-semibold whitespace-nowrap transition-all shadow-xl hover:shadow-blue-500/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              <span className="relative">➕ Create Template</span>
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-3 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`group/cat relative px-5 py-2.5 rounded-xl whitespace-nowrap transition-all overflow-hidden font-medium ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-blue-600/40 to-purple-600/40 backdrop-blur-xl border-2 border-blue-400/60 text-white shadow-xl shadow-blue-500/40'
                    : 'bg-gray-800/60 backdrop-blur-lg text-gray-200 hover:bg-gray-700/60 border-2 border-white/20 hover:border-white/30 shadow-lg'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-0 group-hover/cat:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                <span className="relative">{cat.icon} {cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : templates.length === 0 ? (
        <div className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-2xl border-2 border-white/20 rounded-2xl shadow-2xl p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-white mb-3">No templates yet</h3>
            <p className="text-gray-300 mb-6 text-lg">Create your first template to get started!</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="group/btn relative bg-gradient-to-r from-blue-600/40 to-purple-600/40 backdrop-blur-xl border-2 border-blue-400/40 text-white px-8 py-4 rounded-xl hover:from-blue-600/50 hover:to-purple-600/50 font-semibold transition-all shadow-xl hover:shadow-blue-500/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              <span className="relative">Create Your First Template</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTemplates.map(template => (
            <div key={template.id} className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-2xl border-2 border-white/20 rounded-2xl shadow-2xl hover:shadow-purple-500/30 transition-all hover:scale-[1.03] hover:border-purple-400/40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="p-6 relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                    {template.is_public && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-sm border border-blue-400/40 text-blue-200 rounded-full text-xs font-medium">
                        🌐 Public Template
                      </span>
                    )}
                  </div>
                  {template.can_edit && (
                    <button
                      onClick={() => handleToggleFavorite(template.id)}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      {template.is_favorite ? '⭐' : '☆'}
                    </button>
                  )}
                </div>

                {/* Description */}
                {template.description && (
                  <p className="text-sm text-gray-300 mb-3">{template.description}</p>
                )}

                {/* Content Preview */}
                <p className="text-sm text-gray-200 mb-4 line-clamp-3 bg-gray-700/50 p-3 rounded">
                  {template.text}
                </p>

                {/* Platforms */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {template.platforms.map(platform => (
                    <PlatformChip
                      key={platform}
                      platform={platform}
                      size="sm"
                    />
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span>Used {template.use_count} times</span>
                  <span className="px-2 py-1 bg-gray-700/50 backdrop-blur-sm border border-white/10 rounded text-gray-300">{template.category}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {template.can_edit ? (
                    <>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="group/btn relative flex-1 bg-blue-600/20 backdrop-blur-sm border border-blue-400/30 text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-600/30 text-sm font-medium transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative">✏️ Edit</span>
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template.id)}
                        className="group/btn relative flex-1 bg-green-600/20 backdrop-blur-sm border border-green-400/30 text-green-300 px-3 py-2 rounded-lg hover:bg-green-600/30 text-sm font-medium transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative">📋 Duplicate</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="group/btn relative bg-red-600/20 backdrop-blur-sm border border-red-400/30 text-red-300 px-3 py-2 rounded-lg hover:bg-red-600/30 text-sm font-medium transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative">🗑️</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDuplicateTemplate(template.id)}
                      className="group/btn relative flex-1 bg-gradient-to-r from-purple-600/30 to-blue-600/30 backdrop-blur-sm border-2 border-purple-400/40 text-purple-200 px-4 py-2 rounded-lg hover:from-purple-600/40 hover:to-blue-600/40 text-sm font-semibold transition-all overflow-hidden shadow-lg hover:shadow-purple-500/30"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative">✨ Clone to My Templates</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="group relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-2xl border-2 border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            <div className="p-8 relative">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent mb-6">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">Template Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all shadow-lg"
                    placeholder="e.g., Welcome Message"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all shadow-lg"
                    placeholder="Optional description"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">Content *</label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 h-32 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all shadow-lg resize-none"
                    placeholder="Template content... Use {{variable}} for dynamic values"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Use variables like {'{'}{'{'} name {'}'}{'}'},  {'{'}{'{'} date {'}'}{'}'},  {'{'}{'{'} company {'}'}{'}'} 
                  </p>
                </div>

                {/* Platforms */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Platforms *</label>
                  <div className="flex gap-3 flex-wrap">
                    {AVAILABLE_PLATFORMS.map((platform) => (
                      <PlatformChip
                        key={platform}
                        platform={platform}
                        selected={formData.platforms.includes(platform)}
                        onClick={() => togglePlatform(platform)}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all shadow-lg"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(formData.tags) ? formData.tags.join(', ') : ''}
                    onChange={(e) => {
                      const tagsArray = e.target.value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0);
                      setFormData({ ...formData, tags: tagsArray });
                    }}
                    className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all shadow-lg"
                    placeholder="e.g., sales, promotion, engagement"
                  />
                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/50 to-purple-600/50 text-white text-xs px-3 py-1 rounded-full"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = formData.tags.filter((_, i) => i !== idx);
                              setFormData({ ...formData, tags: newTags });
                            }}
                            className="hover:text-red-300 transition"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all shadow-lg"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleSaveTemplate}
                  className="group/btn relative flex-1 bg-gradient-to-r from-blue-600/40 to-purple-600/40 backdrop-blur-xl border-2 border-blue-400/40 text-white px-6 py-3 rounded-xl hover:from-blue-600/50 hover:to-purple-600/50 font-semibold transition-all shadow-xl hover:shadow-blue-500/40 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  <span className="relative">{editingTemplate ? 'Update Template' : 'Create Template'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="group/btn relative flex-1 bg-gray-800/60 backdrop-blur-lg border-2 border-white/20 text-gray-200 px-6 py-3 rounded-xl hover:bg-gray-700/60 font-semibold transition-all shadow-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  <span className="relative">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
