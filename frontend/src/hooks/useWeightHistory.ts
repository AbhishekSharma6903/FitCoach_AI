import useSWR from "swr";
import api from "@/lib/api";
import type { WeightLogRead } from "@/lib/progressUtils";

export interface WeightHistoryRead {
  entries:           WeightLogRead[];
  start_weight_kg:   number | null;
  current_weight_kg: number | null;
  change_kg:         number | null;
}

const fetcher = (url: string) => api.get(url).then(r => r.data);

export function useWeightHistory(days: 30 | 90 = 30) {
  const { data, error, isLoading } = useSWR<WeightHistoryRead>(
    `/api/v1/weight/log?days=${days}`,
    fetcher,
  );
  return { history: data ?? null, error, isLoading };
}
