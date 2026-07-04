/**
 * useMealStore — UI state for the Quick Add → AddFoodModal flow.
 *
 * When a user taps a Quick Add button (e.g. "Dal Tadka — Breakfast"),
 * the meal slot is pre-selected so AddFoodModal opens with the correct
 * meal type already filled in. This avoids the user having to re-select
 * it manually.
 *
 * Cleared once the food is actually logged.
 */
import { create } from "zustand";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

interface MealState {
  /** The meal slot pre-selected by a Quick Add tap. Null = user picks manually. */
  pendingMealSlot: MealSlot | null;
  setPendingMealSlot: (slot: MealSlot | null) => void;
  clearPendingMealSlot: () => void;
}

export const useMealStore = create<MealState>((set) => ({
  pendingMealSlot: null,
  setPendingMealSlot: (slot) => set({ pendingMealSlot: slot }),
  clearPendingMealSlot: () => set({ pendingMealSlot: null }),
}));
