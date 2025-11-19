import { create } from 'zustand';
import { toast } from './toastStore';

export enum TagType {
  CRITICAL = 'CRITICAL',
  INTERESTING = 'INTERESTING',
  SAFE = 'SAFE',
  IDOR = 'IDOR',
  XSS = 'XSS',
  SQLI = 'SQLI',
  SSRF = 'SSRF',
  CUSTOM = 'CUSTOM',
}

export interface TagDefinition {
  id: string;
  name: string;
  color: string;
  description: string;
}

export const PREDEFINED_TAGS: TagDefinition[] = [
  {
    id: TagType.CRITICAL,
    name: 'Critical',
    color: '#DC2626', // red-600
    description: 'Critical security finding or high-value target',
  },
  {
    id: TagType.INTERESTING,
    name: 'Interesting',
    color: '#F97316', // orange-500
    description: 'Potentially interesting endpoint or behavior',
  },
  {
    id: TagType.SAFE,
    name: 'Safe',
    color: '#16A34A', // green-600
    description: 'Verified safe request, no vulnerabilities',
  },
  {
    id: TagType.IDOR,
    name: 'IDOR',
    color: '#9333EA', // purple-600
    description: 'Insecure Direct Object Reference vulnerability',
  },
  {
    id: TagType.XSS,
    name: 'XSS',
    color: '#EAB308', // yellow-600
    description: 'Cross-Site Scripting vulnerability',
  },
  {
    id: TagType.SQLI,
    name: 'SQLi',
    color: '#3B82F6', // blue-600
    description: 'SQL Injection vulnerability',
  },
  {
    id: TagType.SSRF,
    name: 'SSRF',
    color: '#EC4899', // pink-600
    description: 'Server-Side Request Forgery vulnerability',
  },
];

export interface TagStats {
  tag: string;
  count: number;
  color: string;
}

interface TagStore {
  // State
  predefinedTags: TagDefinition[];
  tagStats: TagStats[];
  selectedTags: string[]; // For filtering
  isLoading: boolean;

  // Actions
  addTagToRequests: (requestIds: string[], tag: string) => Promise<void>;
  removeTagFromRequests: (requestIds: string[], tag: string) => Promise<void>;
  clearTagsFromRequest: (requestId: string) => Promise<void>;
  loadTagStats: () => Promise<void>;
  toggleTagFilter: (tag: string) => void;
  clearTagFilters: () => void;
  getTagDefinition: (tagId: string) => TagDefinition | undefined;
}

export const useTagStore = create<TagStore>((set, get) => ({
  // Initial state
  predefinedTags: PREDEFINED_TAGS,
  tagStats: [],
  selectedTags: [],
  isLoading: false,

  // Add tag to one or more requests
  addTagToRequests: async (requestIds: string[], tag: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/tags/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ requestIds, tag }),
      });

      const data = await response.json();

      if (data.success) {
        const count = requestIds.length;
        const tagDef = get().getTagDefinition(tag);
        toast.success(
          `Tag applied`,
          `"${tagDef?.name || tag}" applied to ${count} request${count > 1 ? 's' : ''}`
        );

        // Refresh stats
        await get().loadTagStats();
      } else {
        toast.error('Tag failed', data.message || 'Failed to add tag');
      }
    } catch (error) {
      console.error('Add tag failed:', error);
      toast.error('Tag failed', 'Network error or session expired');
    } finally {
      set({ isLoading: false });
    }
  },

  // Remove tag from one or more requests
  removeTagFromRequests: async (requestIds: string[], tag: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/tags/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ requestIds, tag }),
      });

      const data = await response.json();

      if (data.success) {
        const count = requestIds.length;
        const tagDef = get().getTagDefinition(tag);
        toast.success(
          `Tag removed`,
          `"${tagDef?.name || tag}" removed from ${count} request${count > 1 ? 's' : ''}`
        );

        // Refresh stats
        await get().loadTagStats();
      } else {
        toast.error('Tag removal failed', data.message || 'Failed to remove tag');
      }
    } catch (error) {
      console.error('Remove tag failed:', error);
      toast.error('Tag removal failed', 'Network error or session expired');
    } finally {
      set({ isLoading: false });
    }
  },

  // Clear all tags from a request
  clearTagsFromRequest: async (requestId: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/tags/clear/${requestId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Tags cleared', 'All tags removed from request');

        // Refresh stats
        await get().loadTagStats();
      } else {
        toast.error('Clear tags failed', data.message || 'Failed to clear tags');
      }
    } catch (error) {
      console.error('Clear tags failed:', error);
      toast.error('Clear tags failed', 'Network error or session expired');
    } finally {
      set({ isLoading: false });
    }
  },

  // Load tag usage statistics
  loadTagStats: async () => {
    try {
      const response = await fetch('/api/tags/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        set({ tagStats: data.stats });
      }
    } catch (error) {
      console.error('Load tag stats failed:', error);
      // Don't show toast for stats loading failure (non-critical)
    }
  },

  // Toggle tag in filter selection
  toggleTagFilter: (tag: string) => {
    set((state) => {
      const isSelected = state.selectedTags.includes(tag);
      return {
        selectedTags: isSelected
          ? state.selectedTags.filter((t) => t !== tag)
          : [...state.selectedTags, tag],
      };
    });
  },

  // Clear all tag filters
  clearTagFilters: () => {
    set({ selectedTags: [] });
  },

  // Get tag definition by ID
  getTagDefinition: (tagId: string) => {
    return get().predefinedTags.find((t) => t.id === tagId);
  },
}));
