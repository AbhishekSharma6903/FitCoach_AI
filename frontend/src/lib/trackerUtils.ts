import type { FoodLogEntry, MacroTotals } from "@/types/nutrition";
import type { MealSlot } from "@/store/useMealStore";

// ── Calorie pace projection (F-1) ────────────────────────────────────────────
// Only meaningful when food has been logged AND it's past noon

export function computeCaloriePace(
  consumedKcal: number,
  targetKcal: number,
): { projected: number; color: string } | null {
  if (consumedKcal === 0) return null;
  const now = new Date();
  const hoursElapsed = now.getHours() + now.getMinutes() / 60;
  if (hoursElapsed < 12) return null; // not enough data before noon
  const projected = Math.round((consumedKcal / hoursElapsed) * 24);
  const diff = Math.abs(projected - targetKcal);
  const color = diff <= 200 ? "text-primary" : "text-amber-400";
  return { projected, color };
}

// ── Meal distribution (F-2) ─────────────────────────────────────────────────
// Calorie split across meal types — only meaningful when 2+ meals logged

export interface MealDistribution {
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
  total: number;
}

export function computeMealDistribution(entries: FoodLogEntry[]): MealDistribution | null {
  const dist = { breakfast: 0, lunch: 0, dinner: 0, snack: 0, total: 0 };
  for (const e of entries) {
    const slot = e.meal_type as MealSlot;
    if (slot in dist) {
      (dist as Record<string, number>)[slot] += e.calories_kcal;
      dist.total += e.calories_kcal;
    }
  }
  const filledSlots = (["breakfast", "lunch", "dinner", "snack"] as MealSlot[]).filter(
    (s) => dist[s] > 0,
  );
  if (filledSlots.length < 2) return null; // not enough data
  return dist;
}

// ── Multi-meal badge (F-3) ───────────────────────────────────────────────────

export function countLoggedMeals(entries: FoodLogEntry[]): number {
  return new Set(entries.map((e) => e.meal_type)).size;
}

// ── Macro completion pct ──────────────────────────────────────────────────────

export function macroPct(consumed: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((consumed / target) * 100), 100);
}

// ── Calories remaining/over ───────────────────────────────────────────────────

export function calorieStatus(consumed: number, target: number) {
  const remaining = target - consumed;
  const isOver = remaining < 0;
  return {
    isOver,
    value: Math.abs(Math.round(remaining)),
    label: isOver ? "over goal" : "remaining",
    color: isOver ? "text-red-400" : "text-primary",
  };
}
