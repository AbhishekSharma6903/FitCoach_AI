"use client";

import { AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Card from "@/components/ui/Card";
import WorkoutLogRow from "./WorkoutLogRow";
import ExerciseImage from "./ExerciseImage";
import MuscleMap, { parseMuscleIds } from "./MuscleMap";
import { cn } from "@/lib/utils";
import {
  getCategoryStyle,
  isStrengthCategory,
  stripIntensityPrefix,
  calcVolume,
} from "@/lib/workoutUtils";
import type { WorkoutLogEntry } from "@/types/workout";

interface WorkoutLogCardProps {
  exerciseName: string;
  entries: WorkoutLogEntry[];
  onDeleteEntry: (id: number, exerciseName: string) => Promise<void>;
  onUpdateEntry: (id: number, payload: { sets?: number; reps?: number; weight_kg?: number; duration_min?: number }) => Promise<void>;
  onDeleteAll: () => void;
}

export default function WorkoutLogCard({
  exerciseName,
  entries,
  onDeleteEntry,
  onUpdateEntry,
  onDeleteAll,
}: WorkoutLogCardProps) {
  const category = entries[0]?.category ?? "Strength";
  const style = getCategoryStyle(category);
  const isStrength = isStrengthCategory(category);
  // Phase 6: parse muscle IDs from first entry (same exercise across all sets)
  const primaryMuscleIds   = parseMuscleIds(entries[0]?.primary_muscle_ids);
  const secondaryMuscleIds = parseMuscleIds(entries[0]?.secondary_muscle_ids);

  // Each entry = 1 performed set.
  const totalKcal = entries.reduce((s, e) => s + (e.calories_burned ?? 0), 0);
  const setCount = entries.length;
  const totalReps = entries.reduce((s, e) => s + (e.reps ?? 0), 0);
  const totalVolume = calcVolume(entries); // reps × weight per set, summed

  // Volume summary: uniform sets get "3 sets × 10 reps @ 20 kg"
  // Mixed sets (different weights or reps) get "3 sets · 28 reps"
  const allWeights = entries.map(e => e.weight_kg ?? 0);
  const allReps    = entries.map(e => e.reps ?? 0);
  const uniformWeight = allWeights.every(w => w === allWeights[0]);
  const uniformReps   = allReps.every(r => r === allReps[0]);
  const isMixed = !uniformWeight || !uniformReps;

  const avgReps   = setCount > 0 ? Math.round(totalReps / setCount) : 0;
  const avgWeight = setCount > 0
    ? Math.round(allWeights.reduce((s, w) => s + w, 0) / setCount * 10) / 10
    : 0;

  const volumeLabel = isStrength && setCount > 0
    ? isMixed
      ? `${setCount} sets × ~${avgReps} reps${avgWeight > 0 ? ` @ ~${avgWeight} kg` : " (bodyweight)"}`
      : `${setCount} sets × ${allReps[0]} reps${allWeights[0] > 0 ? ` @ ${allWeights[0]} kg` : " (bodyweight)"}`
    : entries[0]?.duration_min ? `${entries[0].duration_min} min` : "—";

  // Note from first entry (strip intensity prefix)
  const rawNote = entries[0]?.notes ?? null;
  const strippedNote = stripIntensityPrefix(rawNote);

  return (
    <Card padding="md" className="space-y-3">
      {/* Header — two rows, no overflow at 375px */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Phase 6: exercise thumbnail (falls back to coloured initial) */}
          <ExerciseImage
            name={exerciseName}
            imageUrl={entries[0]?.image_url_thumb}
            category={category}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{exerciseName}</p>
            <p className="text-xs text-muted-foreground">{category}</p>
          </div>
        </div>
        {/* Badge + delete all */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={cn("text-[10px]", style.badge)}>
            {category}
          </Badge>
          <button
            onClick={onDeleteAll}
            aria-label={`Delete all ${exerciseName} entries`}
            className="text-muted-foreground/30 hover:text-red-400 transition-colors
                       flex h-6 w-6 items-center justify-center rounded"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 py-2 border-t border-[#2A2A2A]">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
            {isStrength ? "Volume" : "Duration"}
          </p>
          <p className="text-sm font-bold text-white">{volumeLabel}</p>
          {isStrength && totalVolume > 0 && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
              {Math.round(totalVolume)} kg total{isMixed ? " (avg)" : " lifted"}
            </p>
          )}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
            Calories
          </p>
          <p className="text-sm font-bold text-white">
            {totalKcal > 0 ? `${Math.round(totalKcal)} kcal` : "—"}
          </p>
        </div>
      </div>

      {/* Phase 6: muscle diagram — only when muscle data is available */}
      {(primaryMuscleIds.length > 0 || secondaryMuscleIds.length > 0) && (
        <div className="border-t border-[#2A2A2A] pt-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Muscles worked
          </p>
          <MuscleMap
            primaryIds={primaryMuscleIds}
            secondaryIds={secondaryMuscleIds}
          />
        </div>
      )}

      {/* Sets table (strength only) */}
      {isStrength && entries.length > 0 && (
        <div className="border-t border-[#2A2A2A] pt-1 space-y-0">
          <AnimatePresence initial={false}>
            {entries.map((entry, i) => (
              <WorkoutLogRow
                key={`${entry.id}-${entry.reps}-${entry.weight_kg}-${entry.calories_burned}`}
                entry={entry}
                index={i + 1}
                onDelete={onDeleteEntry}
                onUpdate={onUpdateEntry}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Note (italic, no emoji) — only when non-empty */}
      {strippedNote && (
        <p className="text-xs text-muted-foreground/70 italic border-t border-[#2A2A2A] pt-2">
          {strippedNote}
        </p>
      )}
    </Card>
  );
}
