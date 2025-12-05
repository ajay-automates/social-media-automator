/**
 * SimpleCard - Clean, flat card with no 3D effects
 * Netflix-style minimal design
 */
export default function SimpleCard({
    children,
    gradient = 'from-blue-400/80 via-blue-500/60 to-cyan-500/80',
    className = '',
    onClick = null
}) {
    return (
        <div
            onClick={onClick}
            className={`relative bg-gradient-to-br ${gradient} backdrop-blur-md rounded-lg border border-white/10 shadow-lg overflow-hidden transition-all duration-300 hover:border-white/20 ${className}`}
        >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
