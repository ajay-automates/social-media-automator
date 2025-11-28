import { motion } from 'framer-motion';

export default function TestimonialGrid({ testimonials }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.slice(0, 6).map((testimonial, index) => (
        <motion.div
          key={testimonial.id}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          whileHover={{ y: -10, scale: 1.02 }}
          className="glass rounded-2xl p-6 hover:bg-white/15 transition-all cursor-pointer group"
        >
          {/* Rating Stars */}
          <div className="flex gap-1 mb-4">
            {[...Array(testimonial.rating)].map((_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, rotate: -180 }}
                whileInView={{ opacity: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + i * 0.05 }}
                className="text-yellow-400 text-lg"
              >
                ★
              </motion.span>
            ))}
          </div>

          {/* Quote */}
          <p className="text-gray-300 mb-6 leading-relaxed text-sm line-clamp-4">
            "{testimonial.text}"
          </p>

          {/* Author */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <motion.img
              src={testimonial.avatar}
              alt={testimonial.name}
              loading="lazy"
              className="w-10 h-10 rounded-full border-2 border-purple-500/50 group-hover:border-purple-400 transition-colors"
              whileHover={{ scale: 1.15, rotate: 360 }}
              transition={{ duration: 0.3 }}
            />
            <div>
              <div className="font-semibold text-white text-sm">{testimonial.name}</div>
              <div className="text-xs text-gray-400">{testimonial.title}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

