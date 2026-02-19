import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
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
          <h1 className="text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-gray-400 mb-8">Last Updated: November 8, 2025</p>

          <div className="prose prose-invert prose-lg max-w-none space-y-8">
            {/* Agreement */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                By accessing or using Social Media Automator ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
              </p>
            </section>

            {/* Service Description */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">2. Service Description</h2>
              <p className="text-gray-300 mb-4">
                Social Media Automator provides:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li>Multi-platform social media posting (10 platforms currently available)</li>
                <li>AI-powered content generation (captions, images, hashtags)</li>
                <li>Post scheduling and automation</li>
                <li>Analytics and reporting</li>
                <li>Team collaboration tools</li>
                <li>Bulk CSV upload</li>
              </ul>
              <p className="text-gray-300 mt-4">
                <strong>Note:</strong> Some platforms (YouTube, Pinterest, TikTok) require platform approval and may not be immediately available.
              </p>
            </section>

            {/* Account Requirements */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">3. Account Requirements</h2>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li>You must be at least 18 years old</li>
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>One person or business per account (no sharing)</li>
                <li>You must own or have permission to post on connected social media accounts</li>
              </ul>
            </section>

            {/* Acceptable Use */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">You MAY:</h3>
              <ul className="text-gray-300 space-y-2 list-disc list-inside mb-4">
                <li>Post content you own or have rights to</li>
                <li>Schedule and automate posts to your accounts</li>
                <li>Use AI features to generate original content</li>
                <li>Connect multiple social media accounts</li>
                <li>Invite team members to collaborate</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">You MAY NOT:</h3>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li>Post spam, illegal content, or violate platform policies</li>
                <li>Use the service for harassment, hate speech, or harmful content</li>
                <li>Share your account credentials with others</li>
                <li>Attempt to bypass usage limits or restrictions</li>
                <li>Reverse engineer or copy our service</li>
                <li>Post copyrighted content without permission</li>
                <li>Use the service to manipulate engagement (fake likes, bots, etc.)</li>
                <li>Violate any laws or third-party rights</li>
              </ul>
            </section>

            {/* Billing and Payments */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">5. Billing and Payments</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">5.1 Subscription Plans</h3>
              <ul className="text-gray-300 space-y-2 list-disc list-inside mb-4">
                <li><strong>Free Plan:</strong> Limited features, 10 posts/month</li>
                <li><strong>Pro Plan:</strong> $29/month, unlimited posts, 100 AI requests/month</li>
                <li><strong>Business Plan:</strong> $99/month, unlimited everything, priority support</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">5.2 Billing Terms</h3>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li>All plans billed monthly in advance</li>
                <li>14-day free trial for new users (no credit card required for Free plan)</li>
                <li>Automatic renewal unless cancelled</li>
                <li>Refunds available within 30 days of purchase</li>
                <li>Usage limits reset monthly on your billing date</li>
                <li>Payments processed securely via Stripe</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">5.3 Cancellation</h3>
              <p className="text-gray-300">
                You can cancel anytime from Settings → Billing. Cancellation takes effect at the end of your current billing period. No refunds for partial months unless required by law.
              </p>
            </section>

            {/* Platform Integration */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">6. Platform Integration & Limitations</h2>
              <p className="text-gray-300 mb-4">
                <strong>Important:</strong> We integrate with third-party social media platforms. We are not responsible for:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li>Changes to platform APIs or policies</li>
                <li>Platform outages or service disruptions</li>
                <li>Content removed or flagged by platforms</li>
                <li>Account suspensions due to platform policy violations</li>
                <li>Rate limits or posting restrictions imposed by platforms</li>
              </ul>
              <p className="text-gray-300 mt-4">
                You are responsible for complying with each platform's Terms of Service.
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">7.1 Your Content</h3>
              <p className="text-gray-300 mb-4">
                You retain all rights to content you create. By using our service, you grant us a limited license to:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li>Store and process your content</li>
                <li>Post content to your connected accounts</li>
                <li>Generate AI variations of your content</li>
                <li>Display content in your analytics dashboard</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">7.2 Our Service</h3>
              <p className="text-gray-300">
                The Service, including all code, design, and features, is owned by Social Media Automator. You may not copy, modify, or reverse engineer our service.
              </p>
            </section>

            {/* Disclaimers */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">8. Disclaimers</h2>
              <p className="text-gray-300 mb-4">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li>Uninterrupted or error-free service</li>
                <li>Specific engagement or growth results</li>
                <li>Compatibility with all social media platforms</li>
                <li>AI-generated content quality or accuracy</li>
                <li>Success of your social media strategy</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-300">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside mt-4">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of profits, data, or revenue</li>
                <li>Account suspensions on third-party platforms</li>
                <li>Failed posts or scheduling errors</li>
                <li>AI-generated content that violates platform policies</li>
              </ul>
              <p className="text-gray-300 mt-4">
                Our total liability is limited to the amount you paid in the last 12 months.
              </p>
            </section>

            {/* Termination */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
              
              <h3 className="text-xl font-semibold text-white mb-3">We may suspend or terminate your account if:</h3>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li>You violate these Terms</li>
                <li>You engage in fraudulent activity</li>
                <li>You fail to pay subscription fees</li>
                <li>Required by law or platform policies</li>
              </ul>
              
              <p className="text-gray-300 mt-4">
                You may terminate your account anytime from Settings. Upon termination, your data will be deleted within 30 days.
              </p>
            </section>

            {/* Governing Law */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">11. Governing Law</h2>
              <p className="text-gray-300">
                These Terms are governed by the laws of the United States and the State of [Your State]. Any disputes will be resolved in the courts of [Your State].
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to Terms</h2>
              <p className="text-gray-300">
                We reserve the right to modify these Terms at any time. We will provide notice of material changes via email or website notification. Continued use after changes constitutes acceptance.
              </p>
            </section>

            {/* Contact */}
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact & Support</h2>
              <ul className="text-gray-300 space-y-2">
                <li><strong>General Support:</strong> support@socialmediaautomator.com</li>
                <li><strong>Legal Questions:</strong> legal@socialmediaautomator.com</li>
                <li><strong>Billing Issues:</strong> billing@socialmediaautomator.com</li>
                <li><strong>Website:</strong> https://socialmediaautomator.com</li>
              </ul>
            </section>

            {/* Acknowledgment */}
            <section className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">✅ Acknowledgment</h2>
              <p className="text-gray-300 leading-relaxed">
                BY USING SOCIAL MEDIA AUTOMATOR, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE AND OUR PRIVACY POLICY.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

