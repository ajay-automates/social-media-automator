import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { triggerConfetti } from '../utils/confetti';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubscribed(true);
    triggerConfetti();
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50 py-20">
      <div className="container mx-auto px-6">
        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-3xl p-12 mb-16 text-center shadow-lg"
        >
          <h3 className="text-4xl font-bold text-gray-900 mb-4">
            Stay Updated
          </h3>
          <p className="text-gray-700 mb-8">
            Get the latest features, tips, and exclusive deals delivered to your inbox
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-6 py-4 rounded-xl bg-white/90 border border-gray-200/50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-2xl hover:shadow-blue-500/50 transition-all"
            >
              {subscribed ? '✓ Subscribed!' : 'Subscribe'}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🚀</span>
              <span className="text-xl font-bold text-gray-900">Social Media Automator</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Automate your social media posting across multiple platforms with AI-powered captions.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-3 text-gray-700 text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/auth" className="hover:text-white transition-colors">
                  Sign Up
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-3 text-gray-700 text-sm">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-white transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/data-deletion" className="hover:text-white transition-colors">
                  Data Deletion
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Connect</h4>
            <ul className="space-y-3 text-gray-700 text-sm">
              <li>
                <a href="mailto:support@socialmediaautomator.com" className="hover:text-white transition-colors">
                  Email Us
                </a>
              </li>
              <li>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-600 text-sm flex flex-wrap gap-4 items-center">
            <span>© 2025 Social Media Automator. All rights reserved.</span>
            <span className="hidden md:inline">•</span>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <span>•</span>
            <Link to="/data-deletion" className="hover:text-white transition-colors">Data Deletion</Link>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4">
            {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
              <motion.a
                key={social}
                href="#"
                whileHover={{ scale: 1.2, y: -2 }}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-gray-200/50 flex items-center justify-center hover:bg-white/90 transition-colors shadow-lg"
              >
                <span className="text-sm">{social[0]}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <motion.button
        onClick={scrollToTop}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false }}
        whileHover={{ scale: 1.1, y: -5 }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:shadow-blue-500/50 transition-all z-50"
      >
        ↑
      </motion.button>
    </footer>
  );
}

