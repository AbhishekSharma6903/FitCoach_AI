import { useState, useEffect } from "react";
import api from "@/lib/api";
import type { FoodItem } from "@/types/nutrition";

export function useFoodSearch(query: string, dietFilter?: string) {
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string> = { q: query };
        if (dietFilter) params.diet_filter = dietFilter;
        const res = await api.get("/api/v1/food/search", { params });
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, dietFilter]);

  return { results, isLoading };
}
