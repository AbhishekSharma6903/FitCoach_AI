"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useProfile } from "@/hooks/useProfile";
import FoodSearchBar from "@/components/tracker/FoodSearchBar";
import AddFoodModal from "@/components/tracker/AddFoodModal";
import FoodLog from "@/components/tracker/FoodLog";
import NutritionTotals from "@/components/tracker/NutritionTotals";
import Spinner from "@/components/ui/Spinner";
import type { FoodItem } from "@/types/nutrition";

export default function TrackerPage() {
  const { log, isLoading, addEntry, deleteEntry } = useFoodLog();
  const { profile } = useProfile();
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const dietFilter = profile?.diet_type;

  if (isLoading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <Spinner className="w-8 h-8" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-300 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-100">Food Log</h1>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        <FoodSearchBar onSelect={setSelectedFood} dietFilter={dietFilter} />

        {log && <NutritionTotals totals={log.totals} targets={log.targets} />}

        {log && <FoodLog entries={log.entries} onDelete={deleteEntry} />}

        <AddFoodModal
          item={selectedFood}
          onClose={() => setSelectedFood(null)}
          onAdd={addEntry}
        />
      </div>
    </div>
  );
}
