import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function RefundPolicy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
            {/* Header with Back Button */}
            <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
                <div className="container mx-auto px-6 py-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                    >
                        <span>←</span>
                        <span>Back to Home</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-16 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-5xl font-bold text-white mb-4">Cancellation & Refund Policy</h1>
                    <p className="text-gray-400 mb-8">Last Updated: November 29, 2025</p>

                    <div className="prose prose-invert prose-lg max-w-none space-y-8">
                        {/* Cancellation */}
                        <section className="glass rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">1. Cancellation Policy</h2>
                            <p className="text-gray-300 leading-relaxed mb-4">
                                You can cancel your subscription at any time directly from your dashboard.
                            </p>
                            <ul className="text-gray-300 space-y-2 list-disc list-inside">
                                <li><strong>How to Cancel:</strong> Go to Settings > Billing > Manage Subscription > Cancel Plan.</li>
                                <li><strong>Effect of Cancellation:</strong> Your subscription will remain active until the end of the current billing period. After that, your account will downgrade to the Free plan.</li>
                                <li><strong>Data Retention:</strong> We retain your data for 30 days after cancellation in case you decide to reactivate. You can request immediate deletion at any time.</li>
                            </ul>
                        </section>

                        {/* Refunds */}
                        <section className="glass rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">2. Refund Policy</h2>
                            <p className="text-gray-300 leading-relaxed mb-4">
                                We offer a <strong>14-day money-back guarantee</strong> for all new subscriptions.
                            </p>
                            <ul className="text-gray-300 space-y-2 list-disc list-inside">
                                <li><strong>Eligibility:</strong> If you are not satisfied with our service within the first 14 days of your initial purchase, you are eligible for a full refund.</li>
                                <li><strong>How to Request:</strong> Email us at support@socialmediaautomator.com with your account email and reason for refund.</li>
                                <li><strong>Processing Time:</strong> Refunds are processed within 5-7 business days and returned to your original payment method.</li>
                                <li><strong>After 14 Days:</strong> We do not offer refunds for partial months or unused annual subscriptions after the initial 14-day period.</li>
                            </ul>
                        </section>

                        {/* Free Trial */}
                        <section className="glass rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">3. Free Trial</h2>
                            <p className="text-gray-300 leading-relaxed">
                                If you sign up for a free trial, you will not be charged until the trial period ends. You can cancel anytime during the trial to avoid being charged. We will send you a reminder email 3 days before your trial ends.
                            </p>
                        </section>

                        {/* Contact */}
                        <section className="glass rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">4. Contact Us</h2>
                            <p className="text-gray-300 mb-4">
                                If you have any questions about our Cancellation & Refund Policy, please contact us:
                            </p>
                            <ul className="text-gray-300 space-y-2">
                                <li><strong>Email:</strong> support@socialmediaautomator.com</li>
                                <li><strong>Response Time:</strong> Within 24 hours</li>
                            </ul>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
