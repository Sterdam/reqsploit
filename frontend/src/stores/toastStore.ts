import { create } from 'zustand';
import type { ToastType } from '../components/Toast';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

let toastIdCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastIdCounter}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

// Convenience functions
export const toast = {
  success: (message: string, description?: string) => {
    useToastStore.getState().addToast({ type: 'success', message, description });
  },
  error: (message: string, description?: string) => {
    useToastStore.getState().addToast({ type: 'error', message, description, duration: 7000 });
  },
  info: (message: string, description?: string) => {
    useToastStore.getState().addToast({ type: 'info', message, description });
  },
  warning: (message: string, description?: string) => {
    useToastStore.getState().addToast({ type: 'warning', message, description, duration: 6000 });
  },
};
