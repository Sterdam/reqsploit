import { useState } from 'react';
import { useRequestsStore } from '../stores/requestsStore';
import { useAIStore } from '../stores/aiStore';

export function AIPanel() {
  const { selectedRequest } = useRequestsStore();
  const { isAnalyzing, analyzeRequest, getAnalysisForRequest } = useAIStore();
  const [analysisType, setAnalysisType] = useState<'request' | 'response' | 'full'>('full');

  const analysis = selectedRequest ? getAnalysisForRequest(selectedRequest.id) : null;

  const handleAnalyze = async () => {
    if (!selectedRequest) return;

    try {
      await analyzeRequest(selectedRequest.id, analysisType);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-blue-500';
      case 'INFO':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">AI Security Analysis</h2>

        {selectedRequest ? (
          <div className="space-y-3">
            {/* Analysis Type Selection */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Analysis Type:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setAnalysisType('request')}
                  className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    analysisType === 'request'
                      ? 'bg-electric-blue text-white'
                      : 'bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  Request
                </button>
                <button
                  onClick={() => setAnalysisType('response')}
                  className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    analysisType === 'response'
                      ? 'bg-electric-blue text-white'
                      : 'bg-white/10 text-gray-400 hover:text-white'
                  }`}
                  disabled={!selectedRequest.statusCode}
                >
                  Response
                </button>
                <button
                  onClick={() => setAnalysisType('full')}
                  className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    analysisType === 'full'
                      ? 'bg-electric-blue text-white'
                      : 'bg-white/10 text-gray-400 hover:text-white'
                  }`}
                  disabled={!selectedRequest.statusCode}
                >
                  Full
                </button>
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (analysisType !== 'request' && !selectedRequest.statusCode)}
              className="w-full px-4 py-3 bg-cyber-green hover:bg-cyber-green/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-deep-navy font-medium rounded-md transition-colors duration-200"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Select a request to analyze</p>
        )}
      </div>

      {/* Analysis Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-electric-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-400">Analyzing with Claude AI...</p>
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {/* Analysis Info */}
            <div className="p-3 bg-white/5 rounded-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Analysis Type:</span>
                <span className="text-white font-medium uppercase">{analysis.analysisType}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-gray-400">Tokens Used:</span>
                <span className="text-white font-medium">{analysis.tokensUsed.toLocaleString()}</span>
              </div>
            </div>

            {/* Vulnerabilities */}
            {analysis.vulnerabilities && analysis.vulnerabilities.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">
                  Vulnerabilities ({analysis.vulnerabilities.length})
                </h3>
                <div className="space-y-2">
                  {analysis.vulnerabilities.map((vuln, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-md border border-white/10">
                      <div className="flex items-start gap-2 mb-2">
                        <span
                          className={`px-2 py-1 ${getSeverityColor(
                            vuln.severity
                          )} rounded text-xs font-semibold text-white`}
                        >
                          {vuln.severity}
                        </span>
                        <h4 className="text-sm font-medium text-white flex-1">{vuln.title}</h4>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">{vuln.description}</p>
                      {vuln.remediation && (
                        <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                          <p className="text-xs text-blue-200 font-medium mb-1">Remediation:</p>
                          <p className="text-xs text-gray-300">{vuln.remediation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">
                  Suggestions ({analysis.suggestions.length})
                </h3>
                <div className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-md border border-white/10">
                      <div className="flex items-start gap-2 mb-2">
                        <span
                          className={`px-2 py-1 ${getSeverityColor(
                            suggestion.severity
                          )} rounded text-xs font-semibold text-white`}
                        >
                          {suggestion.type.toUpperCase()}
                        </span>
                        <h4 className="text-sm font-medium text-white flex-1">
                          {suggestion.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-300">{suggestion.description}</p>
                      {suggestion.actions && suggestion.actions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {suggestion.actions.map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              className="px-2 py-1 bg-electric-blue/20 hover:bg-electric-blue/30 text-electric-blue text-xs rounded transition-colors"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {(!analysis.vulnerabilities || analysis.vulnerabilities.length === 0) &&
              (!analysis.suggestions || analysis.suggestions.length === 0) && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <p className="text-sm">No vulnerabilities or suggestions found</p>
                    <p className="text-xs mt-1">The request appears to be secure</p>
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p className="text-sm">No analysis yet</p>
              <p className="text-xs mt-1">Click "Analyze with AI" to start</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
