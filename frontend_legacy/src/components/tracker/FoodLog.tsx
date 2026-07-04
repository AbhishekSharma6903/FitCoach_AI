"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, UtensilsCrossed, SlidersHorizontal } from "lucide-react";
import FoodLogEntryRow from "./FoodLogEntry";
import type { FoodLogEntry } from "@/types/nutrition";

interface Props {
  entries: FoodLogEntry[];
  onDelete: (id: number) => void;
}

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

const MEAL_ICONS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

// Shared calorie goal — single source of truth matching dashboard
export const DAILY_CALORIE_GOAL = 2454;

function MacroBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function MealSection({
  meal,
  items,
  onDelete,
}: {
  meal: string;
  items: FoodLogEntry[];
  onDelete: (id: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const subtotal = items.reduce((sum, e) => sum + (e.calories_kcal ?? 0), 0);
  const protein = items.reduce((sum, e) => sum + (e.protein_g ?? 0), 0);
  const carbs = items.reduce((sum, e) => sum + (e.carbs_g ?? 0), 0);
  const fat = items.reduce((sum, e) => sum + (e.fat_g ?? 0), 0);
  const isEmpty = items.length === 0;

  // Rough per-meal macro targets (based on 4 meals from daily goals)
  const proteinTarget = 50;
  const carbsTarget = 75;
  const fatTarget = 20;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Section Header */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{MEAL_ICONS[meal]}</span>
          <span className="text-sm font-semibold text-gray-200 tracking-wide">
            {MEAL_LABELS[meal] ?? meal}
          </span>
          {isEmpty && (
            <span className="text-xs text-gray-600 font-normal ml-1">— empty</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {subtotal > 0 && (
            <span className="text-sm font-bold text-white">
              {subtotal}{" "}
              <span className="text-xs text-gray-500 font-normal">kcal</span>
            </span>
          )}
          {isEmpty && (
            <span className="text-xs text-gray-600">0 kcal</span>
          )}
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* Macro mini-bars — shown when not empty and not collapsed or even collapsed */}
      {!isEmpty && (
        <div className="px-4 pb-3 grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-blue-400 font-medium">Protein</span>
              <span className="text-[10px] text-gray-500">{Math.round(protein)}g</span>
            </div>
            <MacroBar value={protein} max={proteinTarget} color="bg-blue-500" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-400 font-medium">Carbs</span>
              <span className="text-[10px] text-gray-500">{Math.round(carbs)}g</span>
            </div>
            <MacroBar value={carbs} max={carbsTarget} color="bg-amber-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-orange-400 font-medium">Fat</span>
              <span className="text-[10px] text-gray-500">{Math.round(fat)}g</span>
            </div>
            <MacroBar value={fat} max={fatTarget} color="bg-orange-400" />
          </div>
        </div>
      )}

      {/* Section Body */}
      {!collapsed && (
        <div className="border-t border-gray-800">
          {isEmpty ? (
            <div className="px-4 py-3 text-xs text-gray-600 italic">
              Nothing logged yet for {MEAL_LABELS[meal]?.toLowerCase() ?? meal}
            </div>
          ) : (
            <div className="px-4">
              {items.map((entry) => (
                <FoodLogEntryRow key={entry.id} entry={entry} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FoodLog({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
        {/* Illustrated icon */}
        <div className="w-20 h-20 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-5">
          <UtensilsCrossed className="w-9 h-9 text-gray-600" />
        </div>

        <h3 className="text-white font-semibold text-base mb-1">
          Nothing logged today
        </h3>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">
          Start tracking your meals to see calories, macros, and progress toward your{" "}
          <span className="text-white font-semibold">{DAILY_CALORIE_GOAL.toLocaleString()} kcal</span>{" "}
          daily goal.
        </p>

        <button
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-green-500/20"
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>(
              'input[placeholder*="Search"]'
            );
            input?.focus();
          }}
        >
          <span className="text-base leading-none">+</span>
          Log your first meal
        </button>

        {/* Empty meal sections below CTA */}
        <div className="w-full mt-8 space-y-3">
          {MEAL_ORDER.map((meal) => (
            <MealSection key={meal} meal={meal} items={[]} onDelete={onDelete} />
          ))}
        </div>
      </div>
    );
  }

  const grouped = MEAL_ORDER.reduce<Record<string, FoodLogEntry[]>>((acc, meal) => {
    acc[meal] = entries.filter((e) => e.meal_type === meal);
    return acc;
  }, {});

  const totalCalories = entries.reduce((sum, e) => sum + (e.calories_kcal ?? 0), 0);
  const totalProtein = entries.reduce((sum, e) => sum + (e.protein_g ?? 0), 0);
  const totalCarbs = entries.reduce((sum, e) => sum + (e.carbs_g ?? 0), 0);
  const totalFat = entries.reduce((sum, e) => sum + (e.fat_g ?? 0), 0);

  const caloriesPct = Math.min((totalCalories / DAILY_CALORIE_GOAL) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Daily Summary Bar */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-200">Today's Summary</span>
          </div>
          <div className="relative group">
            <button
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-800"
              aria-label="Log Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Log Settings</span>
            </button>
            {/* Tooltip for mobile */}
            <div className="absolute right-0 top-full mt-1.5 px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none sm:hidden z-10">
              Log Settings
            </div>
          </div>
        </div>

        {/* Calorie progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Calories</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-white">{totalCalories.toLocaleString()}</span>
              <span className="text-xs text-gray-500">/ {DAILY_CALORIE_GOAL.toLocaleString()} kcal</span>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                caloriesPct >= 100 ? "bg-red-500" : "bg-green-500"
              }`}
              style={{ width: `${caloriesPct}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-gray-600">{Math.round(caloriesPct)}% of goal</span>
            <span className="text-[10px] text-gray-600">
              {Math.max(DAILY_CALORIE_GOAL - totalCalories, 0).toLocaleString()} kcal remaining
            </span>
          </div>
        </div>

        {/* Macro bars */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {/* Protein — blue */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-blue-400 font-semibold">Protein</span>
              <span className="text-[11px] text-white font-semibold">{Math.round(totalProtein)}g</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalProtein / 200) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-600">Goal: 200g</span>
          </div>

          {/* Carbs — amber */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-400 font-semibold">Carbs</span>
              <span className="text-[11px] text-white font-semibold">{Math.round(totalCarbs)}g</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalCarbs / 300) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-600">Goal: 300g</span>
          </div>

          {/* Fat — orange */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-orange-400 font-semibold">Fat</span>
              <span className="text-[11px] text-white font-semibold">{Math.round(totalFat)}g</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalFat / 80) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-600">Goal: 80g</span>
          </div>
        </div>
      </div>

      {/* Meal Sections */}
      <div className="space-y-3">
        {MEAL_ORDER.map((meal) => (
          <MealSection
            key={meal}
            meal={meal}
            items={grouped[meal] ?? []}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}