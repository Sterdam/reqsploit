/**
 * Billing Settings Page - Manage subscription and billing
 */

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export function BillingSettings() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user, getToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/subscription`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setSubscription(data.data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading('portal');
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.data.url;
      } else {
        alert(data.error || 'Failed to open billing portal');
      }
    } catch (error: any) {
      console.error('Error opening portal:', error);
      alert('Failed to open billing portal');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      return;
    }

    setActionLoading('cancel');
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Subscription will be canceled at the end of the billing period');
        fetchSubscription();
      } else {
        alert(data.error || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    setActionLoading('reactivate');
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('Subscription reactivated successfully');
        fetchSubscription();
      } else {
        alert(data.error || 'Failed to reactivate subscription');
      }
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      alert('Failed to reactivate subscription');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'TRIALING':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'PAST_DUE':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'CANCELED':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-navy flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-navy py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
          <p className="text-gray-400">Manage your subscription and billing information</p>
        </div>

        {/* Current Plan */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Current Plan
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">Plan</p>
              <p className="text-2xl font-bold text-white">{user?.plan}</p>
            </div>

            {subscription && (
              <div>
                <p className="text-gray-400 text-sm mb-2">Status</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(subscription.status)}`}>
                  {subscription.status}
                </span>
              </div>
            )}
          </div>

          {subscription && subscription.status !== 'CANCELED' && (
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium mb-1">Billing Period</p>
                  <p className="text-sm text-gray-400">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {subscription?.cancelAtPeriodEnd && (
            <div className="mt-4 p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium mb-1">Subscription Ending</p>
                <p className="text-sm text-yellow-400/80">
                  Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Upgrade Plan */}
          {user?.plan === 'FREE' && (
            <button
              onClick={() => navigate('/pricing')}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition"
            >
              Upgrade to Pro or Enterprise
            </button>
          )}

          {/* Manage Subscription (Stripe Portal) */}
          {subscription && subscription.status !== 'CANCELED' && (
            <button
              onClick={handleManageSubscription}
              disabled={actionLoading === 'portal'}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'portal' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Manage Payment Method
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          )}

          {/* Cancel or Reactivate */}
          {subscription && subscription.status !== 'CANCELED' && (
            subscription.cancelAtPeriodEnd ? (
              <button
                onClick={handleReactivateSubscription}
                disabled={actionLoading === 'reactivate'}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-semibold rounded-lg border border-green-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'reactivate' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Reactivate Subscription'
                )}
              </button>
            ) : (
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'cancel'}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold rounded-lg border border-red-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'cancel' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Cancel Subscription'
                )}
              </button>
            )
          )}
        </div>

        {/* Information */}
        <div className="mt-8 p-6 bg-blue-600/10 border border-blue-600/30 rounded-xl">
          <h3 className="text-white font-semibold mb-2">Need Help?</h3>
          <p className="text-sm text-blue-400/80 mb-3">
            All payments are securely processed by Stripe. You can manage your subscription, update payment methods, and view invoices through the Stripe Customer Portal.
          </p>
          <p className="text-sm text-blue-400/80">
            For billing support, contact us at <a href="mailto:billing@reqsploit.com" className="underline">billing@reqsploit.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
