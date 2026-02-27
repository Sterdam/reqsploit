import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { AlertCircle, Info, Check, X } from 'lucide-react';

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-cyber-green'];
  return { score, label: labels[score] || '', color: colors[score] || '' };
}

export function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setValidationError('Password must contain at least one uppercase letter');
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
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

  const displayError = validationError || error;

  // Format error messages to be more user-friendly
  const getErrorMessage = (errorText: string): { type: 'error' | 'warning' | 'info'; message: string } => {
    const lowerError = errorText.toLowerCase();

    // Validation errors (client-side)
    if (lowerError.includes('passwords do not match')) {
      return {
        type: 'error',
        message: 'The passwords you entered do not match. Please check and try again.'
      };
    }

    if (lowerError.includes('password must be at least')) {
      return {
        type: 'error',
        message: 'Password is too short. Please use at least 8 characters.'
      };
    }

    if (lowerError.includes('uppercase letter')) {
      return {
        type: 'error',
        message: 'Password must contain at least one uppercase letter (A-Z).'
      };
    }

    // Email already exists
    if (lowerError.includes('email already') || lowerError.includes('user already exists')) {
      return {
        type: 'warning',
        message: 'An account with this email already exists. Please sign in or use a different email.'
      };
    }

    // Invalid email format
    if (lowerError.includes('invalid email') || lowerError.includes('email format')) {
      return {
        type: 'error',
        message: 'Please enter a valid email address.'
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
        message: 'Too many registration attempts. Please wait a few minutes and try again.'
      };
    }

    // Default fallback
    return {
      type: 'error',
      message: errorText || 'An error occurred during registration. Please try again.'
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-navy via-deep-navy to-electric-blue/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Req<span className="text-cyber-green">Sploit</span>
          </h1>
          <p className="text-gray-400">Modern MITM Proxy & Security Testing</p>
        </div>

        {/* Register Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl p-8 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6">Create Account</h2>

          {displayError && (() => {
            const { type, message } = getErrorMessage(displayError);
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
              <div className={`mb-4 p-3 ${style.bg} border ${style.border} rounded-md flex items-start gap-3`}>
                <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <p className={`${style.text} text-sm font-medium`}>{message}</p>
                </div>
              </div>
            );
          })()}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

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
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                placeholder="••••••••"
              />
              {formData.password && (() => {
                const { score, label, color } = getPasswordStrength(formData.password);
                return (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? color : 'bg-white/10'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{label}</p>
                  </div>
                );
              })()}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
                placeholder="••••••••"
              />
              {formData.confirmPassword && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${formData.password === formData.confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                  {formData.password === formData.confirmPassword
                    ? <><Check className="w-3 h-3" /> Passwords match</>
                    : <><X className="w-3 h-3" /> Passwords do not match</>}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-electric-blue hover:bg-electric-blue/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors duration-200"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-cyber-green hover:text-cyber-green/80 font-medium">
              Sign in
            </Link>
          </p>

          {/* Password Requirements Info */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-blue-200 font-medium mb-2">Password Requirements:</p>
                <ul className="space-y-1 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-400">•</span>
                    <span>At least 8 characters long</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Contains at least one uppercase letter (A-Z)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Both password fields must match</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
