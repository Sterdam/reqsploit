import { useEffect, useState } from 'react';
import { useProxyStore } from '../stores/proxyStore';
import { useInterceptStore } from '../stores/interceptStore';
import { wsService } from '../lib/websocket';
import {
  Play,
  X,
  Edit3,
  Save,
  XCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';

export function InterceptPanel() {
  const { session, toggleIntercept } = useProxyStore();
  const {
    queuedRequests,
    selectedRequest,
    isEditing,
    editedRequest,
    queueSize,
    selectRequest,
    deselectRequest,
    startEdit,
    updateEdit,
    saveEdit,
    cancelEdit,
    forwardRequest,
    dropRequest,
    clearQueue,
  } = useInterceptStore();

  const [activeTab, setActiveTab] = useState<'headers' | 'body'>('headers');

  // Load queue on mount if intercept is enabled
  useEffect(() => {
    if (session?.interceptMode) {
      wsService.getRequestQueue();
    }
  }, [session?.interceptMode]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'text-green-400';
      case 'POST':
        return 'text-blue-400';
      case 'PUT':
        return 'text-yellow-400';
      case 'DELETE':
        return 'text-red-400';
      case 'PATCH':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleHeaderChange = (key: string, value: string) => {
    if (!editedRequest) return;

    const newHeaders = { ...editedRequest.headers };
    if (value === '') {
      delete newHeaders[key];
    } else {
      newHeaders[key] = value;
    }
    updateEdit('headers', newHeaders);
  };

  const handleAddHeader = () => {
    if (!editedRequest) return;
    const newHeaders = { ...editedRequest.headers, '': '' };
    updateEdit('headers', newHeaders);
  };

  const handleRemoveHeader = (key: string) => {
    if (!editedRequest) return;
    const newHeaders = { ...editedRequest.headers };
    delete newHeaders[key];
    updateEdit('headers', newHeaders);
  };

  return (
    <div className="flex flex-col h-full bg-[#0A1929]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#0A1929] to-[#0D1F2D]">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">Intercept</h2>

          {/* Intercept Toggle */}
          <button
            onClick={() => toggleIntercept(!session?.interceptMode)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              session?.interceptMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {session?.interceptMode ? 'ON' : 'OFF'}
          </button>

          {/* Queue Counter */}
          {queueSize > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 rounded-lg border border-blue-600/30">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">
                {queueSize} {queueSize === 1 ? 'request' : 'requests'}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {queueSize > 0 && (
          <button
            onClick={clearQueue}
            className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg font-medium transition border border-orange-600/30"
          >
            Forward All
          </button>
        )}
      </div>

      {/* Main Content */}
      {!session?.interceptMode ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 space-y-4">
            <div className="text-6xl">🛑</div>
            <div>
              <p className="text-lg font-medium mb-2">Interception is OFF</p>
              <p className="text-sm">Click "ON" to start intercepting requests</p>
            </div>
          </div>
        </div>
      ) : queuedRequests.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400 space-y-4">
            <div className="text-6xl">⏳</div>
            <div>
              <p className="text-lg font-medium mb-2">No requests in queue</p>
              <p className="text-sm">Intercepted requests will appear here</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Queue List - Left 30% */}
          <div className="w-[30%] border-r border-white/10 flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-white/10 bg-[#0D1F2D]">
              <h3 className="text-sm font-semibold text-gray-300">Queue</h3>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {queuedRequests.map((request) => (
                <button
                  key={request.id}
                  onClick={() => selectRequest(request.id)}
                  className={`w-full px-4 py-3 border-b border-white/5 text-left hover:bg-white/5 transition ${
                    selectedRequest?.id === request.id ? 'bg-blue-600/20 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${getMethodColor(request.method)}`}>
                      {request.method}
                    </span>
                    <span className="text-xs text-gray-500">{formatTimestamp(request.queuedAt)}</span>
                  </div>
                  <div className="text-sm text-gray-300 truncate">{request.url}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Request Editor - Right 70% */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedRequest ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <ChevronRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a request from the queue</p>
                </div>
              </div>
            ) : (
              <>
                {/* Request Info */}
                <div className="px-6 py-4 border-b border-white/10 bg-[#0D1F2D]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${getMethodColor(selectedRequest.method)}`}>
                        {isEditing ? (
                          <select
                            value={editedRequest?.method || selectedRequest.method}
                            onChange={(e) => updateEdit('method', e.target.value)}
                            className="bg-[#0A1929] border border-white/10 rounded px-2 py-1 text-sm"
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                        ) : (
                          selectedRequest.method
                        )}
                      </span>

                      {isEditing ? (
                        <input
                          type="text"
                          value={editedRequest?.url || selectedRequest.url}
                          onChange={(e) => updateEdit('url', e.target.value)}
                          className="flex-1 bg-[#0A1929] border border-white/10 rounded px-3 py-1 text-white text-sm"
                        />
                      ) : (
                        <span className="text-white text-sm">{selectedRequest.url}</span>
                      )}
                    </div>

                    <button
                      onClick={() => deselectRequest()}
                      className="text-gray-400 hover:text-white transition"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-xs text-gray-500">
                    Queued at {formatTimestamp(selectedRequest.queuedAt)}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-[#0D1F2D]">
                  <button
                    onClick={() => setActiveTab('headers')}
                    className={`px-6 py-3 text-sm font-medium transition ${
                      activeTab === 'headers'
                        ? 'text-blue-400 border-b-2 border-blue-600'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Headers
                  </button>
                  <button
                    onClick={() => setActiveTab('body')}
                    className={`px-6 py-3 text-sm font-medium transition ${
                      activeTab === 'body'
                        ? 'text-blue-400 border-b-2 border-blue-600'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    Body
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {activeTab === 'headers' && (
                    <div className="space-y-2">
                      {Object.entries(
                        isEditing && editedRequest
                          ? editedRequest.headers
                          : selectedRequest.headers
                      ).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                value={key}
                                onChange={(e) => {
                                  const newHeaders = { ...editedRequest!.headers };
                                  delete newHeaders[key];
                                  newHeaders[e.target.value] = value;
                                  updateEdit('headers', newHeaders);
                                }}
                                className="flex-1 bg-[#0A1929] border border-white/10 rounded px-3 py-2 text-white text-sm font-mono"
                                placeholder="Header name"
                              />
                              <span className="text-gray-500">:</span>
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => handleHeaderChange(key, e.target.value)}
                                className="flex-1 bg-[#0A1929] border border-white/10 rounded px-3 py-2 text-white text-sm font-mono"
                                placeholder="Header value"
                              />
                              <button
                                onClick={() => handleRemoveHeader(key)}
                                className="text-red-400 hover:text-red-300 transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-blue-400 font-mono text-sm w-1/3">{key}:</span>
                              <span className="text-gray-300 font-mono text-sm flex-1 break-all">
                                {value}
                              </span>
                            </>
                          )}
                        </div>
                      ))}

                      {isEditing && (
                        <button
                          onClick={handleAddHeader}
                          className="mt-4 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded border border-blue-600/30 text-sm font-medium transition"
                        >
                          + Add Header
                        </button>
                      )}
                    </div>
                  )}

                  {activeTab === 'body' && (
                    <div>
                      {isEditing ? (
                        <textarea
                          value={editedRequest?.body || ''}
                          onChange={(e) => updateEdit('body', e.target.value)}
                          className="w-full h-96 bg-[#0A1929] border border-white/10 rounded px-4 py-3 text-white font-mono text-sm resize-none"
                          placeholder="Request body (JSON, XML, etc.)"
                        />
                      ) : (
                        <pre className="bg-[#0A1929] border border-white/10 rounded px-4 py-3 text-gray-300 font-mono text-sm overflow-auto max-h-96">
                          {selectedRequest.body || '(no body)'}
                        </pre>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 border-t border-white/10 bg-[#0D1F2D] flex items-center justify-between">
                  {isEditing ? (
                    <>
                      <button
                        onClick={cancelEdit}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </button>

                      <button
                        onClick={saveEdit}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save & Forward
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-3">
                        <button
                          onClick={() => forwardRequest(selectedRequest.id)}
                          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Forward
                        </button>

                        <button
                          onClick={() => dropRequest(selectedRequest.id)}
                          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Drop
                        </button>
                      </div>

                      <button
                        onClick={() => startEdit(selectedRequest.id)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
