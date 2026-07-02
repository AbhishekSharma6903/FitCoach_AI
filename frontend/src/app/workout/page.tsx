"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flame } from "lucide-react";
import { useWorkoutLog } from "@/hooks/useWorkoutLog";
import ExerciseSearchBar from "@/components/workout/ExerciseSearchBar";
import AddWorkoutModal from "@/components/workout/AddWorkoutModal";
import WorkoutLog from "@/components/workout/WorkoutLog";
import Spinner from "@/components/ui/Spinner";
import type { Exercise } from "@/types/workout";

const today = () => new Date().toISOString().split("T")[0];

export default function WorkoutPage() {
  const [selectedDate]   = useState<string>(today());
  const { workout, isLoading, addEntry, deleteEntry } = useWorkoutLog(selectedDate);
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);

  if (isLoading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <Spinner className="w-8 h-8" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-300 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-100">Workout</h1>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
        </div>

        {/* Calories burned banner */}
        {workout && workout.total_calories_burned > 0 && (
          <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <Flame size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-300">
                {Math.round(workout.total_calories_burned)}
                <span className="text-sm font-normal text-orange-500 ml-1">kcal burned today</span>
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <ExerciseSearchBar onSelect={setSelectedEx} />

        {/* Log */}
        {workout && (
          <WorkoutLog entries={workout.entries} onDelete={deleteEntry} />
        )}

        {/* Modal */}
        <AddWorkoutModal
          exercise={selectedEx}
          logDate={selectedDate}
          onClose={() => setSelectedEx(null)}
          onAdd={addEntry}
        />
      </div>
    </div>
  );
}
