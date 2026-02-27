import React, { useEffect, useState } from 'react';
import { Fish, X, Shield, AlertTriangle, Info } from 'lucide-react';
import { useMagicScanStore, ScanResult } from '../stores/magicScanStore';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: string;
  result: ScanResult;
  timestamp: number;
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    icon: Shield,
    bg: 'bg-red-500/95',
    border: 'border-red-600',
    text: 'text-white',
    glow: 'shadow-lg shadow-red-500/50',
    autoDismiss: false,
  },
  HIGH: {
    icon: AlertTriangle,
    bg: 'bg-orange-500/95',
    border: 'border-orange-600',
    text: 'text-white',
    glow: 'shadow-lg shadow-orange-500/50',
    autoDismiss: 10000, // 10s
  },
  MEDIUM: {
    icon: Info,
    bg: 'bg-blue-500/95',
    border: 'border-blue-600',
    text: 'text-white',
    glow: 'shadow-lg shadow-blue-500/50',
    autoDismiss: 5000, // 5s
  },
  LOW: {
    icon: Info,
    bg: 'bg-gray-600/95',
    border: 'border-gray-700',
    text: 'text-white',
    glow: 'shadow-lg shadow-gray-500/50',
    autoDismiss: 3000, // 3s
  },
};

export const MagicScanNotification: React.FC = () => {
  const navigate = useNavigate();
  const { results } = useMagicScanStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lastResultId, setLastResultId] = useState<string | null>(null);

  // Listen for new results and create notifications
  useEffect(() => {
    if (results.length === 0) return;

    const latestResult = results[0];
    if (latestResult.id === lastResultId) return;

    // Skip LOW severity in silent mode
    if (latestResult.severity === 'LOW') {
      setLastResultId(latestResult.id);
      return;
    }

    // Add new notification
    const notification: NotificationItem = {
      id: latestResult.id,
      result: latestResult,
      timestamp: Date.now(),
    };

    setNotifications((prev) => {
      // Keep max 3 notifications
      const updated = [notification, ...prev].slice(0, 3);
      return updated;
    });

    setLastResultId(latestResult.id);

    // Auto-dismiss based on severity
    const config = SEVERITY_CONFIG[latestResult.severity];
    if (config.autoDismiss && typeof config.autoDismiss === 'number') {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, config.autoDismiss);
    }
  }, [results, lastResultId]);

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleViewAll = () => {
    navigate('/magic-scan');
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {notifications.map((notification, index) => {
        const { result } = notification;
        const config = SEVERITY_CONFIG[result.severity];
        const Icon = config.icon;

        return (
          <div
            key={notification.id}
            className={`
              pointer-events-auto
              w-96 rounded-lg border-2 overflow-hidden
              ${config.bg} ${config.border} ${config.glow}
              transform transition-all duration-300 ease-out
              animate-slide-in-right
            `}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            {/* Header with severity and close */}
            <div className="flex items-center justify-between p-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <Fish className="w-5 h-5 animate-pulse" />
                <span className="font-semibold text-sm">Magic Scan Alert</span>
                <span className="px-2 py-0.5 bg-black/30 rounded text-xs font-medium">
                  {result.severity}
                </span>
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="hover:bg-white/20 rounded p-1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-black/30 rounded">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">{result.type}</h3>
                  <p className="text-xs opacity-90 mb-2">{result.description}</p>
                  <code className="text-xs bg-black/40 px-2 py-1 rounded font-mono block truncate">
                    {result.value}
                  </code>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-2 text-xs opacity-75 mb-3">
                <span>{result.location.source === 'request' ? '→ Request' : '← Response'}</span>
                <span>•</span>
                <span className="capitalize">{result.location.part}</span>
                <span>•</span>
                <span>{result.confidence}% confidence</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleViewAll}
                  className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded transition text-sm font-medium"
                >
                  View All Findings
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
