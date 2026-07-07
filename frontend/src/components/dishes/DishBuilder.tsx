"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/Spinner";
import SearchCommand from "@/components/ui/SearchCommand";
import IngredientRow from "./IngredientRow";
import DishNutritionPreview from "./DishNutritionPreview";
import { getUnitOptions, defaultOption } from "@/lib/dishUtils";
import type { UnitOption } from "@/lib/dishUtils";
import { useFoodSearch } from "@/hooks/useFoodSearch";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import type { FoodItem } from "@/types/nutrition";
import type { DishIngredientInput } from "@/types/dish";

interface DishBuilderProps {
  initialName?: string;
  initialIngredients?: DishIngredientInput[];
  onSave: (name: string, ingredients: { food_item_id: number; quantity_g: number }[]) => Promise<void>;
  onCancel: () => void;
  title?: string;
}

// Adapter: turn FoodItem into SearchResultItem for SearchCommand
function renderFoodItem(item: FoodItem) {
  return {
    id: item.id,
    primary: item.name,
    secondary: item.category ?? undefined,
    rightLabel: item.calories_kcal ? `${Math.round(item.calories_kcal)} kcal` : undefined,
    indicator: item.is_veg ? "bg-green-500" : "bg-red-400",
  };
}

async function searchFoods(query: string): Promise<FoodItem[]> {
  if (query.trim().length < 2) return [];
  const res = await api.get("/api/v1/food/search", { params: { q: query } });
  return res.data;
}

export default function DishBuilder({
  initialName = "",
  initialIngredients = [],
  onSave,
  onCancel,
  title = "Create Dish",
}: DishBuilderProps) {
  const [name, setName]               = useState(initialName);
  const [nameError, setNameError]     = useState("");
  const [ingredients, setIngredients] = useState<DishIngredientInput[]>(initialIngredients);
  const [saving, setSaving]           = useState(false);

  const handleSearch = useCallback(searchFoods, []);

  function addIngredient(item: FoodItem) {
    const opts    = getUnitOptions(item);
    const selUnit = defaultOption(opts);
    const amount  = 1; // user picks quantity, default 1 unit
    const grams   = selUnit.weight_g * amount;

    const ing: DishIngredientInput = {
      food_item_id:   item.id,
      food_name:      item.name,
      quantity_g:     grams,
      display_amount: amount,
      unit_options:   opts,
      selected_unit:  selUnit,
      item_ref:       item,
      calories_kcal:  item.calories_kcal,
      protein_g:      item.protein_g,
      carbs_g:        item.carbs_g,
      fat_g:          item.fat_g,
      fiber_g:        item.fiber_g,
      serving_size_g: item.serving_size_g,
    };
    setIngredients(prev => [...prev, ing]);
  }

  function updateAmount(index: number, newDisplayAmount: number) {
    setIngredients(prev => prev.map((ing, i) => {
      if (i !== index) return ing;
      const grams = newDisplayAmount * ing.selected_unit.weight_g;
      return { ...ing, display_amount: newDisplayAmount, quantity_g: grams };
    }));
  }

  function updateUnit(index: number, newUnit: UnitOption) {
    setIngredients(prev => prev.map((ing, i) => {
      if (i !== index) return ing;
      const grams = ing.display_amount * newUnit.weight_g;
      return { ...ing, selected_unit: newUnit, quantity_g: grams };
    }));
  }

  function removeIngredient(index: number) {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) { setNameError("Dish name is required"); return; }
    if (ingredients.length === 0) { toast.error("Add at least one ingredient"); return; }
    if (ingredients.some(i => i.quantity_g <= 0)) { toast.error("All quantities must be greater than 0"); return; }

    setSaving(true);
    try {
      await onSave(
        name.trim(),
        ingredients.map(i => ({ food_item_id: i.food_item_id, quantity_g: i.quantity_g })),
      );
    } catch {
      toast.error("Failed to save dish. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Builder header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          aria-label="Back to dishes"
          className="w-9 h-9 flex items-center justify-center rounded-xl
                     bg-[#1A1A1A] border border-[#2A2A2A]
                     text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>

      {/* Dish name */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Dish name <span className="text-red-400">*</span>
        </label>
        <Input
          type="text"
          placeholder="e.g. My Dal Tadka"
          value={name}
          onChange={e => { setName(e.target.value); setNameError(""); }}
          className={cn(
            "h-11 bg-[#222222] border-[#2A2A2A] focus:border-primary text-sm",
            nameError && "border-red-500/50",
          )}
        />
        {nameError && <p className="text-xs text-red-400">{nameError}</p>}
      </div>

      {/* Ingredient search */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
          Ingredients
        </p>
        <SearchCommand<FoodItem>
          placeholder="Search rice, dal, paneer…"
          onSearch={handleSearch}
          renderItem={renderFoodItem}
          onSelect={item => addIngredient(item)}
          emptyText="No foods found. Try a different name."
        />
      </div>

      {/* Ingredient list */}
      {ingredients.length > 0 && (
        <div className="rounded-xl bg-[#111111] border border-[#2A2A2A] px-4 py-1">
          <AnimatePresence initial={false}>
            {ingredients.map((ing, i) => (
              <IngredientRow
                key={`${ing.food_item_id}-${i}`}
                ingredient={ing}
                onAmountChange={amount => updateAmount(i, amount)}
                onUnitChange={unit => updateUnit(i, unit)}
                onRemove={() => removeIngredient(i)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Live nutrition preview */}
      <DishNutritionPreview ingredients={ingredients} />

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-primary text-black font-semibold text-sm
                   hover:bg-green-400 active:scale-[0.98] transition-all
                   disabled:opacity-40 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Spinner className="w-4 h-4" />
            <span>Saving…</span>
          </>
        ) : (
          "Save Dish"
        )}
      </button>
    </div>
  );
}
