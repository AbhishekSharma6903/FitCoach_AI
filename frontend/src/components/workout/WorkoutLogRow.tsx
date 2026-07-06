"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { X, Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { WorkoutLogEntry } from "@/types/workout";

interface WorkoutLogRowProps {
  entry: WorkoutLogEntry;
  index: number;
  onDelete: (id: number, exerciseName: string) => Promise<void>;
  onUpdate?: (id: number, payload: { sets?: number; reps?: number; weight_kg?: number; duration_min?: number }) => Promise<void>;
}

export default function WorkoutLogRow({ entry, index, onDelete, onUpdate }: WorkoutLogRowProps) {
  const [editing, setEditing] = useState(false);
  const [reps, setReps] = useState(String(entry.reps ?? ""));
  const [weight, setWeight] = useState(String(entry.weight_kg ?? ""));
  const [duration, setDuration] = useState(String(entry.duration_min ?? ""));
  const [saving, setSaving] = useState(false);

  const isCardio = !entry.sets && !entry.reps;

  async function handleDelete() {
    await onDelete(entry.id, entry.exercise_name);
    toast(`Set ${index} removed`, { duration: 3000 });
  }

  async function handleSave() {
    if (!onUpdate) return;
    setSaving(true);
    try {
      await onUpdate(entry.id, {
        reps: reps ? Number(reps) : undefined,
        weight_kg: weight ? Number(weight) : undefined,
        duration_min: duration ? Number(duration) : undefined,
      });
      setEditing(false);
      toast("Updated", { duration: 2000 });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setReps(String(entry.reps ?? ""));
    setWeight(String(entry.weight_kg ?? ""));
    setDuration(String(entry.duration_min ?? ""));
    setEditing(false);
  }

  const inputCls = "w-16 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-2 py-0.5 text-xs text-foreground tabular-nums outline-none focus:border-primary";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-between py-1.5 group"
    >
      {editing ? (
        /* ── Inline edit mode ─────────────────────────────────── */
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-muted-foreground w-12 tabular-nums shrink-0">Set {index}</span>
          {isCardio ? (
            <input
              type="number" min={1}
              value={duration} onChange={(e) => setDuration(e.target.value)}
              className={inputCls}
              placeholder="min"
              autoFocus
            />
          ) : (
            <>
              <input
                type="number" min={1}
                value={reps} onChange={(e) => setReps(e.target.value)}
                className={inputCls}
                placeholder="reps"
                autoFocus
              />
              <input
                type="number" min={0} step={0.5}
                value={weight} onChange={(e) => setWeight(e.target.value)}
                className={inputCls}
                placeholder="kg"
              />
            </>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            aria-label="Save"
            className="flex h-6 w-6 items-center justify-center rounded text-primary hover:text-green-400 transition-colors"
          >
            <Check size={13} />
          </button>
          <button
            onClick={handleCancel}
            aria-label="Cancel"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        /* ── Read mode ────────────────────────────────────────── */
        <>
          {isCardio ? (
            <span className="text-xs text-muted-foreground">
              {entry.duration_min} min
              {entry.calories_burned ? ` · ${Math.round(entry.calories_burned)} kcal` : ""}
            </span>
          ) : (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="w-10 font-medium text-foreground/70 tabular-nums">Set {index}</span>
              <span className="w-16 tabular-nums">{entry.reps ?? "—"} reps</span>
              <span className="tabular-nums font-medium text-foreground/80">
                {entry.weight_kg ? `${entry.weight_kg} kg` : "bodyweight"}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
            {onUpdate && (
              <button
                onClick={() => setEditing(true)}
                aria-label="Edit set"
                className="flex h-6 w-6 items-center justify-center rounded
                           text-muted-foreground/30 hover:text-blue-400 transition-colors"
              >
                <Pencil size={11} />
              </button>
            )}
            <button
              onClick={handleDelete}
              aria-label="Delete set"
              className="flex h-6 w-6 items-center justify-center rounded
                         text-muted-foreground/30 hover:text-red-400 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

