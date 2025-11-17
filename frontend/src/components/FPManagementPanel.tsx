import { useState, useEffect } from 'react';
import { aiAPI } from '../lib/api';
import { X, Shield, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';

/**
 * False Positive Management Panel (Module 3.1)
 * Compact UI for managing dismissed vulnerabilities and patterns
 */

interface FPStats {
  totalDismissed: number;
  totalPatterns: number;
  activePatterns: number;
  averageConfidence: number;
  totalMatches: number;
}

interface FPPattern {
  id: string;
  vulnerabilityType: string;
  confidence: number;
  matchCount: number;
  isActive: boolean;
  createdAt: string;
}

export function FPManagementPanel({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<FPStats | null>(null);
  const [patterns, setPatterns] = useState<FPPattern[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [showInactive]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, patternsData] = await Promise.all([
        aiAPI.getFalsePositiveStats(),
        aiAPI.getFalsePositivePatterns(!showInactive),
      ]);
      setStats(statsData);
      setPatterns(patternsData);
    } catch (error) {
      console.error('Failed to load FP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePattern = async (patternId: string) => {
    try {
      await aiAPI.toggleFalsePositivePattern(patternId);
      await loadData();
    } catch (error) {
      console.error('Failed to toggle pattern:', error);
    }
  };

  const handleDeletePattern = async (patternId: string) => {
    if (!confirm('Delete this pattern? This cannot be undone.')) return;
    try {
      await aiAPI.deleteFalsePositivePattern(patternId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete pattern:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">False Positive Management</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard label="Dismissed" value={stats.totalDismissed} />
                <StatCard label="Patterns" value={stats.totalPatterns} />
                <StatCard label="Active" value={stats.activePatterns} color="green" />
                <StatCard label="Avg Confidence" value={`${stats.averageConfidence}%`} />
                <StatCard label="Total Matches" value={stats.totalMatches} />
              </div>
            )}

            {/* Patterns List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300">Learned Patterns</h3>
                <button
                  onClick={() => setShowInactive(!showInactive)}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
                >
                  {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {showInactive ? 'Show Active Only' : 'Show All'}
                </button>
              </div>

              {patterns.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No patterns yet. Dismiss vulnerabilities with "Create Pattern" to build your pattern library.
                </div>
              ) : (
                <div className="space-y-2">
                  {patterns.map((pattern) => (
                    <PatternCard
                      key={pattern.id}
                      pattern={pattern}
                      onToggle={() => handleTogglePattern(pattern.id)}
                      onDelete={() => handleDeletePattern(pattern.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'blue' }: { label: string; value: string | number; color?: string }) {
  const colorClasses = {
    blue: 'text-blue-400 border-blue-500/30',
    green: 'text-green-400 border-green-500/30',
  };

  return (
    <div className={`bg-gray-900 border ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} rounded p-3`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-xl font-semibold ${color === 'green' ? 'text-green-400' : 'text-blue-400'}`}>{value}</div>
    </div>
  );
}

function PatternCard({
  pattern,
  onToggle,
  onDelete,
}: {
  pattern: FPPattern;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`bg-gray-900 border ${pattern.isActive ? 'border-green-500/30' : 'border-gray-700'} rounded p-3`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{pattern.vulnerabilityType}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${pattern.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
              {pattern.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="text-xs text-gray-400">{pattern.confidence}% confidence</span>
            <span className="text-xs text-gray-400">{pattern.matchCount} matches</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggle} className="p-1.5 hover:bg-gray-700 rounded" title={pattern.isActive ? 'Deactivate' : 'Activate'}>
            {pattern.isActive ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
          </button>
          <button onClick={onDelete} className="p-1.5 hover:bg-red-900/50 rounded text-red-400" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
