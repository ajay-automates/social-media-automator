import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaCommentDots,
  FaCheck,
  FaHeart,
  FaImage,
  FaLinkedin,
  FaMagic,
  FaPaperPlane,
  FaRegComment,
  FaRobot,
  FaRetweet,
  FaShare,
  FaThumbsUp,
  FaTwitter,
  FaUpload
} from 'react-icons/fa';
import api from '../lib/api';
import { showError, showSuccess } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';

const HOOK_LIBRARY = [
  {
    id: 'ai',
    label: 'AI',
    items: [
      'This is the AI shift most people are missing.',
      'Everyone is talking about AI, but this part matters most.',
      'The next wave of AI products will not look like the last one.',
      'This AI trend looks small on the surface, but it changes the game underneath.',
      'If you are building with AI right now, this is worth paying attention to.',
      'Most people are reacting to the AI headline. Builders should study the behavior behind it.'
    ]
  },
  {
    id: 'viral',
    label: 'Viral',
    items: [
      'I think this is bigger than it looks.',
      'This is going to spread faster than people expect.',
      'There is a reason this topic is taking over timelines right now.',
      'This feels like one of those moments people reference six months from now.',
      'You can tell this one hit a nerve for a reason.',
      'This is the kind of post people share because it signals where things are heading.'
    ]
  },
  {
    id: 'contrarian',
    label: 'Contrarian',
    items: [
      'Unpopular opinion: the obvious takeaway is not the important one.',
      'I think most people are reading this the wrong way.',
      'Hot take: this matters less for consumers and more for operators.',
      'The loudest angle is not the most useful angle here.',
      'The real opportunity is hiding behind the popular narrative.',
      'I would bet against the common reaction to this story.'
    ]
  },
  {
    id: 'builder',
    label: 'Builder',
    items: [
      'Builders should be paying close attention to this.',
      'If you are shipping product right now, there is a lesson in this.',
      'This is a useful signal for founders, creators, and operators.',
      'Here is what I would steal from this if I were building today.',
      'This tells me where smart teams are going to focus next.',
      'There is a practical product lesson buried in this update.'
    ]
  },
  {
    id: 'story',
    label: 'Story',
    items: [
      'A year ago this would have sounded unrealistic. Now it is normal.',
      'This is one of those updates that quietly resets expectations.',
      'Small headline, big implication.',
      'This says a lot about where the market is moving next.',
      'I keep coming back to one thing about this story.',
      'This is the kind of shift that looks obvious only in hindsight.'
    ]
  }
];

const CTA_LIBRARY = [
  {
    id: 'engagement',
    label: 'Engage',
    items: [
      'What is your take on this?',
      'Would you use this in your workflow?',
      'Do you think this changes how people build?',
      'Curious how you see this playing out.',
      'What part of this stands out most to you?',
      'Agree or disagree?'
    ]
  },
  {
    id: 'creator',
    label: 'Creator',
    items: [
      'What would you build with this?',
      'How would you turn this into content or product?',
      'If you had to ship around this trend, where would you start?',
      'What kind of creator wins if this keeps growing?',
      'How would you package this insight into a useful offer?',
      'What would your first experiment be here?'
    ]
  },
  {
    id: 'viral',
    label: 'Viral',
    items: [
      'Save this if you are tracking where AI is heading.',
      'Send this to someone building in AI right now.',
      'Bookmark this one because it will age interestingly.',
      'Worth sharing with anyone watching the AI market closely.',
      'Keep this on your radar for the next few weeks.',
      'This is one to revisit when the next update drops.'
    ]
  },
  {
    id: 'follow',
    label: 'Follow',
    items: [
      'Follow for more AI and startup breakdowns.',
      'I share practical AI and growth observations like this every week.',
      'Follow along if you want signal over noise on AI and startups.',
      'More founder and creator breakdowns coming soon.',
      'I am tracking more shifts like this in public.',
      'Follow if you want sharper takes on what is actually working.'
    ]
  },
  {
    id: 'community',
    label: 'Community',
    items: [
      'Drop your perspective below.',
      'Tell me where you think I am wrong.',
      'I would love to hear how your team is handling this.',
      'Would you want more breakdowns in this format?',
      'What should I analyze next?',
      'Reply with the use case you are most excited about.'
    ]
  }
];

const SUGGESTION_BATCH_SIZE = 12;

const flattenSuggestionLibrary = (library) => library.flatMap((group) => (
  group.items.map((item, index) => ({
    id: `${group.id}-${index}`,
    categoryId: group.id,
    categoryLabel: group.label,
    text: item
  }))
));

const shuffleArray = (items) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const buildSuggestionFeed = (library, cycles = 6) => {
  const flattened = flattenSuggestionLibrary(library);
  const batches = [];

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    batches.push(
      ...shuffleArray(flattened).map((item) => ({
        ...item,
        feedId: `${item.id}-${cycle}`
      }))
    );
  }

  return batches;
};

const defaultHook = HOOK_LIBRARY[0].items[0];
const defaultCta = CTA_LIBRARY[0].items[0];

const studioPlatformOptions = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    shortLabel: 'LinkedIn',
    Icon: FaLinkedin,
    accentClass: 'text-[#0a66c2]',
    activeClass: 'border-[#0a66c2]/50 bg-[#0a66c2]/10'
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    shortLabel: 'X',
    Icon: FaTwitter,
    accentClass: 'text-sky-400',
    activeClass: 'border-sky-400/50 bg-sky-400/10'
  }
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

const buildFallbackStory = (article) => cleanArticleText([
  article?.title,
  article?.description && `Why it matters: ${article.description}`,
  article?.url && `Source: ${article.url}`
].filter(Boolean).join('\n\n'));

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

const getPostingErrorMessage = (responseData) => {
  if (responseData?.error) return responseData.error;

  const platformResults = responseData?.results || {};
  const failedResult = Object.values(platformResults)
    .flat()
    .find(result => result?.error);

  if (!failedResult?.error) return 'Failed to post';

  if (/credits? to fulfill this request|creditsdepleted|out of ppu credits/i.test(failedResult.error)) {
    return 'X API credits are depleted for this developer account. Add or purchase API credits in the X Developer Portal, then try posting again.';
  }

  return failedResult.error;
};

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
  const hookFeed = useMemo(() => buildSuggestionFeed(HOOK_LIBRARY), []);
  const ctaFeed = useMemo(() => buildSuggestionFeed(CTA_LIBRARY), []);
  const hookCategories = useMemo(() => HOOK_LIBRARY.map((group) => group.label), []);
  const ctaCategories = useMemo(() => CTA_LIBRARY.map((group) => group.label), []);

  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [platformsLoading, setPlatformsLoading] = useState(true);
  const [studioArticle, setStudioArticle] = useState(() => normalizeArticleForStudio(location.state?.studioArticle));
  const [studioHook, setStudioHook] = useState(defaultHook);
  const [studioCta, setStudioCta] = useState(defaultCta);
  const [visibleHookCount, setVisibleHookCount] = useState(18);
  const [visibleCtaCount, setVisibleCtaCount] = useState(18);
  const [studioStory, setStudioStory] = useState(() => {
    const article = normalizeArticleForStudio(location.state?.studioArticle);
    return location.state?.studioDraft || article?.description || '';
  });
  const [studioGenerating, setStudioGenerating] = useState(false);
  const [studioPosting, setStudioPosting] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [schedulingPost, setSchedulingPost] = useState(false);

  useEffect(() => {
    const articleFromRoute = normalizeArticleForStudio(location.state?.studioArticle);
    if (!articleFromRoute) return;

    setStudioArticle(articleFromRoute);
    setStudioStory(location.state?.studioDraft || articleFromRoute.description || '');
    setStudioHook(defaultHook);
    setStudioCta(defaultCta);
    setVisibleHookCount(18);
    setVisibleCtaCount(18);
    window.history.replaceState({}, '');
  }, [location.state]);

  useEffect(() => {
    const fetchConnectedPlatforms = async () => {
      setPlatformsLoading(true);
      try {
        const response = await api.get('/accounts');
        const accounts = response.data?.accounts || response.data || [];
        const supportedPlatformIds = studioPlatformOptions.map(platform => platform.id);
        const platforms = [...new Set(accounts
          .map(account => account.platform)
          .filter(platform => supportedPlatformIds.includes(platform)))];

        setConnectedPlatforms(platforms);
        setSelectedPlatforms(previous => {
          const stillConnected = previous.filter(platform => platforms.includes(platform));
          return stillConnected.length > 0 ? stillConnected : platforms;
        });
      } catch (error) {
        console.error('Failed to fetch connected platforms:', error);
        setConnectedPlatforms([]);
        setSelectedPlatforms([]);
        showError('Could not load connected platforms');
      } finally {
        setPlatformsLoading(false);
      }
    };

    fetchConnectedPlatforms();
  }, []);

  const studioPost = studioStory.trim()
    ? [studioHook, studioStory, studioCta]
      .map(part => part?.trim())
      .filter(Boolean)
      .join('\n\n')
    : '';

  const visibleHookSuggestions = hookFeed.slice(0, visibleHookCount);
  const visibleCtaSuggestions = ctaFeed.slice(0, visibleCtaCount);

  const handleSuggestionScroll = (event, type) => {
    const element = event.currentTarget;
    const nearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 120;

    if (!nearBottom) return;

    if (type === 'hooks') {
      setVisibleHookCount((current) => Math.min(current + SUGGESTION_BATCH_SIZE, hookFeed.length));
      return;
    }

    setVisibleCtaCount((current) => Math.min(current + SUGGESTION_BATCH_SIZE, ctaFeed.length));
  };

  const toggleStudioPlatform = (platformId) => {
    if (!connectedPlatforms.includes(platformId)) return;

    setSelectedPlatforms(previous => (
      previous.includes(platformId)
        ? previous.filter(platform => platform !== platformId)
        : [...previous, platformId]
    ));
  };

  const handleGenerateStudioPost = async () => {
    if (!studioArticle) {
      showError('Select a topic from the dashboard news feed first');
      return;
    }

    setStudioGenerating(true);
    try {
      const response = await api.post('/ai/generate', {
        topic: [
          studioArticle.title,
          studioArticle.description,
          studioArticle.url && `Source: ${studioArticle.url}`
        ].filter(Boolean).join('\n\n'),
        niche: 'AI, startups, and creator growth',
        platform: 'linkedin'
      });

      const generatedPost = response.data?.variations?.[0];
      if (!response.data?.success || !generatedPost) {
        console.error('Post generation returned no draft:', response.data);
        const fallbackStory = buildFallbackStory(studioArticle);
        if (fallbackStory) {
          setStudioStory(fallbackStory);
          showError(response.data?.error || 'AI generation failed, so a source-based draft was created');
        } else {
          showError(response.data?.error || 'Failed to generate post');
        }
        return;
      }

      setStudioStory(cleanArticleText(generatedPost));
      showSuccess('Post draft generated');
    } catch (error) {
      console.error('Post generation request failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      const fallbackStory = buildFallbackStory(studioArticle);
      if (fallbackStory) {
        setStudioStory(fallbackStory);
        showError(error.response?.data?.error || 'AI generation failed, so a source-based draft was created');
      } else {
        showError(error.response?.data?.error || 'Failed to generate post');
      }
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
        showError(getPostingErrorMessage(response.data));
      }
    } catch (error) {
      showError(getPostingErrorMessage(error.response?.data));
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
            <button
              onClick={handleGenerateStudioPost}
              disabled={!studioArticle || studioGenerating}
              className="px-4 py-2 bg-[#22d3ee] text-[#0a0a0b] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center gap-2"
            >
              <FaMagic size={13} />
              {studioGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_280px] min-h-[620px]">
            <div className="border-b xl:border-b-0 xl:border-r border-white/[0.06] p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Hooks</h3>
                  <p className="text-xs text-[#71717a] mt-1">AI, viral, contrarian, builder, and story-led openers.</p>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-[#52525b]">
                  {visibleHookSuggestions.length} shown
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {hookCategories.map((category) => (
                  <span
                    key={category}
                    className="px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-medium text-[#a1a1aa]"
                  >
                    {category}
                  </span>
                ))}
              </div>

              <div
                className="space-y-2 max-h-[680px] overflow-y-auto pr-1"
                onScroll={(event) => handleSuggestionScroll(event, 'hooks')}
              >
                {visibleHookSuggestions.map((hook) => (
                  <button
                    key={hook.feedId}
                    onClick={() => setStudioHook(hook.text)}
                    className={`w-full text-left p-3 rounded-lg border text-sm leading-relaxed transition-colors ${
                      studioHook === hook.text
                        ? 'bg-[#22d3ee]/10 border-[#22d3ee]/30 text-[#22d3ee]'
                        : 'bg-[#18181b] border-white/[0.06] text-[#a1a1aa] hover:text-white hover:border-white/[0.14]'
                    }`}
                  >
                    <span className="block text-[11px] uppercase tracking-wide text-[#71717a] mb-1">
                      {hook.categoryLabel}
                    </span>
                    <span>{hook.text}</span>
                  </button>
                ))}

                {visibleHookCount < hookFeed.length && (
                  <button
                    onClick={() => setVisibleHookCount((current) => Math.min(current + SUGGESTION_BATCH_SIZE, hookFeed.length))}
                    className="w-full rounded-lg border border-dashed border-white/[0.12] px-3 py-3 text-sm text-[#a1a1aa] hover:text-white hover:border-white/[0.24] transition-colors"
                  >
                    Load more hooks
                  </button>
                )}
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

              <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Post Draft</h3>
                  <span className="text-xs text-[#52525b]">{studioPost.length} characters</span>
                </div>

                <textarea
                  value={studioStory}
                  onChange={(e) => setStudioStory(e.target.value)}
                  placeholder="Select a topic and generate a post draft..."
                  className="min-h-[390px] w-full resize-none bg-[#0d0d0f] border border-white/[0.08] rounded-lg p-4 text-white text-sm leading-relaxed placeholder-[#52525b] focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20"
                />

                <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 bg-white/[0.06] border border-white/[0.08] text-white rounded-lg hover:bg-white/[0.1] cursor-pointer text-sm font-medium">
                      <FaUpload size={12} />
                      {uploadingMedia ? 'Uploading...' : 'Upload'}
                      <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} className="hidden" disabled={uploadingMedia} />
                    </label>
                    <div className="flex items-center gap-2 flex-1 min-w-[220px]">
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
                  </div>

                  {mediaUrl && (
                    <div className="rounded-lg overflow-hidden border border-white/[0.06] bg-[#18181b]">
                      {mediaType === 'video'
                        ? <video src={mediaUrl} controls className="w-full max-h-52 object-contain bg-black" />
                        : <img src={mediaUrl} alt="Attached media" className="w-full max-h-52 object-cover" />}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-lg p-4">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-sm font-semibold text-white">Where should this post go?</h3>
                  <p className="text-xs text-[#71717a]">Select one or both destinations before posting or scheduling.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studioPlatformOptions.map(({ id, label, Icon, accentClass, activeClass }) => {
                    const isConnected = connectedPlatforms.includes(id);
                    const isSelected = selectedPlatforms.includes(id);

                    return (
                      <label
                        key={id}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                          isSelected
                            ? activeClass
                            : 'border-white/[0.06] bg-[#18181b] hover:border-white/[0.14]'
                        } ${isConnected ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!isConnected}
                          onChange={() => toggleStudioPlatform(id)}
                          className="sr-only"
                        />
                        <span className={`w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center ${accentClass}`}>
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-white">{label}</span>
                          <span className="block text-xs text-[#71717a]">
                            {platformsLoading ? 'Checking connection...' : isConnected ? 'Connected' : 'Not connected'}
                          </span>
                        </span>
                        <span className={`w-5 h-5 rounded border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#22d3ee] bg-[#22d3ee] text-[#0a0a0b]'
                            : 'border-white/[0.18] text-transparent'
                        }`}>
                          <FaCheck size={11} />
                        </span>
                      </label>
                    );
                  })}
                </div>

                {!platformsLoading && connectedPlatforms.length === 0 && (
                  <p className="mt-3 text-xs text-amber-300">
                    No connected platforms found. Connect X or LinkedIn from Accounts first.
                  </p>
                )}
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
                        {studioPlatformOptions.find(option => option.id === platform)?.shortLabel || platform}
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
                  disabled={!studioPost.trim() || selectedPlatforms.length === 0 || schedulingPost}
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
                  disabled={!studioPost.trim() || selectedPlatforms.length === 0 || studioPosting}
                  className="px-4 py-2 bg-[#22d3ee] text-[#0a0a0b] rounded-lg transition-colors disabled:opacity-50 text-sm font-semibold"
                >
                  {studioPosting ? 'Posting...' : 'Post Now'}
                </button>
              </div>
            </div>

            <div className="border-t xl:border-t-0 xl:border-l border-white/[0.06] p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">CTAs</h3>
                  <p className="text-xs text-[#71717a] mt-1">Mix in engagement, follow, creator, and community prompts.</p>
                </div>
                <span className="text-[11px] uppercase tracking-wide text-[#52525b]">
                  {visibleCtaSuggestions.length} shown
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {ctaCategories.map((category) => (
                  <span
                    key={category}
                    className="px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-medium text-[#a1a1aa]"
                  >
                    {category}
                  </span>
                ))}
              </div>

              <div
                className="space-y-2 max-h-[680px] overflow-y-auto pr-1"
                onScroll={(event) => handleSuggestionScroll(event, 'ctas')}
              >
                {visibleCtaSuggestions.map((cta) => (
                  <button
                    key={cta.feedId}
                    onClick={() => setStudioCta(cta.text)}
                    className={`w-full text-left p-3 rounded-lg border text-sm leading-relaxed transition-colors ${
                      studioCta === cta.text
                        ? 'bg-[#22d3ee]/10 border-[#22d3ee]/30 text-[#22d3ee]'
                        : 'bg-[#18181b] border-white/[0.06] text-[#a1a1aa] hover:text-white hover:border-white/[0.14]'
                    }`}
                  >
                    <span className="block text-[11px] uppercase tracking-wide text-[#71717a] mb-1">
                      {cta.categoryLabel}
                    </span>
                    <span>{cta.text}</span>
                  </button>
                ))}

                {visibleCtaCount < ctaFeed.length && (
                  <button
                    onClick={() => setVisibleCtaCount((current) => Math.min(current + SUGGESTION_BATCH_SIZE, ctaFeed.length))}
                    className="w-full rounded-lg border border-dashed border-white/[0.12] px-3 py-3 text-sm text-[#a1a1aa] hover:text-white hover:border-white/[0.24] transition-colors"
                  >
                    Load more CTAs
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
