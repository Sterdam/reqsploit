import { create } from 'zustand';
import { wsService, type PendingRequest } from '../lib/websocket';
import { batchToRepeater } from '../lib/panel-bridge';
import { useUndoStore } from './undoStore';

/**
 * Editable request structure for modification
 */
export interface EditableRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Smart Filter Pattern (synced with backend)
 */
export interface SmartFilterPattern {
  name: string;
  pattern: RegExp;
  enabled: boolean;
  description: string;
}

/**
 * Intercept Store
 * Manages request queue, multi-select, bulk actions, and smart filtering
 */
interface InterceptState {
  // State
  queuedRequests: PendingRequest[];
  selectedRequest: PendingRequest | null;
  isEditing: boolean;
  editedRequest: EditableRequest | null;
  queueSize: number;
  selectedRequestIds: Set<string>;
  smartFilters: SmartFilterPattern[];

  // Single-select actions
  addRequest: (request: PendingRequest) => void;
  removeRequest: (requestId: string) => void;
  selectRequest: (requestId: string, multi?: boolean) => void;
  deselectRequest: () => void;
  setQueue: (queue: PendingRequest[]) => void;
  updateQueueSize: (size: number) => void;

  // Multi-select actions
  toggleSelection: (requestId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isSelected: (requestId: string) => boolean;

  // Edit actions
  startEdit: (requestId: string) => void;
  updateEdit: (field: keyof EditableRequest, value: any) => void;
  saveEdit: () => void;
  cancelEdit: () => void;

  // Request control actions
  forwardRequest: (requestId: string, modifications?: Partial<EditableRequest>) => void;
  dropRequest: (requestId: string) => void;
  modifyAndForward: () => void;

  // Bulk actions
  bulkForward: (requestIds?: string[]) => void;
  bulkDrop: (requestIds?: string[]) => void;
  bulkSendToRepeater: (requestIds?: string[]) => void;
  forwardByPattern: (pattern: string) => void;
  dropByPattern: (pattern: string) => void;

  // Smart filters
  loadSmartFilters: () => void;
  updateSmartFilters: (filters: SmartFilterPattern[]) => void;

  // Utility
  clearQueue: () => void;
}

export const useInterceptStore = create<InterceptState>((set, get) => ({
  // Initial state
  queuedRequests: [],
  selectedRequest: null,
  isEditing: false,
  editedRequest: null,
  queueSize: 0,
  selectedRequestIds: new Set<string>(),
  smartFilters: [],

  // Add request to queue
  addRequest: (request: PendingRequest) => {
    set((state) => {
      if (state.queuedRequests.some((r) => r.id === request.id)) {
        return state;
      }

      return {
        queuedRequests: [...state.queuedRequests, request],
        queueSize: state.queueSize + 1,
      };
    });
  },

  // Remove request from queue
  removeRequest: (requestId: string) => {
    set((state) => {
      const newSelected = new Set(state.selectedRequestIds);
      newSelected.delete(requestId);

      return {
        queuedRequests: state.queuedRequests.filter((r) => r.id !== requestId),
        selectedRequest: state.selectedRequest?.id === requestId ? null : state.selectedRequest,
        selectedRequestIds: newSelected,
        isEditing: state.selectedRequest?.id === requestId ? false : state.isEditing,
        editedRequest: state.selectedRequest?.id === requestId ? null : state.editedRequest,
        queueSize: Math.max(0, state.queueSize - 1),
      };
    });
  },

  // Select a request (with multi-select support)
  selectRequest: (requestId: string, multi = false) => {
    const request = get().queuedRequests.find((r) => r.id === requestId);
    if (!request) return;

    set((state) => {
      if (multi) {
        const newSelected = new Set(state.selectedRequestIds);
        newSelected.add(requestId);
        return {
          selectedRequest: request,
          selectedRequestIds: newSelected,
          isEditing: false,
          editedRequest: null,
        };
      } else {
        return {
          selectedRequest: request,
          selectedRequestIds: new Set([requestId]),
          isEditing: false,
          editedRequest: null,
        };
      }
    });
  },

  // Deselect current request
  deselectRequest: () => {
    set({
      selectedRequest: null,
      selectedRequestIds: new Set(),
      isEditing: false,
      editedRequest: null,
    });
  },

  // Toggle selection (for checkboxes)
  toggleSelection: (requestId: string) => {
    set((state) => {
      const newSelected = new Set(state.selectedRequestIds);
      if (newSelected.has(requestId)) {
        newSelected.delete(requestId);
      } else {
        newSelected.add(requestId);
      }
      return { selectedRequestIds: newSelected };
    });
  },

  // Select all requests
  selectAll: () => {
    set((state) => ({
      selectedRequestIds: new Set(state.queuedRequests.map((r) => r.id)),
    }));
  },

  // Deselect all requests
  deselectAll: () => {
    set({ selectedRequestIds: new Set() });
  },

  // Check if request is selected
  isSelected: (requestId: string) => {
    return get().selectedRequestIds.has(requestId);
  },

  // Set entire queue (from server)
  setQueue: (queue: PendingRequest[]) => {
    set({
      queuedRequests: queue,
      queueSize: queue.length,
    });
  },

  // Update queue size (from queue:changed event)
  updateQueueSize: (size: number) => {
    set({ queueSize: size });
  },

  // Start editing current selected request
  startEdit: (requestId: string) => {
    const request = get().queuedRequests.find((r) => r.id === requestId);
    if (request) {
      set({
        selectedRequest: request,
        isEditing: true,
        editedRequest: {
          method: request.method,
          url: request.url,
          headers: { ...request.headers },
          body: request.body,
        },
      });
    }
  },

  // Update a field in the edited request
  updateEdit: (field: keyof EditableRequest, value: any) => {
    set((state) => {
      if (!state.editedRequest) return state;

      return {
        editedRequest: {
          ...state.editedRequest,
          [field]: value,
        },
      };
    });
  },

  // Save edits and forward request
  saveEdit: () => {
    const { selectedRequest, editedRequest } = get();

    if (!selectedRequest || !editedRequest) {
      console.warn('Cannot save: no request selected or edited');
      return;
    }

    // Send modifications to server
    wsService.modifyRequest(selectedRequest.id, {
      method: editedRequest.method !== selectedRequest.method ? editedRequest.method : undefined,
      url: editedRequest.url !== selectedRequest.url ? editedRequest.url : undefined,
      headers: editedRequest.headers,
      body: editedRequest.body !== selectedRequest.body ? editedRequest.body : undefined,
    });

    // Clear edit state (request will be removed by queue event)
    set({
      isEditing: false,
      editedRequest: null,
    });
  },

  // Cancel editing
  cancelEdit: () => {
    set({
      isEditing: false,
      editedRequest: null,
    });
  },

  // Forward request without modifications
  forwardRequest: (requestId: string, modifications?: Partial<EditableRequest>) => {
    if (modifications) {
      wsService.modifyRequest(requestId, modifications);
    } else {
      wsService.forwardRequest(requestId);
    }
  },

  // Drop request (return 403) with undo tracking
  dropRequest: (requestId: string) => {
    wsService.dropRequest(requestId);

    // Track for undo
    useUndoStore.getState().addUndoableAction({
      type: 'single-drop',
      data: { requestIds: [requestId] },
    });
  },

  // Modify current selected request and forward
  modifyAndForward: () => {
    get().saveEdit();
  },

  // Bulk forward (use selected if not provided)
  bulkForward: (requestIds?: string[]) => {
    const ids = requestIds || Array.from(get().selectedRequestIds);
    if (ids.length === 0) return;

    wsService.bulkForward(ids);
    console.log('[InterceptStore] Bulk forward requested:', ids.length, 'requests');
  },

  // Bulk drop (use selected if not provided) with undo tracking
  bulkDrop: (requestIds?: string[]) => {
    const ids = requestIds || Array.from(get().selectedRequestIds);
    if (ids.length === 0) return;

    wsService.bulkDrop(ids);
    console.log('[InterceptStore] Bulk drop requested:', ids.length, 'requests');

    // Track for undo
    useUndoStore.getState().addUndoableAction({
      type: 'bulk-drop',
      data: { requestIds: ids },
    });
  },

  // Bulk send to Repeater (use selected if not provided)
  bulkSendToRepeater: (requestIds?: string[]) => {
    const ids = requestIds || Array.from(get().selectedRequestIds);
    if (ids.length === 0) return;

    const requests = get().queuedRequests.filter((r) => ids.includes(r.id));

    // Use batchToRepeater for better performance with multiple requests
    const repeaterRequests = requests.map((req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers as Record<string, string>,
      body: req.body || '',
    }));

    batchToRepeater(repeaterRequests, 'intercept');

    console.log('[InterceptStore] Bulk sent to Repeater:', requests.length, 'requests');
  },

  // Forward by URL pattern
  forwardByPattern: (pattern: string) => {
    wsService.forwardByPattern(pattern);
    console.log('[InterceptStore] Forward by pattern:', pattern);
  },

  // Drop by URL pattern
  dropByPattern: (pattern: string) => {
    wsService.dropByPattern(pattern);
    console.log('[InterceptStore] Drop by pattern:', pattern);
  },

  // Load smart filters from backend
  loadSmartFilters: () => {
    wsService.getSmartFilters();
  },

  // Update smart filters
  updateSmartFilters: (filters: SmartFilterPattern[]) => {
    wsService.updateSmartFilters(filters);
    set({ smartFilters: filters });
  },

  // Clear entire queue (forward all)
  clearQueue: () => {
    const { queuedRequests } = get();

    queuedRequests.forEach((request) => {
      wsService.forwardRequest(request.id);
    });
  },
}));

// Setup WebSocket event handlers for intercept store
wsService.setHandlers({
  onRequestHeld: (data) => {
    console.log('[InterceptStore] Request held:', data.request.url);
    useInterceptStore.getState().addRequest(data.request);
  },

  onRequestForwarded: (data) => {
    console.log('[InterceptStore] Request forwarded:', data.requestId);
    useInterceptStore.getState().removeRequest(data.requestId);
  },

  onRequestDropped: (data) => {
    console.log('[InterceptStore] Request dropped:', data.requestId);
    useInterceptStore.getState().removeRequest(data.requestId);
  },

  onQueueChanged: (data) => {
    console.log('[InterceptStore] Queue changed:', data);
    useInterceptStore.getState().updateQueueSize(data.queueSize);
  },

  onRequestQueue: (data) => {
    console.log('[InterceptStore] Queue received:', data.queue.length, 'requests');
    useInterceptStore.getState().setQueue(data.queue);
  },

  onBulkResult: (data) => {
    console.log('[InterceptStore] Bulk result:', data.action, data.success.length, 'success', data.failed.length, 'failed');
    // Requests already removed by individual forward/drop events
    useInterceptStore.getState().deselectAll();
  },

  onSmartFiltersConfig: (data) => {
    console.log('[InterceptStore] Smart filters config received:', data.filters.length, 'filters');
    useInterceptStore.getState().updateSmartFilters(data.filters);
  },
});
