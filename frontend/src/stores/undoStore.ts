import { create } from 'zustand';
import { wsService } from '../lib/websocket';
import { toast } from './toastStore';

export interface UndoableAction {
  id: string;
  type: 'bulk-drop' | 'bulk-forward' | 'single-drop' | 'single-forward' | 'filter-create';
  data: {
    requestIds?: string[];
    filterName?: string;
    filterPattern?: string;
  };
  timestamp: number;
  canUndo: boolean;
}

interface UndoStore {
  undoStack: UndoableAction[];
  redoStack: UndoableAction[];

  // Actions
  addUndoableAction: (action: Omit<UndoableAction, 'id' | 'timestamp' | 'canUndo'>) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // Helpers
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const UNDO_TIMEOUT = 30000; // 30 seconds

let actionIdCounter = 0;

export const useUndoStore = create<UndoStore>((set, get) => ({
  undoStack: [],
  redoStack: [],

  addUndoableAction: (action) => {
    const id = `undo-${++actionIdCounter}`;
    const newAction: UndoableAction = {
      ...action,
      id,
      timestamp: Date.now(),
      canUndo: true,
    };

    set((state) => ({
      undoStack: [...state.undoStack, newAction],
      redoStack: [], // Clear redo stack on new action
    }));

    // Set timeout to mark action as non-undoable after grace period
    setTimeout(() => {
      set((state) => ({
        undoStack: state.undoStack.map((a) =>
          a.id === id ? { ...a, canUndo: false } : a
        ),
      }));
    }, UNDO_TIMEOUT);

    // Show undo toast for critical actions
    if (action.type === 'bulk-drop' || action.type === 'single-drop') {
      const count = action.data.requestIds?.length || 1;
      toast.warning(
        `${count} request${count > 1 ? 's' : ''} dropped`,
        'Press Ctrl+Z to undo (30s)'
      );
    }
  },

  undo: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) {
      toast.info('Nothing to undo');
      return;
    }

    // Find last undoable action
    let lastUndoableIndex = -1;
    for (let i = undoStack.length - 1; i >= 0; i--) {
      if (undoStack[i].canUndo) {
        lastUndoableIndex = i;
        break;
      }
    }
    if (lastUndoableIndex === -1) {
      toast.warning('Undo period expired (30s limit)');
      return;
    }

    const actionToUndo = undoStack[lastUndoableIndex];

    // Execute undo based on action type
    switch (actionToUndo.type) {
      case 'bulk-drop':
      case 'single-drop':
        // Re-queue dropped requests via backend API
        if (actionToUndo.data.requestIds && actionToUndo.data.requestIds.length > 0) {
          try {
            const response = await fetch('/api/proxy/intercept/undo', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
              },
              body: JSON.stringify({
                requestIds: actionToUndo.data.requestIds,
              }),
            });

            // Check if response is OK before parsing JSON
            if (!response.ok) {
              let errorMessage = 'Request failed';
              try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
              } catch {
                // Response is not JSON (might be HTML error page)
                errorMessage = `Server error (${response.status})`;
              }
              toast.error('Undo failed', errorMessage);
              return;
            }

            const data = await response.json();

            if (data.success) {
              const count = data.restored?.length || actionToUndo.data.requestIds.length;
              toast.success(
                `Undo successful`,
                `${count} request${count > 1 ? 's' : ''} restored to queue`
              );
            } else {
              toast.error('Undo failed', data.message || 'Grace period may have expired');
            }
          } catch (error) {
            console.error('Undo drop failed:', error);
            toast.error('Undo failed', 'Network error or session expired');
          }
        }
        break;

      case 'bulk-forward':
      case 'single-forward':
        // Can't really undo a forward (request already sent)
        toast.warning('Cannot undo forward', 'Request already sent to server');
        return;

      case 'filter-create':
        // Remove created filter (not yet implemented)
        if (actionToUndo.data.filterName) {
          toast.info('Undo filter creation', 'Feature coming soon');
        }
        break;
    }

    // Move action to redo stack
    set((state) => ({
      undoStack: state.undoStack.filter((_, i) => i !== lastUndoableIndex),
      redoStack: [...state.redoStack, actionToUndo],
    }));
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) {
      toast.info('Nothing to redo');
      return;
    }

    const actionToRedo = redoStack[redoStack.length - 1];

    // Execute redo based on action type
    switch (actionToRedo.type) {
      case 'bulk-drop':
      case 'single-drop':
        if (actionToRedo.data.requestIds) {
          // Re-drop the requests using wsService methods
          actionToRedo.data.requestIds.forEach((id) => {
            wsService.dropRequest(id);
          });
          const count = actionToRedo.data.requestIds.length;
          toast.warning(
            `Re-dropped ${count} request${count > 1 ? 's' : ''}`,
            'Press Ctrl+Z to undo again'
          );
        }
        break;

      case 'filter-create':
        if (actionToRedo.data.filterName && actionToRedo.data.filterPattern) {
          toast.info('Redo filter creation', 'Feature coming soon');
        }
        break;
    }

    // Move action back to undo stack
    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, actionToRedo],
    }));
  },

  clearHistory: () => {
    set({ undoStack: [], redoStack: [] });
    toast.info('Undo history cleared');
  },

  canUndo: () => {
    const { undoStack } = get();
    return undoStack.some((a) => a.canUndo);
  },

  canRedo: () => {
    const { redoStack } = get();
    return redoStack.length > 0;
  },
}));

// Keyboard shortcut handler
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    // Ctrl+Z (Cmd+Z on Mac) for Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      useUndoStore.getState().undo();
    }

    // Ctrl+Shift+Z (Cmd+Shift+Z on Mac) for Redo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      useUndoStore.getState().redo();
    }

    // Ctrl+Y for Redo (alternative)
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      useUndoStore.getState().redo();
    }
  });
}
