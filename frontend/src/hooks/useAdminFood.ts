import { useState, useCallback } from "react";
import useSWR from "swr";
import api from "@/lib/api";

export interface AdminFoodItem {
  id:             number;
  name:           string;
  category:       string | null;
  region:         string | null;
  serving_size_g: number;
  calories_kcal:  number;
  protein_g:      number;
  carbs_g:        number;
  fat_g:          number;
  fiber_g:        number;
  sugar_g:        number;
  is_veg:         boolean;
  is_egg:         boolean;
}

export interface AdminFoodCreate {
  name:           string;
  category:       string;
  region:         string;
  serving_size_g: number;
  calories_kcal:  number;
  protein_g:      number;
  carbs_g:        number;
  fat_g:          number;
  fiber_g:        number;
  sugar_g:        number;
  is_veg:         boolean;
  is_egg:         boolean;
}

const PAGE_SIZE = 100;

export function useAdminFood(search: string) {
  const [page, setPage]             = useState(0);
  const [allItems, setAllItems]     = useState<AdminFoodItem[]>([]);
  const [total, setTotal]           = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch first page whenever search changes
  const url = `/api/v1/admin/food?search=${encodeURIComponent(search)}&skip=0&limit=${PAGE_SIZE}`;
  const { isLoading } = useSWR(
    url,
    (u: string) => api.get(u).then(r => r.data as AdminFoodItem[]),
    {
      onSuccess(data) {
        setAllItems(data);
        setPage(0);
        // Backend doesn't return total — we infer from response size
        // If we got exactly PAGE_SIZE, there might be more
        setTotal(data.length < PAGE_SIZE ? data.length : null);
      },
    },
  );

  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const { data } = await api.get<AdminFoodItem[]>(
        `/api/v1/admin/food?search=${encodeURIComponent(search)}&skip=${nextPage * PAGE_SIZE}&limit=${PAGE_SIZE}`,
      );
      setAllItems(prev => [...prev, ...data]);
      setPage(nextPage);
      if (data.length < PAGE_SIZE) {
        setTotal(allItems.length + data.length);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [page, search, allItems.length]);

  const hasMore = total === null && allItems.length > 0 && allItems.length % PAGE_SIZE === 0;

  async function createFood(payload: AdminFoodCreate): Promise<AdminFoodItem> {
    const { data } = await api.post<AdminFoodItem>("/api/v1/admin/food", payload);
    setAllItems(prev => [data, ...prev]);
    return data;
  }

  async function updateFood(id: number, payload: Partial<AdminFoodCreate>): Promise<AdminFoodItem> {
    const { data } = await api.put<AdminFoodItem>(`/api/v1/admin/food/${id}`, payload);
    setAllItems(prev => prev.map(f => f.id === id ? data : f));
    return data;
  }

  async function deleteFood(id: number): Promise<void> {
    await api.delete(`/api/v1/admin/food/${id}`);
    setAllItems(prev => prev.filter(f => f.id !== id));
  }

  return {
    items: allItems,
    isLoading,
    loadingMore,
    hasMore,
    loadedCount: allItems.length,
    loadMore,
    createFood,
    updateFood,
    deleteFood,
  };
}
