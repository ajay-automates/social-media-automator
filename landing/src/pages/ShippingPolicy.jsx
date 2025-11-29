import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ShippingPolicy() {
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
                    <h1 className="text-5xl font-bold text-white mb-4">Shipping & Delivery Policy</h1>
                    <p className="text-gray-400 mb-8">Last Updated: November 29, 2025</p>

                    <div className="prose prose-invert prose-lg max-w-none space-y-8">
                        <section className="glass rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Digital Product Delivery</h2>
                            <p className="text-gray-300 leading-relaxed mb-4">
                                Social Media Automator is a Software-as-a-Service (SaaS) platform. We do not sell physical products, and therefore, <strong>no physical shipping is required.</strong>
                            </p>

                            <h3 className="text-xl font-semibold text-white mb-3 mt-6">Instant Access</h3>
                            <p className="text-gray-300 leading-relaxed">
                                Upon successful payment or sign-up, you will receive <strong>immediate access</strong> to your account and all purchased features.
                            </p>
                            <ul className="text-gray-300 space-y-2 list-disc list-inside mt-4">
                                <li><strong>Account Activation:</strong> Instant</li>
                                <li><strong>Feature Access:</strong> Instant</li>
                                <li><strong>Confirmation:</strong> You will receive a confirmation email with your invoice immediately after purchase.</li>
                            </ul>
                        </section>

                        <section className="glass rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Issues with Access</h2>
                            <p className="text-gray-300 leading-relaxed">
                                If you have completed payment but cannot access your account or premium features, please contact our support team immediately.
                            </p>
                            <ul className="text-gray-300 space-y-2 mt-4">
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
