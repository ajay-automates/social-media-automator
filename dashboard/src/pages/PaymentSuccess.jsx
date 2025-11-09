import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { celebrateBigWin } from '../utils/animations';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Trigger confetti
    celebrateBigWin();

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const sessionId = searchParams.get('session_id');
  const plan = sessionId ? 'Pro' : 'your new plan'; // This would come from the session

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
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
          <CheckCircleIcon className="w-24 h-24 text-green-600 mx-auto mb-6" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎉 Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome to {plan}! Your subscription is now active.
        </p>

        {/* Trial Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            📅 <strong>14-day free trial</strong> • You won't be charged until{' '}
            {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-2">You now have access to:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {[
              'Unlimited posts',
              '3 social accounts',
              '100 AI generations/month',
              'CSV bulk upload',
              'Email support',
            ].map((benefit, i) => (
              <li key={i} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition transform hover:scale-105 mb-4"
        >
          Go to Dashboard
        </button>

        {/* Countdown */}
        <p className="text-xs text-gray-500">
          Redirecting to dashboard in {countdown} seconds...
        </p>
      </motion.div>
    </div>
  );
}
