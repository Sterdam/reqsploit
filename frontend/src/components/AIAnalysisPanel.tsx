/**
 * AI Analysis Panel - Intelligent security analysis with 3 modes
 */

import { useState, useEffect } from 'react';
import { Brain, Sparkles, Microscope, AlertTriangle, CheckCircle, Info, Loader2, Tag as TagIcon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

type AIMode = 'EDUCATIONAL' | 'DEFAULT' | 'ADVANCED';

interface Vulnerability {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  evidence: Record<string, any>;
  remediation: string;
  cwe?: string;
  cvss?: number;
}

interface Analysis {
  id: string;
  mode: AIMode;
  aiResponse: string;
  suggestions: any;
  tokensUsed: number;
  confidence: number;
  createdAt: string;
  vulnerabilities: Vulnerability[];
}

interface Props {
  requestId: string;
}

export function AIAnalysisPanel({ requestId }: Props) {
  const [mode, setMode] = useState<AIMode>('DEFAULT');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [attackSurface, setAttackSurface] = useState<any>(null);
  const [userContext, setUserContext] = useState('');
  const [showUserContext, setShowUserContext] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<any>(null);
  const { accessToken } = useAuthStore();

  const modes = [
    {
      id: 'EDUCATIONAL' as AIMode,
      name: 'Educational',
      icon: Brain,
      color: 'blue',
      description: 'Detailed explanations for learning',
      features: ['Why & How explanations', 'Learning resources', 'Step-by-step guides'],
    },
    {
      id: 'DEFAULT' as AIMode,
      name: 'Default',
      icon: Sparkles,
      color: 'purple',
      description: 'Fast & actionable pentesting',
      features: ['Quick vulnerability detection', 'Ready-to-use payloads', 'Prioritized findings'],
    },
    {
      id: 'ADVANCED' as AIMode,
      name: 'Advanced',
      icon: Microscope,
      color: 'red',
      description: 'Expert-level analysis',
      features: ['Advanced vuln detection', 'Vulnerability chaining', 'Complex exploitation'],
    },
  ];

  const severityColors = {
    CRITICAL: 'bg-red-600/20 text-red-400 border-red-600/30',
    HIGH: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
    MEDIUM: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    LOW: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
    INFO: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  };

  useEffect(() => {
    fetchTokenStatus();
    fetchAttackSurface();
  }, [requestId]);

  const fetchTokenStatus = async () => {
    try {
      const token = accessToken;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analysis/tokens/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTokenStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching token status:', error);
    }
  };

  const fetchAttackSurface = async () => {
    try {
      const token = accessToken;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/analysis/attack-surface/${requestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setAttackSurface(data.data);
      }
    } catch (error) {
      console.error('Error fetching attack surface:', error);
    }
  };

  const runAnalysis = async () => {
    if (!tokenStatus?.available) {
      alert('Token limit exceeded. Please upgrade your plan.');
      return;
    }

    setAnalyzing(true);
    try {
      const token = accessToken;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestLogId: requestId,
          mode,
          userContext: userContext || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysis({
          ...data.data.analysis,
          vulnerabilities: data.data.vulnerabilities,
        });
        setTokenStatus({
          ...tokenStatus,
          remaining: data.data.tokensRemaining,
          used: tokenStatus.used + data.data.analysis.tokensUsed,
        });
      } else {
        alert(data.error || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('Error running analysis:', error);
      alert('Analysis failed: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const selectedMode = modes.find(m => m.id === mode)!;

  return (
    <div className="flex flex-col h-full bg-[#0A1929]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-[#0A1929]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-400" />
            AI Security Analysis
          </h2>
          {tokenStatus && (
            <div className="text-xs text-gray-400">
              <span className={tokenStatus.available ? 'text-green-400' : 'text-red-400'}>
                {tokenStatus.remaining.toLocaleString()} / {tokenStatus.limit.toLocaleString()} tokens
              </span>
            </div>
          )}
        </div>

        {/* Mode Selection */}
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`p-3 rounded-lg border transition ${
                  isSelected
                    ? `bg-${m.color}-600/20 text-${m.color}-400 border-${m.color}-600/30`
                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{m.name}</span>
                </div>
                <p className="text-xs opacity-80">{m.description}</p>
              </button>
            );
          })}
        </div>

        {/* Mode Features */}
        <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="flex flex-wrap gap-2">
            {selectedMode.features.map((feature, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded border border-white/10"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* User Context (Optional) */}
        <button
          onClick={() => setShowUserContext(!showUserContext)}
          className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition"
        >
          {showUserContext ? 'Hide' : 'Add'} Analysis Notes (Optional)
        </button>

        {showUserContext && (
          <textarea
            placeholder="Add context to help AI understand your testing objectives..."
            value={userContext}
            onChange={(e) => setUserContext(e.target.value)}
            className="mt-2 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm resize-none"
            rows={3}
          />
        )}

        {/* Analyze Button */}
        <button
          onClick={runAnalysis}
          disabled={analyzing || !tokenStatus?.available}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing with {mode} mode...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Run AI Analysis ({mode})
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Attack Surface (Quick Preview) */}
        {attackSurface && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              Attack Surface
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/5 rounded p-2">
                <div className="text-xs text-gray-400">Parameters</div>
                <div className="text-lg font-bold text-white">{attackSurface.totalParameters}</div>
              </div>
              <div className="bg-white/5 rounded p-2">
                <div className="text-xs text-gray-400">Risk Score</div>
                <div className={`text-lg font-bold ${attackSurface.riskScore >= 70 ? 'text-red-400' : attackSurface.riskScore >= 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {attackSurface.riskScore}/100
                </div>
              </div>
            </div>

            {attackSurface.vulnerabilities && attackSurface.vulnerabilities.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 font-medium">Potential Vulnerabilities:</div>
                {attackSurface.vulnerabilities.slice(0, 3).map((v: any, idx: number) => (
                  <div key={idx} className="bg-white/5 rounded p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white font-medium">{v.parameter}</span>
                      <span className="text-xs text-gray-400">{v.location}</span>
                    </div>
                    {v.detectedVulnerabilities.map((dv: any, didx: number) => (
                      <div key={didx} className="mt-1 text-xs text-gray-400">
                        → {dv.type} ({dv.confidence}% confidence)
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Analysis Summary</h3>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Confidence: {analysis.confidence}%</span>
                  <span>Tokens: {analysis.tokensUsed}</span>
                </div>
              </div>
              <div className="text-sm text-gray-300">{analysis.aiResponse.substring(0, 200)}...</div>
            </div>

            {/* Vulnerabilities */}
            {analysis.vulnerabilities.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Vulnerabilities Found ({analysis.vulnerabilities.length})
                </h3>

                <div className="space-y-3">
                  {analysis.vulnerabilities.map((vuln) => (
                    <div key={vuln.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white">{vuln.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">{vuln.type}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${severityColors[vuln.severity]}`}>
                          {vuln.severity}
                        </span>
                      </div>

                      <p className="text-sm text-gray-300 mb-2">{vuln.description}</p>

                      {vuln.cwe && (
                        <div className="text-xs text-gray-400 mb-2">CWE: {vuln.cwe}</div>
                      )}

                      {vuln.cvss && (
                        <div className="text-xs text-gray-400 mb-2">CVSS: {vuln.cvss}</div>
                      )}

                      <div className="mt-3 p-2 bg-blue-600/10 border border-blue-600/30 rounded">
                        <div className="text-xs font-medium text-blue-400 mb-1">Remediation:</div>
                        <div className="text-xs text-blue-300">{vuln.remediation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  Recommendations
                </h3>

                {analysis.suggestions.nextSteps && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-400 mb-2">Next Steps:</div>
                    <ul className="space-y-1">
                      {analysis.suggestions.nextSteps.map((step: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.suggestions.payloads && (
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Test Payloads:</div>
                    <div className="space-y-1">
                      {analysis.suggestions.payloads.map((payload: string, idx: number) => (
                        <code key={idx} className="block px-2 py-1 bg-black/30 text-xs text-green-400 rounded font-mono">
                          {payload}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!analysis && !analyzing && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select an AI mode and run analysis</p>
              <p className="text-xs mt-1">Get intelligent security insights powered by Claude</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
