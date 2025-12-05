import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * OverlappingCardCarousel - Reusable carousel with 3D overlapping card effect
 * 
 * Features:
 * - Horizontal scroll with snap points
 * - Navigation arrows (appear on hover)
 * - Touch/swipe support
 * - Perspective container for 3D effects
 * - GPU-accelerated smooth scrolling
 */
export default function OverlappingCardCarousel({
    children,
    className = '',
    arrowColor = 'white'
}) {
    const scrollContainerRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [isHovering, setIsHovering] = useState(false);

    // Check scroll position to show/hide arrows
    const checkScrollPosition = () => {
        if (!scrollContainerRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        checkScrollPosition();
        container.addEventListener('scroll', checkScrollPosition);

        return () => container.removeEventListener('scroll', checkScrollPosition);
    }, []);

    const scroll = (direction) => {
        if (!scrollContainerRef.current) return;

        const scrollAmount = 350; // Approximate card width + gap
        const newScrollLeft = scrollContainerRef.current.scrollLeft +
            (direction === 'left' ? -scrollAmount : scrollAmount);

        scrollContainerRef.current.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
        });
    };

    return (
        <div
            className={`relative ${className}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Scroll Container with Perspective */}
            <div
                ref={scrollContainerRef}
                className="flex gap-4 lg:gap-0 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{
                    perspective: '1000px',
                    perspectiveOrigin: 'center',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                {/* Negative margin for overlap on desktop */}
                <div className="flex gap-4 lg:-mx-5 lg:gap-0">
                    {children}
                </div>
            </div>

            {/* Left Arrow */}
            <AnimatePresence>
                {showLeftArrow && isHovering && (
                    <motion.button
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => scroll('left')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 transition-all shadow-xl"
                        aria-label="Scroll left"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke={arrowColor}
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Right Arrow */}
            <AnimatePresence>
                {showRightArrow && isHovering && (
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => scroll('right')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/70 transition-all shadow-xl"
                        aria-label="Scroll right"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke={arrowColor}
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Hide scrollbar */}
            <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </div>
    );
}
