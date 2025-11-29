import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ContactUs() {
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
                    <h1 className="text-5xl font-bold text-white mb-4">Contact Us</h1>
                    <p className="text-gray-400 mb-8">We're here to help!</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {/* Support Card */}
                        <div className="glass rounded-2xl p-8 border border-white/10">
                            <div className="text-4xl mb-4">💬</div>
                            <h2 className="text-2xl font-bold text-white mb-2">Customer Support</h2>
                            <p className="text-gray-300 mb-6">
                                Need help with your account, billing, or technical issues? Our support team is ready to assist you.
                            </p>
                            <a href="mailto:support@socialmediaautomator.com" className="text-blue-400 hover:text-blue-300 font-semibold">
                                support@socialmediaautomator.com
                            </a>
                            <p className="text-sm text-gray-500 mt-2">Response time: Within 24 hours</p>
                        </div>

                        {/* Business Card */}
                        <div className="glass rounded-2xl p-8 border border-white/10">
                            <div className="text-4xl mb-4">🤝</div>
                            <h2 className="text-2xl font-bold text-white mb-2">Business Inquiries</h2>
                            <p className="text-gray-300 mb-6">
                                Interested in partnerships, enterprise plans, or press inquiries? Let's talk.
                            </p>
                            <a href="mailto:business@socialmediaautomator.com" className="text-purple-400 hover:text-purple-300 font-semibold">
                                business@socialmediaautomator.com
                            </a>
                        </div>
                    </div>

                    {/* Office Address (Required for Payment Gateways) */}
                    <section className="glass rounded-2xl p-8 mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4">📍 Registered Office</h2>
                        <p className="text-gray-300 leading-relaxed">
                            <strong>Social Media Automator</strong><br />
                            123 Tech Park, Hitech City<br />
                            Hyderabad, Telangana 500081<br />
                            India
                        </p>
                    </section>

                    {/* FAQ Link */}
                    <section className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Have a quick question?</h2>
                        <p className="text-gray-300 mb-6">
                            Check out our Frequently Asked Questions for instant answers.
                        </p>
                        <button
                            onClick={() => navigate('/#faq')}
                            className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition"
                        >
                            View FAQ
                        </button>
                    </section>
                </motion.div>
            </div>
        </div>
    );
}
