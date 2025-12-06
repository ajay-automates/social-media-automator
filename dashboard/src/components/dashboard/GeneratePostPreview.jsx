import { motion } from 'framer-motion';
import {
    FaLinkedin, FaTwitter, FaInstagram, FaFacebook, FaTiktok, FaYoutube,
    FaReddit, FaDiscord, FaSlack, FaTelegram, FaWhatsapp, FaPinterest,
    FaMedium, FaTumblr
} from 'react-icons/fa';
import { SiMastodon, SiBluesky } from 'react-icons/si';

// Reuse the platform config from Calendar.jsx layout
const PLATFORM_CONFIG = {
    linkedin: { Icon: FaLinkedin, color: '#0A66C2' },
    twitter: { Icon: FaTwitter, color: '#1DA1F2' },
    telegram: { Icon: FaTelegram, color: '#26A5E4' },
    slack: { Icon: FaSlack, color: '#4A154B' },
    discord: { Icon: FaDiscord, color: '#5865F2' },
    reddit: { Icon: FaReddit, color: '#FF4500' },
    medium: { Icon: FaMedium, color: '#00AB6C' },
    tumblr: { Icon: FaTumblr, color: '#36465D' },
    mastodon: { Icon: SiMastodon, color: '#6364FF' },
    bluesky: { Icon: SiBluesky, color: '#1185FE' },
    // others if needed
    instagram: { Icon: FaInstagram, color: '#E1306C' },
    facebook: { Icon: FaFacebook, color: '#1877F2' },
    youtube: { Icon: FaYoutube, color: '#FF0000' },
    tiktok: { Icon: FaTiktok, color: '#FE2C55' },
    whatsapp: { Icon: FaWhatsapp, color: '#25D366' },
    pinterest: { Icon: FaPinterest, color: '#E60023' }
};

const DISPLAY_PLATFORMS = [
    'linkedin', 'twitter', 'telegram', 'slack', 'discord',
    'reddit', 'medium', 'tumblr', 'mastodon', 'bluesky'
];

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function GeneratePostPreview({
    isOpen,
    onClose,
    article,
    generatedContent,
    isGenerating,
    onRegenerate,
    onPostNow,
    onSchedule,
    connectedPlatforms = []
}) {
    // Filter platforms if connectedPlatforms is provided and has items
    const visiblePlatforms = connectedPlatforms.length > 0
        ? DISPLAY_PLATFORMS.filter(p => connectedPlatforms.includes(p))
        : DISPLAY_PLATFORMS; // Fallback to all if none passed (or handle empty state)

    // Auto-select disabled per user request
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);

    const toggleSelectAll = () => {
        if (selectedPlatforms.length === visiblePlatforms.length) {
            setSelectedPlatforms([]);
        } else {
            setSelectedPlatforms(visiblePlatforms);
        }
    };

    const togglePlatform = (platform) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[10000] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1c1c1e] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#38383a] overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
                style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                }}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#38383a] flex items-center justify-between bg-[#2c2c2e] sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white">Generate Post</h2>
                        <p className="text-[#98989d] text-sm mt-1">Based on: {article?.headline?.substring(0, 40)}...</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#98989d] hover:text-white transition p-2 rounded-full hover:bg-white/10"
                    >
                        <span className="text-xl">✕</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Caption Preview */}
                    <div>
                        <label className="block text-xs font-semibold text-[#8e8e93] uppercase tracking-wide mb-2">
                            Generated Caption
                        </label>
                        <div className="bg-[#2c2c2e] border border-[#38383a] text-white rounded-xl px-4 py-3 min-h-[150px] whitespace-pre-wrap text-sm leading-relaxed relative">
                            {isGenerating ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-[#2c2c2e]/80 rounded-xl">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-[#38383a] border-t-[#0a84ff] rounded-full animate-spin"></div>
                                        <span className="text-[#98989d] text-xs font-medium">Generating content...</span>
                                    </div>
                                </div>
                            ) : (
                                generatedContent
                            )}
                        </div>
                    </div>

                    {/* Source Info */}
                    <div className="bg-[#2c2c2e]/50 rounded-lg p-3 border border-[#38383a] flex items-start gap-3">
                        <span className="text-2xl">📰</span>
                        <div>
                            <p className="text-white text-sm font-medium">{article?.source}</p>
                            <a
                                href={article?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0a84ff] text-xs hover:underline block truncate max-w-[400px]"
                            >
                                {article?.url}
                            </a>
                        </div>
                    </div>

                    {/* Platform Selector */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">
                                Select Platforms
                            </label>
                            <button
                                onClick={toggleSelectAll}
                                className="text-xs text-[#0a84ff] hover:text-[#0071e3] font-medium transition"
                            >
                                {selectedPlatforms.length === visiblePlatforms.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {visiblePlatforms.map(platform => {
                                const config = PLATFORM_CONFIG[platform];
                                const isSelected = selectedPlatforms.includes(platform);
                                const Icon = config.Icon;

                                return (
                                    <motion.button
                                        key={platform}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => togglePlatform(platform)}
                                        className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 border-2 ${isSelected
                                            ? 'border-transparent shadow-[0_0_12px_rgba(var(--platform-color),0.5)]'
                                            : 'border-[#38383a] opacity-60 hover:opacity-100 hover:border-[#666]'
                                            }`}
                                        style={{
                                            background: isSelected ? config.color : 'transparent',
                                            '--platform-color': config.color
                                        }}
                                    >
                                        <Icon className={`text-4xl ${isSelected ? 'text-white' : 'text-[#8e8e93]'}`} />

                                        {/* Checkmark Badge */}
                                        {isSelected && (
                                            <div className="absolute -top-1.5 -right-1.5 bg-[#34C759] text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#1c1c1e]">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onRegenerate}
                            disabled={isGenerating}
                            className="flex-1 bg-[#3a3a3c] text-white px-4 py-3 rounded-xl font-semibold hover:bg-[#48484a] transition flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <span>🔄</span> Regenerate
                        </button>
                        <button
                            onClick={() => onPostNow(selectedPlatforms)}
                            disabled={isGenerating || selectedPlatforms.length === 0}
                            className="flex-1 bg-[#0a84ff] text-white px-4 py-3 rounded-xl font-semibold hover:bg-[#0071e3] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-[#0a84ff]/50"
                        >
                            <span>🚀</span> Post Now
                        </button>
                        <button
                            onClick={() => onSchedule(selectedPlatforms)}
                            disabled={isGenerating || selectedPlatforms.length === 0}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:opacity-50"
                        >
                            <span>📅</span> Schedule
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
