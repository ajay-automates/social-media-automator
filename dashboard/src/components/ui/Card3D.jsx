import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function Card3D({
  children,
  gradient = 'from-blue-400/80 via-blue-500/60 to-cyan-500/80',
  shadowColor = 'rgba(59, 130, 246, 0.5)',
  className = '',
  intensity = 15,
  onClick = null,
  hover3D = true
}) {
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${intensity}deg`, `-${intensity}deg`]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${intensity}deg`, `${intensity}deg`]);

  const handleMouseMove = (e) => {
    if (!ref.current || !hover3D) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      className={`group ${className} will-change-transform`}
    >
      <motion.div
        style={{
          rotateX: hover3D ? rotateX : 0,
          rotateY: hover3D ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
        className="relative will-change-transform"
      >
        {/* 3D Shadow */}
        <motion.div
          style={{
            transform: "translateZ(-30px)",
            background: shadowColor,
          }}
          className="absolute inset-0 rounded-2xl blur-xl opacity-20 will-change-transform"
        />

        {/* Main Card */}
        <motion.div
          whileHover={hover3D ? {} : {}}
          style={{
            transform: hover3D ? "translateZ(20px)" : "translateZ(0px)",
          }}
          className={`relative bg-gradient-to-br ${gradient} backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden will-change-transform`}
        >
          {/* Static gradient overlay instead of animated for performance */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"
          />

          {/* Content */}
          <div
            className="relative z-10"
            style={{
              transform: hover3D ? "translateZ(10px)" : "translateZ(0px)",
            }}
          >
            {children}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

