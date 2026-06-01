import useSWR from "swr";
import api from "@/lib/api";
import type { DailyNutrition, FoodLogEntry } from "@/types/nutrition";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useFoodLog(date?: string) {
  const today = date || new Date().toISOString().split("T")[0];
  const { data, error, isLoading, mutate } = useSWR<DailyNutrition>(
    `/api/v1/food/log?log_date=${today}`,
    fetcher
  );

  async function addEntry(payload: {
    food_item_id: number;
    log_date: string;
    meal_type: string;
    quantity_g: number;
  }) {
    await api.post("/api/v1/food/log", payload);
    mutate();
  }

  async function deleteEntry(entryId: number) {
    await api.delete(`/api/v1/food/log/${entryId}`);
    mutate();
  }

  return { log: data, error, isLoading, addEntry, deleteEntry, mutate };
}
