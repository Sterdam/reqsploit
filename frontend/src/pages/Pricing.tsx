/**
 * Pricing Page - Plan selection and upgrade flow
 */

import { useState, useEffect } from 'react';
import { Check, Zap, Sparkles, Crown } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: {
    aiTokens: number;
    requestHistory: number;
    projects: number;
  };
  popular?: boolean;
}

export function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { user, getToken } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/plans`);
      const data = await response.json();
      if (data.success) {
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (planId === 'FREE') {
      return; // Can't "upgrade" to free
    }

    setUpgrading(planId);
    try {
      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();
      if (data.success) {
        // Redirect to Stripe checkout
        window.location.href = data.data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      alert('Failed to create checkout session');
    } finally {
      setUpgrading(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'FREE':
        return <Zap className="w-8 h-8" />;
      case 'PRO':
        return <Sparkles className="w-8 h-8" />;
      case 'ENTERPRISE':
        return <Crown className="w-8 h-8" />;
      default:
        return null;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'FREE':
        return 'from-gray-600 to-gray-700';
      case 'PRO':
        return 'from-blue-600 to-purple-600';
      case 'ENTERPRISE':
        return 'from-purple-600 to-pink-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-deep-navy flex items-center justify-center">
        <div className="text-white text-lg">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-navy py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400">
            Start free, upgrade anytime. No credit card required.
          </p>
        </div>

        {/* Current Plan Badge */}
        {user && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-600/30 rounded-lg">
              <span className="text-blue-400 font-medium">Current Plan:</span>
              <span className="text-white font-bold">{user.plan}</span>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border ${
                plan.popular
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'border-white/10'
              } bg-white/5 backdrop-blur-sm overflow-hidden`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}

              <div className="p-8">
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${getPlanColor(plan.id)} mb-4`}>
                  {getPlanIcon(plan.id)}
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-gray-400 ml-2">/ {plan.interval}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgrading === plan.id || user?.plan === plan.id}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {upgrading === plan.id ? (
                    'Processing...'
                  ) : user?.plan === plan.id ? (
                    'Current Plan'
                  ) : plan.id === 'FREE' ? (
                    'Get Started'
                  ) : (
                    'Upgrade Now'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ/Trust Section */}
        <div className="mt-16 text-center">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <h4 className="text-white font-semibold mb-2">Cancel Anytime</h4>
              <p className="text-gray-400 text-sm">
                No contracts, no commitments. Cancel your subscription anytime.
              </p>
            </div>
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <h4 className="text-white font-semibold mb-2">Secure Payments</h4>
              <p className="text-gray-400 text-sm">
                Powered by Stripe. Your payment information is always secure.
              </p>
            </div>
            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
              <h4 className="text-white font-semibold mb-2">Instant Access</h4>
              <p className="text-gray-400 text-sm">
                Get immediate access to all features upon successful payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
