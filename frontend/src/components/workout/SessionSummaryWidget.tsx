import { motion } from "motion/react";
import Card from "@/components/ui/Card";
import { calcCategoryBreakdown, calcVolume, formatVolume, isStrengthCategory } from "@/lib/workoutUtils";
import type { WorkoutLogEntry } from "@/types/workout";
import { cn } from "@/lib/utils";

interface SessionSummaryWidgetProps {
  entries: WorkoutLogEntry[];
  totalKcal: number;
}

export default function SessionSummaryWidget({ entries, totalKcal }: SessionSummaryWidgetProps) {
  if (entries.length === 0) return null;

  const exerciseCount = new Set(entries.map(e => e.exercise_name)).size;
  const strengthEntries = entries.filter(e => isStrengthCategory(e.category));
  const totalVolume = calcVolume(strengthEntries);
  const breakdown = calcCategoryBreakdown(entries);

  const totalSets = entries.filter(e => e.sets).length;

  return (
    <Card padding="md" className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Session Summary
      </p>

      {/* Primary stats grid — AG-4 fills column width */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-2xl font-black text-white tabular-nums">
            {Math.round(totalKcal).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">kcal burned</p>
        </div>
        <div>
          <p className="text-2xl font-black text-white tabular-nums">{exerciseCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            exercise{exerciseCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Volume (strength only) */}
      {totalVolume > 0 && (
        <div className="text-xs text-muted-foreground">
          <span>{totalSets} sets</span>
          <span className="mx-1.5 text-muted-foreground/30">·</span>
          <span>{formatVolume(totalVolume)} lifted</span>
          <span className="ml-1 text-muted-foreground/40">(sets×reps×kg)</span>
        </div>
      )}

      {/* Category breakdown bars */}
      {breakdown.length > 0 && (
        <div className="space-y-2 border-t border-[#2A2A2A] pt-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Breakdown</p>
          {breakdown.map(({ category, kcal, pct, style }) => (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-medium", style.text)}>{category}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{pct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", style.bgSolid)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
