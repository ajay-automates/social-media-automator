import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BulkScheduleModal({
    isOpen,
    onClose,
    onConfirm,
    selectedCount = 0,
    connectedPlatforms = []  // e.g. ['linkedin', 'twitter']
}) {
    const [selectedPlatforms, setSelectedPlatforms] = useState(['linkedin']);

    const togglePlatform = (platform) => {
        if (selectedPlatforms.includes(platform)) {
            // Prevent unselecting the last platform
            if (selectedPlatforms.length > 1) {
                setSelectedPlatforms(prev => prev.filter(p => p !== platform));
            }
        } else {
            setSelectedPlatforms(prev => [...prev, platform]);
        }
    };

    const handleConfirm = () => {
        onConfirm(selectedPlatforms);
    };

    // Helper to get platform icon/color
    const getPlatformDetails = (platform) => {
        switch (platform) {
            case 'linkedin':
                return { name: 'LinkedIn', color: 'bg-[#0077b5]', icon: '💼' };
            case 'twitter':
                return { name: 'Twitter', color: 'bg-black', icon: '🐦' };
            default:
                return { name: platform, color: 'bg-[#18181b]', icon: '🌐' };
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/[0.06]">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>🚀</span>
                            Schedule AI Posts
                        </h3>
                        <p className="text-[#a1a1aa] text-sm mt-1">
                            Generating posts for <span className="text-white font-medium">{selectedCount}</span> selected articles.
                        </p>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Platform Selection */}
                        <div>
                            <label className="block text-sm font-medium text-[#a1a1aa] mb-3">
                                Select Target Platforms
                            </label>

                            {connectedPlatforms.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {connectedPlatforms.map(platform => {
                                        const details = getPlatformDetails(platform);
                                        const isSelected = selectedPlatforms.includes(platform);

                                        return (
                                            <button
                                                key={platform}
                                                onClick={() => togglePlatform(platform)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected
                                                        ? 'bg-[#22d3ee]/10 border-[#22d3ee]/50'
                                                        : 'bg-[#18181b] border-white/[0.06] hover:border-white/[0.06]'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${details.color}`}>
                                                    {details.icon}
                                                </div>
                                                <div className="text-left">
                                                    <div className={`font-medium ${isSelected ? 'text-[#22d3ee]' : 'text-[#a1a1aa]'}`}>
                                                        {details.name}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="ml-auto text-[#22d3ee]">
                                                        ✓
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm">
                                    No connected accounts found. Please connect accounts in Settings.
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="bg-[#18181b] rounded-xl p-4 border border-white/5">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">⚡</span>
                                <div className="space-y-1">
                                    <p className="text-sm text-[#a1a1aa]">
                                        This will immediately generate and schedule <span className="text-white font-bold">{selectedCount * selectedPlatforms.length} posts</span> ({selectedCount} articles × {selectedPlatforms.length} platforms).
                                    </p>
                                    <p className="text-xs text-[#52525b]">
                                        Posts will be spread throughout the day automatically.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/[0.06] bg-[#111113] flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[#18181b] hover:bg-[#18181b] text-white font-medium transition-colors border border-white/[0.06]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedPlatforms.length === 0}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[#22d3ee] text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Schedule Now
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
