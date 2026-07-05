import type { WeightPoint } from "@/types/dashboard";
import type { DashboardData } from "@/types/dashboard";

// ── Weight trend ──────────────────────────────────────────────────────────────

export function computeWeeklyTrend(entries: WeightPoint[]): number | null {
  if (entries.length < 3) return null;
  const first = entries[0];
  const last = entries[entries.length - 1];
  const weeks =
    (new Date(last.log_date).getTime() - new Date(first.log_date).getTime()) /
    (7 * 24 * 60 * 60 * 1000);
  return weeks > 0 ? (last.weight_kg - first.weight_kg) / weeks : null;
}

export interface PaceResult {
  weeksAtPace: number;
  deltaWeeks: number; // positive = ahead, negative = behind
}

export function computePaceVsGoal(
  entries: WeightPoint[],
  goalKg: number,
  statedWeeks: number,
): PaceResult | null {
  const trend = computeWeeklyTrend(entries);
  if (!trend || trend >= 0) return null; // not losing weight
  const currentKg = entries[entries.length - 1].weight_kg;
  const kgToGoal = currentKg - goalKg;
  if (kgToGoal <= 0) return null; // already at or past goal
  const weeksAtPace = Math.abs(kgToGoal / trend);
  const deltaWeeks = Math.round(statedWeeks - weeksAtPace);
  return { weeksAtPace: Math.round(weeksAtPace), deltaWeeks };
}

// ── Day score (F-4) ───────────────────────────────────────────────────────────

export function computeDayScore(d: DashboardData): number | null {
  if (d.calories_consumed === 0) return null;
  const calScore = Math.min(d.calories_net / d.calories_target, 1);
  const waterScore = d.water.pct_complete;
  const proteinTarget = d.macros_target.protein_g;
  const proteinScore =
    proteinTarget > 0
      ? Math.min(d.macros_consumed.protein_g / proteinTarget, 1)
      : 0;
  return Math.round(((calScore + waterScore + proteinScore) / 3) * 100);
}

// ── BMI category ─────────────────────────────────────────────────────────────

export interface BmiCategory {
  label: string;
  color: string;  // Tailwind text + border classes
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400 border-blue-500/30" };
  if (bmi < 25)   return { label: "Healthy",     color: "text-green-400 border-green-500/30" };
  if (bmi < 30)   return { label: "Overweight",  color: "text-amber-400 border-amber-500/30" };
  return             { label: "Obese",         color: "text-red-400 border-red-500/30" };
}

// ── Streak motivation text ────────────────────────────────────────────────────

export function getStreakMotivation(days: number): string {
  if (days === 0) return "Log today to start 🔥";
  if (days === 1) return "Great start!";
  if (days < 7)   return "Keep it up!";
  if (days < 30)  return "On fire! 🔥";
  return "Unstoppable!";
}

// ── Macro calorie split ───────────────────────────────────────────────────────

export interface MacroSplit {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

export function computeMacroSplit(
  proteinG: number,
  carbsG: number,
  fatG: number,
): MacroSplit {
  const total = proteinG * 4 + carbsG * 4 + fatG * 9;
  if (total === 0) return { proteinPct: 33, carbsPct: 34, fatPct: 33 };
  return {
    proteinPct: Math.round((proteinG * 4 / total) * 100),
    carbsPct:   Math.round((carbsG   * 4 / total) * 100),
    fatPct:     Math.round((fatG     * 9 / total) * 100),
  };
}

// ── Greeting ─────────────────────────────────────────────────────────────────

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
