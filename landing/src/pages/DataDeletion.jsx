import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function DataDeletion() {
  const navigate = useNavigate();

  const steps = [
    {
      title: 'Submit a deletion request',
      details: [
        'Email privacy@socialmediaautomator.com with the subject line "Delete My Data".',
        'Send the email from the address associated with your Social Media Automator account so we can verify ownership.',
      ],
    },
    {
      title: 'Verify your identity',
      details: [
        'We will reply within 24 hours to confirm your request.',
        'If needed, we may ask for the last four digits of your billing method or a recent post ID to verify the request.',
      ],
    },
    {
      title: 'Data removal timeline',
      details: [
        'All account data (posts, media, analytics, team members, OAuth tokens) is permanently deleted within 7 business days.',
        'Backups containing your data are purged within 30 days.',
        'You will receive a confirmation email once deletion is complete.',
      ],
    },
  ];

  const dataScope = [
    'Account profile information (name, email, workspace settings)',
    'Connected social media credentials and access tokens',
    'Scheduled, drafted, and published post content stored in Social Media Automator',
    'Uploaded media assets and AI generated files stored in Cloudinary',
    'Analytics, usage logs, and automation history tied to your account',
    'Team invitations, roles, and collaboration data',
    'Billing history stored with Stripe (note: Stripe retains limited records to comply with financial regulations)',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
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

      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-white mb-4">Data Deletion Policy</h1>
          <p className="text-gray-400 mb-8">Last Updated: November 15, 2025</p>

          <div className="prose prose-invert prose-lg max-w-none space-y-8">
            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">How to request deletion</h2>
              <p className="text-gray-300 mb-6">
                We respect your right to be forgotten. Follow the simple steps below to permanently remove your
                Social Media Automator account and all related data.
              </p>

              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={step.title} className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="w-10 h-10 rounded-full bg-blue-600/30 flex items-center justify-center font-semibold text-blue-200">
                        {index + 1}
                      </span>
                      <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                    </div>
                    <ul className="text-gray-300 space-y-2 list-disc list-inside">
                      {step.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">What we delete</h2>
              <p className="text-gray-300 mb-4">
                Once we verify your request, we permanently delete the following information:
              </p>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                {dataScope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="text-gray-400 mt-4">
                Note: Posts already published to external platforms (LinkedIn, Twitter, etc.) must be removed
                directly from those services.
              </p>
            </section>

            <section className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Need help?</h2>
              <p className="text-gray-300 mb-4">
                If you have questions about data deletion or need urgent assistance, contact us:
              </p>
              <ul className="text-gray-300 space-y-2">
                <li>
                  <strong>Email:</strong> privacy@socialmediaautomator.com
                </li>
                <li>
                  <strong>Support Hours:</strong> Monday – Friday, 9am–6pm PST
                </li>
                <li>
                  <strong>Response Time:</strong> within 48 hours
                </li>
              </ul>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

