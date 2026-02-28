import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useAIStore } from '../stores/aiStore';
import { useExtensionStore } from '../stores/extensionStore';
import { LogOut, User, Menu, X, BookOpen, Wifi, Chrome } from 'lucide-react';
import { AIModelSelector } from './AIModelSelector';

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { tokenUsage } = useAIStore();
  const { isConnected, attachedTabs, interceptEnabled } = useExtensionStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'bg-gray-500';
      case 'PRO':
        return 'bg-electric-blue';
      case 'ENTERPRISE':
        return 'bg-cyber-green';
      default:
        return 'bg-gray-500';
    }
  };

  const tokenPercentage = tokenUsage
    ? (tokenUsage.used / tokenUsage.limit) * 100
    : 0;

  const getTokenColor = () => {
    if (tokenPercentage >= 90) return 'bg-red-500';
    if (tokenPercentage >= 75) return 'bg-yellow-500';
    return 'bg-cyber-green';
  };

  return (
    <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Logo + Extension Status */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-48x48.png" alt="ReqSploit" className="w-7 h-7 sm:w-8 sm:h-8" />
            <h1 className="text-lg sm:text-2xl font-bold text-white">
              Req<span className="text-cyber-green">Sploit</span>
            </h1>
          </div>
          <div className="hidden md:block h-6 w-px bg-white/20" />
          <p className="hidden md:block text-sm text-gray-400">AI Security Testing</p>

          {/* Extension Connection Indicator */}
          <div className="hidden md:block h-6 w-px bg-white/20" />
          {isConnected ? (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                interceptEnabled && attachedTabs.length > 0
                  ? 'bg-cyber-green/15 text-cyber-green border border-cyber-green/30'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}
              title={
                interceptEnabled && attachedTabs.length > 0
                  ? `Intercepting ${attachedTabs.length} tab${attachedTabs.length > 1 ? 's' : ''}`
                  : 'Extension connected'
              }
            >
              <Wifi className="w-3 h-3" />
              <span className="hidden sm:inline">
                {interceptEnabled && attachedTabs.length > 0
                  ? `Intercepting (${attachedTabs.length})`
                  : 'Connected'}
              </span>
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  interceptEnabled && attachedTabs.length > 0
                    ? 'bg-cyber-green animate-pulse'
                    : 'bg-blue-400'
                }`}
              />
            </div>
          ) : (
            <button
              onClick={() => navigate('/extension')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30 transition-all cursor-pointer"
              title="Install the Chrome extension to start intercepting"
            >
              <Chrome className="w-3 h-3" />
              <span className="hidden sm:inline">Get Extension</span>
            </button>
          )}
        </div>

        {/* Desktop User Info */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6">
          {/* Token Usage */}
          {tokenUsage && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">AI Tokens</p>
                <p className="text-sm font-medium text-white">
                  {tokenUsage.remaining.toLocaleString()} / {tokenUsage.limit.toLocaleString()}
                </p>
              </div>
              <div className="w-24 xl:w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getTokenColor()} transition-all duration-300`}
                  style={{ width: `${tokenPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* AI Model Selector */}
          <AIModelSelector />

          {/* Documentation Button */}
          <button
            onClick={() => navigate('/docs')}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-md transition-colors duration-200 text-sm"
            title="Documentation"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden xl:inline">Docs</span>
          </button>

          {/* Plan Badge */}
          {user && (
            <div className={`px-3 py-1 ${getPlanColor(user.plan)} rounded-full`}>
              <span className="text-xs font-semibold text-white">{user.plan}</span>
            </div>
          )}

          {/* User Name */}
          {user && (
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors duration-200 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden xl:inline">Logout</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="lg:hidden p-2 hover:bg-white/10 rounded-md transition"
          aria-label="Toggle menu"
        >
          {showMobileMenu ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Menu className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden mt-4 pt-4 border-t border-white/10 space-y-3">
          {/* Extension Status (Mobile) */}
          {isConnected ? (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                interceptEnabled && attachedTabs.length > 0
                  ? 'bg-cyber-green/10 border border-cyber-green/20'
                  : 'bg-blue-500/10 border border-blue-500/20'
              }`}
            >
              <Wifi className={`w-4 h-4 ${interceptEnabled && attachedTabs.length > 0 ? 'text-cyber-green' : 'text-blue-400'}`} />
              <span className={`text-sm font-medium ${
                interceptEnabled && attachedTabs.length > 0 ? 'text-cyber-green' : 'text-blue-400'
              }`}>
                {interceptEnabled && attachedTabs.length > 0
                  ? `Intercepting ${attachedTabs.length} tab${attachedTabs.length > 1 ? 's' : ''}`
                  : 'Extension Connected'}
              </span>
            </div>
          ) : (
            <button
              onClick={() => { navigate('/extension'); setShowMobileMenu(false); }}
              className="w-full flex items-center gap-2 p-3 rounded-lg bg-blue-600/10 border border-blue-600/20 hover:bg-blue-600/20 transition"
            >
              <Chrome className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Get Chrome Extension</span>
            </button>
          )}

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <div className={`px-2 py-1 ${getPlanColor(user.plan)} rounded-full`}>
                <span className="text-xs font-semibold text-white">{user.plan}</span>
              </div>
            </div>
          )}

          {/* Token Usage */}
          {tokenUsage && (
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">AI Tokens</p>
                <p className="text-sm font-medium text-white">
                  {tokenUsage.remaining.toLocaleString()} / {tokenUsage.limit.toLocaleString()}
                </p>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getTokenColor()} transition-all duration-300`}
                  style={{ width: `${tokenPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* AI Model Selector */}
          <div className="flex justify-center">
            <AIModelSelector />
          </div>

          {/* Documentation Button */}
          <button
            onClick={() => { navigate('/docs'); setShowMobileMenu(false); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-md transition-colors duration-200 text-sm"
          >
            <BookOpen className="w-4 h-4" />
            Documentation
          </button>

          {/* Logout Button */}
          <button
            onClick={() => { handleLogout(); setShowMobileMenu(false); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors duration-200 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
