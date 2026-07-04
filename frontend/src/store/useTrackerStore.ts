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
    const d = new Date(get().selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    set({ selectedDate: d.toISOString().split("T")[0] });
  },

  goToNextDay: () => {
    const next = new Date(get().selectedDate + "T00:00:00");
    next.setDate(next.getDate() + 1);
    const today = todayString();
    // Never navigate to future dates
    if (next.toISOString().split("T")[0] <= today) {
      set({ selectedDate: next.toISOString().split("T")[0] });
    }
  },

  resetToToday: () => set({ selectedDate: todayString() }),

  isToday: () => get().selectedDate === todayString(),
}));
