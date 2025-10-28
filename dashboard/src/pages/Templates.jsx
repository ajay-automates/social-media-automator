import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

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

const PLATFORM_ICONS = {
  linkedin: { icon: '💼', color: 'bg-blue-100 text-blue-600' },
  twitter: { icon: '🐦', color: 'bg-sky-100 text-sky-600' },
  telegram: { icon: '✈️', color: 'bg-blue-100 text-blue-600' },
  instagram: { icon: '📸', color: 'bg-pink-100 text-pink-600' }
};

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [stats, setStats] = useState(null);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Post Templates</h1>
        <p className="text-gray-600 mt-2">Save and reuse your best-performing posts</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total Templates</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-yellow-600">{stats.favorites}</div>
            <div className="text-sm text-gray-600 mt-1">Favorites</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">{stats.totalUses}</div>
            <div className="text-sm text-gray-600 mt-1">Total Uses</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600">
              {stats.mostUsed && stats.mostUsed.length > 0 ? stats.mostUsed[0]?.use_count || 0 : 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Most Used</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Create Button */}
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap"
          >
            ➕ Create Template
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-6">Create your first template to get started!</p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{template.name}</h3>
                  <button
                    onClick={() => handleToggleFavorite(template.id)}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    {template.is_favorite ? '⭐' : '☆'}
                  </button>
                </div>

                {/* Description */}
                {template.description && (
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                )}

                {/* Content Preview */}
                <p className="text-sm text-gray-700 mb-4 line-clamp-3 bg-gray-50 p-3 rounded">
                  {template.text}
                </p>

                {/* Platforms */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  {template.platforms.map(platform => {
                    const config = PLATFORM_ICONS[platform] || { icon: '📱', color: 'bg-gray-100 text-gray-600' };
                    return (
                      <span
                        key={platform}
                        className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}
                      >
                        {config.icon} {platform}
                      </span>
                    );
                  })}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Used {template.use_count} times</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">{template.category}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100 text-sm font-medium"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(template.id)}
                    className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded hover:bg-green-100 text-sm font-medium"
                  >
                    📋 Duplicate
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 text-sm font-medium"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">Template Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g., Welcome Message"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Optional description"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium mb-1">Content *</label>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 h-32"
                    placeholder="Template content... Use {{variable}} for dynamic values"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Use variables like {'{'}{'{'} name {'}'}{'}'},  {'{'}{'{'} date {'}'}{'}'},  {'{'}{'{'} company {'}'}{'}'} 
                  </p>
                </div>

                {/* Platforms */}
                <div>
                  <label className="block text-sm font-medium mb-2">Platforms *</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(PLATFORM_ICONS).map(([platform, config]) => (
                      <button
                        key={platform}
                        onClick={() => togglePlatform(platform)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          formData.platforms.includes(platform)
                            ? 'border-blue-600 bg-blue-50 text-blue-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {config.icon} {platform}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
