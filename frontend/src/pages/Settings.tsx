import { useState } from 'react';
import { User, Shield, CreditCard, Bell, Key, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

type Tab = 'profile' | 'security' | 'billing' | 'notifications' | 'api';

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { user, logout } = useAuthStore();

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
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition border border-red-600/20"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
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
            <div className="bg-white/5 border border-white/10 rounded-xl p-8">
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
            defaultValue={user?.name}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <input
            type="email"
            defaultValue={user?.email}
            disabled
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
            <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
              Upgrade Plan →
            </a>
          </div>
        </div>

        <div className="pt-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
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
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
          <input
            type="password"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Enter new password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
          <input
            type="password"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Confirm new password"
          />
        </div>

        <div className="pt-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
            Update Password
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Two-Factor Authentication</h3>
        <p className="text-gray-400 mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition font-medium border border-white/10">
          Enable 2FA (Coming Soon)
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Billing & Subscription</h2>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{user?.plan || 'FREE'} Plan</h3>
            <p className="text-gray-300 text-sm mt-1">
              {user?.plan === 'FREE' && 'Basic features with 10,000 AI tokens/month'}
              {user?.plan === 'PRO' && '$29/month • 100,000 AI tokens/month'}
              {user?.plan === 'ENTERPRISE' && '$99/month • 500,000 AI tokens/month'}
            </p>
          </div>
          {user?.plan !== 'ENTERPRISE' && (
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
              Upgrade
            </button>
          )}
        </div>

        {/* Token Usage */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">AI Tokens Used</span>
            <span className="text-sm text-white font-medium">0 / 10,000</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
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
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
              Add Payment Method
            </button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                  VISA
                </div>
                <div>
                  <p className="text-white font-medium">•••• •••• •••• 4242</p>
                  <p className="text-sm text-gray-400">Expires 12/2025</p>
                </div>
              </div>
              <button className="text-sm text-blue-400 hover:text-blue-300">Update</button>
            </div>
          </div>
        )}
      </div>

      {/* Billing History */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Billing History</h3>
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                  No billing history yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [vulnerabilityAlerts, setVulnerabilityAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Notification Preferences</h2>
      </div>

      <div className="space-y-4">
        {/* Email Notifications */}
        <div className="flex items-center justify-between py-4 border-b border-white/10">
          <div>
            <h3 className="text-white font-medium">Email Notifications</h3>
            <p className="text-sm text-gray-400 mt-1">Receive email notifications for important updates</p>
          </div>
          <button
            onClick={() => setEmailNotifs(!emailNotifs)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              emailNotifs ? 'bg-blue-600' : 'bg-white/20'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                emailNotifs ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Vulnerability Alerts */}
        <div className="flex items-center justify-between py-4 border-b border-white/10">
          <div>
            <h3 className="text-white font-medium">Vulnerability Alerts</h3>
            <p className="text-sm text-gray-400 mt-1">Get notified when AI detects critical vulnerabilities</p>
          </div>
          <button
            onClick={() => setVulnerabilityAlerts(!vulnerabilityAlerts)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              vulnerabilityAlerts ? 'bg-blue-600' : 'bg-white/20'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                vulnerabilityAlerts ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Weekly Reports */}
        <div className="flex items-center justify-between py-4">
          <div>
            <h3 className="text-white font-medium">Weekly Reports</h3>
            <p className="text-sm text-gray-400 mt-1">Receive weekly summary of your pentesting activity</p>
          </div>
          <button
            onClick={() => setWeeklyReports(!weeklyReports)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              weeklyReports ? 'bg-blue-600' : 'bg-white/20'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                weeklyReports ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="pt-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
          Save Preferences
        </button>
      </div>
    </div>
  );
}

function APIKeysTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">API Keys</h2>
        <p className="text-gray-400">Manage API keys for programmatic access to PentestAI Proxy</p>
      </div>

      <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
        <p className="text-blue-400 text-sm">
          ℹ️ API access is available on Pro and Enterprise plans only
        </p>
      </div>

      <div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium">
          Generate New API Key
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center text-gray-400">
        No API keys created yet
      </div>
    </div>
  );
}
