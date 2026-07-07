import useSWR from "swr";
import api from "@/lib/api";

export interface AdminUserSummary {
  user_id: string;
  name:    string | null;
  age:     number | null;
  gender:  string | null;
  current_weight_kg: number | null;
  goal_weight_kg:    number | null;
  diet_type:         string | null;
  experience_level:  string | null;
}

export interface AdminUserDetail extends AdminUserSummary {
  height_cm:           number | null;
  activity_level:      string | null;
  target_calories_kcal: number | null;
  bmi:                 number | null;
  tdee_kcal:           number | null;
  protein_g:           number | null;
  carbs_g:             number | null;
  fat_g:               number | null;
  wants_workout_split: boolean | null;
  wants_diet_plan:     boolean | null;
}

const fetcher = (url: string) => api.get(url).then(r => r.data);

export function useAdminUsers() {
  const { data, error, isLoading } = useSWR<AdminUserSummary[]>(
    "/api/v1/admin/users",
    fetcher,
  );
  return { users: data ?? [], error, isLoading };
}

export function useAdminUserDetail(userId: string | null) {
  const { data, error, isLoading } = useSWR<AdminUserDetail>(
    userId ? `/api/v1/admin/users/${userId}` : null,
    fetcher,
  );
  return { user: data ?? null, error, isLoading };
}
