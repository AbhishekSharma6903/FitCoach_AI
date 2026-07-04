import useSWR from "swr";
import api from "@/lib/api";
import type { CustomDish, CustomDishListItem } from "@/types/dish";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useCustomDishes() {
  const { data, error, isLoading, mutate } = useSWR<CustomDishListItem[]>(
    "/api/v1/dishes",
    fetcher
  );

  async function createDish(payload: { name: string; ingredients: { food_item_id: number; quantity_g: number }[] }) {
    const res = await api.post("/api/v1/dishes", payload);
    mutate();
    return res.data as CustomDish;
  }

  async function updateDish(id: number, payload: { name: string; ingredients: { food_item_id: number; quantity_g: number }[] }) {
    const res = await api.put(`/api/v1/dishes/${id}`, payload);
    mutate();
    return res.data as CustomDish;
  }

  async function deleteDish(id: number) {
    await api.delete(`/api/v1/dishes/${id}`);
    mutate();
  }

  return { dishes: data ?? [], error, isLoading, createDish, updateDish, deleteDish, mutate };
}
