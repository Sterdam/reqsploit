import React from 'react';
import { X } from 'lucide-react';

interface TagBadgeProps {
  tag: string;
  color: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  tag,
  color,
  onRemove,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${color}20`, // 20% opacity
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {tag}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 transition-opacity"
          title="Remove tag"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};
