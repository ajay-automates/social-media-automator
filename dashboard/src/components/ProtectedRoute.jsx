import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22d3ee] mx-auto"></div>
          <p className="mt-4 text-[#52525b]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // For testing - show demo mode instead of redirecting
    console.log('No user logged in - showing demo mode');
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="text-center p-8 bg-white rounded-xl max-w-md mx-4">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-[#52525b] mb-6">
            Please log in to access the dashboard. The app is running in protected mode.
          </p>
          <a
            href="/auth"
            className="bg-[#06b6d4] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#06b6d4] transition inline-block"
          >
            Go to Login →
          </a>
        </div>
      </div>
    );
  }

  return children;
}

