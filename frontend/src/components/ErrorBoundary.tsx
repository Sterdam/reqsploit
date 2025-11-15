/**
 * Error Boundary Component
 * Catches and displays React errors gracefully
 */

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || null,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-deep-navy flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#0D1F2D] border border-red-500/30 rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-red-500/10 border-b border-red-500/20 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">Something went wrong</h2>
                <p className="text-sm text-white/60 mt-1">
                  An unexpected error occurred in the application
                </p>
              </div>
            </div>

            {/* Error Details */}
            <div className="p-6">
              <div className="bg-[#0A1929] border border-white/10 rounded p-4 mb-4">
                <h3 className="text-sm font-medium text-red-400 mb-2">Error Message</h3>
                <p className="text-sm text-white/80 font-mono">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>

              {this.state.errorInfo && (
                <details className="bg-[#0A1929] border border-white/10 rounded p-4">
                  <summary className="text-sm font-medium text-white/60 cursor-pointer hover:text-white">
                    Stack Trace (click to expand)
                  </summary>
                  <pre className="mt-3 text-xs text-white/60 overflow-auto max-h-64 font-mono">
                    {this.state.errorInfo}
                  </pre>
                </details>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <p className="text-xs text-white/40">
                This error has been logged. You can try to recover or reload the page.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-medium transition"
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center gap-2 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
