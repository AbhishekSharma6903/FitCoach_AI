"use client";

import { useState, useCallback } from "react";
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/Modal";
import SearchCommand from "@/components/ui/SearchCommand";
import api from "@/lib/api";
import type { FoodItem } from "@/types/nutrition";
import type { MealSlot } from "@/store/useMealStore";
import { cn } from "@/lib/utils";

interface AddFoodModalProps {
  open: boolean;
  onClose: () => void;
  logDate: string;
  initialMealSlot: MealSlot;
  /** Pre-fills the food search (used by Quick Add tiles) */
  prefilledQuery?: string;
  onAdd: (payload: {
    food_item_id: number;
    log_date: string;
    meal_type: string;
    quantity_g: number;
  }) => Promise<void>;
}

const MEAL_OPTIONS: { value: MealSlot; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch",     label: "Lunch" },
  { value: "dinner",    label: "Dinner" },
  { value: "snack",     label: "Snack" },
];

async function searchFoods(query: string): Promise<FoodItem[]> {
  const res = await api.get("/api/v1/food/search", { params: { q: query } });
  return res.data;
}

function renderFoodItem(item: FoodItem) {
  const dot = item.is_veg
    ? item.is_egg ? "bg-yellow-400" : "bg-primary"
    : "bg-red-500";
  return {
    id: item.id,
    primary: item.name,
    secondary: `${item.category ?? ""} · ${item.calories_kcal} kcal/100g`,
    indicator: dot,
    badge: item.is_custom ? "Custom" : undefined,
  };
}

export default function AddFoodModal({
  open,
  onClose,
  logDate,
  initialMealSlot,
  prefilledQuery = "",
  onAdd,
}: AddFoodModalProps) {
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [mealSlot, setMealSlot] = useState<MealSlot>(initialMealSlot);
  const [quantity, setQuantity] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Sync meal slot when opened from different tabs
  React.useEffect(() => {
    if (open) setMealSlot(initialMealSlot);
  }, [open, initialMealSlot]);

  function handleClose() {
    setSelected(null);
    setQuantity("");
    onClose();
  }

  function handleSelectFood(item: FoodItem) {
    setSelected(item);
    setQuantity(String(item.serving_size_g > 0 ? item.serving_size_g : 100));
  }

  const handleSearch = useCallback(searchFoods, []);

  async function handleAdd() {
    if (!selected || !quantity || Number(quantity) <= 0) return;
    setSaving(true);
    try {
      await onAdd({
        food_item_id: selected.id,
        log_date: logDate,
        meal_type: mealSlot,
        quantity_g: Number(quantity),
      });
      handleClose();
    } finally {
      setSaving(false);
    }
  }

  // Live nutrition preview
  const qty = Number(quantity);
  const servingSize = selected?.serving_size_g || 100;
  const ratio = qty > 0 && servingSize > 0 ? qty / servingSize : 0;
  const preview = selected && ratio > 0 ? {
    kcal:    Math.round(selected.calories_kcal * ratio),
    protein: (selected.protein_g * ratio).toFixed(1),
    carbs:   (selected.carbs_g   * ratio).toFixed(1),
    fat:     (selected.fat_g     * ratio).toFixed(1),
  } : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Add to ${MEAL_OPTIONS.find(o => o.value === mealSlot)?.label ?? "Meal"}`}
    >
      <div className="space-y-4">

        {/* Food search */}
        <SearchCommand<FoodItem>
          placeholder="Search food items…"
          initialQuery={prefilledQuery}
          onSearch={handleSearch}
          renderItem={renderFoodItem}
          onSelect={handleSelectFood}
          emptyText="No foods found."
        />

        {/* Empty state — shown on desktop before any food is selected */}
        {!selected && (
          <div className="hidden lg:flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-[#1A1A1A] flex items-center justify-center">
              <span className="text-3xl" aria-hidden="true">🔍</span>
            </div>
            <p className="text-sm font-medium text-foreground">Search for a food above</p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Type at least 2 characters to search from our food database. Try "paneer", "roti", or "rice".
            </p>
          </div>
        )}

        {/* Selected food pill */}
        {selected && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <span className="text-xs font-semibold text-primary flex-1 truncate">
              {selected.name}
            </span>
            <button
              onClick={() => { setSelected(null); setQuantity(""); }}
              aria-label="Remove selected food"
              className="text-primary/50 hover:text-primary shrink-0"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Meal selector + quantity */}
        {selected && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Meal</label>
                <select
                  value={mealSlot}
                  onChange={(e) => setMealSlot(e.target.value as MealSlot)}
                  className="w-full h-10 rounded-lg bg-[#222222] border border-[#2A2A2A] text-foreground text-sm px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                >
                  {MEAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Quantity (g)</label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="bg-[#222222] border-[#2A2A2A] focus:border-primary focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Nutrition preview */}
            {preview && (
              <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-center">
                {[
                  { label: "Calories", value: `${preview.kcal}`, unit: "kcal" },
                  { label: "Protein",  value: preview.protein,    unit: "g"    },
                  { label: "Carbs",    value: preview.carbs,      unit: "g"    },
                  { label: "Fat",      value: preview.fat,        unit: "g"    },
                ].map(({ label, value, unit }) => (
                  <div key={label}>
                    <p className="text-[9px] text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold text-white mt-0.5">{value}</p>
                    <p className="text-[9px] text-muted-foreground/50">{unit}</p>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleAdd}
              disabled={saving || !quantity || Number(quantity) <= 0}
              className={cn(
                "w-full h-11 bg-primary text-black font-semibold rounded-xl",
                "hover:bg-green-400 active:scale-[0.98] transition-all",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              {saving ? "Adding…" : `Add to ${MEAL_OPTIONS.find(o => o.value === mealSlot)?.label}`}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
