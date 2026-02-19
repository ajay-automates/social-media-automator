import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How does the free trial work?',
      answer: 'You get full access to all Pro features for 14 days, no credit card required. After the trial, you can choose to upgrade or continue with the free plan.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Absolutely! You can cancel your subscription at any time from your account settings. No questions asked, no hidden fees.',
    },
    {
      question: 'Which platforms do you support?',
      answer: 'We support LinkedIn, Twitter/X, YouTube, TikTok, Reddit, Telegram, Discord, Slack, and more. New platforms are added regularly based on user requests.',
    },
    {
      question: 'How does the AI caption generation work?',
      answer: 'We use Claude AI (Anthropic) to generate platform-specific captions tailored to your content and brand voice. You get 3 variations to choose from for each post.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! We use industry-standard OAuth for account connections, meaning we never store your passwords. All data is encrypted and isolated per user with our multi-tenant architecture.',
    },
    {
      question: 'Can I schedule posts in advance?',
      answer: 'Yes! You can schedule posts weeks or months in advance. Our cron-based automation ensures your posts go live at the perfect time, even when you\'re offline.',
    },
  ];

  return (
    <section className="relative py-32 bg-white">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <span className="text-netflix-red font-semibold text-sm uppercase tracking-wider px-4 py-2 rounded-full bg-white/80 backdrop-blur-md border border-gray-200/50 font-netflix">
              ❓ FAQ
            </span>
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-bold text-netflix-red mb-6 font-netflix">
            Frequently Asked{' '}
            <span className="text-netflix-red">Questions</span>
          </h2>
          <p className="text-xl text-netflix-red font-netflix">
            Everything you need to know about the platform
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-xl overflow-hidden hover:bg-white/90 transition-colors shadow-lg"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="text-lg font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>
                <motion.span
                  animate={{ rotate: openIndex === index ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl text-netflix-red flex-shrink-0"
                >
                  +
                </motion.span>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

