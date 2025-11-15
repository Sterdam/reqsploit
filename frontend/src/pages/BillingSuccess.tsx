/**
 * Billing Success Page - Shown after successful Stripe checkout
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export function BillingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-deep-navy flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="inline-flex p-4 rounded-full bg-green-600/20 border border-green-600/30 mb-6">
          <CheckCircle className="w-16 h-16 text-green-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Payment Successful!
        </h1>

        {/* Message */}
        <p className="text-gray-400 mb-8">
          Your subscription has been activated. You now have access to all premium features.
        </p>

        {/* Session ID (for debugging) */}
        {sessionId && (
          <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Session ID</p>
            <p className="text-xs text-gray-400 font-mono break-all">{sessionId}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/settings/billing')}
            className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition"
          >
            Manage Subscription
          </button>
        </div>

        {/* Auto-redirect Notice */}
        <p className="text-sm text-gray-500 mt-8">
          Redirecting to dashboard in 5 seconds...
        </p>
      </div>
    </div>
  );
}
