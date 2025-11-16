/**
 * AI Model Selector
 * Dropdown to select AI model (Haiku vs Sonnet) with cost information
 */

import { useState, useRef, useEffect } from 'react';
import { useAIStore, type AIModel } from '../stores/aiStore';
import { Cpu, ChevronDown, Check, Zap, Sparkles } from 'lucide-react';

const MODEL_INFO = {
  'haiku-4.5': {
    name: 'Haiku 4.5',
    description: 'Fast & economical',
    icon: Zap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    costMultiplier: 1,
  },
  'sonnet-4.5': {
    name: 'Sonnet 4.5',
    description: 'Deep analysis',
    icon: Sparkles,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    costMultiplier: 12,
  },
  auto: {
    name: 'Auto',
    description: 'Smart selection',
    icon: Cpu,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    costMultiplier: 1,
  },
} as const;

export function AIModelSelector() {
  const { model, setModel } = useAIStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const currentModel = MODEL_INFO[model];
  const CurrentIcon = currentModel.icon;

  const handleModelChange = (newModel: AIModel) => {
    console.log('🔧 Changing model from', model, 'to', newModel);
    setModel(newModel);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
          ${currentModel.bgColor} border ${currentModel.borderColor}
          hover:bg-white/10 active:scale-95
        `}
        aria-label="Select AI Model"
      >
        <CurrentIcon className={`w-4 h-4 ${currentModel.color}`} />
        <span className={`text-sm font-medium ${currentModel.color} hidden sm:inline`}>
          {currentModel.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 ${currentModel.color} transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="fixed rounded-lg shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 border-2 border-white/40"
          style={{
            backgroundColor: '#0D1F2D',
            backdropFilter: 'blur(10px)',
            zIndex: 99999,
            right: '1rem',
            top: '4.5rem',
            width: '18rem'
          }}
        >
          {/* Header */}
          <div className="px-4 py-2 border-b border-white/20">
            <p className="text-xs font-semibold text-gray-300 uppercase">AI Model</p>
          </div>

          {/* Model Options */}
          <div className="py-1">
            {(['haiku-4.5', 'sonnet-4.5', 'auto'] as AIModel[]).map((modelKey) => {
              const modelInfo = MODEL_INFO[modelKey];
              const Icon = modelInfo.icon;
              const isSelected = model === modelKey;
              const costInfo =
                modelKey === 'haiku-4.5'
                  ? 'Base cost'
                  : modelKey === 'sonnet-4.5'
                  ? '12× cost'
                  : 'Optimized';

              return (
                <button
                  key={modelKey}
                  onClick={() => handleModelChange(modelKey)}
                  className={`
                    w-full px-4 py-3 flex items-start gap-3 transition-colors duration-150
                    ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}
                  `}
                >
                  {/* Icon */}
                  <div
                    className={`
                      w-9 h-9 rounded-lg ${modelInfo.bgColor} border ${modelInfo.borderColor}
                      flex items-center justify-center flex-shrink-0
                    `}
                  >
                    <Icon className={`w-5 h-5 ${modelInfo.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white">{modelInfo.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-green-400" />}
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{modelInfo.description}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`
                          text-xs px-1.5 py-0.5 rounded
                          ${
                            modelKey === 'sonnet-4.5'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-white/10 text-gray-400'
                          }
                        `}
                      >
                        {costInfo}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="px-4 py-2 border-t border-white/20 mt-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <p className="text-xs text-gray-400 leading-relaxed">
              Sonnet provides deeper analysis but costs 12× more tokens than Haiku
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
