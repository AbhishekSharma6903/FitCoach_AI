"use client";

import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ExerciseImage from "@/components/workout/ExerciseImage";
import { topExercises } from "@/lib/progressUtils";
import type { WorkoutLogEntry } from "@/types/workout";

interface TopExercisesListProps {
  entries: WorkoutLogEntry[];
}

export default function TopExercisesList({ entries }: TopExercisesListProps) {
  const top = topExercises(entries, 5);

  if (top.length === 0) return null;

  return (
    <Card padding="md" className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Top Exercises
      </p>

      <div className="space-y-2">
        {top.map((ex, i) => (
          <div
            key={ex.exercise_name}
            className="flex items-center gap-3 py-1"
          >
            {/* Rank number */}
            <span className="text-[11px] text-muted-foreground/50 w-4 text-right shrink-0 tabular-nums">
              {i + 1}
            </span>

            {/* Thumbnail */}
            <ExerciseImage
              name={ex.exercise_name}
              imageUrl={ex.image_url_thumb}
              category={ex.category}
              size="sm"
            />

            {/* Name + category */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {ex.exercise_name}
              </p>
              <p className="text-[10px] text-muted-foreground">{ex.category}</p>
            </div>

            {/* Session count */}
            <Badge
              variant="outline"
              className="text-[10px] text-muted-foreground border-[#2A2A2A] shrink-0"
            >
              {ex.count} set{ex.count !== 1 ? "s" : ""}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TopExercisesListSkeleton() {
  return (
    <Card padding="md" className="space-y-3">
      <Skeleton className="h-3 w-28 rounded" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-11 rounded-xl" />
      ))}
    </Card>
  );
}
