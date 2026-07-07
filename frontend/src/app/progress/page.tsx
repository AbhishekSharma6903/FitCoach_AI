"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Scale, Dumbbell, Flame, TrendingUp } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import WeightChart from "@/components/dashboard/WeightChart";
import { ProgressStatCard, ProgressStatCardSkeleton } from "@/components/progress/ProgressStatCard";
import WorkoutVolumeChart, { WorkoutVolumeChartSkeleton } from "@/components/progress/WorkoutVolumeChart";
import ConsistencyStrip, { ConsistencyStripSkeleton } from "@/components/progress/ConsistencyStrip";
import TopExercisesList, { TopExercisesListSkeleton } from "@/components/progress/TopExercisesList";
import { useWeightHistory } from "@/hooks/useWeightHistory";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { useProfile } from "@/hooks/useProfile";
import {
  weightEntriesToPoints,
  uniqueWorkoutDays,
} from "@/lib/progressUtils";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/lib/motionVariants";
import { cn } from "@/lib/utils";

type Range = 30 | 90;

function RangeToggle({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-[#111111] border border-[#2A2A2A] p-1">
      {([30, 90] as Range[]).map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            "h-8 px-4 rounded-lg text-xs font-semibold transition-colors",
            value === r
              ? "bg-[#1A1A1A] text-foreground border border-[#2A2A2A]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r}d
        </button>
      ))}
    </div>
  );
}

export default function ProgressPage() {
  const [range, setRange] = useState<Range>(30);

  const { history, isLoading: weightLoading } = useWeightHistory(range);
  const { entries, isLoading: workoutLoading } = useWorkoutHistory(range);
  const { profile } = useProfile();

  const isLoading = weightLoading || workoutLoading;

  const weightPoints = useMemo(
    () => weightEntriesToPoints(history?.entries ?? []),
    [history],
  );

  // Overview stat values
  const weightChangeStat = useMemo(() => {
    const c = history?.change_kg;
    if (c === null || c === undefined || (history?.entries?.length ?? 0) < 2) return { value: "—", color: undefined };
    if (c < 0) return { value: `−${Math.abs(c).toFixed(1)} kg`, color: "text-primary" };
    if (c > 0) return { value: `+${c.toFixed(1)} kg`, color: "text-amber-400" };
    return { value: "0 kg", color: undefined };
  }, [history]);

  const workoutDays = useMemo(() => uniqueWorkoutDays(entries), [entries]);

  const totalKcalBurned = useMemo(
    () => entries.reduce((s, e) => s + (e.calories_burned ?? 0), 0),
    [entries],
  );

  const isEmpty = weightPoints.length === 0 && entries.length === 0;

  return (
    <PageShell title="Progress">
      <div className="space-y-6 pt-2">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground lg:text-2xl hidden lg:block">
            Progress
          </h1>
          <RangeToggle value={range} onChange={setRange} />
        </div>

        {/* Empty state — no data at all */}
        {!isLoading && isEmpty && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center">
              <TrendingUp size={28} className="text-muted-foreground/30" aria-hidden="true" />
            </div>
            <div className="max-w-56">
              <p className="text-sm font-semibold text-foreground">Start tracking to see your progress</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Log workouts and your weight to unlock charts and insights here.
              </p>
            </div>
          </div>
        )}

        {/* Overview stat cards */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <ProgressStatCardSkeleton key={i} />)}
          </div>
        ) : !isEmpty ? (
          <motion.div
            className="grid grid-cols-3 gap-3"
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={STAGGER_ITEM}>
              <ProgressStatCard
                icon={<Scale size={14} aria-hidden="true" />}
                value={weightChangeStat.value}
                label="Weight"
                valueColor={weightChangeStat.color}
              />
            </motion.div>
            <motion.div variants={STAGGER_ITEM}>
              <ProgressStatCard
                icon={<Dumbbell size={14} aria-hidden="true" />}
                value={workoutDays === 0 ? "—" : String(workoutDays)}
                label="Workouts"
              />
            </motion.div>
            <motion.div variants={STAGGER_ITEM}>
              <ProgressStatCard
                icon={<Flame size={14} aria-hidden="true" />}
                value={totalKcalBurned === 0 ? "—" : Math.round(totalKcalBurned).toLocaleString()}
                label="kcal"
              />
            </motion.div>
          </motion.div>
        ) : null}

        {/* Weight trend chart */}
        {weightLoading ? (
          <WorkoutVolumeChartSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <WeightChart
              entries={weightPoints}
              goalWeightKg={profile?.goal_weight_kg ?? 70}
              timeToGoalWeeks={profile?.time_to_reach_goal_weeks ?? 20}
              variant="full"
            />
          </motion.div>
        )}

        {/* Workout volume chart */}
        {workoutLoading ? (
          <WorkoutVolumeChartSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <WorkoutVolumeChart entries={entries} />
          </motion.div>
        )}

        {/* Weekly consistency + Top exercises — side-by-side on desktop */}
        {!workoutLoading && entries.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <ConsistencyStrip entries={entries} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <TopExercisesList entries={entries} />
            </motion.div>
          </div>
        )}

        {workoutLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ConsistencyStripSkeleton />
            <TopExercisesListSkeleton />
          </div>
        )}

      </div>
    </PageShell>
  );
}
