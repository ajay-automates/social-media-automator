import { motion } from 'framer-motion';

export const SuccessCheckmark = () => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    className="flex items-center justify-center"
  >
    <motion.svg
      className="w-16 h-16 text-green-500"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  </motion.div>
);

