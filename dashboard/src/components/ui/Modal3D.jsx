import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export default function Modal3D({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
  showParticles = true 
}) {
  // Prevent scroll when modal is open
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

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          >
            {/* Floating particles */}
            {showParticles && (
              <>
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
                    animate={{
                      x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                      y: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                      duration: 10 + Math.random() * 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50, rotateX: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50, rotateX: -15 }}
              transition={{ 
                type: "spring",
                stiffness: 150,
                damping: 20,
                duration: 0.4 
              }}
              onClick={(e) => e.stopPropagation()}
              className={`${sizeClasses[size]} w-full pointer-events-auto`}
              style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
              }}
            >
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-white/20 overflow-hidden">
                {/* Header */}
                {title && (
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {title}
                    </h3>
                    <button
                      onClick={onClose}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

