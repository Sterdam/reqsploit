/**
 * Compact AI Test Header - Integrated into Repeater tab header
 * Minimal footprint with maximum efficiency for pentesters
 */

import { useState } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAIStore } from '../stores/aiStore';
import { aiAPI } from '../lib/api';

interface CompactAITestHeaderProps {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  onTestSuggestionsReady: (suggestions: any) => void;
  autoExecute: boolean;
  onToggleAutoExecute: (enabled: boolean) => void;
}

export function CompactAITestHeader({
  request,
  onTestSuggestionsReady,
  autoExecute,
  onToggleAutoExecute,
}: CompactAITestHeaderProps) {
  const { canAfford, tokenUsage, getEstimatedCost, model } = useAIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const estimatedCost = getEstimatedCost('suggestTests');
  const hasEnoughTokens = canAfford('suggestTests');

  const handleSuggestTests = async () => {
    if (!hasEnoughTokens) {
      alert(`Insufficient tokens. Need ${estimatedCost?.toLocaleString() || 'N/A'}`);
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiAPI.suggestTests(request, model);
      onTestSuggestionsReady(result);
    } catch (error) {
      console.error('Test suggestion failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate test suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-2 bg-[#0A1929] border-b border-white/10">
      <div className="flex items-center gap-3">
        {/* AI Icon & Title */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Sparkles className="w-4 h-4 text-electric-blue" />
          <span className="text-xs font-medium text-gray-300">AI Test Assistant</span>
        </div>

        {/* Auto-Execute Toggle */}
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={autoExecute}
            onChange={(e) => onToggleAutoExecute(e.target.checked)}
            className="w-3 h-3 rounded border-white/20 bg-white/10 text-electric-blue focus:ring-electric-blue focus:ring-offset-0"
          />
          Auto-execute
        </label>

        {/* Suggest Tests Button */}
        <button
          onClick={handleSuggestTests}
          disabled={isLoading || !hasEnoughTokens}
          className="px-3 py-1 bg-electric-blue hover:bg-electric-blue/80 text-white rounded text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
          title={
            isLoading
              ? 'Analyzing...'
              : !hasEnoughTokens
              ? `Insufficient tokens (need ${estimatedCost?.toLocaleString() || 'N/A'})`
              : 'Generate AI test suggestions'
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              Suggest Tests {estimatedCost ? `(${(estimatedCost / 1000).toFixed(1)}K)` : ''}
            </>
          )}
        </button>

        {/* Token Info - Compact */}
        {tokenUsage && (
          <div className="flex items-center gap-2 text-xs ml-auto">
            <span className="text-gray-400">Available:</span>
            <span className="font-medium text-white">{tokenUsage.remaining.toLocaleString()}</span>
            {estimatedCost && (
              <>
                <span className="text-gray-600">|</span>
                <span className="text-gray-400">Cost:</span>
                <span className="font-medium text-electric-blue">{estimatedCost.toLocaleString()}</span>
              </>
            )}
          </div>
        )}

        {/* Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-1 hover:bg-white/10 rounded transition flex-shrink-0"
          title="Toggle details"
        >
          {showDetails ? (
            <ChevronUp className="w-3 h-3 text-gray-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-gray-400" />
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && tokenUsage && (
        <div className="mt-2 pt-2 border-t border-white/10 grid grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-gray-400">Used:</span>
            <span className="ml-2 font-medium text-white">{tokenUsage.used.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400">Limit:</span>
            <span className="ml-2 font-medium text-white">{(tokenUsage.used + tokenUsage.remaining).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400">Model:</span>
            <span className="ml-2 font-medium text-electric-blue">{model}</span>
          </div>
        </div>
      )}
    </div>
  );
}
