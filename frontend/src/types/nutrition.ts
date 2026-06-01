export interface FoodItem {
  id: number;
  name: string;
  category: string | null;
  region: string | null;
  serving_size_g: number;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  is_veg: boolean;
  is_egg: boolean;
  score?: number;
}

export interface FoodLogEntry {
  id: number;
  user_id: string;
  food_item_id: number;
  food_name: string;
  log_date: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  quantity_g: number;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  created_at: string;
}

export interface MacroTotals {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface DailyNutrition {
  log_date: string;
  entries: FoodLogEntry[];
  totals: MacroTotals;
  targets: MacroTotals;
}
