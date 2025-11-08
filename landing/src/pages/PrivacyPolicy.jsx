import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
          <h1 className="text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last Updated: November 8, 2025</p>

          <div className="prose prose-invert prose-lg max-w-none space-y-8">
            {/* Introduction */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="text-gray-300 leading-relaxed">
                Welcome to Social Media Automator ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service at socialmediaautomator.com.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.1 Information You Provide</h3>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li><strong>Account Information:</strong> Email address, password, name</li>
                <li><strong>Social Media Credentials:</strong> OAuth tokens for connected platforms (encrypted)</li>
                <li><strong>Payment Information:</strong> Processed securely by Stripe (we don't store card details)</li>
                <li><strong>Content Data:</strong> Posts, images, captions you create</li>
                <li><strong>Team Data:</strong> Team member emails, roles, invitations</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
                <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                <li><strong>Analytics:</strong> Post performance, engagement metrics</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li>Provide and maintain our service</li>
                <li>Post content to your connected social media accounts</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send email notifications about scheduled posts</li>
                <li>Provide customer support</li>
                <li>Improve and optimize our service</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and abuse</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li><strong>Encryption:</strong> All data encrypted in transit (SSL/TLS) and at rest</li>
                <li><strong>OAuth Tokens:</strong> Stored encrypted in secure database (Supabase)</li>
                <li><strong>Access Control:</strong> Row-Level Security (RLS) ensures data isolation</li>
                <li><strong>Payment Security:</strong> PCI-compliant through Stripe</li>
                <li><strong>Regular Backups:</strong> Automatic daily backups</li>
              </ul>
            </section>

            {/* Data Sharing */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">We Share Data With:</h3>
              <ul className="text-gray-300 space-y-2 list-disc list-inside mb-4">
                <li><strong>Social Media Platforms:</strong> To post content on your behalf (LinkedIn, Twitter, Reddit, etc.)</li>
                <li><strong>AI Providers:</strong> Anthropic (Claude AI), Stability AI for content generation</li>
                <li><strong>Payment Processor:</strong> Stripe for billing</li>
                <li><strong>Infrastructure:</strong> Railway (hosting), Supabase (database), Cloudinary (media storage)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">We DO NOT:</h3>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li>Sell your personal information</li>
                <li>Share your content with third parties for marketing</li>
                <li>Use your data to train AI models</li>
                <li>Post to your accounts without your explicit instruction</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
              <p className="text-gray-300 mb-4">You have the right to:</p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li><strong>Access:</strong> Request a copy of your data</li>
                <li><strong>Correction:</strong> Update inaccurate information</li>
                <li><strong>Deletion:</strong> Delete your account and all associated data</li>
                <li><strong>Export:</strong> Download your data in CSV format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from email notifications</li>
                <li><strong>Revoke Access:</strong> Disconnect social media accounts anytime</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li><strong>Active Accounts:</strong> Data retained while account is active</li>
                <li><strong>After Cancellation:</strong> Data deleted within 30 days unless legally required</li>
                <li><strong>Scheduled Posts:</strong> Deleted after posting or cancellation</li>
                <li><strong>Analytics:</strong> Aggregated data may be retained for service improvement</li>
              </ul>
            </section>

            {/* Cookies */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-300 mb-4">We use:</p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li><strong>Essential Cookies:</strong> For authentication and session management</li>
                <li><strong>Analytics:</strong> To understand how you use our service</li>
                <li><strong>Preferences:</strong> To remember your settings</li>
              </ul>
              <p className="text-gray-300 mt-4">
                You can disable cookies in your browser, but some features may not work properly.
              </p>
            </section>

            {/* Third-Party Services */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">9. Third-Party Services</h2>
              <p className="text-gray-300 mb-4">We integrate with:</p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li><strong>Supabase:</strong> Database and authentication</li>
                <li><strong>Stripe:</strong> Payment processing</li>
                <li><strong>Anthropic:</strong> AI caption generation</li>
                <li><strong>Stability AI:</strong> Image generation</li>
                <li><strong>Cloudinary:</strong> Media hosting</li>
                <li><strong>Social Media Platforms:</strong> LinkedIn, Twitter, Reddit, etc.</li>
              </ul>
              <p className="text-gray-300 mt-4">
                Each third-party service has its own privacy policy. We recommend reviewing them.
              </p>
            </section>

            {/* International Users */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">10. International Users</h2>
              <p className="text-gray-300">
                Our service is hosted in the United States. By using our service, you consent to the transfer of your information to the United States. We comply with GDPR for EU users and provide the same privacy protections globally.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">11. Children's Privacy</h2>
              <p className="text-gray-300">
                Our service is not intended for users under 18 years of age. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Policy</h2>
              <p className="text-gray-300">
                We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on our website. Continued use of the service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
              <p className="text-gray-300 mb-4">
                If you have questions about this Privacy Policy or want to exercise your rights, contact us:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li><strong>Email:</strong> privacy@socialmediaautomator.com</li>
                <li><strong>Website:</strong> https://socialmediaautomator.com/contact</li>
                <li><strong>Response Time:</strong> Within 48 hours</li>
              </ul>
            </section>

            {/* Summary */}
            <section className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">📌 Summary</h2>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li>We collect data to provide our social media automation service</li>
                <li>Your social media credentials are encrypted and secure</li>
                <li>We don't sell your data or use it for advertising</li>
                <li>You can delete your account and data anytime</li>
                <li>We comply with GDPR and US privacy laws</li>
                <li>Questions? Email privacy@socialmediaautomator.com</li>
              </ul>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

