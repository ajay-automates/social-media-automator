import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isActive = (path) => location.pathname === path || location.pathname === `${path}/`;
  
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🚀 Social Media Automator</h1>
            </div>
            <div className="ml-10 flex items-center space-x-4">
              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'}`}>Dashboard</Link>
              <Link to="/create" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/create') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'}`}>Create Post</Link>
              <Link to="/analytics" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/analytics') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'}`}>Analytics</Link>
              <Link to="/settings" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/settings') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'}`}>Settings</Link>
              <Link to="/pricing" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/pricing') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'}`}>Pricing</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button onClick={signOut} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <Navigation />
            
            <Routes>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
              <Route path="/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
              <Route path="/cancel" element={<ProtectedRoute><PaymentCancel /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              success: {
                duration: 4000,
                style: {
                  background: '#10B981',
                  color: '#fff',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10B981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#EF4444',
                  color: '#fff',
                },
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
