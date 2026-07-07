import useSWR, { mutate as globalMutate } from "swr";
import api from "@/lib/api";
import type { DailyNutrition, FoodLogEntry } from "@/types/nutrition";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useFoodLog(date?: string) {
  const today = date || new Date().toISOString().split("T")[0];
  const key = `/api/v1/food/log?log_date=${today}`;
  const { data, error, isLoading, mutate } = useSWR<DailyNutrition>(key, fetcher);

  async function addEntry(payload: {
    food_item_id: number;
    log_date: string;
    meal_type: string;
    quantity_g: number;
  }) {
    await api.post("/api/v1/food/log", payload);
    mutate();
    // Invalidate dashboard so calorie ring + macro bars update immediately
    globalMutate("/api/v1/dashboard");
  }

  async function deleteEntry(entryId: number) {
    await api.delete(`/api/v1/food/log/${entryId}`);
    mutate();
    globalMutate("/api/v1/dashboard");
  }

  return { log: data, error, isLoading, addEntry, deleteEntry, mutate };
}
