import useSWR from "swr";
import api from "@/lib/api";
import type { WorkoutLogEntry } from "@/types/workout";

const fetcher = (url: string) => api.get(url).then(r => r.data);

export function useWorkoutHistory(days: 30 | 90 = 30) {
  const { data, error, isLoading } = useSWR<WorkoutLogEntry[]>(
    `/api/v1/workout/history?days=${days}`,
    fetcher,
  );
  return { entries: data ?? [], error, isLoading };
}
