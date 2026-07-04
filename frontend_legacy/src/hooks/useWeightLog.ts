import useSWR from "swr";
import api from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useWeightLog(days = 30) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/v1/weight/log?days=${days}`,
    fetcher
  );

  async function logWeight(weight_kg: number, note?: string) {
    const log_date = new Date().toISOString().split("T")[0];
    await api.post("/api/v1/weight/log", { log_date, weight_kg, note });
    mutate();
  }

  return { weightLog: data, error, isLoading, logWeight, mutate };
}
