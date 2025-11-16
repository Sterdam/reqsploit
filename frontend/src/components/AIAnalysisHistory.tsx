/**
 * AI Analysis History Panel
 *
 * Features:
 * - Chronological list of past analyses
 * - Search and filter by severity, date, URL
 * - Quick reload of past analysis
 * - Retention period based on subscription plan
 * - Visual severity indicators
 */

import { useState, useEffect } from 'react';
import {
  History,
  Search,
  Calendar,
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Clock,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { aiAPI, type AIAnalysis } from '../lib/api';
import { useAIStore } from '../stores/aiStore';

interface AIAnalysisHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

export function AIAnalysisHistory({ isOpen, onClose }: AIAnalysisHistoryProps) {
  const { setActiveAnalysis } = useAIStore();
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [sortBy, setSortBy] = useState<'date' | 'severity'>('date');

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const history = await aiAPI.getHistory(100); // Get last 100 analyses
      setAnalyses(history);
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnalysis = (analysis: AIAnalysis) => {
    setActiveAnalysis(analysis, true);
    onClose();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/40';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'LOW':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'HIGH':
        return <AlertCircle className="w-3.5 h-3.5" />;
      case 'MEDIUM':
        return <Shield className="w-3.5 h-3.5" />;
      default:
        return <Info className="w-3.5 h-3.5" />;
    }
  };

  const getHighestSeverity = (analysis: AIAnalysis): string => {
    const vulns = analysis.vulnerabilities || [];
    if (vulns.some(v => v.severity === 'CRITICAL')) return 'CRITICAL';
    if (vulns.some(v => v.severity === 'HIGH')) return 'HIGH';
    if (vulns.some(v => v.severity === 'MEDIUM')) return 'MEDIUM';
    if (vulns.some(v => v.severity === 'LOW')) return 'LOW';
    return 'INFO';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getRetentionInfo = (): { days: number; label: string } => {
    // This would come from user's plan in production
    const plan = 'FREE' as 'FREE' | 'PRO' | 'ENTERPRISE'; // TODO: Get from auth store

    if (plan === 'PRO') {
      return { days: 30, label: '30 days' };
    }
    if (plan === 'ENTERPRISE') {
      return { days: Infinity, label: 'Unlimited' };
    }
    return { days: 7, label: '7 days' };
  };

  // Filter and sort analyses
  const filteredAnalyses = analyses
    .filter(analysis => {
      // Search filter - search in URL, method, and request ID
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const url = (analysis.requestUrl || '').toLowerCase();
        const method = (analysis.requestMethod || '').toLowerCase();
        const requestId = (analysis.requestId || '').toLowerCase();

        const matches = url.includes(search) ||
                       method.includes(search) ||
                       requestId.includes(search);

        if (!matches) return false;
      }

      // Severity filter
      if (severityFilter !== 'all') {
        const highestSeverity = getHighestSeverity(analysis);
        if (highestSeverity.toLowerCase() !== severityFilter) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
        const aSev = getHighestSeverity(a);
        const bSev = getHighestSeverity(b);
        return severityOrder[aSev as keyof typeof severityOrder] - severityOrder[bSev as keyof typeof severityOrder];
      }
    });

  const retention = getRetentionInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A1929] border border-white/20 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-electric-blue/20 rounded-lg">
              <History className="w-5 h-5 text-electric-blue" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Analysis History</h2>
              <p className="text-xs text-gray-400">
                Retention: {retention.label} • {filteredAnalyses.length} analyses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-white/10 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by URL, method, or request ID..."
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-electric-blue/50 transition"
            />
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-3">
            {/* Severity filter */}
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-electric-blue/50 transition"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'severity')}
                className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-electric-blue/50 transition"
              >
                <option value="date">Sort by Date</option>
                <option value="severity">Sort by Severity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Analysis List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <History className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400 text-sm">
                {searchTerm || severityFilter !== 'all'
                  ? 'No analyses match your filters'
                  : 'No analysis history yet'}
              </p>
            </div>
          ) : (
            filteredAnalyses.map((analysis) => {
              const severity = getHighestSeverity(analysis);
              const vulnCount = analysis.vulnerabilities?.length || 0;
              const suggestionCount = Array.isArray(analysis.suggestions) ? analysis.suggestions.length : 0;

              return (
                <button
                  key={analysis.analysisId}
                  onClick={() => handleSelectAnalysis(analysis)}
                  className="w-full p-3 bg-[#0D1F2D] hover:bg-[#162C3D] border border-white/10 hover:border-white/20 rounded-lg transition text-left group"
                >
                  <div className="flex items-start gap-3">
                    {/* Severity indicator */}
                    <div className={`flex-shrink-0 px-2 py-1 ${getSeverityColor(severity)} border rounded-md flex items-center gap-1.5`}>
                      {getSeverityIcon(severity)}
                      <span className="text-xs font-bold">{severity}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white truncate">
                          {analysis.requestUrl || 'Unknown URL'}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(analysis.timestamp)}
                        </span>
                      </div>

                      {/* Method and Analysis Type */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {analysis.requestMethod && (
                          <span className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 font-mono">
                            {analysis.requestMethod}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-white/5 rounded">
                          {analysis.analysisType}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {vulnCount} vulnerabilities
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {suggestionCount} suggestions
                        </span>
                        <span className="px-2 py-0.5 bg-white/5 rounded text-xs">
                          {analysis.analysisType}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition flex-shrink-0" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Showing {filteredAnalyses.length} of {analyses.length} analyses
          </div>
          <button
            onClick={loadHistory}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs text-white transition"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
