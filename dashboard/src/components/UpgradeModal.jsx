import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const reasonConfig = {
  posts_limit: { emoji: '📝', title: 'Post Limit Reached', description: 'You\'ve used all your posts for this month.' },
  accounts_limit: { emoji: '🔗', title: 'Account Limit Reached', description: 'You\'ve reached your account connection limit.' },
  ai_limit: { emoji: '🤖', title: 'AI Generations Limit Reached', description: 'You\'ve used all your AI generations this month.' },
  platform_limit: { emoji: '🚀', title: 'Platform Not Available', description: 'This platform is only available on paid plans.' },
};

export default function UpgradeModal({ isOpen, onClose, reason = 'posts_limit', currentPlan = 'free' }) {
  const navigate = useNavigate();
  const config = reasonConfig[reason] || reasonConfig.posts_limit;

  const benefits = currentPlan === 'free' ? [
    'Unlimited posts',
    '3 social accounts',
    '100 AI generations/month',
    'CSV bulk upload',
    'All platforms',
  ] : [
    'Unlimited everything',
    '10 social accounts',
    'Unlimited AI generations',
    'Priority support',
    'API access',
    'Dedicated account manager',
  ];

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-2xl transition-all">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                {/* Emoji */}
                <div className="text-6xl mb-4 text-center">{config.emoji}</div>

                {/* Title */}
                <Dialog.Title className="text-2xl font-bold text-gray-900 text-center mb-2">
                  {config.title}
                </Dialog.Title>
                <p className="text-gray-600 text-center mb-6">{config.description}</p>

                {/* Benefits Section */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Upgrade to {currentPlan === 'free' ? 'Pro' : 'Business'} and get:
                  </h3>
                  <ul className="space-y-2">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleUpgrade}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition transform hover:scale-105"
                  >
                    View Pricing Plans
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition"
                  >
                    Maybe Later
                  </button>
                </div>

                {/* Footer */}
                <p className="text-xs text-gray-500 text-center mt-6">
                  No credit card required • 14-day free trial • Cancel anytime
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
