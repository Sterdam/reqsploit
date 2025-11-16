import { useState } from 'react';
import { X, Search, Loader2, Copy, CheckCircle, Globe, Code, Shield } from 'lucide-react';
import { useAIStore } from '../stores/aiStore';
import { toast } from '../stores/toastStore';
import { aiAPI } from '../lib/api';

interface Dork {
  query: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface DorkResults {
  google: Dork[];
  shodan: Dork[];
  github: Dork[];
}

interface DorkGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DorkGeneratorModal({ isOpen, onClose }: DorkGeneratorModalProps) {
  const { canAfford } = useAIStore();
  const [target, setTarget] = useState('');
  const [objective, setObjective] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['google', 'shodan', 'github']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<DorkResults | null>(null);
  const [summary, setSummary] = useState('');
  const [copiedDork, setCopiedDork] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTogglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter((p) => p !== platform));
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  const handleGenerate = async () => {
    if (!target.trim() || !objective.trim()) {
      toast.error('Missing fields', 'Please provide both target and objective');
      return;
    }

    if (platforms.length === 0) {
      toast.error('No platforms selected', 'Select at least one platform');
      return;
    }

    if (!canAfford('generateDorks')) {
      toast.error('Insufficient tokens', 'You need more tokens to generate dorks');
      return;
    }

    setIsGenerating(true);
    setResults(null);

    try {
      const result = await aiAPI.generateDorks({
        target,
        objective,
        platforms,
      });
      setResults(result.dorks);
      setSummary(result.summary);
      toast.success('Dorks Generated', `${result.totalDorks} dorks created for ${platforms.length} platforms`);
    } catch (error) {
      console.error('Dork generation failed:', error);
      toast.error('Generation Failed', error instanceof Error ? error.message : 'Failed to generate dorks');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyDork = (query: string) => {
    navigator.clipboard.writeText(query);
    setCopiedDork(query);
    setTimeout(() => setCopiedDork(null), 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'low':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'google':
        return <Globe className="w-4 h-4" />;
      case 'shodan':
        return <Shield className="w-4 h-4" />;
      case 'github':
        return <Code className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0D1F2D] border border-white/10 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-electric-blue" />
              AI Dork Generator
            </h2>
            <p className="text-sm text-white/60 mt-1">Generate reconnaissance search dorks (14K tokens)</p>
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
          <div className="space-y-4">
            {/* Input Fields */}
            <div>
              <label className="text-sm font-medium text-white block mb-2">Target Domain/Organization</label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="example.com or CompanyName"
                className="w-full px-3 py-2 bg-[#0A1929] text-white border border-white/20 rounded text-sm focus:outline-none focus:border-electric-blue"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white block mb-2">Objective</label>
              <input
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Find exposed credentials, admin panels, API keys, etc."
                className="w-full px-3 py-2 bg-[#0A1929] text-white border border-white/20 rounded text-sm focus:outline-none focus:border-electric-blue"
                disabled={isGenerating}
              />
            </div>

            {/* Platform Selection */}
            <div>
              <label className="text-sm font-medium text-white block mb-2">Platforms</label>
              <div className="flex gap-2">
                {['google', 'shodan', 'github'].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => handleTogglePlatform(platform)}
                    disabled={isGenerating}
                    className={`px-4 py-2 rounded text-sm font-medium flex items-center gap-2 border transition ${
                      platforms.includes(platform)
                        ? 'bg-electric-blue border-electric-blue text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    } disabled:opacity-50`}
                  >
                    {getPlatformIcon(platform)}
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !canAfford('generateDorks')}
              className="w-full px-4 py-3 bg-electric-blue hover:bg-electric-blue/80 text-white rounded font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Dorks...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Generate Dorks (14K tokens)
                </>
              )}
            </button>

            {!canAfford('generateDorks') && (
              <p className="text-sm text-red-400 text-center">Insufficient tokens to generate dorks</p>
            )}

            {/* Results */}
            {results && (
              <div className="mt-6 space-y-4">
                {/* Summary */}
                {summary && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                    <p className="text-sm text-blue-400">{summary}</p>
                  </div>
                )}

                {/* Dorks by Platform */}
                {platforms.map((platform) => {
                  const dorks = results[platform as keyof DorkResults] || [];
                  if (dorks.length === 0) return null;

                  return (
                    <div key={platform} className="space-y-2">
                      <div className="flex items-center gap-2 text-white font-medium">
                        {getPlatformIcon(platform)}
                        <h3 className="text-lg capitalize">{platform} Dorks ({dorks.length})</h3>
                      </div>
                      <div className="space-y-2">
                        {dorks.map((dork, index) => (
                          <div
                            key={index}
                            className="p-3 bg-[#0A1929] border border-white/10 rounded hover:border-white/20 transition"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs border ${getSeverityColor(
                                      dork.severity
                                    )}`}
                                  >
                                    {dork.severity}
                                  </span>
                                  <span className="text-xs text-white/40">{dork.category}</span>
                                </div>
                                <p className="text-xs text-white/60 mb-2">{dork.description}</p>
                                <code className="text-xs text-white font-mono bg-black/30 px-2 py-1 rounded block overflow-x-auto">
                                  {dork.query}
                                </code>
                              </div>
                              <button
                                onClick={() => handleCopyDork(dork.query)}
                                className="p-2 hover:bg-white/10 rounded text-white/60 hover:text-white transition flex-shrink-0"
                                title="Copy to clipboard"
                              >
                                {copiedDork === dork.query ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
