/**
 * Intercept AI Results - Inline compact AI analysis display for InterceptPanel
 *
 * Features:
 * - Compact inline display (no modal)
 * - Apply Suggestion button to modify intercepted request
 * - Collapsible vulnerabilities and suggestions
 * - Visual severity indicators
 * - One-click copy
 */

import { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Copy,
  ChevronDown,
  ChevronRight,
  Shield,
  Code,
  Check,
  X,
  Zap,
  ExternalLink,
} from 'lucide-react';
import type { AIAnalysis, AISuggestion } from '../lib/api';

interface InterceptAIResultsProps {
  analysis: AIAnalysis;
  onClose: () => void;
  onApplySuggestion?: (suggestion: AISuggestion) => void;
}

export function InterceptAIResults({
  analysis,
  onClose,
  onApplySuggestion,
}: InterceptAIResultsProps) {
  const [expandedVulns, setExpandedVulns] = useState<Set<number>>(new Set());
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const toggleVuln = (idx: number) => {
    const newExpanded = new Set(expandedVulns);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedVulns(newExpanded);
  };

  const getSeverityColor = (severity: string) => {
    const s = severity.toUpperCase();
    switch (s) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/50',
          text: 'text-red-400',
          icon: AlertTriangle,
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/50',
          text: 'text-orange-400',
          icon: AlertCircle,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/50',
          text: 'text-yellow-400',
          icon: Info,
        };
      case 'LOW':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/50',
          text: 'text-blue-400',
          icon: CheckCircle,
        };
      default:
        return {
          bg: 'bg-gray-500/20',
          border: 'border-gray-500/50',
          text: 'text-gray-400',
          icon: Info,
        };
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const vulnerabilities = analysis.vulnerabilities || [];
  const suggestions = analysis.suggestions || [];
  const criticalCount = vulnerabilities.filter((v) => v.severity === 'CRITICAL').length;
  const highCount = vulnerabilities.filter((v) => v.severity === 'HIGH').length;

  return (
    <div className="bg-[#0A1929] border border-white/20 rounded-lg shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-white font-bold text-sm">AI Security Analysis</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {criticalCount > 0 && (
                <span className="text-xs font-medium text-red-400">
                  {criticalCount} Critical
                </span>
              )}
              {highCount > 0 && (
                <span className="text-xs font-medium text-orange-400">
                  {highCount} High
                </span>
              )}
              <span className="text-xs text-gray-500">
                {vulnerabilities.length} total issues
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content - Compact scrollable */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Vulnerabilities */}
        {vulnerabilities.length > 0 && (
          <div className="p-3 border-b border-white/5">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Vulnerabilities
            </h4>
            <div className="space-y-2">
              {vulnerabilities.map((vuln, idx) => {
                const colors = getSeverityColor(vuln.severity);
                const Icon = colors.icon;
                const isExpanded = expandedVulns.has(idx);

                return (
                  <div
                    key={idx}
                    className={`${colors.bg} border ${colors.border} rounded-lg overflow-hidden`}
                  >
                    <button
                      onClick={() => toggleVuln(idx)}
                      className="w-full px-3 py-2 flex items-start gap-2 hover:bg-white/5 transition"
                    >
                      <Icon className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${colors.text}`}>
                            {vuln.severity}
                          </span>
                          <span className="text-sm font-medium text-white truncate">
                            {vuln.title}
                          </span>
                        </div>
                        {!isExpanded && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                            {vuln.description}
                          </p>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                      ) : (
                        <ChevronRight className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2">
                        <div className="text-xs text-gray-300">
                          <p className="mb-2">{vuln.description}</p>

                          {vuln.evidence && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-gray-500 font-medium">Evidence</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(vuln.evidence || '', `vuln-${idx}-evidence`);
                                  }}
                                  className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
                                >
                                  {copiedItem === `vuln-${idx}-evidence` ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <pre className="bg-black/30 px-2 py-1.5 rounded text-xs font-mono overflow-x-auto">
                                {vuln.evidence}
                              </pre>
                            </div>
                          )}

                          {vuln.remediation && (
                            <div className="mt-2">
                              <span className="text-gray-500 font-medium block mb-1">
                                Remediation
                              </span>
                              <p className="text-gray-300">{vuln.remediation}</p>
                            </div>
                          )}

                          {vuln.references && vuln.references.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {vuln.references.map((ref, refIdx) => (
                                <a
                                  key={refIdx}
                                  href={ref.startsWith('http') ? ref : `https://cwe.mitre.org/data/definitions/${ref.replace('CWE-', '')}.html`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs px-2 py-0.5 bg-blue-600/20 border border-blue-600/30 rounded text-blue-400 hover:bg-blue-600/30 transition flex items-center gap-1"
                                >
                                  {ref}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && onApplySuggestion && (
          <div className="p-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              AI Suggestions
            </h4>
            <div className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="bg-green-500/10 border border-green-500/30 rounded-lg p-3"
                >
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white mb-1">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-gray-300 mb-2">{suggestion.description}</p>

                      {suggestion.actions && suggestion.actions.length > 0 && (
                        <div className="space-y-1.5">
                          {suggestion.actions.map((action, actionIdx) => (
                            <div key={actionIdx}>
                              {action.payload && (
                                <div className="bg-black/30 px-2 py-1.5 rounded mb-1.5">
                                  <code className="text-xs font-mono text-green-300">
                                    {typeof action.payload === 'string' ? action.payload : JSON.stringify(action.payload)}
                                  </code>
                                </div>
                              )}
                              {action.type === 'modify' && (
                                <button
                                  onClick={() => onApplySuggestion(suggestion)}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition flex items-center gap-1.5"
                                >
                                  <Code className="w-3 h-3" />
                                  {action.label}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {vulnerabilities.length === 0 && suggestions.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400/50" />
            <p className="text-sm">No security issues detected</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 bg-white/5 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {analysis.tokensUsed} tokens used
        </div>
        {analysis.confidence && (
          <div className="text-xs text-gray-500">
            Confidence: {Math.round(analysis.confidence * 100)}%
          </div>
        )}
      </div>
    </div>
  );
}
