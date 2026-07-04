import useSWR, { mutate } from "swr";
import api from "@/lib/api";

interface WaterEntry {
  id: number;
  amount_ml: number;
  log_date: string;
}

interface WaterDailyData {
  log_date: string;
  total_ml: number;
  goal_ml: number;
  pct_complete: number;
  remaining_ml: number;
  entries: WaterEntry[];
}

const KEY = "/api/v1/water/log";

async function fetcher(url: string) {
  const res = await api.get<WaterDailyData>(url);
  return res.data;
}

export function useWaterLog() {
  const { data, error, isLoading } = useSWR<WaterDailyData>(KEY, fetcher, {
    refreshInterval: 0,
  });

  async function addWater(amount_ml: number) {
    await api.post("/api/v1/water/log", {
      amount_ml,
      log_date: new Date().toISOString().split("T")[0],
    });
    mutate(KEY);
    mutate("/api/v1/dashboard");
  }

  async function removeWater(entry_id: number) {
    await api.delete(`/api/v1/water/log/${entry_id}`);
    mutate(KEY);
    mutate("/api/v1/dashboard");
  }

  return { water: data, isLoading, error, addWater, removeWater };
}
