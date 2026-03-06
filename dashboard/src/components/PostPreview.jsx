import React from 'react';
import { motion } from 'framer-motion';

export default function PostPreview({ caption, image, video, platforms }) {
    const hasMedia = image || video;
    const mediaUrl = image || (video ? video.video_files?.[0]?.link : null);
    const isVideo = !!video || (image && (image.endsWith('.mp4') || image.includes('video')));

    if (platforms.length === 0) {
        return (
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6 text-center">
                <p className="text-[#a1a1aa]">Select a platform to see preview</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {platforms.includes('linkedin') && (
                <div className="bg-white rounded-lg shadow-sm border border-white/[0.06] overflow-hidden max-w-[550px] mx-auto">
                    {/* LinkedIn Header */}
                    <div className="p-3 flex gap-3 border-b border-white/[0.06]">
                        <div className="w-12 h-12 bg-[#18181b] rounded-full flex-shrink-0"></div>
                        <div>
                            <div className="h-4 w-32 bg-[#18181b] rounded mb-1"></div>
                            <div className="h-3 w-24 bg-[#18181b] rounded"></div>
                        </div>
                    </div>
                    {/* LinkedIn Content */}
                    <div className="p-3">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3">
                            {caption || <span className="text-[#a1a1aa] italic">Your post text will appear here...</span>}
                        </p>
                        {hasMedia && (
                            <div className="bg-[#18181b] rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                                {isVideo ? (
                                    <div className="text-[#a1a1aa] flex flex-col items-center">
                                        <span className="text-4xl">▶️</span>
                                        <span className="text-xs mt-2">Video Preview</span>
                                    </div>
                                ) : (
                                    <img src={mediaUrl} alt="Post media" className="w-full h-full object-cover" />
                                )}
                            </div>
                        )}
                    </div>
                    {/* LinkedIn Footer */}
                    <div className="px-3 py-2 border-t border-white/[0.06] flex justify-between text-[#52525b] text-sm">
                        <span>👍 Like</span>
                        <span>💬 Comment</span>
                        <span>share Repost</span>
                        <span>Send</span>
                    </div>
                </div>
            )}

            {platforms.includes('twitter') && (
                <div className="bg-black rounded-xl border border-white/[0.06] overflow-hidden max-w-[550px] mx-auto p-4">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 bg-[#18181b] rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                            <div className="flex gap-2 items-center mb-1">
                                <div className="h-4 w-24 bg-[#18181b] rounded"></div>
                                <div className="h-4 w-16 bg-[#111113] rounded"></div>
                            </div>
                            <p className="text-white text-[15px] whitespace-pre-wrap mb-3">
                                {caption || <span className="text-[#52525b] italic">Your tweet...</span>}
                            </p>
                            {hasMedia && (
                                <div className="bg-[#111113] rounded-xl overflow-hidden aspect-video border border-white/[0.06] flex items-center justify-center">
                                    {isVideo ? (
                                        <div className="text-[#52525b] flex flex-col items-center">
                                            <span className="text-3xl">▶️</span>
                                        </div>
                                    ) : (
                                        <img src={mediaUrl} alt="Tweet media" className="w-full h-full object-cover" />
                                    )}
                                </div>
                            )}
                            <div className="flex justify-between text-[#52525b] text-sm mt-3 max-w-[80%]">
                                <span>💬</span>
                                <span>⚡</span>
                                <span>❤️</span>
                                <span>📊</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
