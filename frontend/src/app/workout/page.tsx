"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Dumbbell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/lib/motionVariants";
import { toast } from "sonner";
import PageShell from "@/components/layout/PageShell";
import DateNavigator from "@/components/tracker/DateNavigator";
import CaloriesBurnedBanner from "@/components/workout/CaloriesBurnedBanner";
import WorkoutLogCard from "@/components/workout/WorkoutLogCard";
import AddWorkoutModal from "@/components/workout/AddWorkoutModal";
import SessionSummaryWidget from "@/components/workout/SessionSummaryWidget";
import { useWorkoutLog } from "@/hooks/useWorkoutLog";
import { useProfile } from "@/hooks/useProfile";
import { useTrackerStore } from "@/store/useTrackerStore";
import { groupEntriesByExercise, getCategoryStyle } from "@/lib/workoutUtils";

export default function WorkoutPage() {
  const { selectedDate } = useTrackerStore();
  const { workout, isLoading, addEntry, updateEntry, deleteEntry } = useWorkoutLog(selectedDate);
  const { profile } = useProfile();
  const [modalOpen, setModalOpen] = useState(false);

  const currentWeightKg = typeof profile?.current_weight_kg === "number"
    ? profile.current_weight_kg
    : 75;
  const entries = workout?.entries ?? [];
  const grouped = groupEntriesByExercise(entries);

  async function handleDeleteAll(exerciseName: string) {
    const toDelete = entries.filter(e => e.exercise_name === exerciseName);
    for (const e of toDelete) {
      await deleteEntry(e.id);
    }
    toast(`${exerciseName} removed`);
  }

  if (isLoading) {
    return (
      <PageShell title="Workout">
        <div className="space-y-4 pt-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  /* ── Left column ──────────────────────────────────────────────────── */
  const leftColumn = (
    <div className="flex flex-col gap-5">
      <CaloriesBurnedBanner totalKcal={workout?.total_calories_burned ?? 0} />

      {/* Log Exercise CTA — above the log (AG-3 fix) */}
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center justify-center gap-2 w-full lg:w-auto lg:px-6
                   h-11 rounded-xl bg-primary text-black font-semibold text-sm
                   hover:bg-green-400 active:scale-[0.98] transition-all shrink-0"
      >
        <Plus size={15} aria-hidden="true" />
        Log Exercise
      </button>

      {entries.length === 0 ? (
        /* Empty state — vertically centred in remaining space */
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center px-4 py-12">
          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center">
            <Dumbbell size={28} className="text-muted-foreground/30" aria-hidden="true" />
          </div>
          <div className="max-w-55">
            <p className="text-sm font-semibold text-foreground">Start your workout</p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Log exercises to track calories burned, volume, and progress over time.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Workout Log
          </p>
          <motion.div
            className="space-y-4"
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="show"
          >
            <AnimatePresence initial={false}>
              {Array.from(grouped.entries()).map(([name, exEntries]) => (
                <motion.div key={name} variants={STAGGER_ITEM}>
                  <WorkoutLogCard
                    exerciseName={name}
                    entries={exEntries}
                    onDeleteEntry={deleteEntry}
                    onUpdateEntry={updateEntry}
                    onDeleteAll={() => handleDeleteAll(name)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );

  /* ── Right column (desktop xl:) ──────────────────────────────────── */
  const QUICK_EXERCISES = [
    { name: "Push Up",      category: "Strength" },
    { name: "Running",      category: "Cardio"   },
    { name: "Squats",       category: "Strength" },
    { name: "Plank",        category: "Strength" },
    { name: "Cycling",      category: "Cardio"   },
    { name: "Yoga Flow",    category: "Yoga"     },
  ];

  const rightColumn = (
    <div className="hidden xl:flex xl:flex-col gap-4 sticky top-20">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
          Add Exercise
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="w-full h-10 rounded-xl bg-[#111111] border border-[#2A2A2A]
                     text-sm text-muted-foreground text-left px-3
                     hover:bg-[#1A1A1A] transition-colors flex items-center gap-2"
        >
          <Plus size={14} className="shrink-0" aria-hidden="true" />
          Search exercises…
        </button>
      </div>

      {/* Quick suggestions when no entries */}
      {entries.length === 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Popular
          </p>
          <div className="space-y-1.5">
            {QUICK_EXERCISES.map(({ name, category }) => {
              const s = getCategoryStyle(category);
              return (
                <button
                  key={name}
                  onClick={() => setModalOpen(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                             bg-[#111111] border border-[#2A2A2A]
                             hover:bg-[#1A1A1A] transition-colors text-left"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-xs ${s.bg} ${s.text}`}>
                    {name[0]}
                  </div>
                  <span className="text-xs font-medium text-foreground truncate">{name}</span>
                  <span className={`text-[10px] ml-auto shrink-0 ${s.text}`}>{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <SessionSummaryWidget
        entries={entries}
        totalKcal={workout?.total_calories_burned ?? 0}
      />

      {/* License attribution — required by CC-BY-SA 4.0 */}
      <p className="text-[10px] text-muted-foreground/30 text-center pt-1">
        Exercise images ©{" "}
        <a
          href="https://wger.de"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-muted-foreground/60 transition-colors"
        >
          wger.de
        </a>
        {" "}(CC-BY-SA 4.0)
      </p>
    </div>
  );

  return (
    <PageShell title="Workout">
      <div className="space-y-5 pt-2 pb-6">
        <DateNavigator />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
          {leftColumn}
          {rightColumn}
        </div>
      </div>

      <AddWorkoutModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        logDate={selectedDate}
        currentWeightKg={currentWeightKg}
        onAdd={addEntry}
      />

      <Toaster position="bottom-center" richColors />
    </PageShell>
  );
}
