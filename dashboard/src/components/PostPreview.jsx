import React from 'react';
import { motion } from 'framer-motion';

export default function PostPreview({ caption, image, video, platforms }) {
    const hasMedia = image || video;
    const mediaUrl = image || (video ? video.video_files?.[0]?.link : null);
    const isVideo = !!video || (image && (image.endsWith('.mp4') || image.includes('video')));

    if (platforms.length === 0) {
        return (
            <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center">
                <p className="text-gray-400">Select a platform to see preview</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {platforms.includes('linkedin') && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-[550px] mx-auto">
                    {/* LinkedIn Header */}
                    <div className="p-3 flex gap-3 border-b border-gray-100">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
                        <div>
                            <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                            <div className="h-3 w-24 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                    {/* LinkedIn Content */}
                    <div className="p-3">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3">
                            {caption || <span className="text-gray-300 italic">Your post text will appear here...</span>}
                        </p>
                        {hasMedia && (
                            <div className="bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                                {isVideo ? (
                                    <div className="text-gray-400 flex flex-col items-center">
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
                    <div className="px-3 py-2 border-t border-gray-100 flex justify-between text-gray-500 text-sm">
                        <span>👍 Like</span>
                        <span>💬 Comment</span>
                        <span>share Repost</span>
                        <span>Send</span>
                    </div>
                </div>
            )}

            {platforms.includes('twitter') && (
                <div className="bg-black rounded-xl border border-gray-800 overflow-hidden max-w-[550px] mx-auto p-4">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                            <div className="flex gap-2 items-center mb-1">
                                <div className="h-4 w-24 bg-gray-800 rounded"></div>
                                <div className="h-4 w-16 bg-gray-900 rounded"></div>
                            </div>
                            <p className="text-white text-[15px] whitespace-pre-wrap mb-3">
                                {caption || <span className="text-gray-600 italic">Your tweet...</span>}
                            </p>
                            {hasMedia && (
                                <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video border border-gray-800 flex items-center justify-center">
                                    {isVideo ? (
                                        <div className="text-gray-600 flex flex-col items-center">
                                            <span className="text-3xl">▶️</span>
                                        </div>
                                    ) : (
                                        <img src={mediaUrl} alt="Tweet media" className="w-full h-full object-cover" />
                                    )}
                                </div>
                            )}
                            <div className="flex justify-between text-gray-500 text-sm mt-3 max-w-[80%]">
                                <span>💬</span>
                                <span>⚡</span>
                                <span>❤️</span>
                                <span>📊</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {platforms.includes('instagram') && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-[400px] mx-auto">
                    {/* Header */}
                    <div className="p-3 flex items-center justify-between border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="h-3 w-20 bg-gray-200 rounded"></div>
                        </div>
                        <div className="text-gray-400">•••</div>
                    </div>

                    {/* Media */}
                    <div className="bg-gray-100 aspect-square flex items-center justify-center overflow-hidden">
                        {hasMedia ? (
                            isVideo ? (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <span className="text-4xl">▶️</span>
                                </div>
                            ) : (
                                <img src={mediaUrl} alt="Insta media" className="w-full h-full object-cover" />
                            )
                        ) : (
                            <span className="text-gray-400 text-sm">Image/Video Required</span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-3">
                        <div className="flex justify-between mb-3 text-2xl">
                            <div className="flex gap-4">
                                <span>♡</span>
                                <span>💬</span>
                                <span>➢</span>
                            </div>
                            <span>🔖</span>
                        </div>
                        <div className="h-3 w-24 bg-gray-100 rounded mb-2"></div>
                        <p className="text-sm text-gray-800">
                            <span className="font-semibold mr-2">username</span>
                            {caption ? (caption.length > 100 ? caption.substring(0, 100) + '...' : caption) : <span className="text-gray-300 italic">Caption...</span>}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
