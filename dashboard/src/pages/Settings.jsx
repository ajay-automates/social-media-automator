import BillingSettings from '../components/BillingSettings';

export default function Settings() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-300">Manage your billing and usage</p>
      </div>

      {/* Billing Section */}
      <div className="bg-gray-900/30 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg p-6">
        <BillingSettings />
      </div>
    </div>
  );
}
