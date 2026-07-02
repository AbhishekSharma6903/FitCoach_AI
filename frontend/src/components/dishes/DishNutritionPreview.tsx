"use client";
import type { DishIngredientInput } from "@/types/dish";

interface Props {
  ingredients: DishIngredientInput[];
  totalWeight: number;
}

interface MacroBar {
  label: string;
  value: number;
  unit: string;
  color: string;
  trackColor: string;
  pct: number;
}

export default function DishNutritionPreview({ ingredients, totalWeight }: Props) {
  // Always render the container — show skeleton/empty state when no ingredients
  const hasData = ingredients.length > 0 && totalWeight > 0;

  let totalCal = 0, totalProt = 0, totalCarb = 0, totalFat = 0, totalFiber = 0;
  if (hasData) {
    for (const ing of ingredients) {
      const ratio = ing.quantity_g / ing.serving_size_g;
      totalCal   += ing.calories_kcal * ratio;
      totalProt  += ing.protein_g     * ratio;
      totalCarb  += ing.carbs_g       * ratio;
      totalFat   += ing.fat_g         * ratio;
      totalFiber += ing.fiber_g       * ratio;
    }
  }

  const scale = hasData ? 100 / totalWeight : 0;

  const macros: MacroBar[] = [
    { label: "Protein", value: totalProt, unit: "g", color: "bg-blue-500",   trackColor: "bg-blue-500/20",   pct: hasData ? (totalProt * 4 / (totalCal || 1)) * 100 : 0 },
    { label: "Carbs",   value: totalCarb, unit: "g", color: "bg-amber-400",  trackColor: "bg-amber-400/20",  pct: hasData ? (totalCarb * 4 / (totalCal || 1)) * 100 : 0 },
    { label: "Fat",     value: totalFat,  unit: "g", color: "bg-orange-400", trackColor: "bg-orange-400/20", pct: hasData ? (totalFat  * 9 / (totalCal || 1)) * 100 : 0 },
  ];

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-800">
        <div className="flex items-baseline gap-3">
          {hasData ? (
            <>
              <span className="text-2xl font-bold text-white">{Math.round(totalCal)}</span>
              <span className="text-sm text-gray-500">kcal total</span>
              <span className="ml-auto text-xs text-gray-600">
                {(totalCal * scale).toFixed(0)} kcal / 100g · dish = {totalWeight.toFixed(0)}g
              </span>
            </>
          ) : (
            <>
              <div className="h-7 w-16 bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-800 rounded animate-pulse" />
              <div className="ml-auto h-3 w-32 bg-gray-800 rounded animate-pulse" />
            </>
          )}
        </div>

        {/* Macro summary pills */}
        {hasData && (
          <div className="flex gap-3 mt-2.5">
            <span className="flex items-center gap-1 text-xs text-blue-400">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
              Protein {totalProt.toFixed(1)}g
            </span>
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
              Carbs {totalCarb.toFixed(1)}g
            </span>
            <span className="flex items-center gap-1 text-xs text-orange-400">
              <span className="inline-block w-2 h-2 rounded-full bg-orange-400" />
              Fat {totalFat.toFixed(1)}g
            </span>
          </div>
        )}
      </div>

      {/* Macro bars */}
      <div className="px-4 py-3 space-y-3">
        {macros.map(({ label, value, unit, color, trackColor, pct }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1.5">
              {hasData ? (
                <>
                  <span className="text-gray-400 font-medium">{label}</span>
                  <span className="font-semibold text-gray-200">{value.toFixed(1)}{unit}</span>
                </>
              ) : (
                <>
                  <span className="text-gray-600">{label}</span>
                  <div className="h-3 w-10 bg-gray-800 rounded animate-pulse" />
                </>
              )}
            </div>
            {/* Track always visible */}
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              {hasData ? (
                <div
                  className={`h-full rounded-full ${color} transition-all duration-500`}
                  style={{ width: `${Math.min(pct, 100).toFixed(1)}%` }}
                />
              ) : (
                <div
                  className={`h-full rounded-full ${trackColor} transition-all duration-300`}
                  style={{ width: "0%" }}
                />
              )}
            </div>
          </div>
        ))}

        {hasData && totalFiber > 0.1 && (
          <div className="flex items-center justify-between pt-0.5 border-t border-gray-800/60">
            <span className="text-xs text-gray-500">Fiber</span>
            <span className="text-xs font-medium text-gray-400">{totalFiber.toFixed(1)}g</span>
          </div>
        )}

        {!hasData && (
          <p className="text-xs text-gray-600 pt-1 italic text-center py-2">
            Nutrition preview will appear as you add ingredients.
          </p>
        )}
      </div>

      {/* Explanation note */}
      <div className="px-4 pb-3 pt-0.5 border-t border-gray-800/50">
        <p className="text-xs text-gray-600">
          {hasData ? (
            <>
              <span className="text-gray-500 font-medium">Total</span> nutrients for the whole dish.
              {" "}Each ingredient contributes proportionally by weight.
            </>
          ) : (
            <>
              Add ingredients to see a{" "}
              <span className="text-gray-500 font-medium">live nutrition breakdown</span>{" "}
              for your dish.
            </>
          )}
        </p>
      </div>
    </div>
  );
}