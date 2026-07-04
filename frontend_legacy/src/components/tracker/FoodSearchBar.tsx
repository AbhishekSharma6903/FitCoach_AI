"use client";
import { useState, useRef, useEffect } from "react";
import { useFoodSearch } from "@/hooks/useFoodSearch";
import type { FoodItem } from "@/types/nutrition";
import { Search } from "lucide-react";

interface Props {
  onSelect: (item: FoodItem) => void;
  dietFilter?: string;
}

export default function FoodSearchBar({ onSelect, dietFilter }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { results, isLoading } = useFoodSearch(query, dietFilter);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="w-full rounded-xl border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-600 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          placeholder="Search food (e.g. Dal Tadka, Roti, Rice...)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query.length >= 2 && setOpen(true)}
        />
      </div>

      {open && query.length >= 2 && (
        <div className="absolute z-20 w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-card max-h-60 overflow-y-auto">
          {isLoading && <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>}
          {!isLoading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
          )}
          {results.map((item) => (
            <button
              key={`${item.is_custom ? "dish" : "food"}-${item.id}`}
              className="w-full px-4 py-3 text-left hover:bg-gray-800 border-b border-gray-800 last:border-0 transition-colors"
              onClick={() => { onSelect(item); setQuery(""); setOpen(false); }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-200">{item.name}</p>
                    {item.is_custom && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-semibold">MY DISH</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{item.category} · {item.region}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.is_veg ? "bg-brand-500" : item.is_egg ? "bg-yellow-400" : "bg-red-500"}`} />
                  <span className="text-xs text-gray-500">{Number(item.calories_kcal).toFixed(0)} kcal/100g</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
