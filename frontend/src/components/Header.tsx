import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAIStore } from '../stores/aiStore';
import { LogOut, User, Menu, X } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuthStore();
  const { tokenUsage } = useAIStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
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
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="text-lg sm:text-2xl font-bold text-white">
            Interceptor<span className="text-cyber-green">AI</span>
          </h1>
          <div className="hidden md:block h-6 w-px bg-white/20" />
          <p className="hidden md:block text-sm text-gray-400">Security Testing Platform</p>
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

          {/* Logout Button */}
          <button
            onClick={handleLogout}
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
