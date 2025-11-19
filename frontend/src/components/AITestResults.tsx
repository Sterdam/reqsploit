/**
 * AI Test Results - Display test execution results in Security Analysis panel
 * Shows both test suggestions and execution results with perfect UX
 */

import { useState } from 'react';
import {
  Play,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Shield,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Copy,
} from 'lucide-react';
import { toast } from '../stores/toastStore';

interface TestVariation {
  description: string;
  method: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface TestSuggestion {
  id: string;
  name: string;
  description: string;
  category: 'sqli' | 'xss' | 'auth' | 'authz' | 'injection' | 'validation' | 'ratelimit' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  variations: TestVariation[];
  indicators: string[];
}

export interface TestExecutionResult {
  testId: string;
  testName: string;
  variationIndex: number;
  variationDescription: string;
  status: 'success' | 'failed' | 'vulnerable' | 'running';
  timestamp: Date;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
  };
  response?: {
    statusCode: number;
    statusMessage?: string;
    headers?: Record<string, string>;
    body: string;
    responseTime?: number;
  };
  findings?: string[];
  vulnerability?: {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    evidence: string;
  };
}

interface AITestResultsProps {
  suggestions: {
    tests: TestSuggestion[];
    summary: string;
  } | null;
  executionResults: TestExecutionResult[];
  onExecuteTest: (test: TestSuggestion, variationIndex: number) => void;
  onClearResults: () => void;
}

export function AITestResults({
  suggestions,
  executionResults,
  onExecuteTest,
  onClearResults,
}: AITestResultsProps) {
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const toggleTest = (testId: string) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      next.has(testId) ? next.delete(testId) : next.add(testId);
      return next;
    });
  };

  const toggleResult = (resultId: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      next.has(resultId) ? next.delete(resultId) : next.add(resultId);
      return next;
    });
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vulnerable':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied', label);
  };

  const vulnerableResults = executionResults.filter((r) => r.status === 'vulnerable');
  const successResults = executionResults.filter((r) => r.status === 'success');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-[#0A1929]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">AI Security Tests</h3>
            {executionResults.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {vulnerableResults.length} vulnerable • {successResults.length} passed
              </p>
            )}
          </div>
          {executionResults.length > 0 && (
            <button
              onClick={onClearResults}
              className="text-xs text-red-400 hover:text-red-300 transition"
            >
              Clear Results
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Execution Results (Priority Display) */}
        {executionResults.length > 0 && (
          <div className="p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Test Results ({executionResults.length})
            </h4>

            {executionResults.map((result, idx) => {
              const resultId = `result-${idx}`;
              const isExpanded = expandedResults.has(resultId);

              return (
                <div
                  key={resultId}
                  className={`rounded-lg border overflow-hidden ${
                    result.status === 'vulnerable'
                      ? 'border-red-500/50 bg-red-500/10'
                      : result.status === 'success'
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  {/* Result Header */}
                  <button
                    onClick={() => toggleResult(resultId)}
                    className="w-full p-3 flex items-start gap-3 hover:bg-white/5 transition"
                  >
                    {getStatusIcon(result.status)}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white truncate">
                          {result.testName}
                        </span>
                        {result.vulnerability && (
                          <span
                            className={`px-2 py-0.5 ${getSeverityColor(
                              result.vulnerability.severity
                            )} rounded text-xs font-semibold text-white flex-shrink-0`}
                          >
                            {result.vulnerability.severity.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{result.variationDescription}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{result.request.method}</span>
                        {result.response && (
                          <>
                            <span>•</span>
                            <span className={result.response.statusCode >= 400 ? 'text-red-400' : ''}>
                              {result.response.statusCode}
                            </span>
                            {result.response.responseTime && (
                              <>
                                <span>•</span>
                                <span>{result.response.responseTime}ms</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {/* Result Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3">
                      {/* Vulnerability Details */}
                      {result.vulnerability && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded">
                          <div className="flex items-start gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-red-400">{result.vulnerability.type}</p>
                              <p className="text-xs text-gray-300 mt-1">{result.vulnerability.description}</p>
                            </div>
                          </div>
                          {result.vulnerability.evidence && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-300">Evidence:</span>
                                <button
                                  onClick={() => copyToClipboard(result.vulnerability!.evidence, 'Evidence copied')}
                                  className="p-1 hover:bg-white/10 rounded transition"
                                  title="Copy evidence"
                                >
                                  <Copy className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                              <pre className="p-2 bg-black/30 rounded text-xs text-gray-300 overflow-x-auto">
                                {result.vulnerability.evidence}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Test Details */}
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-blue-400 mb-1">Test Applied:</p>
                            <p className="text-xs text-gray-300">{result.variationDescription}</p>
                          </div>
                        </div>
                      </div>

                      {/* Findings */}
                      {result.findings && result.findings.length > 0 && (
                        <div className="p-2 bg-white/5 rounded">
                          <p className="text-xs font-medium text-gray-300 mb-1">Findings:</p>
                          <ul className="text-xs text-gray-400 space-y-0.5">
                            {result.findings.map((finding, fidx) => (
                              <li key={fidx}>• {finding}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Request */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-300">Modified Request:</span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                `${result.request.method} ${result.request.url}\n${Object.entries(result.request.headers || {}).map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${result.request.body || ''}`,
                                'Request copied'
                              )
                            }
                            className="p-1 hover:bg-white/10 rounded transition"
                            title="Copy request"
                          >
                            <Copy className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                        <div className="p-2 bg-black/30 rounded text-xs space-y-1">
                          <div className="text-electric-blue font-medium">{result.request.method} {result.request.url}</div>
                          {result.request.headers && Object.keys(result.request.headers).length > 0 && (
                            <div className="mt-1">
                              <p className="text-gray-500 text-[10px] mb-0.5">Headers:</p>
                              {Object.entries(result.request.headers).slice(0, 3).map(([key, value]) => (
                                <div key={key} className="text-gray-400 text-[10px]">
                                  <span className="text-purple-400">{key}:</span> {String(value).substring(0, 50)}{String(value).length > 50 ? '...' : ''}
                                </div>
                              ))}
                              {Object.keys(result.request.headers).length > 3 && (
                                <p className="text-gray-500 text-[10px] mt-0.5">... +{Object.keys(result.request.headers).length - 3} more</p>
                              )}
                            </div>
                          )}
                          {result.request.body && (
                            <div className="mt-1">
                              <p className="text-gray-500 text-[10px] mb-0.5">Body:</p>
                              <pre className="text-gray-400 overflow-x-auto text-[10px]">{result.request.body.substring(0, 200)}{result.request.body.length > 200 ? '...' : ''}</pre>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Response Preview */}
                      {result.response && (
                        <div>
                          <span className="text-xs font-medium text-gray-300">Response:</span>
                          <div className="mt-1 p-2 bg-black/30 rounded text-xs">
                            <div className="text-gray-400">
                              Status: <span className={result.response.statusCode >= 400 ? 'text-red-400' : 'text-green-400'}>
                                {result.response.statusCode} {result.response.statusMessage}
                              </span>
                            </div>
                            {result.response.body && (
                              <pre className="mt-1 text-gray-500 line-clamp-3 overflow-hidden">
                                {result.response.body.substring(0, 200)}...
                              </pre>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Test Suggestions */}
        {suggestions && suggestions.tests && suggestions.tests.length > 0 && (
          <div className="p-4 space-y-3 border-t border-white/10">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Available Tests ({suggestions.tests.length})
            </h4>

            {suggestions.summary && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                <p className="text-xs text-gray-300">{suggestions.summary}</p>
              </div>
            )}

            {suggestions.tests.map((test) => {
              const isExpanded = expandedTests.has(test.id);

              return (
                <div key={test.id} className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleTest(test.id)}
                    className="w-full p-3 flex items-start gap-3 hover:bg-white/5 transition"
                  >
                    {getSeverityIcon(test.severity)}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white truncate">{test.name}</span>
                        <span
                          className={`px-2 py-0.5 ${getSeverityColor(
                            test.severity
                          )} rounded text-xs font-semibold text-white flex-shrink-0`}
                        >
                          {test.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{test.description}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2">
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

                      {test.variations.map((variation, idx) => (
                        <div key={idx} className="p-2 bg-white/5 rounded border border-white/10">
                          <p className="text-xs text-gray-300 mb-2">{variation.description}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onExecuteTest(test, idx);
                            }}
                            className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition"
                          >
                            <Play className="w-3 h-3" />
                            Execute Test
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!suggestions && executionResults.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No AI tests available</p>
              <p className="text-xs mt-1">Click "Suggest Tests" to generate security tests</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
