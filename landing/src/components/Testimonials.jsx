import { motion } from 'framer-motion';
import TestimonialCarousel from './TestimonialCarousel';
import TestimonialGrid from './TestimonialGrid';
import { testimonials, trustBadges } from '../data/testimonials';

export default function Testimonials() {
  return (
    <section className="relative py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <span className="text-netflix-red font-semibold text-sm uppercase tracking-wider px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-gray-200/50 font-netflix">
              💬 Testimonials
            </span>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-bold text-netflix-red mb-6 font-netflix">
            Trusted by{' '}
            <span className="text-netflix-red">Creators Worldwide</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Join hundreds of users saving 10+ hours per week
          </p>
        </motion.div>

        {/* Trust Badges - Will be added when we have real reviews */}
        {trustBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-8 mb-16"
          >
            {trustBadges.map((badge, index) => (
              <motion.div
                key={badge.name}
                whileHover={{ scale: 1.1, y: -5 }}
                className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-gray-200/50 px-6 py-4 rounded-xl shadow-lg"
              >
                <span className="text-4xl">{badge.logo}</span>
                <div>
                  <div className="font-bold text-gray-900">{badge.name}</div>
                  <div className="text-sm text-yellow-600">{badge.rating}</div>
                  <div className="text-xs text-gray-600">{badge.reviews}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Infinite Scrolling Carousel */}
        <div className="mb-20">
          <TestimonialCarousel testimonials={testimonials} />
        </div>

        {/* Grid of Testimonials */}
        <div className="mb-16">
          <TestimonialGrid testimonials={testimonials} />
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <motion.a
            href="/auth.html"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 bg-netflix-red hover:bg-netflix-red-dark text-white px-8 py-4 rounded font-bold text-lg hover:shadow-2xl hover:shadow-red-500/50 transition-all font-netflix"
          >
            Join These Happy Users
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}

