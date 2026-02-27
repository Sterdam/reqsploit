import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, CreditCard, Bell, Key, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAIStore } from '../stores/aiStore';
import { toast } from '../stores/toastStore';
import api from '../lib/api';

type Tab = 'profile' | 'security' | 'billing' | 'notifications' | 'api';

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'security' as Tab, label: 'Security', icon: Shield },
    { id: 'billing' as Tab, label: 'Billing', icon: CreditCard },
    { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
    { id: 'api' as Tab, label: 'API Keys', icon: Key },
  ];

  return (
    <div className="min-h-screen bg-[#0A1929]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0A1929]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-400 mt-1">Manage your account and preferences</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition border border-red-600/20"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-8">
          {/* Sidebar — horizontal scroll on mobile, vertical on desktop */}
          <div className="lg:col-span-1">
            <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 scrollbar-thin scrollbar-thumb-white/10">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-4 py-3 rounded-lg transition whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 sm:p-8">
              {activeTab === 'profile' && <ProfileTab user={user} />}
              {activeTab === 'security' && <SecurityTab />}
              {activeTab === 'billing' && <BillingTab user={user} />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'api' && <APIKeysTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: any }) {
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const { loadUser } = useAuthStore();

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning('Validation', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/me', { name: name.trim() });
      await loadUser();
      toast.success('Profile Updated', 'Your name has been updated');
    } catch (err: any) {
      toast.error('Update Failed', err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <input
            type="email"
            defaultValue={user?.email}
            disabled
            autoComplete="email"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Plan</label>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30">
              {user?.plan || 'FREE'}
            </span>
            <a href="/pricing" className="text-sm text-blue-400 hover:text-blue-300">
              Upgrade Plan →
            </a>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning('Missing Fields', 'Please fill in all password fields');
      return;
    }
    if (newPassword.length < 8) {
      toast.warning('Weak Password', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mismatch', 'New password and confirmation do not match');
      return;
    }

    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password Changed', 'Your password has been updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('Password Change Failed', err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Security Settings</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Enter new password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Confirm new password"
          />
          {confirmPassword && newPassword && (
            <p className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
              {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
        </div>

        <div className="pt-4">
          <button
            onClick={handleChangePassword}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg transition font-medium"
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
          <span className="text-xs font-medium text-yellow-400 bg-yellow-600/20 px-2 py-0.5 rounded border border-yellow-600/30">
            Coming Soon
          </span>
        </div>
        <p className="text-gray-400 mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <button disabled className="bg-white/10 text-white/50 px-6 py-2 rounded-lg font-medium border border-white/10 opacity-50 cursor-not-allowed">
          Enable 2FA
        </button>
      </div>

      <div className="border-t border-white/10 pt-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Active Sessions</h3>
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Current Session</p>
              <p className="text-sm text-gray-400">Linux • Chrome • {new Date().toLocaleDateString()}</p>
            </div>
            <span className="text-xs text-green-400 bg-green-600/20 px-2 py-1 rounded">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingTab({ user }: { user: any }) {
  const { tokenUsage, loadTokenUsage } = useAIStore();

  useEffect(() => {
    loadTokenUsage();
  }, [loadTokenUsage]);

  const used = tokenUsage?.used ?? 0;
  const limit = tokenUsage?.limit ?? 10000;
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Billing & Subscription</h2>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{user?.plan || 'FREE'} Plan</h3>
            <p className="text-gray-300 text-sm mt-1">
              {user?.plan === 'FREE' && 'Basic features with 10,000 AI tokens/month'}
              {user?.plan === 'PRO' && '$29/month • 200,000 AI tokens/month'}
              {user?.plan === 'ENTERPRISE' && '$99/month • 1,000,000 AI tokens/month'}
            </p>
          </div>
          {user?.plan !== 'ENTERPRISE' && (
            <a href="/pricing" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium flex-shrink-0 text-center">
              Upgrade
            </a>
          )}
        </div>

        {/* Token Usage */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">AI Tokens Used</span>
            <span className="text-sm text-white font-medium">{used.toLocaleString()} / {limit.toLocaleString()}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit}>
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Resets on the 1st of each month</p>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
        {user?.plan === 'FREE' ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-4">No payment method on file</p>
            <a href="/pricing" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
              Upgrade to add a payment method
            </a>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
            <p className="text-gray-400 mb-4">Payment method managed by Stripe</p>
            <a
              href="/billing"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium"
            >
              Manage Billing
            </a>
          </div>
        )}
      </div>

      {/* Billing History */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Billing History</h3>
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
          <p className="text-gray-400 mb-4">
            {user?.plan === 'FREE'
              ? 'No billing history — you are on the Free plan'
              : 'View your invoices and billing history in the billing portal'}
          </p>
          {user?.plan !== 'FREE' && (
            <a
              href="/billing"
              className="inline-block text-sm text-blue-400 hover:text-blue-300"
            >
              Open Billing Portal →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const NOTIF_STORAGE_KEY = 'reqsploit-notification-prefs';

function NotificationsTab() {
  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return { emailNotifs: true, vulnerabilityAlerts: true, weeklyReports: false };
  });

  const toggle = (key: string) => {
    setPrefs((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(prefs));
    toast.success('Preferences Saved', 'Your notification preferences have been saved');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>
      </div>

      <div className="space-y-4">
        {[
          { key: 'emailNotifs', label: 'Email Notifications', desc: 'Receive email notifications for important updates' },
          { key: 'vulnerabilityAlerts', label: 'Vulnerability Alerts', desc: 'Get notified when AI detects critical vulnerabilities' },
          { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly summary of your pentesting activity' },
        ].map((item, i, arr) => (
          <div key={item.key} className={`flex items-center justify-between py-4 ${i < arr.length - 1 ? 'border-b border-white/10' : ''}`}>
            <div>
              <h3 className="text-white font-medium">{item.label}</h3>
              <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              aria-label={`Toggle ${item.label}`}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                prefs[item.key] ? 'bg-blue-600' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  prefs[item.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}

function APIKeysTab() {
  const { user } = useAuthStore();
  const isPaidPlan = user?.plan === 'PRO' || user?.plan === 'ENTERPRISE';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">API Keys</h2>
        <p className="text-gray-400">Manage API keys for programmatic access to ReqSploit</p>
      </div>

      {!isPaidPlan ? (
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <Key className="w-10 h-10 text-gray-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">API Access Requires a Paid Plan</h3>
          <p className="text-gray-400 text-sm mb-4">
            Upgrade to Pro or Enterprise to generate API keys and access ReqSploit programmatically.
          </p>
          <a href="/pricing" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
            View Plans
          </a>
        </div>
      ) : (
        <>
          <div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
              Generate New API Key
            </button>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center text-gray-400">
            No API keys created yet
          </div>
        </>
      )}
    </div>
  );
}
