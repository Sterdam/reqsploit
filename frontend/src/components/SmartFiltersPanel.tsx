import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, X, Edit2, Check } from 'lucide-react';
import type { SmartFilterPattern } from '../stores/interceptStore';

interface SmartFiltersPanelProps {
  filters: SmartFilterPattern[];
  onToggle: (name: string) => void;
  onDelete: (name: string) => void;
  onUpdate: (filters: SmartFilterPattern[]) => void;
}

export function SmartFiltersPanel({ filters, onToggle, onDelete, onUpdate }: SmartFiltersPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingFilter, setEditingFilter] = useState<string | null>(null);
  const [editPattern, setEditPattern] = useState('');

  if (filters.length === 0) return null;

  const enabledCount = filters.filter((f) => f.enabled).length;

  const startEdit = (filter: SmartFilterPattern) => {
    setEditingFilter(filter.name);
    setEditPattern(filter.pattern.source);
  };

  const saveEdit = (name: string) => {
    try {
      const updatedFilters = filters.map((f) =>
        f.name === name ? { ...f, pattern: new RegExp(editPattern) } : f
      );
      onUpdate(updatedFilters);
      setEditingFilter(null);
    } catch (error) {
      console.error('Invalid regex pattern:', error);
    }
  };

  const cancelEdit = () => {
    setEditingFilter(null);
    setEditPattern('');
  };

  return (
    <div className="border-b border-white/10 bg-[#0A1929]">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Smart Filters</span>
          <span className="text-xs text-gray-400">
            ({enabledCount} of {filters.length} active)
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Filter List */}
      {!collapsed && (
        <div className="px-4 pb-3 space-y-2">
          {filters.map((filter) => (
            <div
              key={filter.name}
              className={`flex items-center gap-2 p-2 rounded border ${
                filter.enabled
                  ? 'bg-purple-900/20 border-purple-600/30'
                  : 'bg-gray-900/20 border-gray-600/30'
              }`}
            >
              {/* Toggle Checkbox */}
              <input
                type="checkbox"
                checked={filter.enabled}
                onChange={() => onToggle(filter.name)}
                className="w-4 h-4 rounded bg-[#0D1F2D] border-white/20 text-purple-600 focus:ring-2 focus:ring-purple-500"
              />

              {/* Filter Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{filter.name}</span>
                  {filter.description && (
                    <span className="text-xs text-gray-400 truncate">{filter.description}</span>
                  )}
                </div>
                {editingFilter === filter.name ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editPattern}
                      onChange={(e) => setEditPattern(e.target.value)}
                      className="flex-1 px-2 py-1 bg-[#0A1929] border border-white/20 rounded text-xs text-white font-mono"
                      placeholder="Regex pattern"
                    />
                    <button
                      onClick={() => saveEdit(filter.name)}
                      className="p-1 text-green-400 hover:bg-green-600/20 rounded transition"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 text-gray-400 hover:bg-gray-600/20 rounded transition"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-xs font-mono text-gray-500 truncate">
                    {filter.pattern.source}
                  </div>
                )}
              </div>

              {/* Actions */}
              {editingFilter !== filter.name && (
                <>
                  <button
                    onClick={() => startEdit(filter)}
                    className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-600/20 rounded transition"
                    title="Edit pattern"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(filter.name)}
                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-600/20 rounded transition"
                    title="Delete filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
