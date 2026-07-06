"use client";

import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/Modal";
import SearchCommand from "@/components/ui/SearchCommand";
import { cn } from "@/lib/utils";
import {
  INTENSITIES,
  INTENSITY_MET,
  isStrengthCategory,
  buildNotes,
  calcCaloriePreview,
  calcStrengthCaloriePreview,
  getCategoryStyle,
} from "@/lib/workoutUtils";
import type { Intensity } from "@/lib/workoutUtils";
import type { Exercise } from "@/types/workout";
import api from "@/lib/api";

interface AddWorkoutModalProps {
  open: boolean;
  onClose: () => void;
  logDate: string;
  currentWeightKg: number;
  onAdd: (payload: {
    exercise_id: number | null;
    log_date: string;
    sets?: number;
    reps?: number;
    weight_kg?: number;
    duration_min?: number;
    notes?: string;
  }) => Promise<void>;
}

async function searchExercises(query: string): Promise<Exercise[]> {
  const res = await api.get("/api/v1/workout/search", { params: { q: query } });
  return res.data;
}

function renderExercise(ex: Exercise) {
  const style = getCategoryStyle(ex.category);
  return {
    id: ex.id,
    primary: ex.name,
    secondary: [ex.muscle_group, ex.equipment].filter(Boolean).join(" · ") || ex.category,
    badge: ex.category,
    badgeColor: style.text,
    indicator: style.bgSolid,
  };
}

export default function AddWorkoutModal({
  open,
  onClose,
  logDate,
  currentWeightKg,
  onAdd,
}: AddWorkoutModalProps) {
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [intensity, setIntensity] = useState<Intensity>("moderate");
  const [sets, setSets] = useState<string>("3");
  const [reps, setReps] = useState<string>("10");
  const [weightKg, setWeightKg] = useState<string>("");
  const [durationMin, setDurationMin] = useState<string>("");
  const [userNote, setUserNote] = useState<string>("");
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSelected(null); setIntensity("moderate");
      setSets("3"); setReps("10"); setWeightKg("");
      setDurationMin(""); setUserNote(""); setShowNote(false);
    }
  }, [open]);

  const handleSearch = useCallback(searchExercises, []);
  const isStrength = selected ? isStrengthCategory(selected.category) : false;
  const style = selected ? getCategoryStyle(selected.category) : null;
  const met = INTENSITY_MET[intensity];

  // Bug 3 fix: calorie preview uses sets × reps for strength (scales with actual volume)
  const strengthPreview =
    isStrength && currentWeightKg > 0 && Number(sets) > 0 && Number(reps) > 0
      ? calcStrengthCaloriePreview(met, currentWeightKg, Number(sets), Number(reps))
      : null;

  const cardioPreview =
    !isStrength && selected && currentWeightKg > 0 && Number(durationMin) > 0
      ? calcCaloriePreview(selected.met_value, currentWeightKg, Number(durationMin))
      : null;

  const caloriePreview = strengthPreview ?? cardioPreview;

  async function handleAdd() {
    if (!selected) return;
    setSaving(true);
    try {
      const notes = buildNotes(intensity, userNote);
      // For strength: estimate duration from sets × reps for backend calorie calculation
      const estimatedDur = isStrength
        ? Math.max(1, (Number(sets) * Number(reps) * 3 + Number(sets) * 90) / 60)
        : undefined;

      await onAdd({
        exercise_id: selected.id,
        log_date: logDate,
        sets: isStrength ? (Number(sets) || undefined) : undefined,
        reps: isStrength ? (Number(reps) || undefined) : undefined,
        weight_kg: isStrength && weightKg ? Number(weightKg) : undefined,
        duration_min: !isStrength ? (Number(durationMin) || undefined) : estimatedDur,
        notes: notes || undefined,
      });
      // Bug 1 fix: close modal after successfully logging
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const canAdd = selected && (
    isStrength
      ? (Number(sets) > 0 && Number(reps) > 0)
      : Number(durationMin) > 0
  );

  return (
    <Modal open={open} onClose={onClose} title="Log Exercise">
      <div className="space-y-4 pt-1">

        {/* Exercise search */}
        <SearchCommand<Exercise>
          placeholder="Search push up, running…"
          onSearch={handleSearch}
          renderItem={renderExercise}
          onSelect={(ex) => { setSelected(ex); }}
          emptyText="No exercises found."
        />

        {/* Selected exercise pill */}
        {selected && style && (
          <div className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl border",
            style.bg, style.badge.includes("border") ? "" : "border-[#2A2A2A]",
          )}>
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-xs",
              style.bg, style.text,
            )}>
              {selected.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{selected.name}</p>
              <p className="text-[10px] text-muted-foreground">{selected.category}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              aria-label="Remove exercise"
              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {selected && (
          <>
            {/* Strength fields */}
            {isStrength && (
              <div className="space-y-3">
                {/* Intensity segmented control */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Intensity</label>
                  <div className="flex rounded-xl bg-[#222222] border border-[#2A2A2A] p-1 gap-1">
                    {INTENSITIES.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setIntensity(value)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                          intensity === value
                            ? "bg-[#1A1A1A] text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sets / Reps / Weight */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Sets", value: sets, setValue: setSets, placeholder: "3" },
                    { label: "Reps", value: reps, setValue: setReps, placeholder: "10" },
                    { label: "Weight (kg)", value: weightKg, setValue: setWeightKg, placeholder: "body" },
                  ].map(({ label, value, setValue, placeholder }) => (
                    <div key={label} className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground">{label}</label>
                      <Input
                        type="number" min={0} step={label === "Weight (kg)" ? 0.5 : 1}
                        placeholder={placeholder} value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="bg-[#222222] border-[#2A2A2A] focus:border-primary focus:ring-primary/20 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cardio / Yoga / Stretching: session time */}
            {!isStrength && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Session time (min)
                </label>
                <Input
                  type="number" min={1} placeholder="15"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="bg-[#222222] border-[#2A2A2A] focus:border-primary focus:ring-primary/20"
                />
                <p className="text-[10px] text-muted-foreground/50">Total time including rest</p>
              </div>
            )}

            {/* Calorie preview */}
            {caloriePreview !== null && (
              <div className="px-3 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                  Estimated burn
                </p>
                <p className="text-lg font-black text-white tabular-nums">
                  ≈ {caloriePreview} kcal
                </p>
                {isStrength && (
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                    {sets} sets × {reps} reps · add weight for better accuracy
                  </p>
                )}
              </div>
            )}

            {/* Collapsible notes */}
            {!showNote ? (
              <button
                onClick={() => setShowNote(true)}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                + Add a note (optional)
              </button>
            ) : (
              <textarea
                rows={2}
                placeholder="e.g. felt strong today, good form…"
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                className="w-full rounded-xl bg-[#222222] border border-[#2A2A2A] text-foreground
                           text-sm px-3 py-2 resize-none outline-none
                           focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            )}

            <Button
              onClick={handleAdd}
              disabled={!canAdd || saving}
              className={cn(
                "w-full h-11 bg-primary text-black font-semibold rounded-xl",
                "hover:bg-green-400 active:scale-[0.98] transition-all",
                "disabled:opacity-40 disabled:cursor-not-allowed",
              )}
            >
              {saving ? "Logging…" : "Log Exercise"}
            </Button>
          </>
        )}

        {/* Empty state when no exercise selected */}
        {!selected && (
          <div className="hidden lg:flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
              <span className="text-2xl" aria-hidden="true">🔍</span>
            </div>
            <p className="text-sm text-muted-foreground">Search for an exercise above</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
