/**
 * ResponseViewer Component
 * Multi-mode HTTP response viewer (Raw/Pretty/Rendered/Hex)
 * Burp Suite-inspired response visualization
 */

import { useState, useMemo } from 'react';
import {
  detectContentType,
  formatJson,
  formatXml,
  formatHtml,
  toHexDump,
  formatResponseSize,
} from '../../utils/contentTypeUtils';

interface ResponseViewerProps {
  statusCode?: number;
  statusMessage?: string;
  headers?: Record<string, string>;
  body?: string;
  responseTime?: number;
}

type ViewMode = 'raw' | 'pretty' | 'rendered' | 'hex';

export function ResponseViewer({
  statusCode,
  statusMessage,
  headers = {},
  body = '',
  responseTime,
}: ResponseViewerProps) {
  const contentInfo = useMemo(() => detectContentType(headers), [headers]);
  const [viewMode, setViewMode] = useState<ViewMode>(contentInfo.suggestedMode);

  // Format response based on view mode
  const formattedBody = useMemo(() => {
    if (!body) return '';

    switch (viewMode) {
      case 'pretty':
        if (contentInfo.category === 'json') return formatJson(body);
        if (contentInfo.category === 'xml') return formatXml(body);
        if (contentInfo.category === 'html') return formatHtml(body);
        return body;

      case 'hex':
        return toHexDump(body);

      case 'raw':
      default:
        return body;
    }
  }, [body, viewMode, contentInfo.category]);

  // Build raw HTTP response with headers
  const rawResponse = useMemo(() => {
    if (!statusCode) return body;

    const statusLine = `HTTP/1.1 ${statusCode} ${statusMessage || 'OK'}\n`;
    const headerLines = Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return `${statusLine}${headerLines}\n\n${body}`;
  }, [statusCode, statusMessage, headers, body]);

  const responseSize = formatResponseSize(body, headers);

  return (
    <div className="flex flex-col h-full bg-[#0A1929]">
      {/* Response metadata bar */}
      {statusCode && (
        <div className="flex items-center gap-4 px-4 py-2 bg-[#0D1F2D] border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Status:</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                statusCode >= 200 && statusCode < 300
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : statusCode >= 300 && statusCode < 400
                  ? 'bg-blue-500/20 text-blue-400'
                  : statusCode >= 400 && statusCode < 500
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {statusCode} {statusMessage}
            </span>
          </div>

          {responseTime !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Time:</span>
              <span className="text-xs text-white/70">{responseTime}ms</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Size:</span>
            <span className="text-xs text-white/70">{responseSize}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50">Type:</span>
            <span className="text-xs text-white/70">{contentInfo.category.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* View mode tabs */}
      <div className="flex items-center gap-1 px-4 py-2 bg-[#0D1F2D] border-b border-white/10">
        <button
          onClick={() => setViewMode('raw')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            viewMode === 'raw'
              ? 'bg-[#10B981]/20 text-[#10B981]'
              : 'text-white/60 hover:text-white/90 hover:bg-white/5'
          }`}
        >
          Raw
        </button>

        {contentInfo.canPrettify && (
          <button
            onClick={() => setViewMode('pretty')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'pretty'
                ? 'bg-[#10B981]/20 text-[#10B981]'
                : 'text-white/60 hover:text-white/90 hover:bg-white/5'
            }`}
          >
            Pretty
          </button>
        )}

        {contentInfo.canRender && (
          <button
            onClick={() => setViewMode('rendered')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'rendered'
                ? 'bg-[#10B981]/20 text-[#10B981]'
                : 'text-white/60 hover:text-white/90 hover:bg-white/5'
            }`}
          >
            Rendered
          </button>
        )}

        <button
          onClick={() => setViewMode('hex')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            viewMode === 'hex'
              ? 'bg-[#10B981]/20 text-[#10B981]'
              : 'text-white/60 hover:text-white/90 hover:bg-white/5'
          }`}
        >
          Hex
        </button>

        <div className="flex-1" />

        {/* Copy button */}
        <button
          onClick={() => {
            const textToCopy = viewMode === 'raw' && statusCode ? rawResponse : formattedBody;
            navigator.clipboard.writeText(textToCopy);
          }}
          className="px-3 py-1.5 rounded text-xs font-medium text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors"
        >
          Copy
        </button>
      </div>

      {/* Response body viewer */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'rendered' && contentInfo.category === 'html' ? (
          // HTML rendered view in sandboxed iframe
          <iframe
            srcDoc={body}
            sandbox="allow-same-origin"
            className="w-full h-full bg-white"
            title="Rendered HTML Response"
          />
        ) : viewMode === 'rendered' && contentInfo.category === 'image' ? (
          // Image preview
          <div className="flex items-center justify-center h-full p-4">
            <img
              src={`data:${contentInfo.mimeType};base64,${btoa(body)}`}
              alt="Response"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          // Raw/Pretty/Hex text view
          <pre className="p-4 text-sm text-white/90 font-mono whitespace-pre overflow-auto">
            {viewMode === 'raw' && statusCode ? rawResponse : formattedBody}
          </pre>
        )}
      </div>

      {/* Headers section */}
      {Object.keys(headers).length > 0 && (
        <details className="border-t border-white/10 bg-[#0D1F2D]">
          <summary className="px-4 py-2 text-xs font-medium text-white/70 cursor-pointer hover:bg-white/5">
            Response Headers ({Object.keys(headers).length})
          </summary>
          <div className="px-4 py-2 max-h-48 overflow-auto">
            <table className="w-full text-xs">
              <tbody>
                {Object.entries(headers).map(([key, value]) => (
                  <tr key={key} className="border-b border-white/5">
                    <td className="py-1 pr-4 text-white/50 font-medium align-top">{key}</td>
                    <td className="py-1 text-white/70 break-all">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
