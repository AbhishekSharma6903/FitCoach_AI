"use client";
import { Trash2 } from "lucide-react";
import type { FoodLogEntry } from "@/types/nutrition";
import { cn } from "@/lib/utils";

const MEAL_COLORS: Record<string, string> = {
  breakfast: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  lunch:     "bg-brand-500/10 text-brand-400 border border-brand-500/20",
  dinner:    "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  snack:     "bg-orange-500/10 text-orange-400 border border-orange-500/20",
};

interface Props {
  entry: FoodLogEntry;
  onDelete: (id: number) => void;
}

export default function FoodLogEntryRow({ entry, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0 gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-200 truncate">{entry.food_name}</p>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", MEAL_COLORS[entry.meal_type])}>
            {entry.meal_type}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-0.5">
          {entry.quantity_g}g · P:{entry.protein_g.toFixed(1)}g C:{entry.carbs_g.toFixed(1)}g F:{entry.fat_g.toFixed(1)}g
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-300">{Math.round(entry.calories_kcal)} kcal</span>
        <button onClick={() => onDelete(entry.id)} className="text-gray-700 hover:text-red-400 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
