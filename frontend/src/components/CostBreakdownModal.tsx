/**
 * Cost Breakdown Modal
 *
 * Features:
 * - Detailed cost breakdown by action type
 * - Visual charts showing token consumption
 * - Model cost comparison (Haiku vs Sonnet)
 * - Usage predictions based on historical data
 * - Cost transparency (actual vs SaaS pricing)
 * - Daily/weekly/monthly usage stats
 */

import { useState, useMemo, useEffect } from 'react';
import {
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Info,
  AlertCircle,
} from 'lucide-react';
import { useAIStore } from '../stores/aiStore';
import { aiAPI } from '../lib/api';

interface CostBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ActionStats {
  action: string;
  count: number;
  tokensUsed: number;
  cost: number;
  percentage: number;
}

export function CostBreakdownModal({ isOpen, onClose }: CostBreakdownModalProps) {
  const { tokenUsage, actionCosts, model } = useAIStore();
  const [selectedTab, setSelectedTab] = useState<'breakdown' | 'comparison' | 'predictions'>('breakdown');
  const [usageHistory, setUsageHistory] = useState<Array<{ date: string; tokensUsed: number; actions: number; byType: Record<string, number> }>>([]);

  // Load usage history from backend
  useEffect(() => {
    if (isOpen) {
      loadUsageHistory();
    }
  }, [isOpen]);

  const loadUsageHistory = async () => {
    try {
      const data = await aiAPI.getUsageHistory(30);
      setUsageHistory(data.history);
    } catch (error) {
      console.error('Failed to load usage history:', error);
      // Use fallback mock data if API fails
      setUsageHistory([
        { date: '2025-11-10', tokensUsed: 45000, actions: 12, byType: {} },
        { date: '2025-11-11', tokensUsed: 52000, actions: 15, byType: {} },
        { date: '2025-11-12', tokensUsed: 38000, actions: 10, byType: {} },
        { date: '2025-11-13', tokensUsed: 61000, actions: 18, byType: {} },
        { date: '2025-11-14', tokensUsed: 48000, actions: 14, byType: {} },
        { date: '2025-11-15', tokensUsed: 55000, actions: 16, byType: {} },
        { date: '2025-11-16', tokensUsed: 72000, actions: 22, byType: {} },
        { date: '2025-11-17', tokensUsed: 29000, actions: 8, byType: {} },
      ]);
    }
  };

  // Calculate action statistics
  const actionStats: ActionStats[] = useMemo(() => {
    if (!actionCosts.length || !usageHistory.length) return [];

    const totalUsed = usageHistory.reduce((sum, day) => sum + day.tokensUsed, 0);

    // Aggregate usage by type from history
    const usageByType: Record<string, { count: number; tokensUsed: number }> = {};

    usageHistory.forEach((day) => {
      Object.entries(day.byType || {}).forEach(([type, count]) => {
        if (!usageByType[type]) {
          usageByType[type] = { count: 0, tokensUsed: 0 };
        }
        usageByType[type].count += count;
        // Estimate tokens used (proportional distribution)
        const typePercentage = count / day.actions;
        usageByType[type].tokensUsed += Math.round(day.tokensUsed * typePercentage);
      });
    });

    // Map to action costs
    const stats = actionCosts.map((action) => {
      const usage = usageByType[action.action] || { count: 0, tokensUsed: 0 };
      const percentage = totalUsed > 0 ? (usage.tokensUsed / totalUsed) * 100 : 0;

      return {
        action: formatActionName(action.action),
        count: usage.count,
        tokensUsed: usage.tokensUsed,
        cost: action.haiku,
        percentage,
      };
    });

    return stats.filter(s => s.count > 0).sort((a, b) => b.tokensUsed - a.tokensUsed);
  }, [actionCosts, usageHistory]);

  // Calculate predictions
  const predictions = useMemo(() => {
    if (!usageHistory.length) {
      return {
        dailyAverage: 0,
        projectedTotal: 0,
        projectedRemaining: tokenUsage?.remaining || 0,
        daysUntilReset: 30,
        trend: 'down' as const,
        trendPercentage: 0,
        willExceed: false,
      };
    }

    const recentAverage = usageHistory.slice(-7).reduce((sum, day) => sum + day.tokensUsed, 0) / Math.min(7, usageHistory.length);
    const dailyAverage = usageHistory.reduce((sum, day) => sum + day.tokensUsed, 0) / usageHistory.length;

    const limit = tokenUsage?.limit || 100000;
    const remaining = tokenUsage?.remaining || 0;
    const used = limit - remaining;

    const daysUntilReset = tokenUsage ? Math.ceil((new Date(tokenUsage.resetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 30;
    const projectedTotal = used + (recentAverage * daysUntilReset);
    const projectedRemaining = Math.max(0, limit - projectedTotal);

    const trend = recentAverage > dailyAverage ? 'up' : 'down';
    const trendPercentage = Math.abs(((recentAverage - dailyAverage) / dailyAverage) * 100);

    return {
      dailyAverage: Math.round(recentAverage),
      projectedTotal: Math.round(projectedTotal),
      projectedRemaining: Math.round(projectedRemaining),
      daysUntilReset,
      trend,
      trendPercentage: Math.round(trendPercentage),
      willExceed: projectedTotal > limit,
    };
  }, [tokenUsage, usageHistory]);

  // Model comparison data
  const modelComparison = useMemo(() => {
    const haikuCost = actionCosts.find(a => a.action === 'analyzeRequest')?.haiku || 1000;
    const sonnetCost = actionCosts.find(a => a.action === 'analyzeRequest')?.sonnet || 12000;

    return {
      haiku: {
        name: 'Haiku 4.5',
        costPerAction: haikuCost,
        monthlyEstimate: Math.round(predictions.projectedTotal / 1000 * haikuCost / 1000),
        speed: 'Fast',
        quality: 'Good',
      },
      sonnet: {
        name: 'Sonnet 4.5',
        costPerAction: sonnetCost,
        monthlyEstimate: Math.round(predictions.projectedTotal / 1000 * sonnetCost / 1000),
        speed: 'Medium',
        quality: 'Excellent',
      },
    };
  }, [actionCosts, predictions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A1929] border border-white/20 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cost Breakdown & Analytics</h2>
              <p className="text-xs text-gray-400">Transparent AI token usage and pricing</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setSelectedTab('breakdown')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              selectedTab === 'breakdown'
                ? 'text-electric-blue border-b-2 border-electric-blue bg-electric-blue/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Usage Breakdown
          </button>
          <button
            onClick={() => setSelectedTab('comparison')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              selectedTab === 'comparison'
                ? 'text-electric-blue border-b-2 border-electric-blue bg-electric-blue/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Model Comparison
          </button>
          <button
            onClick={() => setSelectedTab('predictions')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              selectedTab === 'predictions'
                ? 'text-electric-blue border-b-2 border-electric-blue bg-electric-blue/10'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Predictions
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'breakdown' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0D1F2D] border border-white/10 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Total Used (Period)</div>
                  <div className="text-2xl font-bold text-white">
                    {usageHistory.reduce((sum, day) => sum + day.tokensUsed, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">tokens</div>
                </div>

                <div className="p-4 bg-[#0D1F2D] border border-white/10 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Remaining</div>
                  <div className="text-2xl font-bold text-electric-blue">
                    {tokenUsage?.remaining.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    of {tokenUsage?.limit.toLocaleString() || 0}
                  </div>
                </div>

                <div className="p-4 bg-[#0D1F2D] border border-white/10 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Total Actions</div>
                  <div className="text-2xl font-bold text-white">
                    {usageHistory.reduce((sum, day) => sum + day.actions, 0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">API calls</div>
                </div>
              </div>

              {/* Action Breakdown */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-electric-blue" />
                  Usage by Action Type
                </h3>

                <div className="space-y-2">
                  {actionStats.map((stat) => (
                    <div
                      key={stat.action}
                      className="p-3 bg-[#0D1F2D] border border-white/10 rounded-lg hover:border-white/20 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{stat.action}</span>
                        <span className="text-sm text-gray-400">{stat.count} calls</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-electric-blue transition-all"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{stat.tokensUsed.toLocaleString()} tokens</span>
                        <span className="text-gray-500">{stat.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Transparency */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-300 mb-1">Cost Transparency</h4>
                    <p className="text-xs text-blue-200/80 leading-relaxed">
                      You pay only for actual Claude API usage with a 4× transparent margin. Compare this to typical
                      SaaS AI tools charging $50-200/month for similar features. Your current usage would cost
                      ~${((tokenUsage?.limit || 100000) - (tokenUsage?.remaining || 0)) / 100000 * 5} this month vs $99+ elsewhere.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'comparison' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Haiku Card */}
                <div className={`p-4 border rounded-lg ${model === 'haiku-4.5' ? 'border-electric-blue bg-electric-blue/10' : 'border-white/10 bg-[#0D1F2D]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">{modelComparison.haiku.name}</h3>
                    {model === 'haiku-4.5' && (
                      <span className="px-2 py-1 bg-electric-blue text-white text-xs rounded-full">Active</span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Cost per action</span>
                      <span className="text-white font-medium">{modelComparison.haiku.costPerAction.toLocaleString()} tokens</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Speed</span>
                      <span className="text-green-400 font-medium">{modelComparison.haiku.speed}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Quality</span>
                      <span className="text-blue-400 font-medium">{modelComparison.haiku.quality}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <div className="text-xs text-gray-400 mb-1">Estimated Monthly</div>
                    <div className="text-xl font-bold text-white">${modelComparison.haiku.monthlyEstimate}</div>
                  </div>
                </div>

                {/* Sonnet Card */}
                <div className={`p-4 border rounded-lg ${model === 'sonnet-4.5' ? 'border-electric-blue bg-electric-blue/10' : 'border-white/10 bg-[#0D1F2D]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">{modelComparison.sonnet.name}</h3>
                    {model === 'sonnet-4.5' && (
                      <span className="px-2 py-1 bg-electric-blue text-white text-xs rounded-full">Active</span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Cost per action</span>
                      <span className="text-white font-medium">{modelComparison.sonnet.costPerAction.toLocaleString()} tokens</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Speed</span>
                      <span className="text-yellow-400 font-medium">{modelComparison.sonnet.speed}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Quality</span>
                      <span className="text-green-400 font-medium">{modelComparison.sonnet.quality}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <div className="text-xs text-gray-400 mb-1">Estimated Monthly</div>
                    <div className="text-xl font-bold text-white">${modelComparison.sonnet.monthlyEstimate}</div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-purple-300 mb-1">Recommendation</h4>
                    <p className="text-xs text-purple-200/80 leading-relaxed">
                      Use <strong>Auto mode</strong> to get the best balance. It automatically selects Haiku for quick
                      scans and Sonnet for deep analysis, optimizing both cost and quality.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'predictions' && (
            <div className="space-y-6">
              {/* Prediction Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0D1F2D] border border-white/10 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Daily Average (Last 7 days)</div>
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    {predictions.dailyAverage.toLocaleString()}
                    {predictions.trend === 'up' ? (
                      <TrendingUp className="w-5 h-5 text-orange-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <div className={`text-xs mt-1 ${predictions.trend === 'up' ? 'text-orange-400' : 'text-green-400'}`}>
                    {predictions.trend === 'up' ? '↑' : '↓'} {predictions.trendPercentage}% vs overall average
                  </div>
                </div>

                <div className="p-4 bg-[#0D1F2D] border border-white/10 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Projected Month-End</div>
                  <div className="text-2xl font-bold text-white">
                    {predictions.projectedTotal.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {predictions.projectedRemaining.toLocaleString()} remaining
                  </div>
                </div>
              </div>

              {/* Usage Timeline (Simple bar chart) */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Daily Usage Trend</h3>
                <div className="space-y-2">
                  {usageHistory.map((day) => {
                    const maxTokens = Math.max(...usageHistory.map(d => d.tokensUsed), 1);
                    const percentage = (day.tokensUsed / maxTokens) * 100;

                    return (
                      <div key={day.date} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-20 text-right">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex-1 h-8 bg-white/10 rounded overflow-hidden relative">
                          <div
                            className="h-full bg-electric-blue transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                          <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white">
                            {day.tokensUsed.toLocaleString()} tokens ({day.actions} actions)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Warning if will exceed */}
              {predictions.willExceed && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-300 mb-1">Usage Alert</h4>
                      <p className="text-xs text-red-200/80 leading-relaxed">
                        At your current rate, you may exceed your token limit before the reset date ({predictions.daysUntilReset} days).
                        Consider upgrading your plan or reducing usage.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Reset date: {tokenUsage ? new Date(tokenUsage.resetDate).toLocaleDateString() : 'N/A'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-sm text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to format action names
function formatActionName(action: string): string {
  const names: Record<string, string> = {
    analyzeRequest: 'Analyze Request',
    analyzeResponse: 'Analyze Response',
    analyzeTransaction: 'Analyze Transaction',
    generateExploits: 'Generate Exploits',
    generatePayloads: 'Generate Payloads',
    securityCheck: 'Security Check',
    explain: 'Explain',
    quickScan: 'Quick Scan',
    deepScan: 'Deep Scan',
    suggestTests: 'Suggest Tests',
    generateDorks: 'Generate Dorks',
    attackChain: 'Attack Chain',
  };

  return names[action] || action;
}
