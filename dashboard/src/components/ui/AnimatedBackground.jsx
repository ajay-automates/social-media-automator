import { motion } from 'framer-motion';

export default function AnimatedBackground({ variant = 'default' }) {
  const variants = {
    default: [
      { color: 'bg-blue-500/20', size: 'w-96 h-96', position: '-top-1/2 -left-1/4' },
      { color: 'bg-purple-500/20', size: 'w-96 h-96', position: 'top-1/4 -right-1/4' },
      { color: 'bg-pink-500/10', size: 'w-96 h-96', position: '-bottom-1/4 left-1/3' },
    ],
    purple: [
      { color: 'bg-purple-500/30', size: 'w-[500px] h-[500px]', position: 'top-0 left-0' },
      { color: 'bg-pink-500/20', size: 'w-[400px] h-[400px]', position: 'bottom-0 right-0' },
      { color: 'bg-indigo-500/20', size: 'w-[300px] h-[300px]', position: 'top-1/2 left-1/2' },
    ],
    blue: [
      { color: 'bg-blue-500/30', size: 'w-[500px] h-[500px]', position: 'top-0 right-0' },
      { color: 'bg-cyan-500/20', size: 'w-[400px] h-[400px]', position: 'bottom-0 left-0' },
    ],
  };

  const blobs = variants[variant] || variants.default;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {blobs.map((blob, index) => (
        <motion.div
          key={index}
          className={`absolute ${blob.size} ${blob.color} ${blob.position} rounded-full blur-3xl`}
          animate={{
            x: [0, index % 2 === 0 ? 100 : -100, 0],
            y: [0, index % 2 === 0 ? 50 : -50, 0],
            scale: [1, 1.1 + index * 0.05, 1],
          }}
          transition={{
            duration: 20 + index * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

