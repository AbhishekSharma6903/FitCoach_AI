"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Utensils, SlidersHorizontal } from "lucide-react";
import type { MacroTotals } from "@/types/nutrition";

interface Props {
  totals: MacroTotals;
  targets: MacroTotals;
  isEmpty?: boolean;
  onLogMeal?: () => void;
}

const stats = [
  { key: "calories_kcal", label: "Calories", unit: "kcal" },
  { key: "protein_g", label: "Protein", unit: "g" },
  { key: "carbs_g", label: "Carbs", unit: "g" },
  { key: "fat_g", label: "Fat", unit: "g" },
  { key: "fiber_g", label: "Fiber", unit: "g" },
] as const;

const mealSections = [
  { id: "breakfast", label: "Breakfast", icon: "🌅", targetCals: 600 },
  { id: "lunch", label: "Lunch", icon: "☀️", targetCals: 750 },
  { id: "dinner", label: "Dinner", icon: "🌙", targetCals: 700 },
  { id: "snacks", label: "Snacks", icon: "🥜", targetCals: 404 },
];

const quickAddFoods = [
  { name: "Dal Tadka", cals: 180, emoji: "🫘" },
  { name: "Roti", cals: 70, emoji: "🫓" },
  { name: "Paneer Bhurji", cals: 250, emoji: "🧀" },
  { name: "Rice (1 cup)", cals: 200, emoji: "🍚" },
  { name: "Curd", cals: 60, emoji: "🥛" },
  { name: "Sambar", cals: 90, emoji: "🍲" },
];

function getBarColor(key: string, over: boolean): string {
  if (over) return "bg-red-400";
  switch (key) {
    case "calories_kcal":
      return "bg-green-500";
    case "protein_g":
      return "bg-blue-500";
    case "carbs_g":
      return "bg-amber-400";
    case "fat_g":
      return "bg-orange-400";
    case "fiber_g":
      return "bg-emerald-400";
    default:
      return "bg-green-500";
  }
}

export default function NutritionTotals({ totals, targets, isEmpty = false, onLogMeal }: Props) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: true,
  });
  const [showSettingsTooltip, setShowSettingsTooltip] = useState(false);

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isZeroData = totals.calories_kcal === 0;

  // Use the unified calorie goal of 2454 kcal (single source of truth)
  const unifiedTargets: MacroTotals = {
    ...targets,
    calories_kcal: targets.calories_kcal > 0 ? targets.calories_kcal : 2454,
  };

  return (
    <div className="space-y-4">
      {/* Today's Totals Card */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Today&apos;s Totals
          </h3>
          <div className="relative">
            <button
              onMouseEnter={() => setShowSettingsTooltip(true)}
              onMouseLeave={() => setShowSettingsTooltip(false)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-800"
              aria-label="Log Settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Log Settings</span>
            </button>
            {showSettingsTooltip && (
              <div className="absolute right-0 top-full mt-1.5 z-10 bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                Adjust nutrition goals & targets
                <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-800 border-l border-t border-gray-700 rotate-45" />
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {stats.map(({ key, label, unit }) => {
            const consumed = totals[key];
            const target = unifiedTargets[key];
            const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
            const over = consumed > target;
            const isCalories = key === "calories_kcal";
            const barColor = getBarColor(key, over);

            return (
              <div key={key} className="flex flex-col items-center gap-1.5">
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p
                  className={`font-bold leading-none ${
                    isCalories ? "text-xl" : "text-lg"
                  } ${over ? "text-red-400" : "text-white"}`}
                >
                  {isCalories ? Math.round(consumed) : consumed.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 leading-none">
                  /{" "}
                  <span className="text-gray-600">
                    {isCalories ? Math.round(target) : target.toFixed(0)}
                    {unit}
                  </span>
                </p>
                {/* Color-coded progress bar */}
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-0.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {isZeroData && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 border-dashed p-8 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-4xl">🥗</span>
          </div>
          <div className="text-center">
            <p className="text-gray-100 font-semibold text-base">No meals logged yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Start tracking to hit your nutrition goals today
            </p>
          </div>
          <button
            onClick={onLogMeal}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log your first meal
          </button>
        </div>
      )}

      {/* Meal Sections */}
      <div className="space-y-2">
        {mealSections.map((meal) => {
          const isCollapsed = collapsedSections[meal.id];
          return (
            <div
              key={meal.id}
              className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
            >
              <button
                onClick={() => toggleSection(meal.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{meal.icon}</span>
                  <span className="text-sm font-semibold text-gray-200">{meal.label}</span>
                  <span className="text-xs text-gray-600 font-medium bg-gray-800 px-2 py-0.5 rounded-full">
                    0 kcal
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Goal: {meal.targetCals} kcal</span>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                  )}
                </div>
              </button>

              {!isCollapsed && (
                <div className="px-4 pb-3 border-t border-gray-800">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Utensils className="w-5 h-5 text-gray-700" />
                    <p className="text-xs text-gray-600">No foods logged for {meal.label}</p>
                    <button
                      onClick={onLogMeal}
                      className="flex items-center gap-1.5 text-green-500 hover:text-green-400 text-xs font-medium transition-colors mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add food
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Add Section */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Quick Add — Indian Favourites
          </h3>
          <button className="text-xs text-green-500 hover:text-green-400 font-medium transition-colors">
            See all
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {quickAddFoods.map((food) => (
            <button
              key={food.name}
              onClick={onLogMeal}
              className="flex flex-col items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-xl p-2.5 transition-all group"
            >
              <span className="text-xl">{food.emoji}</span>
              <span className="text-xs text-gray-300 font-medium text-center leading-tight">
                {food.name}
              </span>
              <span className="text-xs text-white font-semibold group-hover:text-green-400 transition-colors">
                {food.cals} kcal
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}