import { useState, useEffect, useRef } from 'react';
import { useRequestsStore } from '../stores/requestsStore';

export function RequestList() {
  const { selectedRequest, selectRequest, setFilter, getFilteredRequests, clearRequests } =
    useRequestsStore();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const listRef = useRef<HTMLDivElement>(null);

  const filteredRequests = getFilteredRequests();

  useEffect(() => {
    setFilter({ search, method: methodFilter || undefined });
  }, [search, methodFilter, setFilter]);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500';
      case 'POST':
        return 'bg-green-500';
      case 'PUT':
        return 'bg-yellow-500';
      case 'DELETE':
        return 'bg-red-500';
      case 'PATCH':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return 'bg-gray-500';
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-500';
    if (statusCode >= 300 && statusCode < 400) return 'bg-blue-500';
    if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-500';
    if (statusCode >= 500) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Requests ({filteredRequests.length})
          </h2>
          <button
            onClick={clearRequests}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search URLs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
        />

        {/* Method Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setMethodFilter('')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              methodFilter === ''
                ? 'bg-electric-blue text-white'
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((method) => (
            <button
              key={method}
              onClick={() => setMethodFilter(method)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                methodFilter === method
                  ? 'bg-electric-blue text-white'
                  : 'bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Request List */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {filteredRequests.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p className="text-sm">No requests yet</p>
              <p className="text-xs mt-1">Start the proxy to see intercepted traffic</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredRequests.map((request) => (
              <button
                key={request.id}
                onClick={() => selectRequest(request.id)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedRequest?.id === request.id
                    ? 'bg-electric-blue/20 border border-electric-blue/50'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                {/* Method and Status */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 ${getMethodColor(
                      request.method
                    )} rounded text-xs font-semibold text-white`}
                  >
                    {request.method}
                  </span>
                  {request.statusCode && (
                    <span
                      className={`px-2 py-1 ${getStatusColor(
                        request.statusCode
                      )} rounded text-xs font-semibold text-white`}
                    >
                      {request.statusCode}
                    </span>
                  )}
                  {request.duration && (
                    <span className="text-xs text-gray-400">{request.duration}ms</span>
                  )}
                </div>

                {/* URL */}
                <p className="text-sm text-white font-mono truncate mb-1" title={request.url}>
                  {truncateUrl(request.url, 50)}
                </p>

                {/* Time */}
                <p className="text-xs text-gray-400">{formatTime(request.timestamp)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
