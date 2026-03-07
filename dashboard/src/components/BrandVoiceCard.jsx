import { useState } from 'react';
import { FaEdit, FaMagic, FaSync, FaCheckCircle, FaTwitter, FaDatabase, FaLinkedin, FaPaste } from 'react-icons/fa';
import api from '../lib/api';
import { showSuccess, showError } from './ui/Toast';

/**
 * BrandVoiceCard - Shows brand voice profile + "Train My Voice" button
 * Drop this into ContentAgent.jsx sidebar to replace the existing Brand Voice section
 */
export default function BrandVoiceCard({ brandVoice, onVoiceUpdated }) {
  const [training, setTraining] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualPosts, setManualPosts] = useState('');
  const [showIdentityForm, setShowIdentityForm] = useState(false);
  const [identity, setIdentity] = useState({
    name: '',
    role: '',
    topics: '',
    style_notes: ''
  });

  // Preview what posts are available from connected accounts
  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const response = await api.get('/content-agent/brand-voice/fetch-posts');
      if (response.data.success) {
        setPreviewData(response.data);
        showSuccess(`Found ${response.data.totalFetched} posts from your accounts`);
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to fetch posts');
    } finally {
      setPreviewing(false);
    }
  };

  // Auto-bootstrap: pull from connected accounts + train voice
  const handleAutoTrain = async () => {
    setTraining(true);
    try {
      const identityPayload = {};
      if (identity.name) identityPayload.name = identity.name;
      if (identity.role) identityPayload.role = identity.role;
      if (identity.topics) identityPayload.topics = identity.topics.split(',').map(t => t.trim()).filter(Boolean);
      if (identity.style_notes) identityPayload.style_notes = identity.style_notes;

      const response = await api.post('/content-agent/brand-voice/auto-bootstrap', {
        identity: Object.keys(identityPayload).length > 0 ? identityPayload : undefined
      });

      if (response.data.success) {
        showSuccess(response.data.message);
        if (onVoiceUpdated) onVoiceUpdated(response.data.brandVoice);
        setPreviewData(null);
        setShowIdentityForm(false);
      } else {
        showError(response.data.error || response.data.message);
        // If not enough posts from accounts, show manual input
        if (response.data.totalFetched < 3) {
          setShowManualInput(true);
        }
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to train voice');
      setShowManualInput(true);
    } finally {
      setTraining(false);
    }
  };

  // Manual bootstrap: paste LinkedIn posts
  const handleManualTrain = async () => {
    const posts = manualPosts.split('\n---\n').map(p => p.trim()).filter(p => p.length > 10);
    if (posts.length < 3) {
      showError('Need at least 3 posts. Separate each post with --- on a new line.');
      return;
    }

    setTraining(true);
    try {
      const identityPayload = {};
      if (identity.name) identityPayload.name = identity.name;
      if (identity.role) identityPayload.role = identity.role;
      if (identity.topics) identityPayload.topics = identity.topics.split(',').map(t => t.trim()).filter(Boolean);
      if (identity.style_notes) identityPayload.style_notes = identity.style_notes;

      const response = await api.post('/content-agent/brand-voice/bootstrap', {
        samplePosts: posts,
        identity: Object.keys(identityPayload).length > 0 ? identityPayload : undefined
      });

      if (response.data.success) {
        showSuccess(response.data.message);
        if (onVoiceUpdated) onVoiceUpdated(response.data.brandVoice);
        setShowManualInput(false);
        setManualPosts('');
      } else {
        showError(response.data.error || response.data.message);
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to train voice');
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="bg-[#111113] border border-white/[0.08] rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <FaEdit className="text-emerald-400" />
        Brand Voice
      </h2>

      {brandVoice ? (
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
            <p className="text-[#a1a1aa]">Tone</p>
            <p className="text-emerald-400 font-medium capitalize">{brandVoice.tone}</p>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
            <p className="text-[#a1a1aa]">Formality</p>
            <p className="text-cyan-400 font-medium">{brandVoice.formality_level}/10</p>
          </div>
          {brandVoice.writing_personality && (
            <div className="py-2 border-b border-white/[0.04]">
              <p className="text-[#a1a1aa] text-xs mb-1">Personality</p>
              <p className="text-white text-xs leading-relaxed">{brandVoice.writing_personality}</p>
            </div>
          )}
          <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
            <p className="text-[#a1a1aa]">Avg Length</p>
            <p className="text-purple-400 font-medium">{brandVoice.avg_caption_length} chars</p>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
            <p className="text-[#a1a1aa]">Emoji Usage</p>
            <p className={`font-medium ${brandVoice.emoji_usage ? 'text-amber-400' : 'text-[#52525b]'}`}>
              {brandVoice.emoji_usage ? 'Yes' : 'No'}
            </p>
          </div>
          <div className="flex items-center justify-between py-2">
            <p className="text-[#a1a1aa]">Posts Analyzed</p>
            <p className="text-white font-bold">{brandVoice.analyzed_post_count}</p>
          </div>

          {/* Re-train button */}
          <button
            onClick={handleAutoTrain}
            disabled={training}
            className="w-full mt-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg hover:bg-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            <FaSync className={training ? 'animate-spin' : ''} size={12} />
            {training ? 'Re-training...' : 'Re-train Voice'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <FaMagic className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-white font-medium mb-1">Train Your Voice</p>
            <p className="text-[#52525b] text-xs">AI will learn how you write from your connected accounts</p>
          </div>

          {/* Identity Form (collapsible) */}
          <button
            onClick={() => setShowIdentityForm(!showIdentityForm)}
            className="w-full text-left text-xs text-[#a1a1aa] hover:text-white transition-colors flex items-center gap-1"
          >
            {showIdentityForm ? '▾' : '▸'} Tell AI about yourself (optional)
          </button>

          {showIdentityForm && (
            <div className="space-y-2">
              <input
                type="text"
                value={identity.name}
                onChange={(e) => setIdentity(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="w-full px-3 py-1.5 bg-[#18181b] border border-white/[0.06] rounded text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500/30"
              />
              <input
                type="text"
                value={identity.role}
                onChange={(e) => setIdentity(prev => ({ ...prev, role: e.target.value }))}
                placeholder="Your role (e.g., AI Engineer)"
                className="w-full px-3 py-1.5 bg-[#18181b] border border-white/[0.06] rounded text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500/30"
              />
              <input
                type="text"
                value={identity.topics}
                onChange={(e) => setIdentity(prev => ({ ...prev, topics: e.target.value }))}
                placeholder="Topics you post about (comma-separated)"
                className="w-full px-3 py-1.5 bg-[#18181b] border border-white/[0.06] rounded text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500/30"
              />
              <input
                type="text"
                value={identity.style_notes}
                onChange={(e) => setIdentity(prev => ({ ...prev, style_notes: e.target.value }))}
                placeholder="Style notes (e.g., direct, technical)"
                className="w-full px-3 py-1.5 bg-[#18181b] border border-white/[0.06] rounded text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-emerald-500/30"
              />
            </div>
          )}

          {/* Preview available posts */}
          {previewData && (
            <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-3 space-y-2">
              <p className="text-xs text-[#a1a1aa] font-medium">Posts found from your accounts:</p>
              {Object.entries(previewData.sources || {}).map(([source, info]) => (
                <div key={source} className="flex items-center justify-between text-xs">
                  <span className="text-[#a1a1aa] capitalize flex items-center gap-1">
                    {source === 'twitter' && <FaTwitter className="text-blue-400" size={10} />}
                    {source === 'internal' && <FaDatabase className="text-purple-400" size={10} />}
                    {source === 'linkedin' && <FaLinkedin className="text-blue-500" size={10} />}
                    {source}
                  </span>
                  <span className={info.count > 0 ? 'text-emerald-400' : 'text-[#52525b]'}>
                    {info.count} posts {info.status === 'not_available' ? '(scope limited)' : ''}
                  </span>
                </div>
              ))}
              <p className="text-xs text-white font-bold pt-1 border-t border-white/[0.04]">
                Total: {previewData.totalFetched} posts
              </p>
            </div>
          )}

          {/* Auto-train button */}
          <button
            onClick={previewData ? handleAutoTrain : handlePreview}
            disabled={training || previewing}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {training ? (
              <><FaSync className="animate-spin" size={12} /> Training your voice...</>
            ) : previewing ? (
              <><FaSync className="animate-spin" size={12} /> Scanning accounts...</>
            ) : previewData ? (
              <><FaMagic size={12} /> Train My Voice ({previewData.totalFetched} posts)</>
            ) : (
              <><FaMagic size={12} /> Train My Voice</>
            )}
          </button>

          {/* Manual paste option */}
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="w-full text-center text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors flex items-center justify-center gap-1"
          >
            <FaPaste size={10} />
            {showManualInput ? 'Hide manual input' : 'Or paste LinkedIn posts manually'}
          </button>

          {showManualInput && (
            <div className="space-y-2">
              <textarea
                value={manualPosts}
                onChange={(e) => setManualPosts(e.target.value)}
                placeholder={"Paste your best LinkedIn posts here.\nSeparate each post with --- on a new line.\n\nExample:\n\nJust shipped a new AI feature...\n\n---\n\nHere's what I learned building...\n\n---\n\nThe future of AI agents is..."}
                className="w-full px-3 py-2 bg-[#18181b] border border-white/[0.06] rounded-lg text-sm text-white placeholder-[#52525b] focus:outline-none focus:border-cyan-500/30 resize-none"
                rows={8}
              />
              <p className="text-[10px] text-[#52525b]">
                {manualPosts.split('\n---\n').filter(p => p.trim().length > 10).length} posts detected (need 3+)
              </p>
              <button
                onClick={handleManualTrain}
                disabled={training || manualPosts.split('\n---\n').filter(p => p.trim().length > 10).length < 3}
                className="w-full px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm rounded-lg hover:bg-cyan-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {training ? 'Training...' : 'Train from Pasted Posts'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
