import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { celebrateBigWin } from '../utils/animations';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    celebrateBigWin();
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); navigate('/dashboard'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const sessionId = searchParams.get('session_id');
  const plan = sessionId ? 'Pro' : 'your new plan';

  const benefits = [
    'Unlimited posts',
    '3 social accounts',
    '100 AI generations/month',
    'CSV bulk upload',
    'Email support',
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111113] border border-white/[0.06] rounded-2xl max-w-md w-full p-8 text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-[#22d3ee]/10 border border-[#22d3ee]/20 flex items-center justify-center mx-auto mb-6"
        >
          <svg width="28" height="28" fill="none" stroke="#22d3ee" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </motion.div>

        <h1 className="font-display text-2xl text-white mb-2">Payment successful!</h1>
        <p className="text-[#a1a1aa] text-sm mb-6">Welcome to {plan}. Your subscription is now active.</p>

        {/* Trial notice */}
        <div className="flex items-start gap-2.5 p-3.5 bg-[#22d3ee]/[0.04] border border-[#22d3ee]/[0.12] rounded-xl mb-5 text-left">
          <svg width="14" height="14" fill="none" stroke="#22d3ee" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <p className="text-xs text-[#a1a1aa]">
            <span className="text-white font-semibold">14-day free trial</span> — you won't be charged until{' '}
            {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-[#18181b] border border-white/[0.06] rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-3">You now have access to</p>
          <ul className="space-y-2">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[#a1a1aa]">
                <svg width="13" height="13" fill="none" stroke="#22d3ee" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-[#22d3ee] text-[#0a0a0b] font-semibold py-2.5 rounded-lg hover:bg-[#06b6d4] transition-colors text-sm mb-3"
        >
          Go to dashboard
        </button>

        <p className="text-xs text-[#52525b]">Redirecting in {countdown}s...</p>
      </motion.div>
    </div>
  );
}
