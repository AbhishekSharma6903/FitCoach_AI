"use client";

import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { buildWeekGrid } from "@/lib/progressUtils";
import type { WorkoutLogEntry } from "@/types/workout";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

interface ConsistencyStripProps {
  entries: WorkoutLogEntry[];
}

export default function ConsistencyStrip({ entries }: ConsistencyStripProps) {
  const weeks = buildWeekGrid(entries, 4);

  return (
    <Card padding="md" className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Weekly Consistency
      </p>

      {/* Day-of-week header */}
      <div className="grid grid-cols-[48px_1fr] items-center gap-2">
        <span />
        <div className="grid grid-cols-7 gap-1">
          {DAY_LABELS.map((d, i) => (
            <span
              key={i}
              className="text-[10px] text-muted-foreground/60 text-center font-medium"
              aria-hidden="true"
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Week rows */}
      <div className="space-y-2">
        {weeks.map(week => (
          <div key={week.weekLabel} className="grid grid-cols-[48px_1fr] items-center gap-2">
            {/* Week label */}
            <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
              {week.weekLabel}
            </span>

            {/* Day dots */}
            <div className="grid grid-cols-7 gap-1">
              {week.days.map(day => (
                <div key={day.date} className="flex items-center justify-center">
                  <div
                    aria-label={`${day.label} ${day.date}${day.hasWorkout ? " — worked out" : ""}`}
                    className={cn(
                      "w-6 h-6 rounded-full transition-colors",
                      day.hasWorkout
                        ? "bg-primary"
                        : "border border-[#2A2A2A]",
                      day.isToday && !day.hasWorkout && "ring-1 ring-primary/50",
                      day.isToday && day.hasWorkout  && "ring-2 ring-primary/40 ring-offset-1 ring-offset-[#111111]",
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-[10px] text-muted-foreground">Workout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-[#2A2A2A]" />
          <span className="text-[10px] text-muted-foreground">Rest</span>
        </div>
      </div>
    </Card>
  );
}

export function ConsistencyStripSkeleton() {
  return <Skeleton className="h-[188px] rounded-2xl" />;
}
