import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PaymentCancel() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); navigate('/pricing'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

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
          className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-6"
        >
          <svg width="24" height="24" fill="none" stroke="#a1a1aa" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </motion.div>

        <h1 className="font-display text-2xl text-white mb-2">Payment cancelled</h1>
        <p className="text-[#a1a1aa] text-sm mb-6">
          No worries — you haven't been charged. Your free plan is still active.
        </p>

        {/* Reassurance */}
        <div className="flex items-start gap-2.5 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl mb-6 text-left">
          <svg width="14" height="14" fill="none" stroke="#a1a1aa" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-xs text-[#a1a1aa]">
            You can upgrade anytime from the pricing page when you're ready.
          </p>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-[#22d3ee] text-[#0a0a0b] font-semibold py-2.5 rounded-lg hover:bg-[#06b6d4] transition-colors text-sm"
          >
            View pricing
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-white/[0.06] border border-white/[0.08] text-white font-medium py-2.5 rounded-lg hover:bg-white/[0.1] transition-colors text-sm"
          >
            Back to dashboard
          </button>
        </div>

        <p className="text-xs text-[#52525b] mt-4">Redirecting to pricing in {countdown}s...</p>
      </motion.div>
    </div>
  );
}
