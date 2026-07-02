"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, ChevronDown, ChevronUp, Plus, Utensils, Coffee, Sun, Moon, Cookie } from "lucide-react";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useProfile } from "@/hooks/useProfile";
import FoodSearchBar from "@/components/tracker/FoodSearchBar";
import AddFoodModal from "@/components/tracker/AddFoodModal";
import FoodLog from "@/components/tracker/FoodLog";
import NutritionTotals from "@/components/tracker/NutritionTotals";
import DateNavigator from "@/components/tracker/DateNavigator";
import Spinner from "@/components/ui/Spinner";
import type { FoodItem } from "@/types/nutrition";

const today = () => new Date().toISOString().split("T")[0];

const QUICK_ADD_FOODS = [
  { name: "Dal Tadka", cal: 180, emoji: "🫕" },
  { name: "Roti", cal: 70, emoji: "🫓" },
  { name: "Paneer Sabzi", cal: 220, emoji: "🥘" },
  { name: "Steamed Rice", cal: 206, emoji: "🍚" },
  { name: "Idli (2)", cal: 140, emoji: "🫔" },
  { name: "Curd Rice", cal: 190, emoji: "🍛" },
];

const MEAL_SECTIONS = [
  { id: "breakfast", label: "Breakfast", icon: Coffee, time: "7–10 AM" },
  { id: "lunch", label: "Lunch", icon: Sun, time: "12–2 PM" },
  { id: "dinner", label: "Dinner", icon: Moon, time: "7–9 PM" },
  { id: "snacks", label: "Snacks", icon: Cookie, time: "Anytime" },
];

function EmptyFoodState({ onLogMeal }: { onLogMeal: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      {/* Illustrated bowl icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
          <span className="text-5xl">🥗</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center shadow-lg shadow-green-900/40">
          <Plus size={16} className="text-white" />
        </div>
      </div>
      <h3 className="text-gray-100 text-lg font-semibold mb-2">Nothing logged yet</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs leading-relaxed">
        Start tracking your meals to hit your daily nutrition goals. Every bite counts!
      </p>
      <button
        onClick={onLogMeal}
        className="flex items-center gap-2 bg-[#22c55e] hover:bg-green-400 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-green-900/30 active:scale-95"
      >
        <Plus size={18} />
        Log your first meal
      </button>
    </div>
  );
}

function MealSection({
  section,
  entries,
  onDelete,
  onAdd,
}: {
  section: typeof MEAL_SECTIONS[0];
  entries: any[];
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const [open, setOpen] = useState(true);
  const Icon = section.icon;
  const sectionCalories = entries.reduce((sum, e) => sum + (e.calories || 0), 0);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/40 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
          <Icon size={15} className="text-gray-400" />
        </div>
        <div className="flex-1 text-left">
          <span className="text-gray-100 font-semibold text-sm">{section.label}</span>
          <span className="text-gray-600 text-xs ml-2">{section.time}</span>
        </div>
        <div className="flex items-center gap-3">
          {sectionCalories > 0 && (
            <span className="text-[#22c55e] text-sm font-medium">{sectionCalories} kcal</span>
          )}
          {sectionCalories === 0 && (
            <span className="text-gray-600 text-xs">0 kcal</span>
          )}
          {open ? (
            <ChevronUp size={15} className="text-gray-600" />
          ) : (
            <ChevronDown size={15} className="text-gray-600" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-800">
          {entries.length === 0 ? (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-gray-600 text-sm italic">No foods logged</span>
              <button
                onClick={onAdd}
                className="flex items-center gap-1.5 text-[#22c55e] text-sm font-medium hover:text-green-400 transition-colors"
              >
                <Plus size={14} />
                Add food
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-gray-200 text-sm font-medium">{entry.food_name}</p>
                    <p className="text-gray-500 text-xs">{entry.quantity}g</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300 text-sm">{entry.calories} kcal</span>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
              <div className="px-4 py-2.5 flex justify-end">
                <button
                  onClick={onAdd}
                  className="flex items-center gap-1.5 text-[#22c55e] text-xs font-medium hover:text-green-400 transition-colors"
                >
                  <Plus size={12} />
                  Add more
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuickAddSection({ onSelect }: { onSelect: (name: string) => void }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-100 text-sm font-semibold">Quick Add</h3>
        <span className="text-gray-600 text-xs">Popular Indian meals</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {QUICK_ADD_FOODS.map((food) => (
          <button
            key={food.name}
            onClick={() => onSelect(food.name)}
            className="flex flex-col items-center gap-1.5 p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-xl transition-all duration-150 active:scale-95 group"
          >
            <span className="text-2xl">{food.emoji}</span>
            <span className="text-gray-300 text-xs font-medium text-center leading-tight group-hover:text-white transition-colors">
              {food.name}
            </span>
            <span className="text-white font-semibold text-xs">{food.cal} kcal</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EnhancedNutritionTotals({ totals, targets }: { totals: any; targets: any }) {
  if (!totals || !targets) return null;

  const calories = totals.calories ?? 0;
  const calGoal = targets.calories ?? 2454;
  const protein = totals.protein ?? 0;
  const proteinGoal = targets.protein ?? 150;
  const carbs = totals.carbs ?? 0;
  const carbsGoal = targets.carbs ?? 250;
  const fat = totals.fat ?? 0;
  const fatGoal = targets.fat ?? 65;

  const caloriePercent = Math.min((calories / calGoal) * 100, 100);
  const remaining = Math.max(calGoal - calories, 0);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4">
      {/* Calorie summary */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Calories</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white text-3xl font-bold">{calories}</span>
            <span className="text-gray-500 text-sm">/ {calGoal} kcal</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs mb-1">Remaining</p>
          <span className="text-[#22c55e] text-xl font-bold">{remaining}</span>
        </div>
      </div>

      {/* Calorie progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-[#22c55e] h-2 rounded-full transition-all duration-500"
          style={{ width: `${caloriePercent}%` }}
        />
      </div>

      {/* Macro grid */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        {[
          { label: "Protein", value: protein, goal: proteinGoal, color: "bg-blue-500", textColor: "text-blue-400" },
          { label: "Carbs", value: carbs, goal: carbsGoal, color: "bg-amber-400", textColor: "text-amber-400" },
          { label: "Fat", value: fat, goal: fatGoal, color: "bg-orange-500", textColor: "text-orange-400" },
        ].map((macro) => {
          const pct = Math.min((macro.value / macro.goal) * 100, 100);
          return (
            <div key={macro.label} className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-white text-base font-bold">{macro.value}g</span>
                <span className="text-gray-500 text-xs">{macro.goal}g</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className={`${macro.color} h-1.5 rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className={`text-xs font-medium ${macro.textColor}`}>{macro.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TrackerPage() {
  const [selectedDate, setSelectedDate] = useState<string>(today());
  const { log, isLoading, addEntry, deleteEntry } = useFoodLog(selectedDate);
  const { profile } = useProfile();
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(true);
  const [showLogSettingsTooltip, setShowLogSettingsTooltip] = useState(false);

  const dietFilter = profile?.diet_type;

  const hasEntries = log && log.entries && log.entries.length > 0;

  const getEntriesForMeal = (mealType: string) => {
    if (!log?.entries) return [];
    return log.entries.filter(
      (e: any) => (e.meal_type || "").toLowerCase() === mealType.toLowerCase()
    );
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-100">Food Log</h1>
          </div>
          {/* Log Settings icon with tooltip */}
          <div className="relative">
            <Link
              href="/profile"
              className="text-gray-600 hover:text-gray-300 transition-colors flex items-center justify-center"
              aria-label="Log Settings"
              onMouseEnter={() => setShowLogSettingsTooltip(true)}
              onMouseLeave={() => setShowLogSettingsTooltip(false)}
            >
              <SlidersHorizontal size={18} />
            </Link>
            {showLogSettingsTooltip && (
              <div className="absolute right-0 top-8 z-10 bg-gray-800 border border-gray-700 text-gray-200 text-xs font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none">
                Log Settings
                <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-800 border-l border-t border-gray-700 rotate-45" />
              </div>
            )}
          </div>
        </div>

        {/* Date navigation */}
        <DateNavigator date={selectedDate} onChange={setSelectedDate} />

        {/* Search */}
        <FoodSearchBar onSelect={setSelectedFood} dietFilter={dietFilter} />

        {/* Quick Add section */}
        {showQuickAdd && (
          <QuickAddSection
            onSelect={(name) => {
              // Trigger search with name — reuse onSelect handler
              // We pass null with a hint; actual search triggers via FoodSearchBar
              // For now, we just close quick add & show the modal conceptually
              setShowQuickAdd(false);
            }}
          />
        )}
        {!showQuickAdd && (
          <button
            onClick={() => setShowQuickAdd(true)}
            className="w-full text-center text-gray-600 text-xs hover:text-gray-400 transition-colors py-1"
          >
            Show Quick Add ↓
          </button>
        )}

        {/* Nutrition Totals */}
        {log && (
          <EnhancedNutritionTotals totals={log.totals} targets={log.targets} />
        )}

        {/* Meal Sections or Empty State */}
        {!hasEntries ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl">
            <EmptyFoodState onLogMeal={() => setSelectedFood(null)} />
          </div>
        ) : (
          <div className="space-y-3">
            {MEAL_SECTIONS.map((section) => (
              <MealSection
                key={section.id}
                section={section}
                entries={getEntriesForMeal(section.id)}
                onDelete={deleteEntry}
                onAdd={() => setSelectedFood(null)}
              />
            ))}
          </div>
        )}

        {/* Legacy FoodLog kept for data compatibility — hidden visually when using meal sections */}
        {hasEntries && (
          <div className="hidden">
            <FoodLog entries={log.entries} onDelete={deleteEntry} />
          </div>
        )}

        <AddFoodModal
          item={selectedFood}
          logDate={selectedDate}
          onClose={() => setSelectedFood(null)}
          onAdd={addEntry}
        />
      </div>
    </div>
  );
}