/**
 * useUIStore — Global UI state that persists across route changes.
 *
 * Responsibilities:
 *   - Toast notification queue (show/hide feedback messages)
 *   - Full-screen loading overlay (e.g. during form submission)
 *
 * NOT for: server data, user preferences, or anything that should
 * be in SWR or persisted to the backend.
 */
import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UIState {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;

  isLoadingOverlay: boolean;
  setLoadingOverlay: (loading: boolean) => void;
}

let _toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  isLoadingOverlay: false,

  showToast: (message, type = "info") => {
    const id = String(++_toastId);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  clearToasts: () => set({ toasts: [] }),

  setLoadingOverlay: (loading) => set({ isLoadingOverlay: loading }),
}));
