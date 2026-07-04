import useSWR from "swr";
import api from "@/lib/api";
import type { UserProfile } from "@/types/profile";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR<UserProfile>(
    "/api/v1/profile",
    fetcher
  );
  return { profile: data, error, isLoading, mutate };
}
