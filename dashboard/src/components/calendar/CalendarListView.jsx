import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FaImage, FaLink } from 'react-icons/fa';

export default function CalendarListView({ events, onSelectEvent, platformConfig }) {
    if (!events || events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-lg">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-gray-900 font-semibold text-lg mb-1">No Posts Scheduled</h3>
                <p className="text-gray-500 text-sm">Create your first post to get started.</p>
            </div>
        );
    }

    // Sort events by date/time (ascending) - matching reference image
    const sortedEvents = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-600">
                <div className="col-span-2">Preview</div>
                <div className="col-span-5">Name</div>
                <div className="col-span-3 flex items-center gap-1">
                    Post Date & Time
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                </div>
                <div className="col-span-2">Post Status</div>
            </div>

            {/* Event Rows */}
            <div className="divide-y divide-gray-100">
                {sortedEvents.map((event) => {
                    const platforms = event.platforms || [];
                    const title = event.text?.split('\n')[0] || event.text || 'Untitled Post';
                    const description = event.text?.split('\n').slice(1).join(' ') || event.text?.substring(0, 150) || '';
                    
                    return (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors cursor-pointer group"
                            onClick={() => onSelectEvent(event)}
                        >
                            {/* Preview */}
                            <div className="col-span-2">
                                <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                                    {event.image_url ? (
                                        <img 
                                            src={event.image_url} 
                                            alt="Post preview" 
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <FaImage className="text-gray-400 text-xl" />
                                    )}
                                </div>
                            </div>

                            {/* Name - Platform icons + "Post" + Title + Description */}
                            <div className="col-span-5 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    {/* Platform Icons */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {platforms.map((platform, idx) => {
                                            const config = platformConfig?.[platform];
                                            if (!config) return null;
                                            const Icon = config.Icon;
                                            return (
                                                <div 
                                                    key={idx}
                                                    className="w-5 h-5 flex items-center justify-center"
                                                    title={config.name}
                                                >
                                                    <Icon style={{ color: config.color, fontSize: '16px' }} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <span className="text-gray-500 text-sm font-medium">Post</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                                    {title}
                                </h4>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {description}
                                </p>
                            </div>

                            {/* Post Date & Time */}
                            <div className="col-span-3">
                                <div className="text-sm font-medium text-gray-900">
                                    {format(new Date(event.start), 'EEE, MMM d h:mma')}
                                </div>
                            </div>

                            {/* Post Status - "Connect" button matching reference */}
                            <div className="col-span-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectEvent(event);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    <FaLink className="text-xs" />
                                    Connect
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
