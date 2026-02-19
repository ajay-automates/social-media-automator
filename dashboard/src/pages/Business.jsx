import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import { DashboardSkeleton } from '../components/ui/LoadingStates';

const BUSINESS_TYPES = [
  { value: 'company', label: 'Company', icon: '🏢' },
  { value: 'personal_brand', label: 'Personal Brand', icon: '👤' },
  { value: 'agency', label: 'Agency', icon: '🎯' },
  { value: 'nonprofit', label: 'Nonprofit', icon: '❤️' },
  { value: 'other', label: 'Other', icon: '📌' }
];

const INDUSTRIES = [
  'saas', 'ecommerce', 'services', 'consulting', 'retail', 
  'healthcare', 'education', 'technology', 'finance', 'real_estate', 'other'
];

const BRAND_VOICES = [
  { value: 'professional', label: 'Professional', desc: 'Formal and business-focused' },
  { value: 'casual', label: 'Casual', desc: 'Relaxed and friendly' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
  { value: 'technical', label: 'Technical', desc: 'Detailed and expert' },
  { value: 'inspirational', label: 'Inspirational', desc: 'Motivational and uplifting' },
  { value: 'humorous', label: 'Humorous', desc: 'Fun and lighthearted' }
];

const CONTENT_THEMES = [
  { value: 'product_updates', label: 'Product Updates', icon: '🚀' },
  { value: 'industry_news', label: 'Industry News', icon: '📰' },
  { value: 'tips', label: 'Tips & Tutorials', icon: '💡' },
  { value: 'behind_scenes', label: 'Behind the Scenes', icon: '🎬' },
  { value: 'customer_stories', label: 'Customer Stories', icon: '👥' },
  { value: 'team_spotlight', label: 'Team Spotlight', icon: '⭐' }
];

export default function Business() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [autofillUrl, setAutofillUrl] = useState('');
  const [autofilledFields, setAutofilledFields] = useState([]);
  const [activeSection, setActiveSection] = useState('basic');
  
  const [formData, setFormData] = useState({
    // Basic Information
    business_name: '',
    business_type: 'company',
    industry: '',
    description: '',
    
    // Contact Information
    website_url: '',
    email: '',
    phone: '',
    
    // Social Links
    linkedin_url: '',
    twitter_handle: '',
    youtube_url: '',
    tiktok_handle: '',
    
    // Business Details
    tagline: '',
    value_proposition: '',
    target_audience: '',
    key_products_services: [],
    key_features_benefits: [],
    
    // Content Preferences
    content_themes: [],
    brand_voice: 'professional',
    tone_description: '',
    
    // Visual Assets
    logo_url: '',
    brand_colors: [],
    
    // Content Generation Settings
    auto_include_cta: true,
    cta_text: 'Learn more',
    preferred_hashtags: [],
    avoid_words: []
  });

  const [productServiceInput, setProductServiceInput] = useState('');
  const [featureBenefitInput, setFeatureBenefitInput] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [avoidWordInput, setAvoidWordInput] = useState('');
  const [colorInput, setColorInput] = useState('#3B82F6');

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/business/profile');
      
      if (response.data.success && response.data.profile) {
        const profile = response.data.profile;
        setFormData({
          business_name: profile.business_name || '',
          business_type: profile.business_type || 'company',
          industry: profile.industry || '',
          description: profile.description || '',
          website_url: profile.website_url || '',
          email: profile.email || '',
          phone: profile.phone || '',
          linkedin_url: profile.linkedin_url || '',
          twitter_handle: profile.twitter_handle || '',
          youtube_url: profile.youtube_url || '',
          tiktok_handle: profile.tiktok_handle || '',
          tagline: profile.tagline || '',
          value_proposition: profile.value_proposition || '',
          target_audience: profile.target_audience || '',
          key_products_services: profile.key_products_services || [],
          key_features_benefits: profile.key_features_benefits || [],
          content_themes: profile.content_themes || [],
          brand_voice: profile.brand_voice || 'professional',
          tone_description: profile.tone_description || '',
          logo_url: profile.logo_url || '',
          brand_colors: profile.brand_colors || [],
          auto_include_cta: profile.auto_include_cta !== undefined ? profile.auto_include_cta : true,
          cta_text: profile.cta_text || 'Learn more',
          preferred_hashtags: profile.preferred_hashtags || [],
          avoid_words: profile.avoid_words || []
        });
      }
    } catch (err) {
      console.error('Error loading business profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.business_name.trim()) {
      showError('Business name is required');
      return;
    }

    setSaving(true);
    try {
      await api.post('/business/profile', formData);
      showSuccess('Business profile saved successfully!');
    } catch (err) {
      console.error('Error saving business profile:', err);
      showError(err.response?.data?.error || 'Failed to save business profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAutofill = async () => {
    if (!autofillUrl.trim()) {
      showError('Please enter a website URL');
      return;
    }

    setAutofilling(true);
    try {
      const response = await api.post('/business/autofill', {
        websiteUrl: autofillUrl.trim()
      });

      if (response.data.success && response.data.data) {
        const extractedData = response.data.data;
        const extractedFields = response.data.extractedFields || [];

        // Helper function to merge field (only if existing is empty)
        const mergeField = (existing, extracted, defaultValue = '') => {
          if (existing && existing !== defaultValue && existing !== '') {
            return existing;
          }
          return extracted || defaultValue;
        };

        // Helper function to merge arrays (only if existing is empty)
        const mergeArray = (existing, extracted) => {
          if (existing && Array.isArray(existing) && existing.length > 0) {
            return existing;
          }
          return (extracted && Array.isArray(extracted) && extracted.length > 0) ? extracted : [];
        };

        // Merge extracted data with existing form data (don't overwrite existing non-empty fields)
        const mergedData = {
          ...formData,
          // Only update fields that were extracted and are currently empty
          business_name: mergeField(formData.business_name, extractedData.business_name),
          business_type: mergeField(formData.business_type, extractedData.business_type, 'company'),
          industry: mergeField(formData.industry, extractedData.industry),
          description: mergeField(formData.description, extractedData.description),
          website_url: mergeField(formData.website_url, extractedData.website_url),
          email: mergeField(formData.email, extractedData.email),
          phone: mergeField(formData.phone, extractedData.phone),
          linkedin_url: mergeField(formData.linkedin_url, extractedData.linkedin_url),
          twitter_handle: mergeField(formData.twitter_handle, extractedData.twitter_handle),
          youtube_url: mergeField(formData.youtube_url, extractedData.youtube_url),
          tiktok_handle: mergeField(formData.tiktok_handle, extractedData.tiktok_handle),
          tagline: mergeField(formData.tagline, extractedData.tagline),
          value_proposition: mergeField(formData.value_proposition, extractedData.value_proposition),
          target_audience: mergeField(formData.target_audience, extractedData.target_audience),
          key_products_services: mergeArray(formData.key_products_services, extractedData.key_products_services),
          key_features_benefits: mergeArray(formData.key_features_benefits, extractedData.key_features_benefits),
          content_themes: mergeArray(formData.content_themes, extractedData.content_themes),
          brand_voice: mergeField(formData.brand_voice, extractedData.brand_voice, 'professional'),
          tone_description: mergeField(formData.tone_description, extractedData.tone_description),
          logo_url: mergeField(formData.logo_url, extractedData.logo_url)
        };

        // Track which fields were actually filled (not already had values)
        const newlyFilled = [];
        Object.keys(extractedData).forEach(key => {
          if (extractedData[key] && (!formData[key] || (Array.isArray(formData[key]) && formData[key].length === 0))) {
            newlyFilled.push(key);
          }
        });

        setFormData(mergedData);
        setAutofilledFields(newlyFilled);
        setAutofillUrl('');
        showSuccess(`✅ Auto-filled ${newlyFilled.length} fields from website! Review and update any missing information.`);
        
        // Clear autofilled indicator after 5 seconds
        setTimeout(() => setAutofilledFields([]), 5000);
      }
    } catch (err) {
      console.error('Error auto-filling business profile:', err);
      const errorMsg = err.response?.data?.error || 'Failed to extract data from website';
      showError(errorMsg);
    } finally {
      setAutofilling(false);
    }
  };

  const addProductService = () => {
    if (productServiceInput.trim()) {
      setFormData({
        ...formData,
        key_products_services: [...formData.key_products_services, productServiceInput.trim()]
      });
      setProductServiceInput('');
    }
  };

  const removeProductService = (index) => {
    setFormData({
      ...formData,
      key_products_services: formData.key_products_services.filter((_, i) => i !== index)
    });
  };

  const addFeatureBenefit = () => {
    if (featureBenefitInput.trim()) {
      setFormData({
        ...formData,
        key_features_benefits: [...formData.key_features_benefits, featureBenefitInput.trim()]
      });
      setFeatureBenefitInput('');
    }
  };

  const removeFeatureBenefit = (index) => {
    setFormData({
      ...formData,
      key_features_benefits: formData.key_features_benefits.filter((_, i) => i !== index)
    });
  };

  const toggleContentTheme = (theme) => {
    setFormData({
      ...formData,
      content_themes: formData.content_themes.includes(theme)
        ? formData.content_themes.filter(t => t !== theme)
        : [...formData.content_themes, theme]
    });
  };

  const addHashtag = () => {
    const hashtag = hashtagInput.trim().replace('#', '');
    if (hashtag && !formData.preferred_hashtags.includes(`#${hashtag}`)) {
      setFormData({
        ...formData,
        preferred_hashtags: [...formData.preferred_hashtags, `#${hashtag}`]
      });
      setHashtagInput('');
    }
  };

  const removeHashtag = (index) => {
    setFormData({
      ...formData,
      preferred_hashtags: formData.preferred_hashtags.filter((_, i) => i !== index)
    });
  };

  const addAvoidWord = () => {
    if (avoidWordInput.trim() && !formData.avoid_words.includes(avoidWordInput.trim())) {
      setFormData({
        ...formData,
        avoid_words: [...formData.avoid_words, avoidWordInput.trim()]
      });
      setAvoidWordInput('');
    }
  };

  const removeAvoidWord = (index) => {
    setFormData({
      ...formData,
      avoid_words: formData.avoid_words.filter((_, i) => i !== index)
    });
  };

  const addBrandColor = () => {
    if (colorInput && !formData.brand_colors.includes(colorInput)) {
      setFormData({
        ...formData,
        brand_colors: [...formData.brand_colors, colorInput]
      });
    }
  };

  const removeBrandColor = (index) => {
    setFormData({
      ...formData,
      brand_colors: formData.brand_colors.filter((_, i) => i !== index)
    });
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: '📋' },
    { id: 'contact', label: 'Contact & Links', icon: '🔗' },
    { id: 'details', label: 'Business Details', icon: '💼' },
    { id: 'content', label: 'Content Preferences', icon: '🎨' },
    { id: 'settings', label: 'Generation Settings', icon: '⚙️' }
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Business Profile</h1>
        <p className="text-gray-300">Set up your business information for personalized AI content generation</p>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeSection === section.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <span className="mr-2">{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      {/* Form Sections */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg p-6 mb-6"
      >
        {/* Basic Information */}
        {activeSection === 'basic' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Basic Information</h2>
            </div>

            {/* Auto-fill from Website */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 rounded-xl p-5 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">✨</span>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Auto-fill from Website</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Enter your company website URL and we'll automatically extract business information using AI
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={autofillUrl}
                      onChange={(e) => setAutofillUrl(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAutofill()}
                      placeholder="https://yourcompany.com"
                      className="flex-1 bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                      disabled={autofilling}
                    />
                    <button
                      onClick={handleAutofill}
                      disabled={autofilling || !autofillUrl.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {autofilling ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <span>🔍</span>
                          <span>Auto-fill</span>
                        </>
                      )}
                    </button>
                  </div>
                  {formData.website_url && (
                    <p className="text-xs text-gray-400 mt-2">
                      Current website: {formData.website_url}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Business Name <span className="text-red-400">*</span>
                {autofilledFields.includes('business_name') && (
                  <span className="ml-2 text-xs text-green-400">✨ Auto-filled</span>
                )}
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className={`w-full bg-gray-800/60 backdrop-blur-lg border-2 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all ${
                  autofilledFields.includes('business_name') 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : 'border-gray-600/50'
                }`}
                placeholder="Your Company Name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Business Type</label>
                <select
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                >
                  {BUSINESS_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Industry</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                >
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map(industry => (
                    <option key={industry} value={industry}>
                      {industry.charAt(0).toUpperCase() + industry.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all resize-none"
                placeholder="Describe what your business does..."
              />
            </div>
          </div>
        )}

        {/* Contact & Links */}
        {activeSection === 'contact' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Contact & Social Links</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Website URL</label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                  placeholder="contact@yourbusiness.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Social Media Handles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">LinkedIn URL</label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">Twitter Handle</label>
                  <input
                    type="text"
                    value={formData.twitter_handle}
                    onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value.replace('@', '') })}
                    className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                    placeholder="@yourhandle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">YouTube URL</label>
                  <input
                    type="url"
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">TikTok Handle</label>
                  <input
                    type="text"
                    value={formData.tiktok_handle}
                    onChange={(e) => setFormData({ ...formData, tiktok_handle: e.target.value.replace('@', '') })}
                    className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                    placeholder="@yourhandle"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Business Details */}
        {activeSection === 'details' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Business Details</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                placeholder="Your catchy tagline or slogan"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Value Proposition</label>
              <textarea
                value={formData.value_proposition}
                onChange={(e) => setFormData({ ...formData, value_proposition: e.target.value })}
                rows={3}
                className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all resize-none"
                placeholder="What makes your business unique?"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Target Audience</label>
              <textarea
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                rows={2}
                className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all resize-none"
                placeholder="Who do you serve? (e.g., Small business owners, Tech startups, etc.)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Key Products/Services</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={productServiceInput}
                  onChange={(e) => setProductServiceInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addProductService()}
                  className="flex-1 bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-2 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                  placeholder="Add a product or service"
                />
                <button
                  onClick={addProductService}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.key_products_services.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 text-blue-300 rounded-lg text-sm"
                  >
                    {item}
                    <button
                      onClick={() => removeProductService(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Key Features/Benefits</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={featureBenefitInput}
                  onChange={(e) => setFeatureBenefitInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addFeatureBenefit()}
                  className="flex-1 bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-2 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                  placeholder="Add a key feature or benefit"
                />
                <button
                  onClick={addFeatureBenefit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.key_features_benefits.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600/20 text-purple-300 rounded-lg text-sm"
                  >
                    {item}
                    <button
                      onClick={() => removeFeatureBenefit(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content Preferences */}
        {activeSection === 'content' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Content Preferences</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Content Themes</label>
              <p className="text-sm text-gray-400 mb-4">Select the types of content you want to post about</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CONTENT_THEMES.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => toggleContentTheme(theme.value)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      formData.content_themes.includes(theme.value)
                        ? 'border-blue-500 bg-blue-600/20 text-white'
                        : 'border-gray-600 bg-gray-800/40 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className="text-xl mr-2">{theme.icon}</span>
                    <span className="text-sm font-medium">{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Brand Voice</label>
              <select
                value={formData.brand_voice}
                onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
                className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
              >
                {BRAND_VOICES.map(voice => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label} - {voice.desc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Tone Description</label>
              <textarea
                value={formData.tone_description}
                onChange={(e) => setFormData({ ...formData, tone_description: e.target.value })}
                rows={3}
                className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all resize-none"
                placeholder="Describe your brand's tone in more detail (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Brand Colors</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="color"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="w-16 h-10 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className="flex-1 bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-2 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                  placeholder="#3B82F6"
                />
                <button
                  onClick={addBrandColor}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.brand_colors.map((color, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm"
                    style={{ backgroundColor: color + '20', border: `1px solid ${color}` }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-white">{color}</span>
                    <button
                      onClick={() => removeBrandColor(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generation Settings */}
        {activeSection === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Content Generation Settings</h2>
            
            <div className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl">
              <div>
                <h3 className="font-semibold text-white mb-1">Auto-include Call-to-Action</h3>
                <p className="text-sm text-gray-400">Automatically add a CTA to generated posts</p>
              </div>
              <button
                onClick={() => setFormData({ ...formData, auto_include_cta: !formData.auto_include_cta })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  formData.auto_include_cta ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                    formData.auto_include_cta ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {formData.auto_include_cta && (
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">CTA Text</label>
                <input
                  type="text"
                  value={formData.cta_text}
                  onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  className="w-full bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                  placeholder="Learn more"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Preferred Hashtags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addHashtag()}
                  className="flex-1 bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-2 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                  placeholder="Add hashtag (with or without #)"
                />
                <button
                  onClick={addHashtag}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.preferred_hashtags.map((hashtag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-600/20 text-green-300 rounded-lg text-sm"
                  >
                    {hashtag}
                    <button
                      onClick={() => removeHashtag(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">Words to Avoid</label>
              <p className="text-sm text-gray-400 mb-2">Words or phrases that should never appear in generated content</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={avoidWordInput}
                  onChange={(e) => setAvoidWordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAvoidWord()}
                  className="flex-1 bg-gray-800/60 backdrop-blur-lg border-2 border-gray-600/50 text-white rounded-xl px-4 py-2 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-400/50 transition-all"
                  placeholder="Add word or phrase to avoid"
                />
                <button
                  onClick={addAvoidWord}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.avoid_words.map((word, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/20 text-red-300 rounded-lg text-sm"
                  >
                    {word}
                    <button
                      onClick={() => removeAvoidWord(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleSave}
          disabled={saving || !formData.business_name.trim()}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {saving ? 'Saving...' : 'Save Business Profile'}
        </button>
      </div>
    </div>
  );
}

