/**
 * progressUtils — pure aggregation functions for the /progress page.
 * No side effects, no imports from React. Mirrors dashboardUtils.ts pattern.
 *
 * All functions operate on WorkoutLogEntry[] (same shape as WorkoutLogRead from backend)
 * and WeightLogRead (defined inline — includes id, note, created_at fields not in WeightPoint).
 */

import type { WeightPoint } from "@/types/dashboard";
import type { WorkoutLogEntry } from "@/types/workout";

// ── Weight ────────────────────────────────────────────────────────────────────

export interface WeightLogRead {
  id: number;
  user_id: string;
  log_date: string;
  weight_kg: number;
  note: string | null;
  created_at: string;
}

/** Map WeightLogRead[] → WeightPoint[] for WeightChart compatibility. */
export function weightEntriesToPoints(entries: WeightLogRead[]): WeightPoint[] {
  return entries.map(e => ({ log_date: e.log_date, weight_kg: e.weight_kg }));
}

// ── Category normalisation ───────────────────────────────────────────────────

export type CategoryBucket = "strength" | "cardio" | "other";

const STRENGTH_TERMS = ["strength", "weights", "powerlifting", "bodybuilding", "resistance"];
const CARDIO_TERMS   = ["cardio", "aerobics", "running", "cycling", "swimming", "hiit", "endurance"];

/** Map a free-string category from the DB to one of three display buckets. */
export function normalisedCategory(raw: string): CategoryBucket {
  const lower = raw.toLowerCase();
  if (STRENGTH_TERMS.some(t => lower.includes(t))) return "strength";
  if (CARDIO_TERMS.some(t => lower.includes(t)))   return "cardio";
  return "other";
}

// ── Workout aggregation ──────────────────────────────────────────────────────

export interface DayVolume {
  date: string;         // formatted: "1 Jul"
  rawDate: string;      // ISO "2026-07-01" — for sorting
  strength: number;
  cardio: number;
  other: number;
}

/**
 * Aggregate flat WorkoutLogEntry[] into one DayVolume per day.
 * Days with no workouts are omitted (bar chart only shows active days).
 */
export function aggregateByDay(entries: WorkoutLogEntry[]): DayVolume[] {
  const map = new Map<string, DayVolume>();

  for (const entry of entries) {
    const rawDate = entry.log_date;
    if (!map.has(rawDate)) {
      const d = new Date(rawDate + "T00:00:00");
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      map.set(rawDate, { date: label, rawDate, strength: 0, cardio: 0, other: 0 });
    }
    const bucket = normalisedCategory(entry.category);
    const kcal = entry.calories_burned ?? 0;
    map.get(rawDate)![bucket] += kcal;
  }

  return Array.from(map.values()).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
}

export interface CategoryBreakdown {
  strength: number;  // percentage 0–100
  cardio:   number;
  other:    number;
}

/** Percentage of total kcal per category bucket. */
export function categoryBreakdown(entries: WorkoutLogEntry[]): CategoryBreakdown {
  let s = 0, c = 0, o = 0;
  for (const e of entries) {
    const kcal = e.calories_burned ?? 0;
    const b = normalisedCategory(e.category);
    if (b === "strength") s += kcal;
    else if (b === "cardio") c += kcal;
    else o += kcal;
  }
  const total = s + c + o;
  if (total === 0) return { strength: 0, cardio: 0, other: 0 };
  return {
    strength: Math.round((s / total) * 100),
    cardio:   Math.round((c / total) * 100),
    other:    Math.round((o / total) * 100),
  };
}

/** Count of unique log_date values — "days with at least one workout". */
export function uniqueWorkoutDays(entries: WorkoutLogEntry[]): number {
  return new Set(entries.map(e => e.log_date)).size;
}

// ── Top exercises ────────────────────────────────────────────────────────────

export interface TopExercise {
  exercise_name:  string;
  category:       string;
  count:          number;
  image_url_thumb: string | null;
}

/**
 * Top N exercises by log-entry count in the given entries.
 * Multiple sets on the same day = multiple entries = higher count.
 */
export function topExercises(entries: WorkoutLogEntry[], n = 5): TopExercise[] {
  const map = new Map<string, TopExercise>();

  for (const e of entries) {
    const key = e.exercise_name;
    if (!map.has(key)) {
      map.set(key, {
        exercise_name:  e.exercise_name,
        category:       e.category,
        count:          0,
        image_url_thumb: e.image_url_thumb,
      });
    }
    map.get(key)!.count += 1;
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

// ── Consistency strip ────────────────────────────────────────────────────────

export interface DayCell {
  date:       string;  // ISO "2026-07-01"
  label:      string;  // "Mon", "Tue" etc — for accessibility
  hasWorkout: boolean;
  isToday:    boolean;
}

export interface WeekRow {
  weekLabel: string;   // "30 Jun" (Monday date of that week)
  days:      DayCell[]; // always 7 cells, Mon–Sun
}

/**
 * Build a week grid for ConsistencyStrip.
 * Returns the last `weeks` ISO weeks (Monday start), most-recent last.
 * Today and future cells are included but never marked as hasWorkout.
 */
export function buildWeekGrid(entries: WorkoutLogEntry[], weeks = 4): WeekRow[] {
  const workoutDates = new Set(entries.map(e => e.log_date));

  const todayStr = new Date().toISOString().split("T")[0];
  const today    = new Date(todayStr + "T00:00:00");

  // Find Monday of current week
  const dow    = (today.getDay() + 6) % 7; // 0=Mon … 6=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);

  const result: WeekRow[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = new Date(monday);
    weekStart.setDate(monday.getDate() - w * 7);

    const weekLabel = weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const days: DayCell[] = [];

    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      const iso   = day.toISOString().split("T")[0];
      const label = day.toLocaleDateString("en-US", { weekday: "short" });
      days.push({
        date:       iso,
        label,
        hasWorkout: workoutDates.has(iso),
        isToday:    iso === todayStr,
      });
    }

    result.push({ weekLabel, days });
  }

  return result;
}
