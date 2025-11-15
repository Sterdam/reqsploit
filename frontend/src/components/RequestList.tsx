import { useState, useEffect, useRef } from 'react';
import { useRequestsStore } from '../stores/requestsStore';
import { useRepeaterStore } from '../stores/repeaterStore';
import { ContextMenu, type ContextMenuItem } from './common';
import { Copy, Send, Trash2 } from 'lucide-react';

export function RequestList() {
  const { selectedRequest, selectRequest, setFilter, getFilteredRequests, clearRequests, requests } =
    useRequestsStore();
  const { createTab } = useRepeaterStore();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const listRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; requestId: string } | null>(null);

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
      <div ref={listRef} className="flex-1 overflow-y-auto min-h-0">
        {filteredRequests.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <p className="text-sm">No requests yet</p>
              <p className="text-xs mt-1">Start the proxy to see intercepted traffic</p>
            </div>
          </div>
        ) : (
          <div className="p-2">
            {filteredRequests.map((request) => (
              <button
                key={request.id}
                onClick={() => selectRequest(request.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, requestId: request.id });
                }}
                className={`w-full text-left p-3 rounded-md transition-colors mb-1 ${
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

      {/* Context Menu */}
      {contextMenu && (() => {
        const request = requests.find(r => r.id === contextMenu.requestId);
        if (!request) return null;

        const menuItems: ContextMenuItem[] = [
          {
            label: 'Send to Repeater',
            icon: <Send size={14} />,
            onClick: () => {
              createTab(undefined, {
                method: request.method,
                url: request.url,
                headers: request.headers,
                body: request.body || '',
              });
            },
            shortcut: 'Ctrl+R',
          },
          {
            label: 'Copy URL',
            icon: <Copy size={14} />,
            onClick: () => {
              navigator.clipboard.writeText(request.url);
            },
          },
          {
            label: 'Copy as cURL',
            icon: <Copy size={14} />,
            onClick: () => {
              const headers = Object.entries(request.headers)
                .map(([k, v]) => `-H "${k}: ${v}"`)
                .join(' ');
              const curl = `curl -X ${request.method} "${request.url}" ${headers}${
                request.body ? ` -d '${request.body}'` : ''
              }`;
              navigator.clipboard.writeText(curl);
            },
          },
          { divider: true },
          {
            label: 'Delete',
            icon: <Trash2 size={14} />,
            onClick: () => {
              // TODO: Implement delete single request
              console.log('Delete request:', request.id);
            },
          },
        ];

        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={menuItems}
            onClose={() => setContextMenu(null)}
          />
        );
      })()}
    </div>
  );
}
