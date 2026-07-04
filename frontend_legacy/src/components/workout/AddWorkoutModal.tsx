"use client";
import { useState } from "react";
import { Flame } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { Exercise } from "@/types/workout";
import { useProfile } from "@/hooks/useProfile";

interface Props {
  exercise: Exercise | null;
  logDate: string;
  onClose: () => void;
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

export default function AddWorkoutModal({ exercise, logDate, onClose, onAdd }: Props) {
  const { profile } = useProfile();
  const [sets,     setSets]     = useState<number | "">("");
  const [reps,     setReps]     = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [durMin,   setDurMin]   = useState<number | "">(30);
  const [loading,  setLoading]  = useState(false);

  if (!exercise) return null;

  const weightKgUser = profile?.current_weight_kg ?? 70;
  const estCalories = durMin && Number(durMin) > 0
    ? Math.round(exercise.met_value * weightKgUser * (Number(durMin) / 60))
    : null;

  const isCardio = exercise.category === "cardio";

  async function handleAdd() {
    setLoading(true);
    try {
      await onAdd({
        exercise_id:  exercise!.id,
        log_date:     logDate,
        sets:         sets     !== "" ? Number(sets)     : undefined,
        reps:         reps     !== "" ? Number(reps)     : undefined,
        weight_kg:    weightKg !== "" ? Number(weightKg) : undefined,
        duration_min: durMin   !== "" ? Number(durMin)   : undefined,
      });
      onClose();
    } finally { setLoading(false); }
  }

  return (
    <Modal open={!!exercise} onClose={onClose} title={exercise.name}>
      <div className="space-y-4">
        {/* Exercise info */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="capitalize font-medium text-gray-400">{exercise.category}</span>
          {exercise.muscle_group && <><span>·</span><span>{exercise.muscle_group}</span></>}
          {exercise.equipment   && <><span>·</span><span>{exercise.equipment}</span></>}
        </div>

        {/* Strength fields */}
        {!isCardio && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Sets</label>
              <Input type="number" min={1} placeholder="3"
                value={sets} onChange={(e) => setSets(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Reps</label>
              <Input type="number" min={1} placeholder="10"
                value={reps} onChange={(e) => setReps(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Weight (kg)</label>
              <Input type="number" min={0} step={0.5} placeholder="—"
                value={weightKg} onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
          </div>
        )}

        {/* Duration */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Duration (min)</label>
          <Input type="number" min={1} placeholder="30"
            value={durMin} onChange={(e) => setDurMin(e.target.value === "" ? "" : Number(e.target.value))} />
        </div>

        {/* Calorie preview */}
        {estCalories !== null && (
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3">
            <Flame size={16} className="text-orange-400 shrink-0" />
            <div>
              <span className="text-base font-bold text-orange-300">{estCalories}</span>
              <span className="text-xs text-orange-500 ml-1">kcal estimated burned</span>
            </div>
            <span className="ml-auto text-xs text-gray-600">MET {exercise.met_value} × {weightKgUser}kg × {durMin}min</span>
          </div>
        )}

        <Button onClick={handleAdd} disabled={loading} className="w-full">
          {loading ? "Logging…" : "Log Workout"}
        </Button>
      </div>
    </Modal>
  );
}
