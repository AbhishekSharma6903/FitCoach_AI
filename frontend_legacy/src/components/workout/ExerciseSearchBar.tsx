"use client";
import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import api from "@/lib/api";
import type { Exercise } from "@/types/workout";

interface Props {
  onSelect: (exercise: Exercise) => void;
}

export default function ExerciseSearchBar({ onSelect }: Props) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/v1/workout/search", { params: { q: query } });
        setResults(res.data);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const CATEGORY_COLORS: Record<string, string> = {
    cardio: "text-red-400",
    strength: "text-blue-400",
    yoga: "text-purple-400",
    stretching: "text-green-400",
    plyometrics: "text-orange-400",
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="w-full rounded-xl border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-600 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          placeholder="Search exercises (e.g. Push-Up, Running, Yoga…)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query.length >= 2 && setOpen(true)}
        />
      </div>

      {open && query.length >= 2 && (
        <div className="absolute z-20 w-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-card max-h-64 overflow-y-auto">
          {loading && <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">No exercises found</div>
          )}
          {results.map((ex) => (
            <button
              key={ex.id}
              className="w-full px-4 py-3 text-left hover:bg-gray-800 border-b border-gray-800 last:border-0 transition-colors"
              onClick={() => { onSelect(ex); setQuery(""); setOpen(false); }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{ex.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {ex.muscle_group || ex.equipment || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold capitalize ${CATEGORY_COLORS[ex.category] ?? "text-gray-400"}`}>
                    {ex.category}
                  </span>
                  <span className="text-xs text-gray-600">MET {ex.met_value}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
