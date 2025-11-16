import { aiAPI } from '../lib/api';
import { useState } from 'react';
import { Sparkles, Play, Loader2, ChevronDown, ChevronUp, AlertTriangle, Shield, Zap, CheckCircle } from 'lucide-react';
import { useAIStore } from '../stores/aiStore';

interface TestSuggestion {
  id: string;
  name: string;
  description: string;
  category: 'sqli' | 'xss' | 'auth' | 'authz' | 'injection' | 'validation' | 'ratelimit' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  variations: Array<{
    description: string;
    method: string;
    url?: string;
    headers?: Record<string, string>;
    body?: string;
  }>;
  indicators: string[];
}

interface AITestSuggestions {
  tests: TestSuggestion[];
  summary: string;
}

interface RepeaterAIPanelProps {
  tabId: string;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  onExecuteTest: (test: TestSuggestion, variationIndex: number) => void;
  autoExecute: boolean;
  onToggleAutoExecute: (enabled: boolean) => void;
}

export function RepeaterAIPanel({
  tabId,
  request: _request,
  onExecuteTest,
  autoExecute,
  onToggleAutoExecute,
}: RepeaterAIPanelProps) {
  const { canAfford } = useAIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AITestSuggestions | null>(null);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [tokensUsed, setTokensUsed] = useState(0);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    return category.toUpperCase();
  };

  const handleSuggestTests = async () => {
    if (!canAfford('suggestTests')) {
      alert('Insufficient tokens to generate test suggestions');
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiAPI.suggestTests(tabId);
      setSuggestions(result.suggestions);
      setTokensUsed(result.tokensUsed);
    } catch (error) {
      console.error('Test suggestion failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate test suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTestExpanded = (testId: string) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  };

  return (
    <div className="w-80 border-l border-white/10 bg-[#0D1F2D] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-electric-blue" />
            <h3 className="text-sm font-semibold text-white">AI Test Assistant</h3>
          </div>
        </div>

        {/* Auto-Execute Toggle */}
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={autoExecute}
            onChange={(e) => onToggleAutoExecute(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-electric-blue focus:ring-electric-blue focus:ring-offset-0"
          />
          Auto-execute AI suggestions
        </label>

        {/* Suggest Tests Button */}
        <button
          onClick={handleSuggestTests}
          disabled={isLoading || !canAfford('suggestTests')}
          className="w-full mt-3 px-4 py-2 bg-electric-blue hover:bg-electric-blue/80 text-white rounded font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Suggest Tests (12K tokens)
            </>
          )}
        </button>

        {tokensUsed > 0 && (
          <p className="text-xs text-gray-400 mt-2">
            Tokens used: {tokensUsed.toLocaleString()}
          </p>
        )}
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto p-4">
        {!suggestions ? (
          <div className="text-center text-gray-400 text-sm py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Click "Suggest Tests" to get</p>
            <p>AI-powered security test recommendations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            {suggestions.summary && (
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-gray-300">{suggestions.summary}</p>
              </div>
            )}

            {/* Test List */}
            {suggestions.tests.map((test) => (
              <div
                key={test.id}
                className="bg-white/5 rounded-lg border border-white/10 overflow-hidden"
              >
                {/* Test Header */}
                <button
                  onClick={() => toggleTestExpanded(test.id)}
                  className="w-full p-3 flex items-start gap-3 hover:bg-white/5 transition"
                >
                  <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(test.severity)}</div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {test.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 ${getSeverityColor(
                          test.severity
                        )} rounded text-xs font-semibold text-white flex-shrink-0`}
                      >
                        {test.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{test.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-300">
                        {getCategoryIcon(test.category)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {test.variations.length} variation{test.variations.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {expandedTests.has(test.id) ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Test Details (Expanded) */}
                {expandedTests.has(test.id) && (
                  <div className="px-3 pb-3 space-y-3">
                    {/* Indicators */}
                    {test.indicators.length > 0 && (
                      <div className="p-2 bg-white/5 rounded">
                        <p className="text-xs font-medium text-gray-300 mb-1">Look for:</p>
                        <ul className="text-xs text-gray-400 space-y-0.5">
                          {test.indicators.map((indicator, idx) => (
                            <li key={idx}>• {indicator}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Variations */}
                    <div className="space-y-2">
                      {test.variations.map((variation, idx) => (
                        <div key={idx} className="p-2 bg-white/5 rounded border border-white/10">
                          <p className="text-xs text-gray-300 mb-2">{variation.description}</p>
                          <button
                            onClick={() => onExecuteTest(test, idx)}
                            className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition"
                          >
                            <Play className="w-3 h-3" />
                            Execute Test
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
