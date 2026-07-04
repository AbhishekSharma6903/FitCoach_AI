export interface DishIngredient {
  id: number;
  food_item_id: number;
  food_name: string;
  quantity_g: number;
}

export interface CustomDish {
  id: number;
  user_id: string;
  name: string;
  name_normalized: string;
  total_weight_g: number;
  calories_kcal: number | null;
  protein_g:     number | null;
  carbs_g:       number | null;
  fat_g:         number | null;
  fiber_g:       number | null;
  sugar_g:       number | null;
  sodium_mg:     number | null;
  is_veg:   boolean;
  is_egg:   boolean;
  is_vegan: boolean;
  ingredients: DishIngredient[];
  created_at: string;
  updated_at: string;
}

export interface CustomDishListItem {
  id: number;
  name: string;
  total_weight_g: number;
  calories_kcal: number | null;
  protein_g:     number | null;
  carbs_g:       number | null;
  fat_g:         number | null;
  is_veg:   boolean;
  is_egg:   boolean;
  ingredient_count: number;
}

import type { FoodItem } from "@/types/nutrition";

export interface DishIngredientInput {
  food_item_id: number;
  food_name: string;
  quantity_g: number;
  display_amount?: number;
  display_unit?: "g" | "ml" | "qty";
  item_ref?: FoodItem;        // kept in memory for unit conversion, not sent to API
  // nutrition per 100g from food_items (for live preview)
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  serving_size_g: number;
}
