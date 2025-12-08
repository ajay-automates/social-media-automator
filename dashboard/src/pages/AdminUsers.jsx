import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    // Admin Check (Dual layer: Client + Server)
    useEffect(() => {
        if (user && user.email !== 'ajaykumarreddynelavetla@gmail.com') {
            navigate('/');
        }
    }, [user, navigate]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setError(error.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // Auto-refresh every 30 seconds to catch new signups
        const interval = setInterval(fetchUsers, 30000);
        return () => clearInterval(interval);
    }, []);

    // Filter users
    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate Stats
    const totalUsers = users.length;
    // Users created in last 24 hours
    const newUsersToday = users.filter(u => {
        const created = new Date(u.created_at);
        const now = new Date();
        return (now - created) < 24 * 60 * 60 * 1000;
    }).length;

    // Active in last 24 hours (approx based on last sign in)
    const activeNow = users.filter(u => {
        if (!u.last_sign_in_at) return false;
        const lastLogin = new Date(u.last_sign_in_at);
        const now = new Date();
        return (now - lastLogin) < 24 * 60 * 60 * 1000;
    }).length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-gray-400">Manage users and monitor growth</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchUsers}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
                        title="Refresh Data"
                    >
                        🔄
                    </button>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg">
                    ⚠️ {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Users */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 backdrop-blur-lg border border-blue-500/30 p-6 rounded-2xl"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-blue-400 font-medium mb-1">Total Users</p>
                            <h3 className="text-4xl font-bold text-white">{totalUsers}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-xl text-2xl">👥</div>
                    </div>
                </motion.div>

                {/* New Today */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-600/20 to-green-900/20 backdrop-blur-lg border border-green-500/30 p-6 rounded-2xl"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-green-400 font-medium mb-1">New (24h)</p>
                            <h3 className="text-4xl font-bold text-white">+{newUsersToday}</h3>
                        </div>
                        <div className="p-3 bg-green-500/20 rounded-xl text-2xl">📈</div>
                    </div>
                </motion.div>

                {/* Active Now */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 backdrop-blur-lg border border-purple-500/30 p-6 rounded-2xl"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-purple-400 font-medium mb-1">Active Recently</p>
                            <h3 className="text-4xl font-bold text-white">{activeNow}</h3>
                        </div>
                        <div className="p-3 bg-purple-500/20 rounded-xl text-2xl">⚡</div>
                    </div>
                </motion.div>
            </div>

            {/* Users Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-2xl overflow-hidden shadow-xl"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-800/50 border-b border-gray-700">
                                <th className="p-4 text-gray-400 font-medium text-sm">User</th>
                                <th className="p-4 text-gray-400 font-medium text-sm">Plan</th>
                                <th className="p-4 text-gray-400 font-medium text-sm">Status</th>
                                <th className="p-4 text-gray-400 font-medium text-sm">Joined</th>
                                <th className="p-4 text-gray-400 font-medium text-sm">Last Login</th>
                                <th className="p-4 text-gray-400 font-medium text-sm">Provider</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                // Loading Skeletons
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-gray-800">
                                        <td className="p-4"><div className="h-4 w-32 bg-gray-800 rounded animate-pulse"></div></td>
                                        <td className="p-4"><div className="h-4 w-16 bg-gray-800 rounded animate-pulse"></div></td>
                                        <td className="p-4"><div className="h-4 w-24 bg-gray-800 rounded animate-pulse"></div></td>
                                        <td className="p-4"><div className="h-4 w-24 bg-gray-800 rounded animate-pulse"></div></td>
                                        <td className="p-4"><div className="h-4 w-16 bg-gray-800 rounded animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-gray-800 hover:bg-white/5 transition group"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {user.email?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{user.email}</p>
                                                    <p className="text-gray-500 text-xs font-mono">{user.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${user.plan === 'business' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                    user.plan === 'pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-gray-700/50 text-gray-400 border-gray-600'
                                                }`}>
                                                {user.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'Free'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.is_confirmed ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                                    Verified
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-400 border border-gray-600">
                                                    Unverified
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-300 text-sm">
                                            {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                                        </td>
                                        <td className="p-4 text-gray-300 text-sm">
                                            {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM d, h:mm a') : 'Never'}
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm capitalize">
                                            {user.provider}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        No users found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-gray-800 text-xs text-center text-gray-500">
                    Showing {filteredUsers.length} of {totalUsers} users
                </div>
            </motion.div>
        </div>
    );
}
