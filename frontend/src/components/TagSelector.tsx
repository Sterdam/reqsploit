import React, { useState } from 'react';
import { Tag, Check } from 'lucide-react';
import { useTagStore, PREDEFINED_TAGS, TagDefinition } from '../stores/tagStore';

interface TagSelectorProps {
  requestIds: string[];
  onClose: () => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ requestIds, onClose }) => {
  const { addTagToRequests, isLoading } = useTagStore();
  const [selectedTag, setSelectedTag] = useState<TagDefinition | null>(null);

  const handleTagSelect = async (tag: TagDefinition) => {
    setSelectedTag(tag);
    await addTagToRequests(requestIds, tag.id);
    setTimeout(() => {
      onClose();
    }, 500); // Close after showing success
  };

  return (
    <div className="absolute z-50 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-3">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
        <Tag className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-300">
          Tag {requestIds.length} request{requestIds.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {PREDEFINED_TAGS.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagSelect(tag)}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: tag.color }}
            />
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-200">{tag.name}</div>
              <div className="text-xs text-gray-400">{tag.description}</div>
            </div>
            {selectedTag?.id === tag.id && (
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-700 flex justify-end">
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
        >
          Cancel (Esc)
        </button>
      </div>
    </div>
  );
};
