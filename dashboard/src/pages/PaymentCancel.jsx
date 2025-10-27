import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

export default function PaymentCancel() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/pricing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <XCircleIcon className="w-24 h-24 text-orange-500 mx-auto mb-6" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 mb-4">
          No worries! Your payment was cancelled and you haven't been charged.
        </p>

        {/* Reassurance */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-orange-900">
            Your <strong>Free plan</strong> is still active. You can upgrade anytime when you're ready.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition transform hover:scale-105"
          >
            View Pricing Again
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Countdown */}
        <p className="text-xs text-gray-500 mt-4">
          Redirecting to pricing in {countdown} seconds...
        </p>
      </motion.div>
    </div>
  );
}
