import { aiAPI } from '../lib/api';
import { useState, useEffect } from 'react';
import { Sparkles, Play, Loader2, ChevronDown, ChevronUp, AlertTriangle, Shield, Zap, CheckCircle } from 'lucide-react';
import { useAIStore } from '../stores/aiStore';
import { toast } from '../stores/toastStore';

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
  tabId: _tabId,
  request,
  onExecuteTest,
  autoExecute,
  onToggleAutoExecute,
}: RepeaterAIPanelProps) {
  const { canAfford, tokenUsage, actionCosts, getEstimatedCost, loadTokenUsage, fetchActionCosts, model } = useAIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AITestSuggestions | null>(null);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [tokensUsed, setTokensUsed] = useState(0);

  // Job system states
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const estimatedCost = getEstimatedCost('suggestTests');
  const hasTokenData = tokenUsage !== null && actionCosts.length > 0;

  // Load token data on mount
  useEffect(() => {
    console.log('🔍 RepeaterAIPanel: Loading token data...');
    console.log('  tokenUsage:', tokenUsage);
    console.log('  actionCosts length:', actionCosts.length);

    if (!tokenUsage) {
      loadTokenUsage().then(() => console.log('✅ Token usage loaded'));
    }
    if (actionCosts.length === 0) {
      fetchActionCosts().then(() => console.log('✅ Action costs loaded'));
    }
  }, []);

  // Debug log when data changes
  useEffect(() => {
    console.log('📊 RepeaterAIPanel state update:');
    console.log('  hasTokenData:', hasTokenData);
    console.log('  estimatedCost:', estimatedCost);
    console.log('  canAfford:', canAfford('suggestTests'));
    console.log('  tokenUsage:', tokenUsage);
    console.log('  actionCosts:', actionCosts);
  }, [hasTokenData, estimatedCost, tokenUsage, actionCosts]);

  // Load active jobs on mount (job persistence)
  useEffect(() => {
    const loadActiveJobs = async () => {
      try {
        console.log('🔄 Checking for active AI jobs...');
        const jobs = await aiAPI.getUserJobs(false); // Only active jobs

        if (jobs && jobs.length > 0) {
          console.log(`📋 Found ${jobs.length} active job(s)`);

          // Find most recent SUGGEST_TESTS job
          const suggestTestsJob = jobs.find(
            (job: any) => job.type === 'SUGGEST_TESTS' &&
            (job.status === 'PENDING' || job.status === 'PROCESSING')
          );

          if (suggestTestsJob) {
            console.log('🔄 Resuming job:', suggestTestsJob.jobId);
            setIsLoading(true);
            startJobPolling(suggestTestsJob.jobId);
          }
        } else {
          console.log('✅ No active jobs to resume');
        }
      } catch (error) {
        console.error('❌ Failed to load active jobs:', error);
      }
    };

    loadActiveJobs();

    // Cleanup polling interval on unmount
    return () => {
      if (pollingInterval) {
        console.log('🧹 Cleaning up polling interval');
        clearInterval(pollingInterval);
      }
    };
  }, []); // Empty deps = run once on mount

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

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    try {
      const jobData = await aiAPI.getJobStatus(jobId);
      console.log('📊 Job status update:', {
        jobId,
        status: jobData.status,
        progress: jobData.progress,
      });

      setJobStatus(jobData.status);
      setJobProgress(jobData.progress);

      if (jobData.status === 'COMPLETED') {
        console.log('✅ Job completed successfully');

        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }

        // Set results
        if (jobData.analysis && jobData.analysis.suggestions) {
          setSuggestions(jobData.analysis.suggestions);
          setTokensUsed(jobData.analysis.tokensUsed || 0);

          // Check if no tests generated
          if (!jobData.analysis.suggestions.tests || jobData.analysis.suggestions.tests.length === 0) {
            console.warn('⚠️ No test suggestions in response');
          }
        }

        setIsLoading(false);
        setCurrentJobId(null);
        setJobStatus(null);
        setJobProgress(0);

        // Reload token usage
        loadTokenUsage();

      } else if (jobData.status === 'FAILED') {
        console.error('❌ Job failed:', jobData.errorMessage);

        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }

        toast.error('Job Failed', jobData.errorMessage || 'Unknown error');
        setIsLoading(false);
        setCurrentJobId(null);
        setJobStatus(null);
        setJobProgress(0);

      } else if (jobData.status === 'CANCELLED') {
        console.log('🚫 Job was cancelled');

        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }

        setIsLoading(false);
        setCurrentJobId(null);
        setJobStatus(null);
        setJobProgress(0);
      }
      // If PENDING or PROCESSING, continue polling (interval will call again)

    } catch (error) {
      console.error('❌ Failed to poll job status:', error);
      // Don't stop polling on temporary errors, will retry
    }
  };

  // Start polling a job
  const startJobPolling = (jobId: string) => {
    console.log('🔄 Starting job polling for:', jobId);
    setCurrentJobId(jobId);
    setJobStatus('PENDING');
    setJobProgress(0);

    // Poll immediately
    pollJobStatus(jobId);

    // Then poll every 2 seconds
    const interval = setInterval(() => {
      pollJobStatus(jobId);
    }, 2000);

    setPollingInterval(interval);
  };

  // Cancel current job
  const handleCancelJob = async () => {
    if (!currentJobId) return;

    try {
      await aiAPI.cancelJob(currentJobId);
      console.log('🚫 Job cancelled:', currentJobId);

      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }

      setIsLoading(false);
      setCurrentJobId(null);
      setJobStatus(null);
      setJobProgress(0);
    } catch (error) {
      console.error('❌ Failed to cancel job:', error);
    }
  };

  const handleSuggestTests = async () => {
    console.log('🚀 handleSuggestTests called');

    // Only check if we have token data AND insufficient tokens
    if (hasTokenData && !canAfford('suggestTests')) {
      const msg = `Insufficient tokens. Need ${estimatedCost?.toLocaleString() || 'N/A'}, have ${tokenUsage?.remaining.toLocaleString() || 0}`;
      toast.error('Analysis Error', msg);
      console.error('❌', msg);
      return;
    }

    setIsLoading(true);
    console.log('📡 Creating AI job for test suggestions...');

    try {
      // Create job (returns immediately with jobId)
      const result = await aiAPI.suggestTests(request, model);
      console.log('✅ Job created:', result);

      // Start polling for results
      startJobPolling(result.jobId);

    } catch (error) {
      console.error('❌ Failed to create job:', error);
      toast.error('Analysis Failed', error instanceof Error ? error.message : 'Failed to create job');
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
    <div className="w-80 min-w-[320px] border-l border-white/10 bg-[#0D1F2D] flex flex-col flex-shrink-0">
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
          disabled={isLoading || (hasTokenData && !canAfford('suggestTests'))}
          className="w-full mt-3 px-4 py-2 bg-electric-blue hover:bg-electric-blue/80 text-white rounded font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title={
            isLoading
              ? jobStatus === 'PENDING' ? 'Job queued...' : jobStatus === 'PROCESSING' ? `Processing... ${jobProgress}%` : 'Generating suggestions...'
              : !hasTokenData
              ? 'Click to generate test suggestions (token data loading...)'
              : !canAfford('suggestTests')
              ? `Insufficient tokens (need ${estimatedCost?.toLocaleString() || 'N/A'}, have ${tokenUsage?.remaining.toLocaleString() || 0})`
              : 'Generate AI test suggestions'
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {jobStatus === 'PENDING' && 'Queued...'}
              {jobStatus === 'PROCESSING' && `${jobProgress}%`}
              {!jobStatus && 'Analyzing...'}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Suggest Tests {estimatedCost ? `(${(estimatedCost / 1000).toFixed(1)}K)` : ''}
            </>
          )}
        </button>

        {/* Cancel Button - Only show when job is running */}
        {isLoading && currentJobId && (
          <button
            onClick={handleCancelJob}
            className="w-full mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm flex items-center justify-center gap-2 transition"
          >
            <AlertTriangle className="w-4 h-4" />
            Cancel Job
          </button>
        )}

        {/* Progress Bar - Show when job is processing */}
        {isLoading && jobProgress > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{jobStatus === 'PENDING' ? 'Queued' : 'Processing'}</span>
              <span>{jobProgress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-electric-blue h-full transition-all duration-300 ease-out"
                style={{ width: `${jobProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Token info */}
        {hasTokenData && tokenUsage && (
          <div className="mt-2 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Available:</span>
              <span className="font-medium text-white">{tokenUsage.remaining.toLocaleString()}</span>
            </div>
            {estimatedCost && (
              <div className="flex justify-between">
                <span>Cost:</span>
                <span className="font-medium text-electric-blue">{estimatedCost.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {!hasTokenData && (
          <p className="text-xs text-yellow-400 mt-2">
            Loading pricing data...
          </p>
        )}

        {tokensUsed > 0 && (
          <p className="text-xs text-green-400 mt-2">
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
            {suggestions.tests && suggestions.tests.length > 0 ? (
              suggestions.tests.map((test) => (
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
            ))
            ) : (
              <div className="text-center text-gray-400 text-sm py-8">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50 text-yellow-500" />
                <p className="font-medium text-white mb-2">No Test Suggestions Generated</p>
                <p>The AI analyzed the request but couldn't generate specific test suggestions.</p>
                <p className="mt-2 text-xs">The analysis has been saved to your history.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
