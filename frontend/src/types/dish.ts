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
import type { UnitOption } from "@/lib/dishUtils";

export interface DishIngredientInput {
  food_item_id:   number;
  food_name:      string;
  quantity_g:     number;            // always in grams → sent to API
  display_amount: number;            // the "2" in "2 tablespoons"
  unit_options:   UnitOption[];      // all available units for this food
  selected_unit:  UnitOption;        // currently selected unit
  item_ref?:      FoodItem;          // kept in memory, not sent to API
  // nutrition per 100g — used for live preview
  calories_kcal:  number;
  protein_g:      number;
  carbs_g:        number;
  fat_g:          number;
  fiber_g:        number;
  serving_size_g: number;
}
