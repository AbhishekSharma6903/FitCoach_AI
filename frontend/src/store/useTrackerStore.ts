/**
 * useTrackerStore — UI state for the date-based logging pages.
 *
 * Shared between:
 *   - /tracker  (food log)
 *   - /workout  (workout log)
 *
 * Both pages show the same selected date and navigate together.
 * Stored in Zustand (not SWR) because it's pure UI state,
 * not server data.
 */
import { create } from "zustand";

const todayString = (): string => new Date().toISOString().split("T")[0];

interface TrackerState {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  goToPrevDay: () => void;
  goToNextDay: () => void;
  resetToToday: () => void;
  isToday: () => boolean;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  selectedDate: todayString(),

  setSelectedDate: (date) => set({ selectedDate: date }),

  goToPrevDay: () => {
    const [y, m, d] = get().selectedDate.split("-").map(Number);
    const prev = new Date(y, m - 1, d - 1);
    set({ selectedDate: `${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,"0")}-${String(prev.getDate()).padStart(2,"0")}` });
  },

  goToNextDay: () => {
    const [y, m, d] = get().selectedDate.split("-").map(Number);
    const next = new Date(y, m - 1, d + 1);
    const nextStr = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}-${String(next.getDate()).padStart(2,"0")}`;
    const today = todayString();
    if (nextStr <= today) {
      set({ selectedDate: nextStr });
    }
  },

  resetToToday: () => set({ selectedDate: todayString() }),

  isToday: () => get().selectedDate === todayString(),
}));
