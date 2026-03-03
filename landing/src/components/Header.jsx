import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50"
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-netflix-red flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-lg font-netflix">S</span>
            </div>
            <span className="text-xl font-bold text-netflix-red font-netflix">Social Media Automator</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors font-medium font-netflix">
              Features
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition-colors font-medium font-netflix">
              Pricing
            </a>
            <a href="#faq" className="text-gray-700 hover:text-gray-900 transition-colors font-medium font-netflix">
              FAQ
            </a>
            <a
              href="/auth"
              className="text-gray-700 hover:text-gray-900 transition-colors font-medium font-netflix"
            >
              Login
            </a>
            <a
              href="/auth"
              className="px-6 py-2 rounded bg-netflix-red text-white font-semibold hover:bg-netflix-red-dark hover:shadow-lg hover:scale-105 transition-all font-netflix"
            >
              Sign up
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="flex flex-col gap-4 py-4 border-t border-gray-200/50 mt-4">
                <a href="#features" onClick={() => setMobileOpen(false)} className="text-gray-700 hover:text-gray-900 transition-colors font-medium font-netflix">
                  Features
                </a>
                <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-gray-700 hover:text-gray-900 transition-colors font-medium font-netflix">
                  Pricing
                </a>
                <a href="#faq" onClick={() => setMobileOpen(false)} className="text-gray-700 hover:text-gray-900 transition-colors font-medium font-netflix">
                  FAQ
                </a>
                <a href="/auth" className="text-gray-700 hover:text-gray-900 transition-colors font-medium font-netflix">
                  Login
                </a>
                <a
                  href="/auth"
                  className="inline-block text-center px-6 py-2 rounded bg-netflix-red text-white font-semibold hover:bg-netflix-red-dark transition-all font-netflix"
                >
                  Sign up
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
