"use client";
import type { MacroTotals } from "@/types/nutrition";

interface Props {
  totals: MacroTotals;
  targets: MacroTotals;
}

const stats = [
  { key: "calories_kcal", label: "Calories", unit: "kcal" },
  { key: "protein_g", label: "Protein", unit: "g" },
  { key: "carbs_g", label: "Carbs", unit: "g" },
  { key: "fat_g", label: "Fat", unit: "g" },
  { key: "fiber_g", label: "Fiber", unit: "g" },
] as const;

export default function NutritionTotals({ totals, targets }: Props) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Today&apos;s Totals</h3>
      <div className="grid grid-cols-5 gap-2">
        {stats.map(({ key, label, unit }) => {
          const consumed = totals[key];
          const target = targets[key];
          const over = consumed > target;
          return (
            <div key={key} className="text-center">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-sm font-bold mt-0.5 ${over ? "text-red-400" : "text-gray-100"}`}>
                {key === "calories_kcal" ? Math.round(consumed) : consumed.toFixed(1)}
              </p>
              <p className="text-xs text-gray-700">
                / {key === "calories_kcal" ? Math.round(target) : target.toFixed(0)}{unit}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
