import { aiAPI } from '../lib/api';
import { useState } from 'react';
import { X, FileText, Loader2, Download, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAIStore } from '../stores/aiStore';
import { toast } from '../stores/toastStore';

interface Finding {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  description: string;
  affectedEndpoints: string[];
  evidence: string;
  impact: string;
  likelihood: string;
  cvss?: string;
  remediation?: string;
  references: string[];
}

interface Report {
  executiveSummary: {
    overview: string;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    keyRecommendations: string[];
  };
  projectOverview: {
    name: string;
    scope: string;
    testingPeriod: string;
    requestsAnalyzed: number;
    aiAnalysesPerformed: number;
  };
  findings: Finding[];
  statistics: {
    totalRequests?: number;
    uniqueEndpoints?: number;
    methodsDistribution?: Record<string, number>;
    statusCodesDistribution?: Record<string, number>;
    vulnerabilityTypes?: Record<string, number>;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  conclusion: string;
}

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export function ReportGeneratorModal({ isOpen, onClose, projectId, projectName }: ReportGeneratorModalProps) {
  const { canAfford } = useAIStore();
  const [includeRemediation, setIncludeRemediation] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!canAfford('generateDorks')) {
      toast.error('Insufficient tokens', 'You need more tokens to generate a security report');
      return;
    }

    setIsGenerating(true);
    setReport(null);

    try {
      const result = await aiAPI.generateReport(projectId, {
        includeRemediation,
      });
      setReport(result.report);
      setTokensUsed(result.tokensUsed);
      toast.success('Report Generated', `Security report created using ${result.tokensUsed.toLocaleString()} tokens`);
    } catch (error) {
      console.error('Report generation failed:', error);
      toast.error('Generation Failed', error instanceof Error ? error.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportMarkdown = () => {
    if (!report) return;

    let markdown = `# Security Assessment Report\n## ${projectName}\n\n`;

    markdown += `## Executive Summary\n\n${report.executiveSummary.overview}\n\n`;
    markdown += `### Risk Level: **${report.executiveSummary.riskLevel.toUpperCase()}**\n\n`;
    markdown += `### Findings Summary\n`;
    markdown += `- 🔴 Critical: ${report.executiveSummary.criticalFindings}\n`;
    markdown += `- 🟠 High: ${report.executiveSummary.highFindings}\n`;
    markdown += `- 🟡 Medium: ${report.executiveSummary.mediumFindings}\n`;
    markdown += `- 🟢 Low: ${report.executiveSummary.lowFindings}\n\n`;

    markdown += `### Key Recommendations\n`;
    report.executiveSummary.keyRecommendations.forEach((rec, i) => {
      markdown += `${i + 1}. ${rec}\n`;
    });
    markdown += `\n`;

    markdown += `## Project Overview\n\n`;
    markdown += `- **Scope**: ${report.projectOverview.scope}\n`;
    markdown += `- **Testing Period**: ${report.projectOverview.testingPeriod}\n`;
    markdown += `- **Requests Analyzed**: ${report.projectOverview.requestsAnalyzed}\n`;
    markdown += `- **AI Analyses Performed**: ${report.projectOverview.aiAnalysesPerformed}\n\n`;

    markdown += `## Findings\n\n`;
    report.findings.forEach((finding, i) => {
      markdown += `### ${i + 1}. ${finding.title} [${finding.severity.toUpperCase()}]\n\n`;
      markdown += `**Category**: ${finding.category}\n\n`;
      markdown += `**Description**: ${finding.description}\n\n`;
      markdown += `**Affected Endpoints**:\n`;
      finding.affectedEndpoints.forEach(endpoint => {
        markdown += `- ${endpoint}\n`;
      });
      markdown += `\n**Impact**: ${finding.impact}\n\n`;
      markdown += `**Likelihood**: ${finding.likelihood}\n\n`;
      if (finding.cvss) {
        markdown += `**CVSS Score**: ${finding.cvss}\n\n`;
      }
      if (finding.remediation) {
        markdown += `**Remediation**:\n${finding.remediation}\n\n`;
      }
      markdown += `---\n\n`;
    });

    markdown += `## Recommendations\n\n`;
    markdown += `### Immediate Actions\n`;
    report.recommendations.immediate.forEach((rec, i) => {
      markdown += `${i + 1}. ${rec}\n`;
    });
    markdown += `\n### Short-term (1-3 months)\n`;
    report.recommendations.shortTerm.forEach((rec, i) => {
      markdown += `${i + 1}. ${rec}\n`;
    });
    markdown += `\n### Long-term (Strategic)\n`;
    report.recommendations.longTerm.forEach((rec, i) => {
      markdown += `${i + 1}. ${rec}\n`;
    });
    markdown += `\n`;

    markdown += `## Conclusion\n\n${report.conclusion}\n`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${projectName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported', 'Report exported as Markdown');
  };

  const exportHTML = () => {
    if (!report) return;

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Assessment Report - ${projectName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #1a1a1a; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
    h2 { color: #0066cc; margin-top: 30px; }
    .severity-critical { color: #d32f2f; font-weight: bold; }
    .severity-high { color: #f57c00; font-weight: bold; }
    .severity-medium { color: #fbc02d; font-weight: bold; }
    .severity-low { color: #388e3c; font-weight: bold; }
    .finding { background: #f9f9f9; padding: 20px; margin: 20px 0; border-left: 4px solid #0066cc; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .stat-box { background: #e3f2fd; padding: 15px; border-radius: 4px; }
    ul { line-height: 1.8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Security Assessment Report</h1>
    <h2>${projectName}</h2>

    <h2>Executive Summary</h2>
    <p>${report.executiveSummary.overview}</p>

    <div class="stats">
      <div class="stat-box">
        <h3>Risk Level</h3>
        <p class="severity-${report.executiveSummary.riskLevel}">${report.executiveSummary.riskLevel.toUpperCase()}</p>
      </div>
      <div class="stat-box">
        <h3>Critical Findings</h3>
        <p>${report.executiveSummary.criticalFindings}</p>
      </div>
      <div class="stat-box">
        <h3>High Findings</h3>
        <p>${report.executiveSummary.highFindings}</p>
      </div>
      <div class="stat-box">
        <h3>Medium Findings</h3>
        <p>${report.executiveSummary.mediumFindings}</p>
      </div>
    </div>

    <h3>Key Recommendations</h3>
    <ul>
      ${report.executiveSummary.keyRecommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>

    <h2>Findings</h2>
    ${report.findings.map((finding, i) => `
      <div class="finding">
        <h3>${i + 1}. ${finding.title} <span class="severity-${finding.severity}">[${finding.severity.toUpperCase()}]</span></h3>
        <p><strong>Category:</strong> ${finding.category}</p>
        <p><strong>Description:</strong> ${finding.description}</p>
        <p><strong>Impact:</strong> ${finding.impact}</p>
        ${finding.remediation ? `<p><strong>Remediation:</strong> ${finding.remediation}</p>` : ''}
      </div>
    `).join('')}

    <h2>Recommendations</h2>
    <h3>Immediate Actions</h3>
    <ul>
      ${report.recommendations.immediate.map(rec => `<li>${rec}</li>`).join('')}
    </ul>

    <h3>Short-term (1-3 months)</h3>
    <ul>
      ${report.recommendations.shortTerm.map(rec => `<li>${rec}</li>`).join('')}
    </ul>

    <h3>Long-term (Strategic)</h3>
    <ul>
      ${report.recommendations.longTerm.map(rec => `<li>${rec}</li>`).join('')}
    </ul>

    <h2>Conclusion</h2>
    <p>${report.conclusion}</p>

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
      Generated by ReqSploit AI on ${new Date().toLocaleString()}
    </footer>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${projectName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Exported', 'Report exported as HTML');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/10';
      case 'high':
        return 'text-orange-400 bg-orange-500/10';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'low':
        return 'text-blue-400 bg-blue-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <TrendingUp className="w-6 h-6 text-red-400" />;
      case 'medium':
        return <TrendingUp className="w-6 h-6 text-yellow-400" />;
      case 'low':
        return <TrendingDown className="w-6 h-6 text-green-400" />;
      default:
        return <CheckCircle className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0D1F2D] border border-white/10 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-electric-blue" />
              AI Security Report
            </h2>
            <p className="text-sm text-white/60 mt-1">Generate comprehensive security assessment (25K tokens)</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {!report && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Project: {projectName}</h3>
                <p className="text-sm text-white/60">
                  Generate a comprehensive security assessment report analyzing all requests and AI findings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="include-remediation"
                  checked={includeRemediation}
                  onChange={(e) => setIncludeRemediation(e.target.checked)}
                  className="w-4 h-4"
                  disabled={isGenerating}
                />
                <label htmlFor="include-remediation" className="text-sm text-white">
                  Include detailed remediation steps
                </label>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !canAfford('generateDorks')}
                className="w-full px-4 py-3 bg-electric-blue hover:bg-electric-blue/80 text-white rounded font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Generate Security Report (25K tokens)
                  </>
                )}
              </button>

              {!canAfford('generateDorks') && (
                <p className="text-sm text-red-400 text-center">Insufficient tokens to generate report</p>
              )}
            </div>
          )}

          {report && (
            <div className="space-y-6">
              {/* Export Buttons */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={exportMarkdown}
                  className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-sm font-medium flex items-center gap-2 border border-green-600/30"
                >
                  <Download className="w-4 h-4" />
                  Export Markdown
                </button>
                <button
                  onClick={exportHTML}
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-sm font-medium flex items-center gap-2 border border-blue-600/30"
                >
                  <Download className="w-4 h-4" />
                  Export HTML
                </button>
              </div>

              {/* Executive Summary */}
              <div className="p-4 bg-[#0A1929] border border-white/10 rounded">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  {getRiskIcon(report.executiveSummary.riskLevel)}
                  Executive Summary
                </h3>
                <p className="text-sm text-white/80 mb-4">{report.executiveSummary.overview}</p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <div className={`p-3 rounded ${getSeverityColor(report.executiveSummary.riskLevel)}`}>
                    <div className="text-xs opacity-60">Risk Level</div>
                    <div className="text-lg font-bold uppercase">{report.executiveSummary.riskLevel}</div>
                  </div>
                  <div className="p-3 rounded bg-red-500/10 text-red-400">
                    <div className="text-xs opacity-60">Critical</div>
                    <div className="text-lg font-bold">{report.executiveSummary.criticalFindings}</div>
                  </div>
                  <div className="p-3 rounded bg-orange-500/10 text-orange-400">
                    <div className="text-xs opacity-60">High</div>
                    <div className="text-lg font-bold">{report.executiveSummary.highFindings}</div>
                  </div>
                  <div className="p-3 rounded bg-yellow-500/10 text-yellow-400">
                    <div className="text-xs opacity-60">Medium</div>
                    <div className="text-lg font-bold">{report.executiveSummary.mediumFindings}</div>
                  </div>
                  <div className="p-3 rounded bg-blue-500/10 text-blue-400">
                    <div className="text-xs opacity-60">Low</div>
                    <div className="text-lg font-bold">{report.executiveSummary.lowFindings}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Key Recommendations</h4>
                  <ul className="text-sm text-white/70 space-y-1">
                    {report.executiveSummary.keyRecommendations.map((rec, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-electric-blue">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Findings */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Findings ({report.findings.length})</h3>
                <div className="space-y-3">
                  {report.findings.map((finding, i) => (
                    <div key={finding.id} className="p-4 bg-[#0A1929] border border-white/10 rounded">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-medium">{i + 1}. {finding.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(finding.severity)}`}>
                          {finding.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mb-2">{finding.category}</p>
                      <p className="text-sm text-white/70 mb-3">{finding.description}</p>

                      {finding.affectedEndpoints.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-white/60 mb-1">Affected Endpoints:</p>
                          <div className="space-y-1">
                            {finding.affectedEndpoints.map((endpoint, j) => (
                              <code key={j} className="text-xs bg-black/30 px-2 py-1 rounded block">
                                {endpoint}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}

                      {finding.remediation && (
                        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded">
                          <p className="text-xs font-medium text-green-400 mb-1">Remediation</p>
                          <p className="text-xs text-white/70">{finding.remediation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 bg-[#0A1929] border border-white/10 rounded">
                <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>

                {report.recommendations.immediate.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Immediate Actions
                    </h4>
                    <ul className="text-sm text-white/70 space-y-1 ml-6">
                      {report.recommendations.immediate.map((rec, i) => (
                        <li key={i}>{i + 1}. {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.recommendations.shortTerm.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-yellow-400 mb-2">Short-term (1-3 months)</h4>
                    <ul className="text-sm text-white/70 space-y-1 ml-6">
                      {report.recommendations.shortTerm.map((rec, i) => (
                        <li key={i}>{i + 1}. {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {report.recommendations.longTerm.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-2">Long-term (Strategic)</h4>
                    <ul className="text-sm text-white/70 space-y-1 ml-6">
                      {report.recommendations.longTerm.map((rec, i) => (
                        <li key={i}>{i + 1}. {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Conclusion */}
              {report.conclusion && (
                <div className="p-4 bg-[#0A1929] border border-white/10 rounded">
                  <h3 className="text-lg font-semibold text-white mb-2">Conclusion</h3>
                  <p className="text-sm text-white/70">{report.conclusion}</p>
                </div>
              )}

              {/* Token Usage */}
              <div className="text-center text-xs text-white/40">
                Report generated using {tokensUsed.toLocaleString()} tokens
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
