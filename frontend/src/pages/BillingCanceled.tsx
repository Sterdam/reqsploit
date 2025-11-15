/**
 * Billing Canceled Page - Shown when user cancels Stripe checkout
 */

import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

export function BillingCanceled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-deep-navy flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Cancel Icon */}
        <div className="inline-flex p-4 rounded-full bg-gray-600/20 border border-gray-600/30 mb-6">
          <XCircle className="w-16 h-16 text-gray-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Payment Canceled
        </h1>

        {/* Message */}
        <p className="text-gray-400 mb-8">
          Your payment was canceled. No charges were made to your account.
        </p>

        {/* Reassurance */}
        <div className="mb-8 p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
          <p className="text-sm text-blue-400">
            You can still enjoy all the features of your current plan. Upgrade anytime when you're ready!
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition"
          >
            <CreditCard className="w-5 h-5" />
            View Plans Again
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
