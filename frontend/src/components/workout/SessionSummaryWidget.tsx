import { motion } from "motion/react";
import Card from "@/components/ui/Card";
import { calcCategoryBreakdown, isStrengthCategory } from "@/lib/workoutUtils";
import type { WorkoutLogEntry } from "@/types/workout";
import { cn } from "@/lib/utils";

interface SessionSummaryWidgetProps {
  entries: WorkoutLogEntry[];
  totalKcal: number;
}

export default function SessionSummaryWidget({ entries, totalKcal }: SessionSummaryWidgetProps) {
  if (entries.length === 0) return null;

  const exerciseCount = new Set(entries.map(e => e.exercise_name)).size;
  // Each entry = 1 set performed
  const strengthEntries = entries.filter(e => isStrengthCategory(e.category));
  const totalSets = strengthEntries.length;
  const totalReps = strengthEntries.reduce((s, e) => s + (e.reps ?? 0), 0);
  const breakdown = calcCategoryBreakdown(entries);

  return (
    <Card padding="md" className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Session Summary
      </p>

      {/* Primary stats */}
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

      {/* Sets summary — only when strength work logged */}
      {totalSets > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span><span className="text-foreground font-semibold">{totalSets}</span> sets</span>
          <span className="text-muted-foreground/30">·</span>
          <span><span className="text-foreground font-semibold">{totalReps}</span> reps</span>
        </div>
      )}

      {/* Category breakdown bars */}
      {breakdown.length > 0 && (
        <div className="space-y-2 border-t border-[#2A2A2A] pt-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Breakdown</p>
          {breakdown.map(({ category, kcal, pct, style }) => (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={cn("text-[10px] font-medium capitalize", style.text)}>{category}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {Math.round(kcal)} kcal · {pct}%
                </span>
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

