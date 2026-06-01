export interface MacroSnapshot {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface WeightPoint {
  log_date: string;
  weight_kg: number;
}

export interface Milestone {
  label: string;
  target_weight_kg: number;
  estimated_date: string;
  weeks_away: number;
}

export interface WaterSnapshot {
  total_ml: number;
  goal_ml: number;
  pct_complete: number;
  remaining_ml: number;
}

export interface DashboardData {
  user_name: string;
  today_date: string;
  calories_consumed: number;
  calories_target: number;
  calories_remaining: number;
  macros_consumed: MacroSnapshot;
  macros_target: MacroSnapshot;
  streak_days: number;
  weight_entries: WeightPoint[];
  next_milestone: Milestone | null;
  bmi: number | null;
  tdee_kcal: number | null;
  goal_weight_kg: number;
  time_to_goal_weeks: number;
  water: WaterSnapshot;
}
