"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import type { FoodItem } from "@/types/nutrition";

interface Props {
  item: FoodItem | null;
  logDate: string;  // YYYY-MM-DD — date to log the entry against
  onClose: () => void;
  onAdd: (payload: { food_item_id: number; log_date: string; meal_type: string; quantity_g: number }) => Promise<void>;
}

const MEAL_OPTIONS = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

export default function AddFoodModal({ item, logDate, onClose, onAdd }: Props) {
  const [mealType, setMealType] = useState("lunch");
  const [quantity, setQuantity] = useState<number | "">(item?.serving_size_g ?? 100);
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const ratio = quantity !== "" ? Number(quantity) / item.serving_size_g : 0;
  const preview = {
    calories: Math.round(item.calories_kcal * ratio),
    protein: (item.protein_g * ratio).toFixed(1),
    carbs: (item.carbs_g * ratio).toFixed(1),
    fat: (item.fat_g * ratio).toFixed(1),
  };

  async function handleAdd() {
    if (!quantity || Number(quantity) <= 0) return;
    setLoading(true);
    try {
      await onAdd({
        food_item_id: item!.id,
        log_date: logDate,
        meal_type: mealType,
        quantity_g: Number(quantity),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={!!item} onClose={onClose} title={item.name}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? "bg-brand-500" : item.is_egg ? "bg-yellow-400" : "bg-red-500"}`} />
          <span className="text-xs text-gray-500">{item.category} · {item.region}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Meal</label>
            <Select options={MEAL_OPTIONS} value={mealType} onChange={(e) => setMealType(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Quantity (g)</label>
            <input
              type="number" min={1}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-gray-100 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Calories", value: `${preview.calories} kcal` },
            { label: "Protein", value: `${preview.protein}g` },
            { label: "Carbs", value: `${preview.carbs}g` },
            { label: "Fat", value: `${preview.fat}g` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-semibold text-gray-100 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        <Button onClick={handleAdd} disabled={loading || !quantity} className="w-full">
          {loading ? "Adding..." : "Add to log"}
        </Button>
      </div>
    </Modal>
  );
}
