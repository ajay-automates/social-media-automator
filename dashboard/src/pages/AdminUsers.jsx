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

  useEffect(() => {
    if (user && user.email !== 'ajaykumarreddynelavetla@gmail.com') navigate('/');
  }, [user, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = users.length;
  const newUsersToday = users.filter(u => (new Date() - new Date(u.created_at)) < 86400000).length;
  const activeNow = users.filter(u => u.last_sign_in_at && (new Date() - new Date(u.last_sign_in_at)) < 86400000).length;

  const stats = [
    { label: 'Total users', value: totalUsers, icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: 'New (24h)', value: `+${newUsersToday}`, icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
    { label: 'Active (24h)', value: activeNow, icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  ];

  const planBadge = (plan) => {
    if (plan === 'business') return 'text-violet-400 bg-violet-400/10 border-violet-400/20';
    if (plan === 'pro') return 'text-[#22d3ee] bg-[#22d3ee]/10 border-[#22d3ee]/20';
    return 'text-[#52525b] bg-white/[0.04] border-white/[0.08]';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white mb-1">Admin Dashboard</h1>
          <p className="text-sm text-[#a1a1aa]">Manage users and monitor growth</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="p-2 bg-white/[0.06] border border-white/[0.08] rounded-lg text-[#a1a1aa] hover:text-white hover:bg-white/[0.1] transition-colors"
            title="Refresh"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
          <div className="relative">
            <svg width="13" height="13" fill="none" stroke="#52525b" strokeWidth="2" viewBox="0 0 24 24" className="absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#111113] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#22d3ee]/40 w-56 transition-colors"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 bg-red-500/[0.06] border border-red-500/20 rounded-lg text-sm text-red-400">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[#111113] border border-white/[0.06] rounded-xl p-5 flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-[#52525b] uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#a1a1aa]">
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['User', 'Plan', 'Status', 'Joined', 'Last login', 'Provider'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-[#52525b] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3.5 rounded bg-white/[0.04] animate-pulse" style={{ width: `${[140, 60, 80, 90, 100, 60][j]}px` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center text-[#22d3ee] text-xs font-bold flex-shrink-0">
                          {u.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{u.email}</p>
                          <p className="text-xs text-[#52525b] font-mono">{u.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${planBadge(u.plan)}`}>
                        {u.plan ? u.plan.charAt(0).toUpperCase() + u.plan.slice(1) : 'Free'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {u.is_confirmed ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-xs text-[#52525b]">Unverified</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#a1a1aa]">
                      {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#a1a1aa]">
                      {u.last_sign_in_at ? format(new Date(u.last_sign_in_at), 'MMM d, h:mm a') : 'Never'}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#52525b] capitalize">{u.provider}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-sm text-[#52525b]">
                    No users found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/[0.06] text-xs text-[#52525b]">
          Showing {filteredUsers.length} of {totalUsers} users
        </div>
      </motion.div>
    </div>
  );
}
