import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Manage your social media posts from one place.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div 
          whileHover={{ y: -2, scale: 1.02 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="text-3xl font-bold">12</div>
          <div className="text-blue-100 mt-1">Posts Today</div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -2, scale: 1.02 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="text-3xl font-bold">3</div>
          <div className="text-green-100 mt-1">Platforms</div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -2, scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="text-3xl font-bold">98%</div>
          <div className="text-purple-100 mt-1">Success Rate</div>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -2, scale: 1.02 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white"
        >
          <div className="text-3xl font-bold">5</div>
          <div className="text-orange-100 mt-1">Scheduled</div>
        </motion.div>
      </div>
      
      {/* Quick Actions */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <Link 
              to="/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
            >
              ➕ Create New Post
            </Link>
            <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
              📅 View Calendar
            </button>
            <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
              📊 View Analytics
            </button>
          </div>
        </div>
      </div>
      
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer transition"
        >
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Posts</h2>
          <p className="text-gray-600 mb-4">Manage your social media content</p>
          <Link to="/create" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1">
            Create Post →
          </Link>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer transition"
        >
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h2>
          <p className="text-gray-600 mb-4">Track performance metrics</p>
          <Link to="/analytics" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1">
            View Analytics →
          </Link>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          className="bg-white rounded-xl shadow-lg p-6 cursor-pointer transition"
        >
          <div className="text-4xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
          <p className="text-gray-600 mb-4">Configure your accounts</p>
          <Link to="/settings" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1">
            Open Settings →
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

