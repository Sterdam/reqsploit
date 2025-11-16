import { Sparkles, Loader2 } from 'lucide-react';
import { useAIStore, type AIAction } from '../stores/aiStore';

/**
 * AI Action Button
 *
 * Displays an AI action with cost estimate and loading state
 */

interface AIActionButtonProps {
  action: AIAction;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function AIActionButton({
  action,
  label,
  icon,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
}: AIActionButtonProps) {
  const { getEstimatedCost, canAfford, model } = useAIStore();

  const cost = getEstimatedCost(action);
  const affordable = canAfford(action);

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-electric-blue hover:bg-electric-blue/90 text-white border-electric-blue/50';
      case 'secondary':
        return 'bg-white/10 hover:bg-white/20 text-white border-white/20';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600/50';
      default:
        return 'bg-electric-blue hover:bg-electric-blue/90 text-white border-electric-blue/50';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getCostColor = () => {
    if (!cost) return 'bg-gray-500';
    if (cost <= 8000) return 'bg-green-500';
    if (cost <= 16000) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading || !affordable}
      className={`
        relative flex items-center gap-2 rounded-lg border font-medium transition-all
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${disabled || loading || !affordable ? 'opacity-50 cursor-not-allowed' : ''}
        group
      `}
      title={
        !affordable
          ? 'Insufficient tokens'
          : cost
          ? `Estimated cost: ${cost.toLocaleString()} token${cost > 1 ? 's' : ''} (${model === 'auto' ? 'Haiku' : model})`
          : 'Cost unavailable'
      }
    >
      {/* Icon */}
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        icon
      ) : (
        <Sparkles className="w-4 h-4" />
      )}

      {/* Label */}
      <span>{label}</span>

      {/* Cost Badge */}
      {cost !== null && (
        <span
          className={`
            ml-1 px-1.5 py-0.5 rounded text-xs font-semibold text-white
            ${getCostColor()}
          `}
        >
          {cost.toLocaleString()}
        </span>
      )}

      {/* Affordable indicator */}
      {!affordable && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0D1F2D]" />
      )}
    </button>
  );
}
