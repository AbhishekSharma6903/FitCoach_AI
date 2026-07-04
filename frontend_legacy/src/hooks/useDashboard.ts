import useSWR from "swr";
import api from "@/lib/api";
import type { DashboardData } from "@/types/dashboard";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useDashboard() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardData>(
    "/api/v1/dashboard",
    fetcher,
    { refreshInterval: 30000 }
  );
  return { dashboard: data, error, isLoading, isValidating, mutate };
}
