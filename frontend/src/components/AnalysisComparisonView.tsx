/**
 * Analysis Comparison View
 *
 * Permet de comparer 2 analyses AI côte à côte:
 * - Highlight new/fixed/changed vulnerabilities
 * - Diff viewer avec color coding
 * - Export comparison report
 * - Track effectiveness des remediations
 */

import { useState } from 'react';
import {
  ArrowRight,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Download,
  X,
  FileText,
} from 'lucide-react';
import type { AIAnalysis, Vulnerability } from '../lib/api';

interface AnalysisComparisonViewProps {
  baseline: AIAnalysis;
  current: AIAnalysis;
  onClose: () => void;
}

interface VulnerabilityDiff {
  new: Vulnerability[];
  fixed: Vulnerability[];
  changed: Array<{
    baseline: Vulnerability;
    current: Vulnerability;
    changes: string[];
  }>;
  unchanged: Vulnerability[];
}

export function AnalysisComparisonView({
  baseline,
  current,
  onClose,
}: AnalysisComparisonViewProps) {
  const [selectedTab, setSelectedTab] = useState<'new' | 'fixed' | 'changed' | 'all'>('new');

  // Calculate diff
  const diff = calculateDiff(baseline, current);

  const handleExportComparison = () => {
    const report = generateComparisonReport(baseline, current, diff);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-${baseline.analysisId}-${current.analysisId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0D1F2D] rounded-lg shadow-2xl border-2 border-white/10 w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Analysis Comparison
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Comparing analyses from {new Date(baseline.timestamp).toLocaleString()} to{' '}
              {new Date(current.timestamp).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportComparison}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/10">
          <div
            className={`bg-green-500/10 border ${
              selectedTab === 'new' ? 'border-green-500' : 'border-green-500/30'
            } rounded-lg p-3 cursor-pointer hover:bg-green-500/20 transition`}
            onClick={() => setSelectedTab('new')}
          >
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-1">
              <AlertCircle className="w-4 h-4" />
              New Vulnerabilities
            </div>
            <div className="text-2xl font-bold text-white">{diff.new.length}</div>
          </div>

          <div
            className={`bg-blue-500/10 border ${
              selectedTab === 'fixed' ? 'border-blue-500' : 'border-blue-500/30'
            } rounded-lg p-3 cursor-pointer hover:bg-blue-500/20 transition`}
            onClick={() => setSelectedTab('fixed')}
          >
            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-1">
              <CheckCircle className="w-4 h-4" />
              Fixed Vulnerabilities
            </div>
            <div className="text-2xl font-bold text-white">{diff.fixed.length}</div>
          </div>

          <div
            className={`bg-yellow-500/10 border ${
              selectedTab === 'changed' ? 'border-yellow-500' : 'border-yellow-500/30'
            } rounded-lg p-3 cursor-pointer hover:bg-yellow-500/20 transition`}
            onClick={() => setSelectedTab('changed')}
          >
            <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-1">
              <AlertTriangle className="w-4 h-4" />
              Changed Vulnerabilities
            </div>
            <div className="text-2xl font-bold text-white">{diff.changed.length}</div>
          </div>

          <div
            className={`bg-white/10 border ${
              selectedTab === 'all' ? 'border-white/50' : 'border-white/20'
            } rounded-lg p-3 cursor-pointer hover:bg-white/20 transition`}
            onClick={() => setSelectedTab('all')}
          >
            <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-1">
              <FileText className="w-4 h-4" />
              All Findings
            </div>
            <div className="text-2xl font-bold text-white">
              {diff.new.length + diff.fixed.length + diff.changed.length + diff.unchanged.length}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {selectedTab === 'new' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-green-400 mb-3">
                New Vulnerabilities ({diff.new.length})
              </h3>
              {diff.new.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No new vulnerabilities detected</p>
              ) : (
                diff.new.map((vuln, idx) => (
                  <VulnerabilityDiffCard key={`new-${idx}`} vulnerability={vuln} status="new" />
                ))
              )}
            </div>
          )}

          {selectedTab === 'fixed' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">
                Fixed Vulnerabilities ({diff.fixed.length})
              </h3>
              {diff.fixed.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No vulnerabilities were fixed</p>
              ) : (
                diff.fixed.map((vuln, idx) => (
                  <VulnerabilityDiffCard key={`fixed-${idx}`} vulnerability={vuln} status="fixed" />
                ))
              )}
            </div>
          )}

          {selectedTab === 'changed' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">
                Changed Vulnerabilities ({diff.changed.length})
              </h3>
              {diff.changed.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No vulnerabilities changed</p>
              ) : (
                diff.changed.map((item, idx) => (
                  <ChangedVulnerabilityCard key={idx} baseline={item.baseline} current={item.current} changes={item.changes} />
                ))
              )}
            </div>
          )}

          {selectedTab === 'all' && (
            <div className="space-y-6">
              {diff.new.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-3">New ({diff.new.length})</h3>
                  <div className="space-y-2">
                    {diff.new.map((vuln, idx) => (
                      <VulnerabilityDiffCard key={`all-new-${idx}`} vulnerability={vuln} status="new" compact />
                    ))}
                  </div>
                </div>
              )}

              {diff.fixed.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">Fixed ({diff.fixed.length})</h3>
                  <div className="space-y-2">
                    {diff.fixed.map((vuln, idx) => (
                      <VulnerabilityDiffCard key={`all-fixed-${idx}`} vulnerability={vuln} status="fixed" compact />
                    ))}
                  </div>
                </div>
              )}

              {diff.changed.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3">Changed ({diff.changed.length})</h3>
                  <div className="space-y-2">
                    {diff.changed.map((item, idx) => (
                      <ChangedVulnerabilityCard
                        key={idx}
                        baseline={item.baseline}
                        current={item.current}
                        changes={item.changes}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for individual vulnerability diff
function VulnerabilityDiffCard({
  vulnerability,
  status,
  compact = false,
}: {
  vulnerability: Vulnerability;
  status: 'new' | 'fixed';
  compact?: boolean;
}) {
  const bgColor = status === 'new' ? 'bg-green-500/10' : 'bg-blue-500/10';
  const borderColor = status === 'new' ? 'border-green-500/30' : 'border-blue-500/30';
  const Icon = status === 'new' ? AlertCircle : CheckCircle;
  const iconColor = status === 'new' ? 'text-green-400' : 'text-blue-400';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className="font-semibold text-white">{vulnerability.title}</h4>
          <p className="text-sm text-gray-400 mt-1">{vulnerability.description}</p>
          {!compact && vulnerability.evidence && vulnerability.evidence.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 font-medium mb-1">Evidence:</p>
              <pre className="text-xs bg-black/30 p-2 rounded border border-white/5 overflow-x-auto">
                {vulnerability.evidence[0]}
              </pre>
            </div>
          )}
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityStyle(vulnerability.severity)}`}>
          {vulnerability.severity}
        </div>
      </div>
    </div>
  );
}

// Helper component for changed vulnerabilities
function ChangedVulnerabilityCard({
  baseline,
  current,
  changes,
  compact = false,
}: {
  baseline: Vulnerability;
  current: Vulnerability;
  changes: string[];
  compact?: boolean;
}) {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <ArrowRight className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-white">{current.title}</h4>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className={`px-2 py-1 rounded ${getSeverityStyle(baseline.severity)}`}>
              {baseline.severity}
            </span>
            <ArrowRight className="w-3 h-3 text-gray-500" />
            <span className={`px-2 py-1 rounded ${getSeverityStyle(current.severity)}`}>
              {current.severity}
            </span>
          </div>
          {!compact && changes.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 font-medium mb-1">Changes:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                {changes.map((change, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-400">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Calculate diff between two analyses
function calculateDiff(baseline: AIAnalysis, current: AIAnalysis): VulnerabilityDiff {
  const baselineVulns = baseline.vulnerabilities || [];
  const currentVulns = current.vulnerabilities || [];

  const result: VulnerabilityDiff = {
    new: [],
    fixed: [],
    changed: [],
    unchanged: [],
  };

  // Find new vulnerabilities (in current but not in baseline)
  for (const vuln of currentVulns) {
    const match = baselineVulns.find((b: Vulnerability) => isSameVulnerability(b, vuln));
    if (!match) {
      result.new.push(vuln);
    } else if (hasChanged(match, vuln)) {
      result.changed.push({
        baseline: match,
        current: vuln,
        changes: getChanges(match, vuln),
      });
    } else {
      result.unchanged.push(vuln);
    }
  }

  // Find fixed vulnerabilities (in baseline but not in current)
  for (const vuln of baselineVulns) {
    const match = currentVulns.find((c: Vulnerability) => isSameVulnerability(vuln, c));
    if (!match) {
      result.fixed.push(vuln);
    }
  }

  return result;
}

// Check if two vulnerabilities are the same (by type and location)
function isSameVulnerability(a: Vulnerability, b: Vulnerability): boolean {
  return a.type === b.type && a.location === b.location;
}

// Check if vulnerability has changed
function hasChanged(baseline: Vulnerability, current: Vulnerability): boolean {
  return (
    baseline.severity !== current.severity ||
    baseline.confidence !== current.confidence ||
    baseline.description !== current.description
  );
}

// Get list of changes
function getChanges(baseline: Vulnerability, current: Vulnerability): string[] {
  const changes: string[] = [];

  if (baseline.severity !== current.severity) {
    changes.push(`Severity changed from ${baseline.severity} to ${current.severity}`);
  }

  if (baseline.confidence !== current.confidence) {
    changes.push(
      `Confidence changed from ${Math.round((baseline.confidence || 0) * 100)}% to ${Math.round((current.confidence || 0) * 100)}%`
    );
  }

  if (baseline.description !== current.description) {
    changes.push('Description updated');
  }

  return changes;
}

// Get severity badge style
function getSeverityStyle(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'HIGH':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
    case 'LOW':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
}

// Generate comparison report in Markdown
function generateComparisonReport(
  baseline: AIAnalysis,
  current: AIAnalysis,
  diff: VulnerabilityDiff
): string {
  return `# Analysis Comparison Report

**Baseline**: ${new Date(baseline.timestamp).toLocaleString()}
**Current**: ${new Date(current.timestamp).toLocaleString()}
**Request**: ${baseline.requestId}

---

## Summary

- **New Vulnerabilities**: ${diff.new.length}
- **Fixed Vulnerabilities**: ${diff.fixed.length}
- **Changed Vulnerabilities**: ${diff.changed.length}
- **Unchanged Vulnerabilities**: ${diff.unchanged.length}

---

## New Vulnerabilities

${
  diff.new.length === 0
    ? '_No new vulnerabilities detected_'
    : diff.new.map((v) => `### ${v.title}\n\n**Severity**: ${v.severity}\n**Type**: ${v.type}\n\n${v.description}\n`).join('\n')
}

---

## Fixed Vulnerabilities

${
  diff.fixed.length === 0
    ? '_No vulnerabilities were fixed_'
    : diff.fixed.map((v) => `### ${v.title}\n\n**Severity**: ${v.severity}\n**Type**: ${v.type}\n\n${v.description}\n`).join('\n')
}

---

## Changed Vulnerabilities

${
  diff.changed.length === 0
    ? '_No vulnerabilities changed_'
    : diff.changed
        .map(
          (c) =>
            `### ${c.current.title}\n\n**Changes**:\n${c.changes.map((ch) => `- ${ch}`).join('\n')}\n`
        )
        .join('\n')
}

---

_Generated by BurpOnWeb AI Analysis System_
`;
}
