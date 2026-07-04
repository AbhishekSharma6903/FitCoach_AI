"use client";
import { Trash2, Dumbbell, Flame } from "lucide-react";
import type { WorkoutLogEntry } from "@/types/workout";

const CATEGORY_COLORS: Record<string, string> = {
  cardio: "text-red-400 bg-red-500/10",
  strength: "text-blue-400 bg-blue-500/10",
  yoga: "text-purple-400 bg-purple-500/10",
  stretching: "text-green-400 bg-green-500/10",
  plyometrics: "text-orange-400 bg-orange-500/10",
};

interface Props {
  entries: WorkoutLogEntry[];
  onDelete: (id: number) => void;
}

export default function WorkoutLog({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
          <Dumbbell size={28} className="text-gray-700" />
        </div>
        <p className="text-sm font-medium text-gray-400">No workouts logged</p>
        <p className="text-xs text-gray-600">Search an exercise above to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Workout Log</h3>
      </div>
      <div className="divide-y divide-gray-800">
        {entries.map((entry) => {
          const catClass = CATEGORY_COLORS[entry.category] ?? "text-gray-400 bg-gray-700/30";
          const details: string[] = [];
          if (entry.sets && entry.reps) details.push(`${entry.sets} × ${entry.reps} reps`);
          if (entry.weight_kg)          details.push(`${entry.weight_kg}kg`);
          if (entry.duration_min)       details.push(`${entry.duration_min} min`);

          return (
            <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/40 transition-colors group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${catClass}`}>
                <Dumbbell size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{entry.exercise_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {details.join(" · ")}
                  {entry.calories_burned != null && (
                    <span className="ml-1.5 text-orange-400 font-medium">
                      <Flame size={10} className="inline -mt-0.5 mr-0.5" />
                      {Math.round(entry.calories_burned)} kcal
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => onDelete(entry.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-800 transition-all"
                aria-label="Delete entry"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
