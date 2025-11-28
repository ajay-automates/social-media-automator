import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function TestimonialCarousel({ testimonials }) {
  const [duplicatedTestimonials] = useState([...testimonials, ...testimonials]);

  return (
    <div className="relative overflow-hidden py-8">
      {/* Gradient Overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-950 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-950 to-transparent z-10" />

      {/* Scrolling Container */}
      <motion.div
        className="flex gap-6"
        animate={{
          x: ['0%', '-50%'],
        }}
        transition={{
          x: {
            duration: 60,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {duplicatedTestimonials.map((testimonial, index) => (
          <div
            key={`${testimonial.id}-${index}`}
            className="flex-shrink-0 w-96 glass rounded-2xl p-6 hover:bg-white/15 transition-all group"
          >
            {/* Rating Stars */}
            <div className="flex gap-1 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-yellow-400 text-xl"
                >
                  ★
                </motion.span>
              ))}
            </div>

            {/* Quote */}
            <p className="text-gray-300 mb-6 leading-relaxed">
              "{testimonial.text}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-4">
              <motion.img
                src={testimonial.avatar}
                alt={testimonial.name}
                loading="lazy"
                className="w-12 h-12 rounded-full border-2 border-blue-500/50 group-hover:border-blue-400 transition-colors"
                whileHover={{ scale: 1.1 }}
              />
              <div>
                <div className="font-semibold text-white">{testimonial.name}</div>
                <div className="text-sm text-gray-400">{testimonial.title}</div>
                <div className="text-xs text-blue-400">{testimonial.company}</div>
              </div>
            </div>

            {/* Platform Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {Array.isArray(testimonial.platforms) && testimonial.platforms.map((platform, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

