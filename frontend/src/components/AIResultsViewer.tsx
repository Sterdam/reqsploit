/**
 * AI Results Viewer - Ultimate pentester-friendly security analysis display
 *
 * Features:
 * - Ultra-readable vulnerability cards with visual hierarchy
 * - One-click copy for all payloads, evidence, and data
 * - Quick exploit actions: Send to Repeater, Copy payload
 * - CVSS visualization and risk assessment
 * - Evidence and location display with syntax highlighting
 * - Collapsible sections with smart defaults
 * - Toast notifications for user feedback
 * - Perfect UX for penetration testing workflows
 */

import { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Copy,
  Send,
  ChevronDown,
  ChevronRight,
  Shield,
  Zap,
  Code,
  ExternalLink,
  Target,
  Check,
  FileText,
  MapPin,
  Activity,
  BookOpen,
  History,
} from 'lucide-react';
import { useAIStore } from '../stores/aiStore';
import { useRepeaterStore } from '../stores/repeaterStore';
import type { AISuggestion, Vulnerability } from '../lib/api';
import { JsonViewer } from './JsonViewer';
import { AIAnalysisHistory } from './AIAnalysisHistory';

export function AIResultsViewer() {
  const { activeAnalysis, isAnalyzing } = useAIStore();
  const { createTab } = useRepeaterStore();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['vulnerabilities', 'suggestions'])
  );
  const [expandedVulns, setExpandedVulns] = useState<Set<number>>(new Set());
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

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
          icon: 'text-red-500',
          glow: 'shadow-red-500/20',
          badge: 'bg-red-500',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/50',
          text: 'text-orange-400',
          icon: 'text-orange-500',
          glow: 'shadow-orange-500/20',
          badge: 'bg-orange-500',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/50',
          text: 'text-yellow-400',
          icon: 'text-yellow-500',
          glow: 'shadow-yellow-500/20',
          badge: 'bg-yellow-500',
        };
      case 'LOW':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/50',
          text: 'text-blue-400',
          icon: 'text-blue-500',
          glow: 'shadow-blue-500/20',
          badge: 'bg-blue-500',
        };
      default:
        return {
          bg: 'bg-gray-500/20',
          border: 'border-gray-500/50',
          text: 'text-gray-400',
          icon: 'text-gray-500',
          glow: 'shadow-gray-500/20',
          badge: 'bg-gray-500',
        };
    }
  };

  const getSeverityIcon = (severity: string) => {
    const s = severity.toUpperCase();
    switch (s) {
      case 'CRITICAL':
        return <AlertCircle className="w-5 h-5" />;
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5" />;
      case 'MEDIUM':
        return <Info className="w-5 h-5" />;
      case 'LOW':
        return <Shield className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getCVSSColor = (score: number) => {
    if (score >= 9.0) return 'text-red-500';
    if (score >= 7.0) return 'text-orange-500';
    if (score >= 4.0) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) {
      return {
        bg: 'bg-green-500/20',
        border: 'border-green-500/50',
        text: 'text-green-400',
        label: 'High Confidence',
      };
    }
    if (confidence >= 75) {
      return {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        label: 'Good Confidence',
      };
    }
    if (confidence >= 60) {
      return {
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/50',
        text: 'text-yellow-400',
        label: 'Moderate',
      };
    }
    return {
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      label: 'Low - Verify',
    };
  };

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleSendToRepeater = (suggestion: AISuggestion) => {
    const modifyAction = suggestion.actions?.find((a) => a.type === 'modify' || a.type === 'repeat');

    if (modifyAction?.payload?.modifiedRequest) {
      const { method, url, headers, body } = modifyAction.payload.modifiedRequest;
      createTab(suggestion.title || 'AI Suggestion', {
        method: method || 'GET',
        url: url || '',
        headers: headers || {},
        body: body || '',
      });
    }
  };

  // Show loading state
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#0A1929]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <Shield className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-white font-semibold text-lg mt-6 mb-2">AI Analysis in Progress</p>
        <p className="text-gray-400 text-sm max-w-xs">
          Scanning for vulnerabilities and generating exploit suggestions...
        </p>
      </div>
    );
  }

  // Show empty state
  if (!activeAnalysis) {
    return (
      <div className="flex flex-col h-full bg-[#0A1929]">
        {/* Header with History button */}
        <div className="flex-shrink-0 p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-white font-bold text-base">Security Analysis</h2>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-xs text-white transition flex items-center gap-1.5"
              title="View analysis history"
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
          </div>
        </div>

        {/* Empty state content */}
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
              <Shield className="w-12 h-12 text-gray-500" />
            </div>
          </div>
          <p className="text-white font-semibold text-lg mb-2">No Analysis Available</p>
          <p className="text-gray-400 text-sm max-w-sm mb-4">
            Select a request and click "AI Analyze" to get intelligent security insights and exploitation suggestions
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Target className="w-4 h-4" />
            <span>Powered by Claude AI</span>
          </div>
        </div>

        {/* History Modal */}
        <AIAnalysisHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      </div>
    );
  }

  const analysis = activeAnalysis;
  const vulnerabilities = analysis.vulnerabilities || [];
  const suggestions = Array.isArray(analysis.suggestions) ? analysis.suggestions : [];

  // Sort vulnerabilities by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
  const sortedVulns = [...vulnerabilities].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  // Count by severity
  const criticalCount = vulnerabilities.filter((v) => v.severity === 'CRITICAL').length;
  const highCount = vulnerabilities.filter((v) => v.severity === 'HIGH').length;
  const mediumCount = vulnerabilities.filter((v) => v.severity === 'MEDIUM').length;
  const lowCount = vulnerabilities.filter((v) => v.severity === 'LOW').length;

  // Calculate risk score (simplified)
  const riskScore = criticalCount * 10 + highCount * 7 + mediumCount * 4 + lowCount * 1;
  const maxRisk = vulnerabilities.length * 10;
  const riskPercent = maxRisk > 0 ? (riskScore / maxRisk) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-[#0A1929] overflow-hidden">
      {/* Enhanced Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Shield className="w-5 h-5 text-blue-500" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <h2 className="text-white font-bold text-base">Security Analysis</h2>
            <button
              onClick={() => setShowHistory(true)}
              className="ml-2 px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-xs text-white transition flex items-center gap-1.5"
              title="View analysis history"
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {(() => {
              const confidence = analysis.confidence || 80;
              const confidenceConfig = getConfidenceColor(confidence);
              return (
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${confidenceConfig.bg} ${confidenceConfig.border}`}>
                  <Activity className={`w-3 h-3 ${confidenceConfig.text}`} />
                  <span className="text-gray-400">Confidence:</span>
                  <span className={`${confidenceConfig.text} font-bold`}>{confidence}%</span>
                  <span className={`${confidenceConfig.text} text-[10px] font-medium`}>({confidenceConfig.label})</span>
                </div>
              );
            })()}
            <span className="text-gray-600">•</span>
            <span className="text-gray-400">{analysis.tokensUsed} tokens</span>
          </div>
        </div>

        {/* Risk Score Bar */}
        {vulnerabilities.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-400">Risk Level</span>
              <span className={`text-xs font-bold ${riskPercent > 70 ? 'text-red-400' : riskPercent > 40 ? 'text-orange-400' : 'text-yellow-400'}`}>
                {riskPercent > 70 ? 'CRITICAL' : riskPercent > 40 ? 'HIGH' : 'MODERATE'}
              </span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${riskPercent > 70 ? 'bg-gradient-to-r from-red-500 to-red-600' : riskPercent > 40 ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-yellow-500 to-yellow-600'}`}
                style={{ width: `${Math.min(riskPercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {criticalCount > 0 && (
            <div className="px-2.5 py-1 bg-red-500/20 border border-red-500/40 rounded-md text-xs font-bold text-red-400 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              {criticalCount} Critical
            </div>
          )}
          {highCount > 0 && (
            <div className="px-2.5 py-1 bg-orange-500/20 border border-orange-500/40 rounded-md text-xs font-bold text-orange-400 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              {highCount} High
            </div>
          )}
          {mediumCount > 0 && (
            <div className="px-2.5 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-md text-xs font-bold text-yellow-400 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
              {mediumCount} Medium
            </div>
          )}
          {lowCount > 0 && (
            <div className="px-2.5 py-1 bg-blue-500/20 border border-blue-500/40 rounded-md text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              {lowCount} Low
            </div>
          )}
          {vulnerabilities.length === 0 && (
            <div className="px-2.5 py-1 bg-green-500/20 border border-green-500/40 rounded-md text-xs font-bold text-green-400 flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3" />
              No vulnerabilities found
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* AI Summary */}
        <div className="bg-[#0D1F2D] rounded-lg border border-white/10 overflow-hidden hover:border-white/20 transition">
          <button
            onClick={() => toggleSection('summary')}
            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition text-left group"
          >
            <span className="text-white font-semibold text-sm flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition" />
              AI Summary
            </span>
            {expandedSections.has('summary') ? (
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
            )}
          </button>
          {expandedSections.has('summary') && (
            <div className="px-3 pb-3">
              <JsonViewer
                content={analysis.aiResponse || 'No summary available'}
                onCopy={(text, label) => handleCopy(text, label)}
              />
            </div>
          )}
        </div>

        {/* Vulnerabilities */}
        {sortedVulns.length > 0 && (
          <div className="bg-[#0D1F2D] rounded-lg border border-white/10 overflow-hidden hover:border-white/20 transition">
            <button
              onClick={() => toggleSection('vulnerabilities')}
              className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition text-left group"
            >
              <span className="text-white font-semibold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-400 group-hover:text-red-300 transition" />
                Vulnerabilities ({sortedVulns.length})
              </span>
              {expandedSections.has('vulnerabilities') ? (
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
              )}
            </button>
            {expandedSections.has('vulnerabilities') && (
              <div className="px-3 pb-3 space-y-2">
                {sortedVulns.map((vuln: Vulnerability, idx: number) => {
                  const colors = getSeverityColor(vuln.severity);
                  const isExpanded = expandedVulns.has(idx);

                  return (
                    <div
                      key={idx}
                      className={`border ${colors.border} rounded-lg overflow-hidden transition hover:shadow-lg ${colors.glow}`}
                    >
                      {/* Vulnerability Header */}
                      <div className={`${colors.bg} p-3`}>
                        <div className="flex items-start gap-3">
                          <div className={`${colors.icon} mt-0.5`}>
                            {getSeverityIcon(vuln.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className={`font-bold ${colors.text} text-sm leading-tight`}>
                                {vuln.title}
                              </h3>
                              <span className={`${colors.badge} px-2 py-0.5 text-[10px] font-black uppercase rounded text-white whitespace-nowrap`}>
                                {vuln.severity}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                              <span className="font-medium">{vuln.type}</span>
                              {vuln.cwe && (
                                <>
                                  <span>•</span>
                                  <span>{vuln.cwe}</span>
                                </>
                              )}
                              {vuln.cvss !== undefined && (
                                <>
                                  <span>•</span>
                                  <span className={`font-bold ${getCVSSColor(vuln.cvss)}`}>
                                    CVSS {vuln.cvss}
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {vuln.description}
                            </p>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => toggleVuln(idx)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs font-medium transition flex items-center gap-1.5 text-white"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            {isExpanded ? 'Less Details' : 'More Details'}
                          </button>
                          {vuln.description && (
                            <button
                              onClick={() => handleCopy(vuln.description, `vuln-${idx}`)}
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs font-medium transition flex items-center gap-1.5 text-white"
                              title="Copy description"
                            >
                              {copiedItem === `vuln-${idx}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                              Copy
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="bg-black/20 p-3 space-y-3 border-t border-white/10">
                          {/* Location */}
                          {vuln.location && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                                <MapPin className="w-3 h-3" />
                                Location
                              </div>
                              <div className="flex items-start gap-2">
                                <code className="flex-1 px-2 py-1.5 bg-black/30 border border-white/10 rounded text-xs text-gray-300 font-mono break-all">
                                  {vuln.location}
                                </code>
                                <button
                                  onClick={() => handleCopy(vuln.location!, `location-${idx}`)}
                                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-gray-400 hover:text-white transition"
                                  title="Copy location"
                                >
                                  {copiedItem === `location-${idx}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Evidence */}
                          {vuln.evidence && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                                <FileText className="w-3 h-3" />
                                Evidence
                              </div>
                              <JsonViewer
                                content={vuln.evidence}
                                onCopy={(text, label) => handleCopy(text, `evidence-${idx}-${label}`)}
                              />
                            </div>
                          )}

                          {/* Exploitation */}
                          {vuln.exploitation && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400">
                                <Zap className="w-3 h-3" />
                                Exploitation
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="flex-1 px-2 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-300 whitespace-pre-wrap">
                                  {vuln.exploitation}
                                </div>
                                <button
                                  onClick={() => handleCopy(vuln.exploitation!, `exploit-${idx}`)}
                                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-gray-400 hover:text-white transition"
                                  title="Copy exploitation"
                                >
                                  {copiedItem === `exploit-${idx}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Remediation */}
                          {vuln.remediation && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400">
                                <Shield className="w-3 h-3" />
                                Remediation
                              </div>
                              <div className="px-2 py-1.5 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-300 leading-relaxed">
                                {vuln.remediation}
                              </div>
                            </div>
                          )}

                          {/* Explanation */}
                          {vuln.explanation && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                                <Info className="w-3 h-3" />
                                Detailed Explanation
                              </div>
                              <div className="space-y-2 px-2 py-2 bg-white/5 border border-white/10 rounded">
                                {/* Why */}
                                {vuln.explanation.why && (
                                  <div>
                                    <p className="text-xs font-medium text-blue-400 mb-1">Why this is a vulnerability:</p>
                                    <p className="text-xs text-gray-300 leading-relaxed">{vuln.explanation.why}</p>
                                  </div>
                                )}

                                {/* Evidence */}
                                {vuln.explanation.evidence && vuln.explanation.evidence.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-purple-400 mb-1">Supporting evidence:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-300">
                                      {vuln.explanation.evidence.map((item, evidIdx) => (
                                        <li key={evidIdx} className="leading-relaxed">{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Verification Steps */}
                                {vuln.explanation.verificationSteps && vuln.explanation.verificationSteps.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-green-400 mb-1">Verification steps:</p>
                                    <ol className="list-decimal list-inside space-y-0.5 text-xs text-gray-300">
                                      {vuln.explanation.verificationSteps.map((step, stepIdx) => (
                                        <li key={stepIdx} className="leading-relaxed">{step}</li>
                                      ))}
                                    </ol>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* References */}
                          {vuln.references && vuln.references.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                                <BookOpen className="w-3 h-3" />
                                References
                              </div>
                              <div className="space-y-1">
                                {vuln.references.map((ref, refIdx) => (
                                  <a
                                    key={refIdx}
                                    href={ref.startsWith('http') ? ref : `https://cwe.mitre.org/data/definitions/${ref.replace(/\D/g, '')}.html`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {ref}
                                  </a>
                                ))}
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
          </div>
        )}

        {/* Exploitation Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-[#0D1F2D] rounded-lg border border-white/10 overflow-hidden hover:border-white/20 transition">
            <button
              onClick={() => toggleSection('suggestions')}
              className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition text-left group"
            >
              <span className="text-white font-semibold text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300 transition" />
                Exploitation Suggestions ({suggestions.length})
              </span>
              {expandedSections.has('suggestions') ? (
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
              )}
            </button>
            {expandedSections.has('suggestions') && (
              <div className="px-3 pb-3 space-y-2">
                {suggestions.map((suggestion: AISuggestion, idx: number) => {
                  const colors = getSeverityColor(suggestion.severity);
                  return (
                    <div
                      key={idx}
                      className={`${colors.bg} border ${colors.border} rounded-lg p-3 transition hover:shadow-lg ${colors.glow}`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`${colors.icon} mt-0.5`}>
                          {getSeverityIcon(suggestion.severity)}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-bold ${colors.text} text-sm mb-1`}>
                            {suggestion.title}
                          </h4>
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {suggestion.actions && suggestion.actions.map((action, actionIdx) => {
                          const isModify = action.type === 'modify' || action.type === 'repeat';
                          const isCopy = action.type === 'copy';

                          return (
                            <button
                              key={actionIdx}
                              onClick={() => {
                                if (isModify) {
                                  handleSendToRepeater(suggestion);
                                } else if (isCopy && action.payload) {
                                  handleCopy(JSON.stringify(action.payload, null, 2), `suggestion-${idx}-${actionIdx}`);
                                }
                              }}
                              className={`px-3 py-1.5 ${isModify ? 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/40 text-blue-300' : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'} border rounded text-xs font-medium transition flex items-center gap-1.5`}
                            >
                              {isModify && <Send className="w-3 h-3" />}
                              {isCopy && (copiedItem === `suggestion-${idx}-${actionIdx}` ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />)}
                              {action.label || (isModify ? 'Send to Repeater' : isCopy ? 'Copy Payload' : action.type)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Copy Toast Notification */}
      {copiedItem && (
        <div className="fixed bottom-4 right-4 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2 animate-slide-up z-50">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Copied to clipboard!</span>
        </div>
      )}

      {/* Analysis History Modal */}
      <AIAnalysisHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
