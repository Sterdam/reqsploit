import { useState } from 'react';
import { useRequestsStore } from '../stores/requestsStore';

export function RequestViewer() {
  const { selectedRequest } = useRequestsStore();
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');
  const [prettyPrint, setPrettyPrint] = useState(true);

  if (!selectedRequest) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white/5">
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium mb-2">No Request Selected</p>
          <p className="text-sm">Select a request from the list to view details</p>
        </div>
      </div>
    );
  }

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const formatHeaders = (headers: Record<string, string>) => {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderBody = (body?: string) => {
    if (!body) return <p className="text-gray-400 text-sm">No body</p>;

    try {
      const parsed = JSON.parse(body);
      const formatted = prettyPrint ? formatJson(parsed) : body;
      return (
        <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-all">
          {formatted}
        </pre>
      );
    } catch {
      return (
        <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-all">{body}</pre>
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Request Details</h2>
          <button
            onClick={() => setPrettyPrint(!prettyPrint)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {prettyPrint ? 'Raw' : 'Pretty'}
          </button>
        </div>

        {/* URL and Method */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 ${
                selectedRequest.method === 'GET'
                  ? 'bg-blue-500'
                  : selectedRequest.method === 'POST'
                  ? 'bg-green-500'
                  : selectedRequest.method === 'DELETE'
                  ? 'bg-red-500'
                  : 'bg-gray-500'
              } rounded text-xs font-semibold text-white`}
            >
              {selectedRequest.method}
            </span>
            {selectedRequest.statusCode && (
              <span
                className={`px-2 py-1 ${
                  selectedRequest.statusCode >= 200 && selectedRequest.statusCode < 300
                    ? 'bg-green-500'
                    : selectedRequest.statusCode >= 400
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                } rounded text-xs font-semibold text-white`}
              >
                {selectedRequest.statusCode}
              </span>
            )}
            {selectedRequest.duration && (
              <span className="text-xs text-gray-400">{selectedRequest.duration}ms</span>
            )}
          </div>
          <p className="text-sm text-white font-mono break-all">{selectedRequest.url}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('request')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'request'
              ? 'bg-white/10 text-white border-b-2 border-electric-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Request
        </button>
        <button
          onClick={() => setActiveTab('response')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'response'
              ? 'bg-white/10 text-white border-b-2 border-electric-blue'
              : 'text-gray-400 hover:text-white'
          }`}
          disabled={!selectedRequest.statusCode}
        >
          Response {selectedRequest.statusCode ? '' : '(Pending)'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'request' ? (
          <div className="space-y-4">
            {/* Headers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Headers</h3>
                <button
                  onClick={() => copyToClipboard(formatHeaders(selectedRequest.headers))}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="bg-white/5 rounded-md p-3">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
                  {formatHeaders(selectedRequest.headers)}
                </pre>
              </div>
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Body</h3>
                {selectedRequest.body && (
                  <button
                    onClick={() => copyToClipboard(selectedRequest.body!)}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="bg-white/5 rounded-md p-3">{renderBody(selectedRequest.body)}</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Response Headers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Headers</h3>
                {selectedRequest.responseHeaders && (
                  <button
                    onClick={() =>
                      copyToClipboard(formatHeaders(selectedRequest.responseHeaders!))
                    }
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="bg-white/5 rounded-md p-3">
                {selectedRequest.responseHeaders ? (
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
                    {formatHeaders(selectedRequest.responseHeaders)}
                  </pre>
                ) : (
                  <p className="text-gray-400 text-sm">No response headers</p>
                )}
              </div>
            </div>

            {/* Response Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Body</h3>
              </div>
              <div className="bg-white/5 rounded-md p-3 max-h-96 overflow-auto">
                {selectedRequest.responseBody ? (
                  <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">
                    {prettyPrint && selectedRequest.responseHeaders?.['content-type']?.includes('json')
                      ? formatJson(JSON.parse(selectedRequest.responseBody))
                      : selectedRequest.responseBody}
                  </pre>
                ) : (
                  <p className="text-gray-400 text-sm">No response body</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
