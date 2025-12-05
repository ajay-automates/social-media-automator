import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * OverlappingCardCarousel - Netflix-style horizontal scroll carousel
 * Arrows always visible, smooth horizontal scrolling
 */
export default function OverlappingCardCarousel({
    children,
    className = '',
    arrowColor = 'white'
}) {
    const scrollContainerRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

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

        // Also check on window resize
        window.addEventListener('resize', checkScrollPosition);

        return () => {
            container.removeEventListener('scroll', checkScrollPosition);
            window.removeEventListener('resize', checkScrollPosition);
        };
    }, []);

    const scroll = (direction) => {
        if (!scrollContainerRef.current) return;

        const scrollAmount = 300; // Card width + gap
        const newScrollLeft = scrollContainerRef.current.scrollLeft +
            (direction === 'left' ? -scrollAmount : scrollAmount);

        scrollContainerRef.current.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
        });
    };

    return (
        <div className={`relative ${className}`}>
            {/* Scroll Container - Netflix style: clean horizontal scroll */}
            <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                style={{
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                {children}
            </div>

            {/* Left Arrow - ALWAYS VISIBLE when there's content to scroll */}
            {showLeftArrow && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => scroll('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-black/90 transition-all shadow-xl"
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

            {/* Right Arrow - ALWAYS VISIBLE when there's content to scroll */}
            {showRightArrow && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-black/90 transition-all shadow-xl"
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

            {/* Hide scrollbar */}
            <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </div>
    );
}
