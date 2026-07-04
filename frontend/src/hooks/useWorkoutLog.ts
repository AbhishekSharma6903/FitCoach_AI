import useSWR, { mutate as globalMutate } from "swr";
import api from "@/lib/api";
import type { DailyWorkout, WorkoutLogEntry } from "@/types/workout";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useWorkoutLog(date?: string) {
  const today = date || new Date().toISOString().split("T")[0];
  const { data, error, isLoading, mutate } = useSWR<DailyWorkout>(
    `/api/v1/workout/log?log_date=${today}`,
    fetcher
  );

  async function addEntry(payload: {
    exercise_id: number | null;
    log_date: string;
    sets?: number;
    reps?: number;
    weight_kg?: number;
    duration_min?: number;
    notes?: string;
  }) {
    await api.post("/api/v1/workout/log", payload);
    mutate();
    globalMutate("/api/v1/dashboard");
  }

  async function deleteEntry(entryId: number) {
    await api.delete(`/api/v1/workout/log/${entryId}`);
    mutate();
    globalMutate("/api/v1/dashboard");
  }

  return { workout: data, error, isLoading, addEntry, deleteEntry, mutate };
}
