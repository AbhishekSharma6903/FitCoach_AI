"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  date: string;        // YYYY-MM-DD
  onChange: (date: string) => void;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function DateNavigator({ date, onChange }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;
  const prev = addDays(date, -1);
  const next = addDays(date, 1);

  return (
    <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
      <button
        onClick={() => onChange(prev)}
        className="p-1 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex-1 text-center">
        <p className="text-sm font-medium text-gray-200">{formatDisplay(date)}</p>
        {isToday && (
          <p className="text-[10px] font-semibold text-brand-500 uppercase tracking-wide leading-none mt-0.5">
            Today
          </p>
        )}
      </div>

      <button
        onClick={() => onChange(next)}
        disabled={isToday}
        className="p-1 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next day"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
