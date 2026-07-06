import type { WorkoutLogEntry } from "@/types/workout";

// ── Category styling ──────────────────────────────────────────────────────────

export interface CategoryStyle {
  bg: string;
  bgSolid: string;  // solid colour for progress bars (no opacity)
  text: string;
  badge: string;
}

export const CATEGORY_STYLE: Record<string, CategoryStyle> = {
  Cardio:     { bg: "bg-red-500/10",    bgSolid: "bg-red-500",    text: "text-red-400",    badge: "text-red-400 border-red-500/30"       },
  Strength:   { bg: "bg-blue-500/10",   bgSolid: "bg-blue-500",   text: "text-blue-400",   badge: "text-blue-400 border-blue-500/30"     },
  Yoga:       { bg: "bg-purple-500/10", bgSolid: "bg-purple-500", text: "text-purple-400", badge: "text-purple-400 border-purple-500/30" },
  Stretching: { bg: "bg-green-500/10",  bgSolid: "bg-green-500",  text: "text-green-400",  badge: "text-green-400 border-green-500/30"  },
  Plyometrics:{ bg: "bg-orange-500/10", bgSolid: "bg-orange-500", text: "text-orange-400", badge: "text-orange-400 border-orange-500/30" },
};

export function getCategoryStyle(category: string): CategoryStyle {
  // DB stores lowercase categories; CATEGORY_STYLE uses title-case — normalize on read
  const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  return CATEGORY_STYLE[normalized] ?? {
    bg: "bg-[#1A1A1A]", bgSolid: "bg-[#333333]", text: "text-muted-foreground", badge: "text-muted-foreground border-[#2A2A2A]",
  };
}

// ── Intensity → MET ───────────────────────────────────────────────────────────

export type Intensity = "light" | "moderate" | "vigorous";

export const INTENSITY_MET: Record<Intensity, number> = {
  light:    3.0,
  moderate: 3.5,
  vigorous: 6.0,
};

export const INTENSITIES: { value: Intensity; label: string; met: number }[] = [
  { value: "light",    label: "Light",    met: 3.0 },
  { value: "moderate", label: "Moderate", met: 3.5 },
  { value: "vigorous", label: "Vigorous", met: 6.0 },
];

export function isStrengthCategory(category: string): boolean {
  const lower = category.toLowerCase();
  return lower !== "cardio" && lower !== "yoga" && lower !== "stretching";
}

// ── Notes: intensity prefix storage ──────────────────────────────────────────
// Until Phase 6 adds a dedicated intensity column, we store as "[moderate] user note"

export function buildNotes(intensity: Intensity, userNote: string): string {
  const note = userNote.trim();
  if (intensity === "moderate" && !note) return "";
  return note ? `[${intensity}] ${note}` : `[${intensity}]`;
}

export function stripIntensityPrefix(notes: string | null): string {
  if (!notes) return "";
  return notes.replace(/^\[.*?\]\s*/, "").trim();
}

export function extractIntensity(notes: string | null): Intensity {
  if (!notes) return "moderate";
  const match = notes.match(/^\[(light|moderate|vigorous)\]/);
  return (match?.[1] as Intensity) ?? "moderate";
}

// ── Volume calculation ────────────────────────────────────────────────────────

export function calcVolume(entries: WorkoutLogEntry[]): number {
  return entries.reduce((sum, e) => {
    if (!e.sets || !e.reps || !e.weight_kg) return sum;
    return sum + e.sets * e.reps * e.weight_kg;
  }, 0);
}

export function formatVolume(kg: number): string {
  if (kg === 0) return "—";
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)} kg`;
}

// ── Calorie preview ───────────────────────────────────────────────────────────

export function calcCaloriePreview(
  met: number,
  weightKg: number,
  durationMin: number,
): number {
  return Math.round(met * weightKg * (durationMin / 60));
}

// Strength-specific: estimate active time from sets × reps (each rep ~3s) + rest (sets × 90s)
// Returns kcal estimate that scales with actual volume
export function calcStrengthCaloriePreview(
  met: number,
  weightKg: number,
  sets: number,
  reps: number,
): number {
  const activeTimeSec = sets * reps * 3;          // ~3s per rep
  const restTimeSec   = sets * 90;                // ~90s rest between sets
  const totalMin = (activeTimeSec + restTimeSec) / 60;
  return Math.round(met * weightKg * (totalMin / 60));
}

// ── Grouping ──────────────────────────────────────────────────────────────────

export function groupEntriesByExercise(
  entries: WorkoutLogEntry[],
): Map<string, WorkoutLogEntry[]> {
  const map = new Map<string, WorkoutLogEntry[]>();
  for (const e of entries) {
    const key = e.exercise_name;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return map;
}

// ── Session category breakdown ────────────────────────────────────────────────

export interface CategoryBreakdown {
  category: string;
  kcal: number;
  pct: number;
  style: CategoryStyle;
}

export function calcCategoryBreakdown(entries: WorkoutLogEntry[]): CategoryBreakdown[] {
  const totals: Record<string, number> = {};
  let grand = 0;
  for (const e of entries) {
    if (!e.calories_burned) continue;
    totals[e.category] = (totals[e.category] ?? 0) + e.calories_burned;
    grand += e.calories_burned;
  }
  if (grand === 0) return [];
  return Object.entries(totals)
    .map(([category, kcal]) => ({
      category,
      kcal: Math.round(kcal),
      pct: Math.round((kcal / grand) * 100),
      style: getCategoryStyle(category),
    }))
    .sort((a, b) => b.kcal - a.kcal);
}
