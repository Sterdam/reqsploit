/**
 * JsonViewer - Ultra-ergonomic JSON viewer for pentesters
 *
 * Features:
 * - Auto-detects JSON vs plain text
 * - Syntax highlighting with color coding
 * - One-click copy for each value
 * - Collapsible/expandable nodes
 * - Detects sensitive patterns (tokens, URLs, emails, IDs)
 * - Toggle between formatted and raw view
 * - Search within JSON
 */

import { useState, useMemo } from 'react';
import { Copy, Check, ChevronRight, ChevronDown, Search, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface JsonViewerProps {
  content: string;
  onCopy?: (text: string, label: string) => void;
}

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject {
  [key: string]: JsonValue;
}
type JsonArray = JsonValue[];

export function JsonViewer({ content, onCopy }: JsonViewerProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Try to parse as JSON
  const parsedJson = useMemo(() => {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      const jsonText = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonText.trim());
    } catch {
      return null;
    }
  }, [content]);

  const isJson = parsedJson !== null;

  // Detect sensitive patterns
  const detectPattern = (value: string): { type: string; icon: typeof AlertTriangle } | null => {
    if (typeof value !== 'string') return null;

    // JWT token
    if (/^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]*$/.test(value)) {
      return { type: 'JWT Token', icon: AlertTriangle };
    }

    // API key patterns
    if (/^(sk|pk)_[a-zA-Z0-9]{20,}$/.test(value) || /^[A-Z0-9]{32,}$/.test(value)) {
      return { type: 'API Key', icon: AlertTriangle };
    }

    // URL
    if (/^https?:\/\/.+/.test(value)) {
      return { type: 'URL', icon: AlertTriangle };
    }

    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { type: 'Email', icon: AlertTriangle };
    }

    // UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return { type: 'UUID', icon: AlertTriangle };
    }

    return null;
  };

  const handleCopy = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(path);
    onCopy?.(text, path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const togglePath = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const matchesSearch = (value: JsonValue, key?: string): boolean => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();

    if (key?.toLowerCase().includes(search)) return true;

    if (typeof value === 'string' && value.toLowerCase().includes(search)) return true;
    if (typeof value === 'number' && value.toString().includes(search)) return true;

    return false;
  };

  const renderValue = (value: JsonValue, path: string, key?: string, level: number = 0): JSX.Element => {
    const indent = level * 16;
    const isExpanded = expandedPaths.has(path);
    const matches = matchesSearch(value, key);

    if (!matches && searchTerm) return <></>;

    // Object
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const entries = Object.entries(value);
      const hasChildren = entries.length > 0;

      return (
        <div key={path} className={searchTerm && !matches ? 'opacity-50' : ''}>
          <div className="flex items-center gap-2 group hover:bg-white/5 rounded py-1" style={{ paddingLeft: `${indent}px` }}>
            {hasChildren && (
              <button
                onClick={() => togglePath(path)}
                className="p-0.5 hover:bg-white/10 rounded transition"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </button>
            )}
            {key && (
              <>
                <span className="text-blue-400 font-mono text-xs">{key}:</span>
                <span className="text-gray-500 text-xs font-mono">{'{'}</span>
                {!isExpanded && <span className="text-gray-500 text-xs">... {entries.length} items</span>}
                <button
                  onClick={() => handleCopy(JSON.stringify(value, null, 2), path)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition ml-auto"
                  title="Copy object"
                >
                  {copiedPath === path ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-400" />
                  )}
                </button>
              </>
            )}
          </div>
          {isExpanded && hasChildren && (
            <div>
              {entries.map(([k, v]) => renderValue(v, `${path}.${k}`, k, level + 1))}
            </div>
          )}
          {isExpanded && (
            <div className="text-gray-500 text-xs font-mono" style={{ paddingLeft: `${indent}px` }}>{'}'}</div>
          )}
        </div>
      );
    }

    // Array
    if (Array.isArray(value)) {
      const hasChildren = value.length > 0;

      return (
        <div key={path} className={searchTerm && !matches ? 'opacity-50' : ''}>
          <div className="flex items-center gap-2 group hover:bg-white/5 rounded py-1" style={{ paddingLeft: `${indent}px` }}>
            {hasChildren && (
              <button
                onClick={() => togglePath(path)}
                className="p-0.5 hover:bg-white/10 rounded transition"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </button>
            )}
            {key && (
              <>
                <span className="text-blue-400 font-mono text-xs">{key}:</span>
                <span className="text-gray-500 text-xs font-mono">{'['}</span>
                {!isExpanded && <span className="text-gray-500 text-xs">... {value.length} items</span>}
                <button
                  onClick={() => handleCopy(JSON.stringify(value, null, 2), path)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition ml-auto"
                  title="Copy array"
                >
                  {copiedPath === path ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-400" />
                  )}
                </button>
              </>
            )}
          </div>
          {isExpanded && hasChildren && (
            <div>
              {value.map((v, i) => renderValue(v, `${path}[${i}]`, `[${i}]`, level + 1))}
            </div>
          )}
          {isExpanded && (
            <div className="text-gray-500 text-xs font-mono" style={{ paddingLeft: `${indent}px` }}>{']'}</div>
          )}
        </div>
      );
    }

    // Primitive values
    const stringValue = String(value);
    const pattern = typeof value === 'string' ? detectPattern(value) : null;

    let valueColor = 'text-gray-300';
    let quotedValue = stringValue;

    if (typeof value === 'string') {
      valueColor = 'text-green-400';
      quotedValue = `"${value}"`;
    } else if (typeof value === 'number') {
      valueColor = 'text-purple-400';
    } else if (typeof value === 'boolean') {
      valueColor = 'text-yellow-400';
    } else if (value === null) {
      valueColor = 'text-red-400';
    }

    return (
      <div
        key={path}
        className={`flex items-center gap-2 group hover:bg-white/5 rounded py-1 ${searchTerm && !matches ? 'opacity-50' : ''}`}
        style={{ paddingLeft: `${indent}px` }}
      >
        <div className="w-3 h-3" /> {/* Spacer for alignment */}
        {key && <span className="text-blue-400 font-mono text-xs">{key}:</span>}
        <span className={`${valueColor} font-mono text-xs break-all flex-1`}>
          {quotedValue}
        </span>
        {pattern && (
          <span className="px-1.5 py-0.5 bg-orange-500/20 border border-orange-500/40 rounded text-xs text-orange-400 flex items-center gap-1">
            <pattern.icon className="w-3 h-3" />
            {pattern.type}
          </span>
        )}
        <button
          onClick={() => handleCopy(stringValue, path)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition"
          title="Copy value"
        >
          {copiedPath === path ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3 text-gray-400" />
          )}
        </button>
      </div>
    );
  };

  if (!isJson) {
    // Plain text view with markdown support
    return (
      <div className="relative">
        <div className="p-3 bg-black/20 rounded border border-white/5 text-sm text-gray-300 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          {content}
        </div>
        <button
          onClick={() => handleCopy(content, 'full-content')}
          className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-gray-400 hover:text-white transition"
          title="Copy all"
        >
          {copiedPath === 'full-content' ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      </div>
    );
  }

  // JSON view
  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in JSON..."
            className="w-full pl-8 pr-3 py-1.5 bg-black/30 border border-white/10 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-electric-blue/50 transition"
          />
        </div>

        {/* Toggle raw/formatted */}
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="px-2 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs text-white transition flex items-center gap-1.5"
          title={showRaw ? 'Show formatted' : 'Show raw'}
        >
          {showRaw ? (
            <>
              <Eye className="w-3.5 h-3.5" />
              Formatted
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              Raw
            </>
          )}
        </button>

        {/* Expand/Collapse all */}
        <button
          onClick={() => {
            if (expandedPaths.size > 0) {
              setExpandedPaths(new Set());
            } else {
              // Expand all paths (up to 3 levels deep)
              const allPaths = new Set<string>();
              const collectPaths = (obj: JsonValue, path: string, depth: number) => {
                if (depth > 3) return;
                if (obj !== null && typeof obj === 'object') {
                  allPaths.add(path);
                  if (Array.isArray(obj)) {
                    obj.forEach((v, i) => collectPaths(v, `${path}[${i}]`, depth + 1));
                  } else {
                    Object.entries(obj).forEach(([k, v]) => collectPaths(v, `${path}.${k}`, depth + 1));
                  }
                }
              };
              collectPaths(parsedJson, 'root', 0);
              setExpandedPaths(allPaths);
            }
          }}
          className="px-2 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs text-white transition"
          title={expandedPaths.size > 0 ? 'Collapse all' : 'Expand all'}
        >
          {expandedPaths.size > 0 ? 'Collapse' : 'Expand'} All
        </button>

        {/* Copy all */}
        <button
          onClick={() => handleCopy(JSON.stringify(parsedJson, null, 2), 'full-json')}
          className="px-2 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs text-white transition flex items-center gap-1.5"
          title="Copy all JSON"
        >
          {copiedPath === 'full-json' ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          Copy
        </button>
      </div>

      {/* JSON Content */}
      <div className="p-3 bg-black/20 rounded border border-white/5 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {showRaw ? (
          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
            {JSON.stringify(parsedJson, null, 2)}
          </pre>
        ) : (
          <div className="text-xs">
            {renderValue(parsedJson, 'root')}
          </div>
        )}
      </div>
    </div>
  );
}
