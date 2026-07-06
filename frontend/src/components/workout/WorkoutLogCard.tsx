"use client";

import { AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Card from "@/components/ui/Card";
import WorkoutLogRow from "./WorkoutLogRow";
import { cn } from "@/lib/utils";
import {
  getCategoryStyle,
  isStrengthCategory,
  stripIntensityPrefix,
  calcVolume,
  formatVolume,
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
  const muscleGroup = entries[0] ? null : null; // muscle_group not in WorkoutLogEntry; use category only

  // Aggregate stats
  const totalKcal = entries.reduce((s, e) => s + (e.calories_burned ?? 0), 0);
  const setsWithData = entries.filter(e => e.sets && e.sets > 0);
  const totalSets = setsWithData.length;
  const totalReps = entries.reduce((s, e) => s + (e.reps ?? 0), 0);
  const totalVolume = calcVolume(entries);

  // Volume label — only show sets/reps when they have real data
  const volumeLabel = isStrength
    ? totalSets > 0
      ? `${totalSets} sets · ${totalReps} reps${totalVolume > 0 ? ` · ${formatVolume(totalVolume)}` : ""}`
      : entries[0]?.duration_min ? `${entries[0].duration_min} min` : "—"
    : entries[0]?.duration_min ? `${entries[0].duration_min} min` : "—";

  // Note from first entry (strip intensity prefix)
  const rawNote = entries[0]?.notes ?? null;
  const strippedNote = stripIntensityPrefix(rawNote);

  return (
    <Card padding="md" className="space-y-3">
      {/* Header — two rows, no overflow at 375px */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Category initial square — Phase 6: replace with <img> */}
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm",
            style.bg, style.text,
          )}>
            {exerciseName[0]?.toUpperCase() ?? "?"}
          </div>
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
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Stats row — Volume | Calories */}
      <div className="grid grid-cols-2 gap-3 py-2 border-t border-[#2A2A2A]">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
            {isStrength ? "Volume" : "Duration"}
          </p>
          <p className="text-sm font-bold text-white">{volumeLabel}</p>
          {isStrength && totalVolume > 0 && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">sets × reps × kg</p>
          )}
          {isStrength && totalVolume === 0 && totalReps > 0 && (
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">bodyweight</p>
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

      {/* Sets table (strength only) */}
      {isStrength && entries.length > 0 && (
        <div className="border-t border-[#2A2A2A] pt-1 space-y-0">
          <AnimatePresence initial={false}>
            {entries.map((entry, i) => (
              <WorkoutLogRow
                key={entry.id}
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
