import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { AlertCircle, Info, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Format error messages to be more user-friendly
  const getErrorMessage = (errorText: string): { type: 'error' | 'warning' | 'info'; message: string } => {
    const lowerError = errorText.toLowerCase();

    // Invalid credentials
    if (lowerError.includes('invalid credentials') || lowerError.includes('incorrect password')) {
      return {
        type: 'error',
        message: 'Invalid email or password. Please check your credentials and try again.'
      };
    }

    // User not found
    if (lowerError.includes('user not found') || lowerError.includes('does not exist')) {
      return {
        type: 'error',
        message: 'No account found with this email address. Please sign up first.'
      };
    }

    // Account inactive
    if (lowerError.includes('inactive') || lowerError.includes('disabled')) {
      return {
        type: 'warning',
        message: 'Your account has been disabled. Please contact support.'
      };
    }

    // Network errors
    if (lowerError.includes('network') || lowerError.includes('fetch failed')) {
      return {
        type: 'error',
        message: 'Unable to connect to server. Please check your internet connection.'
      };
    }

    // Rate limiting
    if (lowerError.includes('too many') || lowerError.includes('rate limit')) {
      return {
        type: 'warning',
        message: 'Too many login attempts. Please wait a few minutes and try again.'
      };
    }

    // Default fallback
    return {
      type: 'error',
      message: errorText || 'An error occurred during login. Please try again.'
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-navy via-deep-navy to-electric-blue/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/icons/icon-96x96.png" alt="ReqSploit" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-4xl font-bold text-white mb-2">
            Req<span className="text-cyber-green">Sploit</span>
          </h1>
          <p className="text-gray-400">Web Security Testing & AI Analysis</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl p-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6">Sign In</h2>

          {error && (() => {
            const { type, message } = getErrorMessage(error);
            const styles = {
              error: {
                bg: 'bg-red-500/20',
                border: 'border-red-500/50',
                text: 'text-red-200',
                icon: AlertCircle,
                iconColor: 'text-red-400'
              },
              warning: {
                bg: 'bg-yellow-500/20',
                border: 'border-yellow-500/50',
                text: 'text-yellow-200',
                icon: AlertCircle,
                iconColor: 'text-yellow-400'
              },
              info: {
                bg: 'bg-blue-500/20',
                border: 'border-blue-500/50',
                text: 'text-blue-200',
                icon: Info,
                iconColor: 'text-blue-400'
              }
            };

            const style = styles[type];
            const Icon = style.icon;

            return (
              <div role="alert" className={`mb-4 p-3 ${style.bg} border ${style.border} rounded-md flex items-start gap-3`}>
                <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <p className={`${style.text} text-sm font-medium`}>{message}</p>
                </div>
              </div>
            );
          })()}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2 pr-10 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <span className="text-sm text-gray-500 cursor-default" title="Password reset coming soon">
                Forgot password?
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-electric-blue hover:bg-electric-blue/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors duration-200"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <p className="mt-6 text-center text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyber-green hover:text-cyber-green/80 font-medium">
              Sign up
            </Link>
          </p>

          {/* Test Account Info - dev only */}
          {import.meta.env.DEV && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-blue-200 font-medium mb-2">Demo Account (dev only):</p>
                  <div className="space-y-1 text-xs text-gray-300 font-mono">
                    <p className="flex items-center gap-2">
                      <span className="text-blue-300">test@test.com</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-blue-300">Test1234</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
