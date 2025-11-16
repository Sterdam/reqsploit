import { useEffect } from 'react';
import { useAIStore } from '../stores/aiStore';
import { Sparkles, RefreshCw, Settings } from 'lucide-react';

/**
 * AI Credits Widget
 *
 * Displays user's AI token balance with:
 * - Available tokens
 * - Progress bar
 * - Reset date
 * - Quick settings access
 */

export function AICreditsWidget() {
  const {
    tokenUsage,
    isLoadingCredits,
    model,
    mode,
    loadTokenUsage,
    setModel,
    setMode,
  } = useAIStore();

  // Fetch token usage on mount
  useEffect(() => {
    loadTokenUsage();
    // Refresh every 5 minutes
    const interval = setInterval(loadTokenUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadTokenUsage]);

  if (!tokenUsage && !isLoadingCredits) {
    return null;
  }

  const percentage = tokenUsage ? (tokenUsage.remaining / tokenUsage.limit) * 100 : 0;
  const isLow = percentage < 20;
  const isMedium = percentage < 50;

  const getColorClasses = () => {
    if (isLow) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (isMedium) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-electric-blue bg-electric-blue/20 border-electric-blue/30';
  };

  const getProgressColor = () => {
    if (isLow) return 'bg-red-500';
    if (isMedium) return 'bg-yellow-500';
    return 'bg-electric-blue';
  };

  return (
    <div className="relative group">
      {/* Main Widget */}
      <button
        onClick={() => loadTokenUsage()}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${getColorClasses()} hover:scale-105`}
      >
        <Sparkles className="w-4 h-4" />

        {isLoadingCredits ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <div className="flex flex-col items-start">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold">
                  {tokenUsage?.remaining.toLocaleString() || 0}
                </span>
                <span className="text-xs opacity-70">/ {tokenUsage?.limit.toLocaleString() || 0}</span>
              </div>
              <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getProgressColor()}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 top-full mt-2 w-72 bg-[#0D1F2D] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-electric-blue" />
              AI Tokens
            </h3>
            <Settings className="w-4 h-4 text-gray-400" />
          </div>

          {tokenUsage && (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-2xl font-bold ${isLow ? 'text-red-400' : isMedium ? 'text-yellow-400' : 'text-electric-blue'}`}>
                  {tokenUsage.remaining.toLocaleString()}
                </span>
                <span className="text-sm text-gray-400">/ {tokenUsage.limit.toLocaleString()} tokens</span>
              </div>

              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getProgressColor()}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Resets on {new Date(tokenUsage.resetDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </>
          )}
        </div>

        {/* Model Selection */}
        <div className="p-4 border-b border-white/10">
          <label className="text-xs text-gray-400 mb-2 block">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as any)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
          >
            <option value="auto">Auto (Recommended)</option>
            <option value="haiku-4.5">Haiku 4.5 (Fast)</option>
            <option value="sonnet-4.5">Sonnet 4.5 (Precise)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {model === 'auto' && 'Automatically selects optimal model'}
            {model === 'haiku-4.5' && 'Fast and cost-effective'}
            {model === 'sonnet-4.5' && 'Deep analysis, higher cost'}
          </p>
        </div>

        {/* Mode Selection */}
        <div className="p-4">
          <label className="text-xs text-gray-400 mb-2 block">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
          >
            <option value="EDUCATIONAL">Educational</option>
            <option value="DEFAULT">Default</option>
            <option value="ADVANCED">Advanced</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {mode === 'EDUCATIONAL' && 'Detailed explanations for learning'}
            {mode === 'DEFAULT' && 'Balanced analysis and speed'}
            {mode === 'ADVANCED' && 'Deep technical analysis'}
          </p>
        </div>

        {/* Warning if low tokens */}
        {isLow && (
          <div className="p-4 bg-red-500/10 border-t border-red-500/30">
            <p className="text-xs text-red-400 flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              Low tokens! Consider upgrading your plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
