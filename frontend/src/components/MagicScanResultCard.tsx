import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { ScanResult, useMagicScanStore } from '../stores/magicScanStore';
import { useToastStore } from '../stores/toastStore';

interface ScanResultCardProps {
  result: ScanResult;
  onViewRequest?: (requestId: string) => void;
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    color: 'red',
    icon: Shield,
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300',
    pulse: 'animate-pulse-red',
  },
  HIGH: {
    color: 'orange',
    icon: AlertTriangle,
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300',
    pulse: 'animate-glow-orange',
  },
  MEDIUM: {
    color: 'blue',
    icon: Info,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
    pulse: '',
  },
  LOW: {
    color: 'gray',
    icon: Info,
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    badge: 'bg-gray-500/20 text-gray-300',
    pulse: '',
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  API_KEYS: 'API Keys',
  PRIVATE_KEYS: 'Private Keys',
  DATABASE_CREDS: 'Database Credentials',
  AUTH_DATA: 'Authentication Data',
  NETWORK_INFO: 'Network Info',
  PII: 'Personal Information',
  SENSITIVE_FILES: 'Sensitive Files',
  ERROR_INFO: 'Error Information',
  BUSINESS_LOGIC: 'Business Logic',
};

export const ScanResultCard: React.FC<ScanResultCardProps> = ({ result, onViewRequest }) => {
  const [expanded, setExpanded] = useState(false);
  const [showFullValue, setShowFullValue] = useState(false);
  const { markAsSafe, markAsFalsePositive, deleteResult } = useMagicScanStore();
  const { addToast } = useToastStore();

  const config = SEVERITY_CONFIG[result.severity];
  const Icon = config.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(result.value);
    addToast({ type: 'success', message: 'Copied to clipboard' });
  };

  const handleMarkSafe = async () => {
    await markAsSafe(result.id);
    addToast({ type: 'success', message: 'Marked as safe' });
  };

  const handleMarkFalsePositive = async () => {
    await markAsFalsePositive(result.id);
    addToast({ type: 'success', message: 'Marked as false positive' });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this finding?')) {
      await deleteResult(result.id);
      addToast({ type: 'success', message: 'Finding deleted' });
    }
  };

  const handleViewRequest = () => {
    if (onViewRequest && result.requestId) {
      onViewRequest(result.requestId);
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div
      className={`
        border rounded-lg p-4 mb-3 transition-all duration-200
        ${config.bg} ${config.border} ${config.pulse}
        hover:border-opacity-50
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${config.badge}`}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-semibold ${config.text}`}>
                {result.severity}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-sm text-gray-300">{result.type}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {CATEGORY_LABELS[result.category]}
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-2">{result.description}</p>

            {/* Value display */}
            <div className="flex items-center gap-2 mb-2">
              <code className="text-sm bg-black/40 px-3 py-1.5 rounded border border-gray-700 text-gray-200 font-mono flex-1 truncate">
                {showFullValue ? result.value : result.value}
              </code>
              <button
                onClick={() => setShowFullValue(!showFullValue)}
                className="p-1.5 hover:bg-white/5 rounded transition text-gray-400 hover:text-white"
                title={showFullValue ? 'Hide' : 'Reveal full value'}
              >
                {showFullValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-white/5 rounded transition text-gray-400 hover:text-white"
                title="Copy value"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>
                {result.location.source === 'request' ? '→ Request' : '← Response'}
              </span>
              <span>•</span>
              <span className="capitalize">{result.location.part}</span>
              {result.location.path && (
                <>
                  <span>•</span>
                  <span className="font-mono">{result.location.path}</span>
                </>
              )}
              <span>•</span>
              <span className={result.confidence >= 80 ? 'text-green-500' : 'text-yellow-500'}>
                {result.confidence}% confidence
              </span>
              <span>•</span>
              <span>{formatTimestamp(result.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 ml-2">
          {result.isMarkedSafe && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Safe
            </span>
          )}
          {result.isFalsePositive && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              False Positive
            </span>
          )}
        </div>
      </div>

      {/* Context (expandable) */}
      {result.context && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition"
          >
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            <span>{expanded ? 'Hide' : 'Show'} context</span>
          </button>

          {expanded && (
            <div className="mt-2 p-3 bg-black/40 rounded border border-gray-700 overflow-x-auto">
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
                {result.context}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-700/50">
        {result.requestId && (
          <button
            onClick={handleViewRequest}
            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm rounded transition border border-blue-500/30"
          >
            View Request
          </button>
        )}

        {!result.isMarkedSafe && (
          <button
            onClick={handleMarkSafe}
            className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm rounded transition border border-green-500/30"
          >
            Mark Safe
          </button>
        )}

        {!result.isFalsePositive && (
          <button
            onClick={handleMarkFalsePositive}
            className="px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-sm rounded transition border border-yellow-500/30"
          >
            False Positive
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={handleDelete}
          className="p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded transition"
          title="Delete finding"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
