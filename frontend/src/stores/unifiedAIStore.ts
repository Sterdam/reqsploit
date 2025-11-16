/**
 * Unified AI Store - Single source of truth for all AI analyses
 *
 * Consolidates AI state from:
 * - InterceptPanel analyses
 * - RequestList analyses (Quick/Deep scans)
 * - Repeater test suggestions
 *
 * Features:
 * - Cross-panel synchronization
 * - Advanced filtering (severity, source, date, type)
 * - Export functionality (JSON/CSV/MD)
 * - Deduplication of findings
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIAnalysis, Vulnerability } from '../lib/api';

export type AISource = 'intercept' | 'request-list' | 'repeater' | 'manual';

export interface UnifiedFinding {
  id: string;
  source: AISource;
  requestId: string;
  requestUrl?: string;
  requestMethod?: string;
  vulnerability: Vulnerability;
  confidence: number;
  timestamp: string;
  analysisId: string;
}

export interface FindingFilter {
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | null;
  source?: AISource | null;
  dateRange?: { from: Date; to: Date } | null;
  searchTerm?: string;
  minConfidence?: number;
}

interface UnifiedAIState {
  // State
  analyses: Map<string, AIAnalysis>; // analysisId → analysis
  findings: UnifiedFinding[]; // Flattened vulnerabilities from all analyses
  filter: FindingFilter;
  selectedFindingId: string | null;

  // Actions - Analyses
  addAnalysis: (analysis: AIAnalysis, source: AISource) => void;
  removeAnalysis: (analysisId: string) => void;
  getAnalysis: (analysisId: string) => AIAnalysis | undefined;
  getAllAnalyses: () => AIAnalysis[];
  clearAllAnalyses: () => void;

  // Actions - Findings
  getFilteredFindings: () => UnifiedFinding[];
  selectFinding: (findingId: string | null) => void;
  getFindingById: (findingId: string) => UnifiedFinding | undefined;

  // Actions - Filters
  setFilter: (filter: Partial<FindingFilter>) => void;
  clearFilter: () => void;

  // Actions - Export
  exportAsJSON: () => string;
  exportAsCSV: () => string;
  exportAsMarkdown: () => string;

  // Actions - Stats
  getStats: () => {
    total: number;
    bySeverity: Record<string, number>;
    bySource: Record<AISource, number>;
    avgConfidence: number;
  };
}

export const useUnifiedAIStore = create<UnifiedAIState>()(
  persist(
    (set, get) => ({
      // Initial state
      analyses: new Map(),
      findings: [],
      filter: {},
      selectedFindingId: null,

      // Add analysis and extract findings
      addAnalysis: (analysis, source) => {
        set((state) => {
          const newAnalyses = new Map(state.analyses);
          newAnalyses.set(analysis.analysisId, analysis);

          // Extract findings from vulnerabilities
          const newFindings = analysis.vulnerabilities.map((vuln, idx) => ({
            id: `${analysis.analysisId}-${idx}`,
            source,
            requestId: analysis.requestId,
            requestUrl: analysis.requestUrl,
            requestMethod: analysis.requestMethod,
            vulnerability: vuln,
            confidence: analysis.confidence || 0.5,
            timestamp: analysis.timestamp,
            analysisId: analysis.analysisId,
          }));

          // Deduplicate findings based on vulnerability signature
          const existingSignatures = new Set(
            state.findings.map((f) =>
              `${f.vulnerability.type}-${f.vulnerability.title}-${f.requestUrl}`
            )
          );

          const uniqueNewFindings = newFindings.filter(
            (f) =>
              !existingSignatures.has(
                `${f.vulnerability.type}-${f.vulnerability.title}-${f.requestUrl}`
              )
          );

          return {
            analyses: newAnalyses,
            findings: [...state.findings, ...uniqueNewFindings],
          };
        });
      },

      // Remove analysis and its findings
      removeAnalysis: (analysisId) => {
        set((state) => {
          const newAnalyses = new Map(state.analyses);
          newAnalyses.delete(analysisId);

          const newFindings = state.findings.filter(
            (f) => f.analysisId !== analysisId
          );

          return {
            analyses: newAnalyses,
            findings: newFindings,
          };
        });
      },

      // Get single analysis
      getAnalysis: (analysisId) => {
        return get().analyses.get(analysisId);
      },

      // Get all analyses
      getAllAnalyses: () => {
        return Array.from(get().analyses.values());
      },

      // Clear all analyses and findings
      clearAllAnalyses: () => {
        set({ analyses: new Map(), findings: [], selectedFindingId: null });
      },

      // Get filtered findings
      getFilteredFindings: () => {
        const { findings, filter } = get();

        let filtered = [...findings];

        // Filter by severity
        if (filter.severity) {
          filtered = filtered.filter(
            (f) => f.vulnerability.severity === filter.severity
          );
        }

        // Filter by source
        if (filter.source) {
          filtered = filtered.filter((f) => f.source === filter.source);
        }

        // Filter by date range
        if (filter.dateRange) {
          filtered = filtered.filter((f) => {
            const timestamp = new Date(f.timestamp);
            return (
              timestamp >= filter.dateRange!.from &&
              timestamp <= filter.dateRange!.to
            );
          });
        }

        // Filter by search term
        if (filter.searchTerm) {
          const term = filter.searchTerm.toLowerCase();
          filtered = filtered.filter(
            (f) =>
              f.vulnerability.title.toLowerCase().includes(term) ||
              f.vulnerability.description.toLowerCase().includes(term) ||
              f.requestUrl?.toLowerCase().includes(term) ||
              f.vulnerability.evidence?.toLowerCase().includes(term)
          );
        }

        // Filter by minimum confidence
        if (filter.minConfidence !== undefined) {
          filtered = filtered.filter((f) => f.confidence >= filter.minConfidence!);
        }

        // Sort by severity (Critical → Info), then by timestamp (newest first)
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
        filtered.sort((a, b) => {
          const severityDiff =
            severityOrder[a.vulnerability.severity] -
            severityOrder[b.vulnerability.severity];
          if (severityDiff !== 0) return severityDiff;

          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        return filtered;
      },

      // Select finding
      selectFinding: (findingId) => {
        set({ selectedFindingId: findingId });
      },

      // Get finding by ID
      getFindingById: (findingId) => {
        return get().findings.find((f) => f.id === findingId);
      },

      // Set filter
      setFilter: (newFilter) => {
        set((state) => ({
          filter: { ...state.filter, ...newFilter },
        }));
      },

      // Clear filter
      clearFilter: () => {
        set({ filter: {} });
      },

      // Export as JSON
      exportAsJSON: () => {
        const findings = get().getFilteredFindings();
        return JSON.stringify(findings, null, 2);
      },

      // Export as CSV
      exportAsCSV: () => {
        const findings = get().getFilteredFindings();
        const headers = [
          'ID',
          'Source',
          'Severity',
          'Title',
          'Description',
          'URL',
          'Method',
          'Confidence',
          'Timestamp',
        ];

        const rows = findings.map((f) => [
          f.id,
          f.source,
          f.vulnerability.severity,
          f.vulnerability.title,
          f.vulnerability.description,
          f.requestUrl || '',
          f.requestMethod || '',
          f.confidence.toFixed(2),
          f.timestamp,
        ]);

        return [
          headers.join(','),
          ...rows.map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
          ),
        ].join('\n');
      },

      // Export as Markdown
      exportAsMarkdown: () => {
        const findings = get().getFilteredFindings();
        const stats = get().getStats();

        let md = '# Security Findings Report\n\n';
        md += `**Generated**: ${new Date().toISOString()}\n\n`;
        md += `## Summary\n\n`;
        md += `- **Total Findings**: ${stats.total}\n`;
        md += `- **Critical**: ${stats.bySeverity.CRITICAL || 0}\n`;
        md += `- **High**: ${stats.bySeverity.HIGH || 0}\n`;
        md += `- **Medium**: ${stats.bySeverity.MEDIUM || 0}\n`;
        md += `- **Low**: ${stats.bySeverity.LOW || 0}\n`;
        md += `- **Average Confidence**: ${Math.round(stats.avgConfidence * 100)}%\n\n`;

        md += `## Findings\n\n`;

        findings.forEach((f, idx) => {
          md += `### ${idx + 1}. ${f.vulnerability.title}\n\n`;
          md += `- **Severity**: ${f.vulnerability.severity}\n`;
          md += `- **Source**: ${f.source}\n`;
          md += `- **URL**: ${f.requestUrl || 'N/A'}\n`;
          md += `- **Method**: ${f.requestMethod || 'N/A'}\n`;
          md += `- **Confidence**: ${Math.round(f.confidence * 100)}%\n`;
          md += `- **Timestamp**: ${f.timestamp}\n\n`;
          md += `**Description**:\n${f.vulnerability.description}\n\n`;

          if (f.vulnerability.evidence) {
            md += `**Evidence**:\n\`\`\`\n${f.vulnerability.evidence}\n\`\`\`\n\n`;
          }

          if (f.vulnerability.remediation) {
            md += `**Remediation**:\n${f.vulnerability.remediation}\n\n`;
          }

          md += `---\n\n`;
        });

        return md;
      },

      // Get statistics
      getStats: () => {
        const findings = get().findings;

        const bySeverity = findings.reduce((acc, f) => {
          acc[f.vulnerability.severity] = (acc[f.vulnerability.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const bySource = findings.reduce((acc, f) => {
          acc[f.source] = (acc[f.source] || 0) + 1;
          return acc;
        }, {} as Record<AISource, number>);

        const avgConfidence =
          findings.length > 0
            ? findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length
            : 0;

        return {
          total: findings.length,
          bySeverity,
          bySource,
          avgConfidence,
        };
      },
    }),
    {
      name: 'unified-ai-store',
      partialize: (state) => ({
        // Only persist analyses and findings
        analyses: Array.from(state.analyses.entries()),
        findings: state.findings,
      }),
      onRehydrateStorage: () => (state) => {
        // Convert persisted array back to Map
        if (state && Array.isArray(state.analyses)) {
          state.analyses = new Map(state.analyses as any);
        }
      },
    }
  )
);
