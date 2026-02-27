import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useWebSocket } from './hooks/useWebSocket';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Documentation } from './pages/Documentation';
import { Pricing } from './pages/Pricing';
import { BillingSettings } from './pages/BillingSettings';
import { BillingSuccess } from './pages/BillingSuccess';
import { BillingCanceled } from './pages/BillingCanceled';
import { MagicScan } from './pages/MagicScan';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-navy flex flex-col items-center justify-center gap-4">
        <div className="text-2xl font-bold text-white">Req<span className="text-cyber-green">Sploit</span></div>
        <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading your workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route (redirect to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Smart 404 page - redirects authenticated users to dashboard
function NotFoundPage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-deep-navy flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-gray-400 mb-8">Page not found</p>
        <a
          href={isAuthenticated ? '/dashboard' : '/'}
          className="inline-block px-6 py-3 bg-electric-blue hover:bg-electric-blue/90 text-white rounded-md transition-colors font-medium"
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Go Home'}
        </a>
      </div>
    </div>
  );
}

export function App() {
  const { loadUser } = useAuthStore();

  // Initialize WebSocket connection
  useWebSocket();

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/docs"
          element={
            <ProtectedRoute>
              <Documentation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/success"
          element={
            <ProtectedRoute>
              <BillingSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/canceled"
          element={
            <ProtectedRoute>
              <BillingCanceled />
            </ProtectedRoute>
          }
        />
        <Route
          path="/magic-scan"
          element={
            <ProtectedRoute>
              <MagicScan />
            </ProtectedRoute>
          }
        />

        {/* Public Routes (no auth redirect) */}
        <Route path="/pricing" element={<Pricing />} />

        {/* Default Route */}
        <Route path="/" element={<Landing />} />

        {/* 404 */}
        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
