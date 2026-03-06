/**
 * SimpleCard - Clean, flat card with no 3D effects
 * Netflix-style minimal design
 */
export default function SimpleCard({
    children,
    gradient = 'bg-[#22d3ee]',
    className = '',
    onClick = null
}) {
    return (
        <div
            onClick={onClick}
            className={`relative bg-[#111113] ${gradient} rounded-lg border border-white/[0.06] overflow-hidden transition-all duration-300 hover:border-white/[0.08] ${className}`}
        >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-[#111113] from-white/5 to-transparent opacity-50" />

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
