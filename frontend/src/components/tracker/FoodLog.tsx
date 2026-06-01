"use client";
import FoodLogEntryRow from "./FoodLogEntry";
import type { FoodLogEntry } from "@/types/nutrition";

interface Props {
  entries: FoodLogEntry[];
  onDelete: (id: number) => void;
}

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];

export default function FoodLog({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-gray-600">
        <p className="text-sm">No food logged today</p>
        <p className="text-xs mt-1 text-gray-700">Search and add your meals above</p>
      </div>
    );
  }

  const grouped = MEAL_ORDER.reduce<Record<string, FoodLogEntry[]>>((acc, meal) => {
    const items = entries.filter((e) => e.meal_type === meal);
    if (items.length > 0) acc[meal] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([meal, items]) => (
        <div key={meal}>
          <h3 className="text-xs font-semibold uppercase text-gray-600 tracking-wide mb-1 capitalize">{meal}</h3>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 px-4">
            {items.map((entry) => (
              <FoodLogEntryRow key={entry.id} entry={entry} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
