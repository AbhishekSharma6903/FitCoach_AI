export interface OnboardingFormData {
  name: string;
  age: number | "";
  gender: "male" | "female" | "other" | "";
  height_cm: number | "";
  current_weight_kg: number | "";
  goal_weight_kg: number | "";
  time_to_reach_goal_weeks: number | "";
  experience_level: "beginner" | "intermediate" | "pro" | "";
  activity_level: "sedentary" | "light" | "moderate" | "intense" | "very_intense" | "";
  diet_type: "veg" | "egg" | "non_veg" | "";
  wants_workout_split: boolean;
  wants_diet_plan: boolean;
}

export interface UserProfile {
  user_id: string;
  name: string;
  age: number;
  gender: string;
  height_cm: number;
  current_weight_kg: number;
  goal_weight_kg: number;
  time_to_reach_goal_weeks: number;
  experience_level: string;
  activity_level: string;
  diet_type: string;
  wants_workout_split: boolean;
  wants_diet_plan: boolean;
  bmr_kcal: number | null;
  tdee_kcal: number | null;
  target_calories_kcal: number | null;
  bmi: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  created_at: string;
  updated_at: string;
}
