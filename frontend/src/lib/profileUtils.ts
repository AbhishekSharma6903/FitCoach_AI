// ── Label maps (DB values → display strings) ─────────────────────────────────

export const ACTIVITY_LABELS: Record<string, string> = {
  sedentary:    "Sedentary",
  light:        "Light activity",
  moderate:     "Moderate",
  intense:      "Intense",
  very_intense: "Very intense",
};

export const DIET_LABELS: Record<string, string> = {
  veg:     "Vegetarian",
  egg:     "Eggetarian",
  non_veg: "Non-veg",
};

export const EXPERIENCE_LABELS: Record<string, string> = {
  beginner:     "Beginner",
  intermediate: "Intermediate",
  pro:          "Advanced",
};

// ── Activity multipliers (Mifflin-St Jeor × Harris) ──────────────────────────

export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary:    1.200,
  light:        1.375,
  moderate:     1.550,
  intense:      1.725,
  very_intense: 1.900,
};

const CALORIE_FLOOR: Record<string, number> = {
  male: 1400, female: 1200, other: 1300,
};

// ── BMR — Mifflin-St Jeor ────────────────────────────────────────────────────

function calcBMR(weightKg: number, heightCm: number, age: number, gender: string): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male")   return base + 5;
  if (gender === "female") return base - 161;
  return ((base + 5) + (base - 161)) / 2;
}

// ── Client-side preview (mirrors backend calculation_engine.py exactly) ───────
// Used for the live "what will change" preview below the form before saving.
// The backend is authoritative; this is display-only.

export function previewTargetCalories(
  weightKg: number,
  goalKg: number,
  weeks: number,
  activityLevel: string,
  age: number,
  heightCm: number,
  gender: string,
): { targetKcal: number; tdeeKcal: number; deficitKcal: number } {
  const bmr  = calcBMR(weightKg, heightCm, age, gender);
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55);
  const weeklyDelta = (goalKg - weightKg) / Math.max(weeks, 1);
  const dailyDelta  = (weeklyDelta * 7700) / 7;
  const floor       = CALORIE_FLOOR[gender] ?? 1300;
  const target      = Math.max(Math.round(tdee + dailyDelta), floor);
  return {
    targetKcal:  target,
    tdeeKcal:    Math.round(tdee),
    deficitKcal: Math.round(target - tdee),
  };
}

// ── BMI classification ────────────────────────────────────────────────────────

export type BmiCategory = "Underweight" | "Normal" | "Overweight" | "Obese";

export function getBmiCategory(bmi: number | null | undefined): BmiCategory {
  if (!bmi) return "Normal";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25)   return "Normal";
  if (bmi < 30)   return "Overweight";
  return "Obese";
}

export const BMI_COLOURS: Record<BmiCategory, string> = {
  Underweight: "text-blue-400 border-blue-500/30",
  Normal:      "text-green-400 border-green-500/30",
  Overweight:  "text-amber-400 border-amber-500/30",
  Obese:       "text-red-400 border-red-500/30",
};

// ── Select options (used in UpdateGoalsForm) ──────────────────────────────────

export const ACTIVITY_OPTIONS = [
  { value: "sedentary",    label: "Sedentary (desk job, little exercise)" },
  { value: "light",        label: "Light (1–2 days/week)" },
  { value: "moderate",     label: "Moderate (3–5 days/week)" },
  { value: "intense",      label: "Intense (6–7 days/week)" },
  { value: "very_intense", label: "Very Intense (2× daily training)" },
];

export const DIET_OPTIONS = [
  { value: "veg",     label: "Vegetarian" },
  { value: "egg",     label: "Eggetarian" },
  { value: "non_veg", label: "Non-Vegetarian" },
];
