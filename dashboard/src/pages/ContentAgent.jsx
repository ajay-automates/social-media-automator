import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaCommentDots,
  FaHeart,
  FaImage,
  FaLink,
  FaMagic,
  FaPaperPlane,
  FaRegComment,
  FaRobot,
  FaRetweet,
  FaShare,
  FaThumbsUp,
  FaTimes,
  FaUpload
} from 'react-icons/fa';
import api from '../lib/api';
import PlatformChip from '../components/ui/PlatformChip';
import { showError, showSuccess } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';

const hookOptions = [
  'This is the AI shift most people are missing.',
  'I think this is bigger than it looks.',
  'Everyone is talking about AI, but this part matters most.',
  'This is a useful signal for builders and creators.',
  'The next wave of AI products will not look like the last one.'
];

const ctaOptions = [
  'Would you use this in your workflow?',
  'What is your take on this?',
  'Follow for more AI and startup breakdowns.',
  'Save this if you are tracking where AI is heading.',
  'What would you build with this?'
];

const cleanArticleText = (value = '') => String(value)
  .replace(/<[^>]*>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const normalizeArticleForStudio = (article) => {
  if (!article) return null;

  const title = cleanArticleText(article.title || article.headline || 'Untitled topic');
  const description = cleanArticleText(article.description || article.summary || article.bulletPoints?.[0] || '');
  const url = article.url || article.link || '';

  return {
    ...article,
    title,
    headline: article.headline || title,
    description,
    summary: article.summary || description,
    url,
    source: article.source || 'AI News'
  };
};

const getDomain = (url = '') => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

const getDisplayName = (user) => {
  const metadata = user?.user_metadata || {};
  return metadata.full_name || metadata.name || metadata.display_name || user?.email?.split('@')[0] || 'Creator';
};

const getInitials = (name = 'Creator') => name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part[0]?.toUpperCase())
  .join('') || 'C';

function ProfileAvatar({ user, size = 'md' }) {
  const name = getDisplayName(user);
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-11 h-11 text-sm';

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${sizeClass} rounded-full object-cover`} />;
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-orange-400 to-cyan-400 text-white flex items-center justify-center font-bold`}>
      {getInitials(name)}
    </div>
  );
}

function MediaPreview({ mediaUrl, mediaType }) {
  if (!mediaUrl) return null;

  if (mediaType === 'video') {
    return (
      <video
        src={mediaUrl}
        controls
        className="mt-4 w-full max-h-72 rounded-lg border border-[#e5e7eb] bg-black object-contain"
      />
    );
  }

  return (
    <img
      src={mediaUrl}
      alt="Attached media"
      className="mt-4 w-full max-h-72 rounded-lg border border-[#e5e7eb] bg-[#f3f2ef] object-cover"
    />
  );
}

function LinkPreview({ article, mediaUrl }) {
  if (mediaUrl) return null;
  if (!article?.url && !article?.title) return null;

  const domain = getDomain(article?.url) || article?.source || 'source';

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f3f2ef]">
      {article?.image ? (
        <img src={article.image} alt={article.title} className="w-full h-36 object-cover bg-[#e5e7eb]" />
      ) : (
        <div className="h-32 bg-white flex items-center justify-center">
          <span className="text-4xl font-bold text-[#4285f4]">{domain.slice(0, 1).toUpperCase()}</span>
        </div>
      )}
      <div className="p-3">
        <p className="text-[13px] font-semibold text-[#1f2937] line-clamp-2">{article?.title}</p>
        <p className="text-xs text-[#6b7280] mt-1">{domain}</p>
      </div>
    </div>
  );
}

function LinkedInPreview({ post, article, user, mediaUrl, mediaType }) {
  const name = getDisplayName(user);

  return (
    <div className="bg-white text-[#191919] rounded-lg border border-[#d6d6d6] overflow-hidden shadow-sm">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <ProfileAvatar user={user} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{name}</p>
            <p className="text-xs text-[#666]">1h • Public</p>
          </div>
        </div>

        <div className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-[#191919]">
          {post || 'Your LinkedIn post preview will appear here.'}
        </div>

        <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} />
        <LinkPreview article={article} mediaUrl={mediaUrl} />
      </div>

      <div className="px-4 pb-2">
        <div className="flex items-center justify-between text-xs text-[#666] border-b border-[#e5e7eb] pb-2">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-[#0a66c2] text-white flex items-center justify-center text-[9px]">👍</span>
            <span>{post ? '12' : '0'}</span>
          </div>
          <span>{post ? '3 comments • 1 repost' : '0 comments'}</span>
        </div>
        <div className="grid grid-cols-4 gap-1 pt-2 text-[#404040]">
          {[
            { icon: FaThumbsUp, label: 'Like' },
            { icon: FaCommentDots, label: 'Comment' },
            { icon: FaRetweet, label: 'Repost' },
            { icon: FaPaperPlane, label: 'Send' }
          ].map(({ icon: Icon, label }) => (
            <button key={label} className="flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold hover:bg-[#f3f2ef]">
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TwitterPreview({ post, article, user, mediaUrl, mediaType }) {
  const name = getDisplayName(user);
  const handle = user?.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15) || 'creator';

  return (
    <div className="bg-black text-white rounded-xl border border-[#2f3336] overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <ProfileAvatar user={user} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <p className="text-sm font-bold truncate">{name}</p>
              <span className="text-[#71767b] text-sm truncate">@{handle} · 1h</span>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">
              {post || 'Your X post preview will appear here.'}
            </div>
            {mediaUrl && (
              mediaType === 'video' ? (
                <video src={mediaUrl} controls className="mt-3 w-full max-h-72 rounded-2xl border border-[#2f3336] bg-black object-contain" />
              ) : (
                <img src={mediaUrl} alt="Attached media" className="mt-3 w-full max-h-72 rounded-2xl border border-[#2f3336] bg-[#16181c] object-cover" />
              )
            )}
            {!mediaUrl && article?.url && (
              <div className="mt-3 rounded-2xl border border-[#2f3336] overflow-hidden">
                {article?.image ? (
                  <img src={article.image} alt={article.title} className="w-full h-36 object-cover bg-[#16181c]" />
                ) : (
                  <div className="h-28 bg-[#16181c] flex items-center justify-center text-[#71767b] text-sm">
                    Link preview
                  </div>
                )}
                <div className="p-3">
                  <p className="text-[#71767b] text-xs">{getDomain(article.url)}</p>
                  <p className="text-sm font-semibold line-clamp-2">{article.title}</p>
                  {article.description && <p className="text-xs text-[#71767b] mt-1 line-clamp-2">{article.description}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 px-14 pb-4 text-[#71767b]">
        {[
          { icon: FaRegComment, label: post ? '8' : '0' },
          { icon: FaRetweet, label: post ? '4' : '0' },
          { icon: FaHeart, label: post ? '31' : '0' },
          { icon: FaShare, label: '' }
        ].map(({ icon: Icon, label }, index) => (
          <button key={index} className="flex items-center gap-2 text-xs hover:text-[#1d9bf0]">
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ContentAgent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [selectedPlatforms, setSelectedPlatforms] = useState(['linkedin', 'twitter']);
  const [studioArticle, setStudioArticle] = useState(() => normalizeArticleForStudio(location.state?.studioArticle));
  const [studioHook, setStudioHook] = useState(hookOptions[0]);
  const [studioCta, setStudioCta] = useState(ctaOptions[0]);
  const [studioStory, setStudioStory] = useState(() => {
    const article = normalizeArticleForStudio(location.state?.studioArticle);
    return location.state?.studioDraft || article?.description || '';
  });
  const [studioGenerating, setStudioGenerating] = useState(false);
  const [studioPosting, setStudioPosting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [urlInstructions, setUrlInstructions] = useState('');
  const [generatingFromUrl, setGeneratingFromUrl] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [schedulingPost, setSchedulingPost] = useState(false);

  useEffect(() => {
    const articleFromRoute = normalizeArticleForStudio(location.state?.studioArticle);
    if (!articleFromRoute) return;

    setStudioArticle(articleFromRoute);
    setStudioStory(location.state?.studioDraft || articleFromRoute.description || '');
    setStudioHook(hookOptions[0]);
    setStudioCta(ctaOptions[0]);
    window.history.replaceState({}, '');
  }, [location.state]);

  const studioPost = studioStory.trim()
    ? [studioHook, studioStory, studioCta]
      .map(part => part?.trim())
      .filter(Boolean)
      .join('\n\n')
    : '';

  const togglePlatform = (platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleGenerateStudioPost = async () => {
    if (!studioArticle) {
      showError('Select a topic from the dashboard news feed first');
      return;
    }

    setStudioGenerating(true);
    try {
      const response = await api.post('/news/generate-posts', {
        article: studioArticle,
        count: 1,
        multipleAngles: false,
        platforms: selectedPlatforms
      });

      const post = response.data?.posts?.[0];
      if (!response.data?.success || !post?.caption) {
        showError(response.data?.error || 'Failed to generate post');
        return;
      }

      setStudioStory(cleanArticleText(post.caption));
      showSuccess('Post draft generated');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to generate post');
    } finally {
      setStudioGenerating(false);
    }
  };

  const handleSaveDraft = () => {
    if (!studioPost.trim()) {
      showError('Generate or write a post first');
      return;
    }

    const drafts = JSON.parse(localStorage.getItem('sma_post_studio_drafts') || '[]');
    drafts.unshift({
      id: Date.now(),
      text: studioPost,
      article: studioArticle,
      platforms: selectedPlatforms,
      mediaUrl,
      mediaType,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('sma_post_studio_drafts', JSON.stringify(drafts.slice(0, 20)));
    showSuccess('Draft saved locally');
  };

  const handlePostStudioNow = async () => {
    if (!studioPost.trim()) {
      showError('Generate or write a post first');
      return;
    }
    if (selectedPlatforms.length === 0) {
      showError('Select at least one platform');
      return;
    }

    setStudioPosting(true);
    try {
      const response = await api.post('/post/now', {
        text: studioPost,
        platforms: selectedPlatforms,
        imageUrl: mediaType === 'image' ? mediaUrl : null,
        videoUrl: mediaType === 'video' ? mediaUrl : null,
        source: studioArticle?.source || 'Post Studio',
        sourceUrl: studioArticle?.url
      });

      if (response.data.success) {
        showSuccess('Posted successfully');
      } else {
        showError(response.data.error || 'Failed to post');
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to post');
    } finally {
      setStudioPosting(false);
    }
  };

  const handleScheduleStudioPost = async () => {
    if (!studioPost.trim()) {
      showError('Generate or write a post first');
      return;
    }
    if (selectedPlatforms.length === 0) {
      showError('Select at least one platform');
      return;
    }
    if (!scheduledDate) {
      showError('Choose a schedule date and time');
      return;
    }

    setSchedulingPost(true);
    try {
      const response = await api.post('/post/schedule', {
        text: studioPost,
        platforms: selectedPlatforms,
        imageUrl: mediaType === 'image' ? mediaUrl : null,
        videoUrl: mediaType === 'video' ? mediaUrl : null,
        scheduleTime: new Date(scheduledDate).toISOString()
      });

      if (response.data.success) {
        showSuccess('Post scheduled');
        navigate('/calendar');
      } else {
        showError(response.data.error || 'Failed to schedule post');
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to schedule post');
    } finally {
      setSchedulingPost(false);
    }
  };

  const handleMediaUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!response.data.success) {
        showError(response.data.error || 'Failed to upload media');
        return;
      }

      const uploadedUrl = response.data.videoUrl || response.data.url || response.data.imageUrl;
      setMediaUrl(uploadedUrl);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      showSuccess('Media attached');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to upload media');
    } finally {
      setUploadingMedia(false);
      event.target.value = '';
    }
  };

  const generateFromUrl = async () => {
    if (!sourceUrl.trim()) {
      showError('Enter a URL first');
      return;
    }

    setGeneratingFromUrl(true);
    try {
      const response = await api.post('/ai/youtube-caption', {
        videoUrl: sourceUrl,
        instructions: urlInstructions,
        platform: selectedPlatforms[0] || 'linkedin'
      });

      const variation = response.data.variations?.[0];
      if (!variation) {
        showError('No post generated from URL');
        return;
      }

      setStudioStory(cleanArticleText(variation));
      setStudioArticle(normalizeArticleForStudio({
        title: sourceUrl,
        description: urlInstructions || variation,
        url: sourceUrl,
        source: getDomain(sourceUrl) || 'URL'
      }));
      showSuccess('Generated post from URL');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to generate from URL');
    } finally {
      setGeneratingFromUrl(false);
    }
  };

  const generateImage = async () => {
    if (!aiImagePrompt.trim()) {
      showError('Enter an image prompt first');
      return;
    }

    setGeneratingImage(true);
    try {
      const response = await api.post('/ai/image/generate', {
        prompt: aiImagePrompt,
        style: 'photographic'
      });

      if (!response.data.imageUrl) {
        showError(response.data.error || 'No image URL returned');
        return;
      }

      setMediaUrl(response.data.imageUrl);
      setMediaType('image');
      showSuccess('AI image attached');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to generate image');
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-6 relative z-10"
      >
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
              <FaRobot className="w-8 h-8 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0a0a0b]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                Post Studio
              </h1>
              <p className="text-[#a1a1aa]">Turn trending AI and tech topics into LinkedIn and X posts</p>
            </div>
          </div>
        </div>

        <section className="bg-[#111113] border border-white/[0.08] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-[#52525b] font-semibold mb-1">Selected topic</p>
              <h2 className="text-lg font-semibold text-white line-clamp-2">
                {studioArticle?.title || 'Choose a topic from the dashboard news feed'}
              </h2>
              {studioArticle?.source && (
                <p className="text-sm text-[#71717a] mt-1">{studioArticle.source}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['linkedin', 'twitter'].map(platform => (
                <PlatformChip
                  key={platform}
                  platform={platform}
                  selected={selectedPlatforms.includes(platform)}
                  onClick={() => togglePlatform(platform)}
                  size="sm"
                />
              ))}
              <button
                onClick={handleGenerateStudioPost}
                disabled={!studioArticle || studioGenerating}
                className="px-4 py-2 bg-[#22d3ee] text-[#0a0a0b] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center gap-2"
              >
                <FaMagic size={13} />
                {studioGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_280px] min-h-[620px]">
            <div className="border-b xl:border-b-0 xl:border-r border-white/[0.06] p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Hooks</h3>
              <div className="space-y-2">
                {hookOptions.map((hook) => (
                  <button
                    key={hook}
                    onClick={() => setStudioHook(hook)}
                    className={`w-full text-left p-3 rounded-lg border text-sm leading-relaxed transition-colors ${
                      studioHook === hook
                        ? 'bg-[#22d3ee]/10 border-[#22d3ee]/30 text-[#22d3ee]'
                        : 'bg-[#18181b] border-white/[0.06] text-[#a1a1aa] hover:text-white hover:border-white/[0.14]'
                    }`}
                  >
                    {hook}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {studioArticle?.description && (
                <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wider text-[#52525b] font-semibold mb-2">Context</p>
                  <p className="text-sm text-[#a1a1aa] leading-relaxed line-clamp-3">{studioArticle.description}</p>
                  {studioArticle.url && (
                    <a
                      href={studioArticle.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex mt-3 text-xs text-[#22d3ee] hover:text-[#06b6d4]"
                    >
                      Open source
                    </a>
                  )}
                </div>
              )}

              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Post Draft</h3>
                  <span className="text-xs text-[#52525b]">{studioPost.length} characters</span>
                </div>
                <textarea
                  value={studioStory}
                  onChange={(e) => setStudioStory(e.target.value)}
                  placeholder="Select a topic and generate a post draft..."
                  className="flex-1 min-h-[330px] w-full resize-none bg-[#0d0d0f] border border-white/[0.08] rounded-lg p-4 text-white text-sm leading-relaxed placeholder-[#52525b] focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Media</p>
                      <p className="text-xs text-[#71717a] mt-1">Upload media or generate an image.</p>
                    </div>
                    {mediaUrl && (
                      <button
                        onClick={() => { setMediaUrl(''); setMediaType(null); }}
                        className="p-2 rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/[0.06]"
                        title="Remove media"
                      >
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 bg-white/[0.06] border border-white/[0.08] text-white rounded-lg hover:bg-white/[0.1] cursor-pointer text-sm font-medium">
                      <FaUpload size={12} />
                      {uploadingMedia ? 'Uploading...' : 'Upload'}
                      <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" disabled={uploadingMedia} />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={aiImagePrompt}
                      onChange={(e) => setAiImagePrompt(e.target.value)}
                      placeholder="Image prompt..."
                      className="flex-1 min-w-0 px-3 py-2 bg-[#18181b] border border-white/[0.06] rounded-lg text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#22d3ee]/40"
                    />
                    <button
                      onClick={generateImage}
                      disabled={generatingImage || !aiImagePrompt.trim()}
                      className="px-3 py-2 bg-[#22d3ee] text-[#0a0a0b] rounded-lg disabled:opacity-50 text-sm font-semibold flex items-center gap-2"
                    >
                      <FaImage size={12} />
                      {generatingImage ? 'Generating...' : 'AI Image'}
                    </button>
                  </div>

                  {mediaUrl && (
                    <div className="rounded-lg overflow-hidden border border-white/[0.06] bg-[#18181b]">
                      {mediaType === 'video'
                        ? <video src={mediaUrl} controls className="w-full max-h-52 object-contain bg-black" />
                        : <img src={mediaUrl} alt="Attached media" className="w-full max-h-52 object-cover" />}
                    </div>
                  )}
                </div>

                <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Generate from URL</p>
                    <p className="text-xs text-[#71717a] mt-1">Paste an article, launch page, or video URL.</p>
                  </div>
                  <input
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full px-3 py-2 bg-[#18181b] border border-white/[0.06] rounded-lg text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-[#22d3ee]/40"
                  />
                  <textarea
                    value={urlInstructions}
                    onChange={(e) => setUrlInstructions(e.target.value)}
                    placeholder="Optional instructions..."
                    rows={3}
                    className="w-full px-3 py-2 bg-[#18181b] border border-white/[0.06] rounded-lg text-sm text-white placeholder-[#52525b] resize-none focus:outline-none focus:border-[#22d3ee]/40"
                  />
                  <button
                    onClick={generateFromUrl}
                    disabled={generatingFromUrl || !sourceUrl.trim()}
                    className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.08] text-white rounded-lg hover:bg-white/[0.1] disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FaLink size={12} />
                    {generatingFromUrl ? 'Generating...' : 'Generate from URL'}
                  </button>
                </div>
              </div>

              <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-lg p-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#52525b] font-semibold">Preview</p>
                    <p className="text-xs text-[#71717a] mt-1">See how this post will look before publishing.</p>
                  </div>
                  <div className="flex gap-1.5">
                    {selectedPlatforms.map(platform => (
                      <span key={platform} className="px-2 py-1 rounded-md bg-white/[0.06] text-[11px] text-[#d4d4d8] capitalize">
                        {platform === 'twitter' ? 'X' : platform}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedPlatforms.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-white/[0.12] p-6 text-sm text-[#71717a] text-center">
                    Select LinkedIn, X, or both to see platform previews.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                    {selectedPlatforms.includes('linkedin') && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-5 h-5 rounded bg-[#0a66c2] text-white text-xs font-bold flex items-center justify-center">in</span>
                          <h4 className="text-sm font-semibold text-white">LinkedIn Preview</h4>
                        </div>
                        <LinkedInPreview post={studioPost} article={studioArticle} user={user} mediaUrl={mediaUrl} mediaType={mediaType} />
                      </div>
                    )}

                    {selectedPlatforms.includes('twitter') && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-5 h-5 rounded bg-white text-black text-xs font-bold flex items-center justify-center">X</span>
                          <h4 className="text-sm font-semibold text-white">X Preview</h4>
                        </div>
                        <TwitterPreview post={studioPost} article={studioArticle} user={user} mediaUrl={mediaUrl} mediaType={mediaType} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={!studioPost.trim()}
                  className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] text-white rounded-lg hover:bg-white/[0.1] transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  Save Draft
                </button>
                <button
                  onClick={handleScheduleStudioPost}
                  disabled={!studioPost.trim() || schedulingPost}
                  className="px-4 py-2 bg-white/[0.06] border border-white/[0.08] text-white rounded-lg hover:bg-white/[0.1] transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {schedulingPost ? 'Scheduling...' : 'Schedule'}
                </button>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="px-3 py-2 bg-[#0d0d0f] border border-white/[0.08] text-white rounded-lg text-sm focus:outline-none focus:border-[#22d3ee]/40"
                />
                <button
                  onClick={handlePostStudioNow}
                  disabled={!studioPost.trim() || studioPosting}
                  className="px-4 py-2 bg-[#22d3ee] text-[#0a0a0b] rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold"
                >
                  {studioPosting ? 'Posting...' : 'Post Now'}
                </button>
              </div>
            </div>

            <div className="border-t xl:border-t-0 xl:border-l border-white/[0.06] p-4">
              <h3 className="text-sm font-semibold text-white mb-3">CTAs</h3>
              <div className="space-y-2">
                {ctaOptions.map((cta) => (
                  <button
                    key={cta}
                    onClick={() => setStudioCta(cta)}
                    className={`w-full text-left p-3 rounded-lg border text-sm leading-relaxed transition-colors ${
                      studioCta === cta
                        ? 'bg-[#22d3ee]/10 border-[#22d3ee]/30 text-[#22d3ee]'
                        : 'bg-[#18181b] border-white/[0.06] text-[#a1a1aa] hover:text-white hover:border-white/[0.14]'
                    }`}
                  >
                    {cta}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
