import { create } from 'zustand';
import { wsService, type PendingRequest } from '../lib/websocket';

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
 * Intercept Store
 * Manages request queue and interception control
 */
interface InterceptState {
  // State
  queuedRequests: PendingRequest[];
  selectedRequest: PendingRequest | null;
  isEditing: boolean;
  editedRequest: EditableRequest | null;
  queueSize: number;

  // Actions
  addRequest: (request: PendingRequest) => void;
  removeRequest: (requestId: string) => void;
  selectRequest: (requestId: string) => void;
  deselectRequest: () => void;
  setQueue: (queue: PendingRequest[]) => void;
  updateQueueSize: (size: number) => void;

  // Edit actions
  startEdit: (requestId: string) => void;
  updateEdit: (field: keyof EditableRequest, value: any) => void;
  saveEdit: () => void;
  cancelEdit: () => void;

  // Request control actions
  forwardRequest: (requestId: string, modifications?: Partial<EditableRequest>) => void;
  dropRequest: (requestId: string) => void;
  modifyAndForward: () => void;

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

  // Add request to queue
  addRequest: (request: PendingRequest) => {
    set((state) => {
      // Avoid duplicates
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
    set((state) => ({
      queuedRequests: state.queuedRequests.filter((r) => r.id !== requestId),
      selectedRequest:
        state.selectedRequest?.id === requestId ? null : state.selectedRequest,
      isEditing: state.selectedRequest?.id === requestId ? false : state.isEditing,
      editedRequest: state.selectedRequest?.id === requestId ? null : state.editedRequest,
      queueSize: Math.max(0, state.queueSize - 1),
    }));
  },

  // Select a request
  selectRequest: (requestId: string) => {
    const request = get().queuedRequests.find((r) => r.id === requestId);
    if (request) {
      set({
        selectedRequest: request,
        isEditing: false,
        editedRequest: null,
      });
    }
  },

  // Deselect current request
  deselectRequest: () => {
    set({
      selectedRequest: null,
      isEditing: false,
      editedRequest: null,
    });
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

    // Request will be removed from queue by server event
  },

  // Drop request (return 403)
  dropRequest: (requestId: string) => {
    wsService.dropRequest(requestId);

    // Request will be removed from queue by server event
  },

  // Modify current selected request and forward
  modifyAndForward: () => {
    get().saveEdit();
  },

  // Clear entire queue (forward all)
  clearQueue: () => {
    const { queuedRequests } = get();

    // Forward all requests
    queuedRequests.forEach((request) => {
      wsService.forwardRequest(request.id);
    });

    // Queue will be cleared by server events
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
});
