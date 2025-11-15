import { useState, useEffect } from 'react';
import { useIntruderStore, type Campaign, type AttackType, type PayloadSet } from '../stores/intruderStore';
import {
  Play,
  Pause,
  Square,
  Trash2,
  Plus,
  Settings,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react';

export function IntruderPanel() {
  const {
    campaigns,
    activeCampaignId,
    draftCampaign,
    builtinPayloads,
    isLoading,
    fetchCampaigns,
    fetchBuiltinPayloads,
    setActiveCampaign,
    startCampaign,
    pauseCampaign,
    resumeCampaign,
    stopCampaign,
    deleteCampaign,
    startDraft,
    cancelDraft,
    saveDraft,
    updateDraftName,
    updateDraftTemplate,
    parseMarkers,
    updatePayloadSet,
    updateAttackType,
    updateConcurrency,
    updateDelay,
    fetchResults,
    getCampaignResults,
    getCampaignProgress,
    getActiveCampaign,
  } = useIntruderStore();

  const [view, setView] = useState<'list' | 'create' | 'results'>('list');
  const [selectedPosition, setSelectedPosition] = useState<number>(0);
  const [customPayloads, setCustomPayloads] = useState('');
  const [numberRange, setNumberRange] = useState({ from: 1, to: 100, step: 1 });
  const [resultsFilter, setResultsFilter] = useState({ statusCode: '', minLength: '', maxLength: '' });

  // Load campaigns and builtin payloads on mount
  useEffect(() => {
    fetchCampaigns();
    fetchBuiltinPayloads();
  }, []);

  // Auto-refresh results for active campaign
  useEffect(() => {
    if (activeCampaignId && view === 'results') {
      const interval = setInterval(() => {
        fetchResults(activeCampaignId);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [activeCampaignId, view]);

  const activeCampaign = getActiveCampaign();
  const results = activeCampaignId ? getCampaignResults(activeCampaignId) : [];
  const progress = activeCampaignId ? getCampaignProgress(activeCampaignId) : null;

  // Handle create campaign
  const handleCreateCampaign = () => {
    startDraft({
      method: 'GET',
      url: 'https://example.com/api/endpoint',
      headers: {},
      body: '',
    });
    setView('create');
  };

  // Handle save campaign
  const handleSaveCampaign = async () => {
    if (!draftCampaign) return;

    const campaignId = await saveDraft();
    if (campaignId) {
      setView('list');
      fetchCampaigns();
    }
  };

  // Handle template change
  const handleTemplateChange = (template: string) => {
    updateDraftTemplate(template);
    parseMarkers();
  };

  // Handle add payload set
  const handleAddPayloadSet = (type: 'builtin' | 'custom' | 'numbers') => {
    if (!draftCampaign || selectedPosition >= draftCampaign.payloadPositions.length) return;

    const position = draftCampaign.payloadPositions[selectedPosition];
    let payloadSet: PayloadSet;

    if (type === 'builtin') {
      // Use first builtin payload as default
      payloadSet = {
        id: `payload-${Date.now()}`,
        name: 'SQL Injection',
        type: 'sqli',
        payloads: [], // Will be loaded from backend
      };
    } else if (type === 'custom') {
      const payloads = customPayloads.split('\n').filter((p) => p.trim());
      payloadSet = {
        id: `payload-${Date.now()}`,
        name: 'Custom List',
        type: 'simple_list',
        payloads,
      };
    } else {
      // Numbers
      const payloads = [];
      for (let i = numberRange.from; i <= numberRange.to; i += numberRange.step) {
        payloads.push(i.toString());
      }
      payloadSet = {
        id: `payload-${Date.now()}`,
        name: 'Number Range',
        type: 'numbers',
        payloads,
      };
    }

    updatePayloadSet(position.id, payloadSet);
  };

  // Render campaign list
  const renderCampaignList = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-white/10 bg-[#0D1F2D] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Intruder Campaigns</h2>
          <p className="text-sm text-white/60 mt-1">Automated fuzzing and payload testing</p>
        </div>
        <button
          onClick={handleCreateCampaign}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading && campaigns.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/60">
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/60 p-6">
            <Zap className="w-12 h-12 mb-4 text-white/30" />
            <p className="text-sm text-center">No campaigns yet</p>
            <p className="text-xs text-white/40 mt-2 text-center">
              Create your first fuzzing campaign to get started
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={`px-6 py-4 hover:bg-white/5 cursor-pointer transition ${
                  activeCampaignId === campaign.id ? 'bg-blue-600/10 border-l-2 border-blue-600' : ''
                }`}
                onClick={() => {
                  setActiveCampaign(campaign.id);
                  setView('results');
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{campaign.name}</h3>
                      {campaign.status === 'running' && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          Running
                        </span>
                      )}
                      {campaign.status === 'paused' && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded flex items-center gap-1">
                          <Pause className="w-3 h-3" />
                          Paused
                        </span>
                      )}
                      {campaign.status === 'completed' && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-white/60">
                        {campaign.requestTemplate.method} {campaign.requestTemplate.url}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span>Type: {campaign.attackType.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>
                          {campaign.completedRequests}/{campaign.totalRequests} requests
                        </span>
                        {campaign.failedRequests > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-400">{campaign.failedRequests} failed</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startCampaign(campaign.id);
                        }}
                        className="p-2 hover:bg-white/10 rounded text-green-400"
                        title="Start"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {campaign.status === 'running' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            pauseCampaign(campaign.id);
                          }}
                          className="p-2 hover:bg-white/10 rounded text-yellow-400"
                          title="Pause"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            stopCampaign(campaign.id);
                          }}
                          className="p-2 hover:bg-white/10 rounded text-red-400"
                          title="Stop"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resumeCampaign(campaign.id);
                        }}
                        className="p-2 hover:bg-white/10 rounded text-green-400"
                        title="Resume"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this campaign?')) {
                          deleteCampaign(campaign.id);
                        }
                      }}
                      className="p-2 hover:bg-white/10 rounded text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {campaign.status === 'running' && campaign.totalRequests > 0 && (
                  <div className="mt-3">
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{
                          width: `${(campaign.completedRequests / campaign.totalRequests) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render create campaign
  const renderCreateCampaign = () => {
    if (!draftCampaign) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-white/10 bg-[#0D1F2D] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Create Campaign</h2>
            <p className="text-sm text-white/60 mt-1">Configure fuzzing parameters</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                cancelDraft();
                setView('list');
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCampaign}
              disabled={draftCampaign.payloadPositions.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50"
            >
              Create Campaign
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Campaign Name */}
          <div>
            <label className="text-sm font-medium text-white block mb-2">Campaign Name</label>
            <input
              type="text"
              value={draftCampaign.name}
              onChange={(e) => updateDraftName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0D1F2D] text-white border border-white/20 rounded text-sm focus:outline-none focus:border-blue-500"
              placeholder="My Fuzzing Campaign"
            />
          </div>

          {/* Request Template */}
          <div>
            <label className="text-sm font-medium text-white block mb-2">
              Request Template (use §markers§ for payload positions)
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={draftCampaign.request.method}
                  onChange={(e) =>
                    updateDraftTemplate(
                      `${e.target.value} ${draftCampaign.request.url}\n${draftCampaign.rawTemplate}`
                    )
                  }
                  className="px-3 py-2 bg-[#0D1F2D] text-white border border-white/20 rounded text-sm"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                  <option>PATCH</option>
                </select>
                <input
                  type="text"
                  value={draftCampaign.request.url}
                  onChange={(e) =>
                    updateDraftTemplate(`${draftCampaign.request.method} ${e.target.value}`)
                  }
                  className="flex-1 px-3 py-2 bg-[#0D1F2D] text-white border border-white/20 rounded text-sm"
                  placeholder="https://example.com/api/login?user=§username§"
                />
              </div>
              <textarea
                value={draftCampaign.rawTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full h-32 px-3 py-2 bg-[#0D1F2D] text-white border border-white/20 rounded text-sm font-mono resize-none focus:outline-none focus:border-blue-500"
                placeholder={'Example:\n{"username":"§user§","password":"§pass§"}'}
              />
              <p className="text-xs text-white/40">
                Detected positions: {draftCampaign.payloadPositions.length}
              </p>
            </div>
          </div>

          {/* Payload Positions */}
          {draftCampaign.payloadPositions.length > 0 && (
            <div>
              <label className="text-sm font-medium text-white block mb-2">Payload Sets</label>
              <div className="space-y-3">
                {draftCampaign.payloadPositions.map((position, index) => (
                  <div key={position.id} className="p-3 bg-[#0D1F2D] rounded border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white font-medium">Position {index + 1}</span>
                      <button
                        onClick={() => setSelectedPosition(index)}
                        className={`px-3 py-1 text-xs rounded ${
                          selectedPosition === index
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        Configure
                      </button>
                    </div>
                    {draftCampaign.payloadSets.get(position.id) ? (
                      <div className="text-xs text-white/60">
                        Type: {draftCampaign.payloadSets.get(position.id)?.type} • Payloads:{' '}
                        {draftCampaign.payloadSets.get(position.id)?.payloads.length}
                      </div>
                    ) : (
                      <div className="text-xs text-yellow-400">⚠ No payload set configured</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Payload Configuration */}
              {selectedPosition < draftCampaign.payloadPositions.length && (
                <div className="mt-4 p-4 bg-white/5 rounded border border-white/10">
                  <h3 className="text-sm font-medium text-white mb-3">
                    Configure Position {selectedPosition + 1}
                  </h3>

                  <div className="space-y-3">
                    {/* Built-in Payloads */}
                    <div>
                      <label className="text-xs text-white/60 block mb-2">Built-in Payloads</label>
                      <div className="flex flex-wrap gap-2">
                        {builtinPayloads.map((payload) => (
                          <button
                            key={payload.id}
                            onClick={() => {
                              updatePayloadSet(draftCampaign.payloadPositions[selectedPosition].id, {
                                id: `payload-${Date.now()}`,
                                name: payload.name,
                                type: payload.id as any,
                                payloads: [], // Loaded from backend
                              });
                            }}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded border border-white/10"
                          >
                            {payload.name} ({payload.count})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom List */}
                    <div>
                      <label className="text-xs text-white/60 block mb-2">Custom List</label>
                      <textarea
                        value={customPayloads}
                        onChange={(e) => setCustomPayloads(e.target.value)}
                        className="w-full h-20 px-3 py-2 bg-[#0D1F2D] text-white border border-white/20 rounded text-xs font-mono resize-none"
                        placeholder="One payload per line"
                      />
                      <button
                        onClick={() => handleAddPayloadSet('custom')}
                        className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                      >
                        Use Custom List
                      </button>
                    </div>

                    {/* Number Range */}
                    <div>
                      <label className="text-xs text-white/60 block mb-2">Number Range</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={numberRange.from}
                          onChange={(e) => setNumberRange({ ...numberRange, from: parseInt(e.target.value) })}
                          className="w-20 px-2 py-1.5 bg-[#0D1F2D] text-white border border-white/20 rounded text-xs"
                          placeholder="From"
                        />
                        <input
                          type="number"
                          value={numberRange.to}
                          onChange={(e) => setNumberRange({ ...numberRange, to: parseInt(e.target.value) })}
                          className="w-20 px-2 py-1.5 bg-[#0D1F2D] text-white border border-white/20 rounded text-xs"
                          placeholder="To"
                        />
                        <input
                          type="number"
                          value={numberRange.step}
                          onChange={(e) => setNumberRange({ ...numberRange, step: parseInt(e.target.value) })}
                          className="w-20 px-2 py-1.5 bg-[#0D1F2D] text-white border border-white/20 rounded text-xs"
                          placeholder="Step"
                        />
                        <button
                          onClick={() => handleAddPayloadSet('numbers')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attack Type */}
          <div>
            <label className="text-sm font-medium text-white block mb-2">Attack Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['sniper', 'battering_ram', 'pitchfork', 'cluster_bomb'] as AttackType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => updateAttackType(type)}
                  className={`px-4 py-3 text-sm rounded border ${
                    draftCampaign.attackType === type
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white block mb-2">Concurrency</label>
              <input
                type="number"
                value={draftCampaign.concurrency}
                onChange={(e) => updateConcurrency(parseInt(e.target.value))}
                min="1"
                max="20"
                className="w-full px-3 py-2 bg-[#0D1F2D] text-white border border-white/20 rounded text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white block mb-2">Delay (ms)</label>
              <input
                type="number"
                value={draftCampaign.delayMs}
                onChange={(e) => updateDelay(parseInt(e.target.value))}
                min="0"
                className="w-full px-3 py-2 bg-[#0D1F2D] text-white border border-white/20 rounded text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render results view
  const renderResults = () => {
    if (!activeCampaign) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-white/10 bg-[#0D1F2D]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{activeCampaign.name}</h2>
              <p className="text-sm text-white/60 mt-1">
                {activeCampaign.requestTemplate.method} {activeCampaign.requestTemplate.url}
              </p>
            </div>
            <button
              onClick={() => setView('list')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm"
            >
              Back to List
            </button>
          </div>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">
                  Progress: {progress.completedRequests}/{progress.totalRequests} requests
                </span>
                <span className="text-white font-medium">{progress.currentProgress}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress.currentProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0D1F2D] sticky top-0">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-white/60 font-medium">#</th>
                <th className="px-4 py-3 text-left text-white/60 font-medium">Payload</th>
                <th className="px-4 py-3 text-left text-white/60 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-white/60 font-medium">Length</th>
                <th className="px-4 py-3 text-left text-white/60 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                    No results yet. Start the campaign to see results.
                  </td>
                </tr>
              ) : (
                results.map((result, index) => (
                  <tr key={result.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-white/60">{index + 1}</td>
                    <td className="px-4 py-3 text-white font-mono text-xs">
                      {result.payloadSet.join(', ')}
                    </td>
                    <td className="px-4 py-3">
                      {result.statusCode ? (
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            result.statusCode >= 200 && result.statusCode < 300
                              ? 'bg-green-500/20 text-green-400'
                              : result.statusCode >= 400
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {result.statusCode}
                        </span>
                      ) : (
                        <span className="text-red-400 text-xs">Error</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/60">{result.responseLength || 0} bytes</td>
                    <td className="px-4 py-3 text-white/60">{result.responseTime || 0}ms</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="flex flex-col h-full bg-[#0A1929]">
      {view === 'list' && renderCampaignList()}
      {view === 'create' && renderCreateCampaign()}
      {view === 'results' && renderResults()}
    </div>
  );
}
