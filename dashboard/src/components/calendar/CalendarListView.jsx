import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
    FaEdit, 
    FaTrash, 
    FaExternalLinkAlt, 
    FaImage,
    FaCheckCircle,
    FaClock,
    FaExclamationCircle 
} from 'react-icons/fa';
import PlatformChip from '../ui/PlatformChip'; // Assuming this exists or using the one from Calendar.jsx logic
// Check Calendar.jsx imports to see where PlatformChip is or likely just inline the logic if it's simple
// Using the platform config from Calendar.jsx would be better if exported, but I'll redefine or pass as props.
// For now, I'll assume passing config or redefining for independence.

const StatusBadge = ({ status }) => {
    const config = {
        queued: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: FaClock, label: 'Queued' },
        scheduled: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: FaClock, label: 'Scheduled' },
        posted: { color: 'text-green-400', bg: 'bg-green-400/10', icon: FaCheckCircle, label: 'Posted' },
        failed: { color: 'text-red-400', bg: 'bg-red-400/10', icon: FaExclamationCircle, label: 'Failed' }
    };

    const style = config[status] || config.queued;
    const Icon = style.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.color} ${style.bg}`}>
            <Icon className="text-[10px]" />
            {style.label}
        </span>
    );
};

export default function CalendarListView({ events, onSelectEvent, onDeleteEvent, platformConfig }) {
    if (!events || events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-[#2c2c2e] rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-1">No Posts Scheduled</h3>
                <p className="text-[#98989d] text-sm">Switch to calendar view to schedule posts.</p>
            </div>
        );
    }

    // Sort events by date (ascending)
    const sortedEvents = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));

    return (
        <div className="space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#2c2c2e]/50 border-y border-[#38383a] text-xs font-semibold uppercase tracking-wider text-[#98989d]">
                <div className="col-span-4">Post Details</div>
                <div className="col-span-2">Platforms</div>
                <div className="col-span-3">Date & Time</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Event Rows */}
            <div className="space-y-1">
                {sortedEvents.map((event) => (
                    <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group grid grid-cols-12 gap-4 px-4 py-4 items-center bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-transparent hover:border-[#38383a] rounded-xl transition-all cursor-pointer"
                        onClick={() => onSelectEvent(event)}
                    >
                        {/* Post Details (Preview + Caption) */}
                        <div className="col-span-4 flex items-center gap-4 overflow-hidden">
                            {/* Preview Image/Icon */}
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#2c2c2e] border border-[#38383a] flex items-center justify-center overflow-hidden">
                                {event.image_url ? (
                                    <img src={event.image_url} alt="Post preview" className="w-full h-full object-cover" />
                                ) : (
                                    <FaImage className="text-[#98989d] text-lg" />
                                )}
                            </div>
                            
                            {/* Caption Text */}
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate pr-4" title={event.text}>
                                    {event.text || "No caption"}
                                </p>
                                <p className="text-xs text-[#98989d] truncate mt-0.5">
                                    {event.characters || event.text?.length || 0} chars
                                </p>
                            </div>
                        </div>

                        {/* Platforms */}
                        <div className="col-span-2 flex items-center">
                            <div className="flex -space-x-2">
                                {event.platforms?.map((platform, idx) => {
                                    const config = platformConfig?.[platform];
                                    if (!config) return null;
                                    const Icon = config.Icon;
                                    return (
                                        <div 
                                            key={idx}
                                            className="w-8 h-8 rounded-full bg-[#1c1c1e] border-2 border-[#1c1c1e] flex items-center justify-center"
                                            title={platform}
                                            style={{ backgroundColor: config.bgColor }}
                                        >
                                            <Icon style={{ color: config.color, fontSize: '14px' }} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="col-span-3 text-sm text-[#e5e5e7]">
                            <div className="font-medium">
                                {format(new Date(event.start), 'EEE, MMM d, yyyy')}
                            </div>
                            <div className="text-[#98989d] text-xs mt-0.5">
                                {format(new Date(event.start), 'h:mm a')}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                            <StatusBadge status={event.status || 'queued'} />
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectEvent(event);
                                }}
                                className="p-2 text-[#98989d] hover:text-white hover:bg-[#3a3a3c] rounded-lg transition-colors"
                                title="Edit"
                            >
                                <FaEdit />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
