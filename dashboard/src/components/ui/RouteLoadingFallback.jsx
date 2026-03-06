import { motion } from 'framer-motion';

export default function RouteLoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
            >
                <motion.div
                    animate={{
                        rotate: 360,
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="inline-block text-6xl mb-4"
                >
                    🚀
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
                <p className="text-[#a1a1aa]">Preparing your experience</p>
            </motion.div>
        </div>
    );
}
