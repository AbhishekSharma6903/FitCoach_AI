"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";

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

function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function DateNavigator({ date, onChange }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;
  const [showCal, setShowCal] = useState(false);

  const selDate = new Date(date + "T00:00:00");
  const [calYear, setCalYear] = useState(selDate.getFullYear());
  const [calMonth, setCalMonth] = useState(selDate.getMonth());

  const todayDate = new Date(today + "T00:00:00");

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    const now = todayDate;
    if (calYear > now.getFullYear() || (calYear === now.getFullYear() && calMonth >= now.getMonth())) return;
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }

  const isNextMonthDisabled = calYear > todayDate.getFullYear() ||
    (calYear === todayDate.getFullYear() && calMonth >= todayDate.getMonth());

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDow = getFirstDayOfWeek(calYear, calMonth);

  function selectDay(day: number) {
    const ymd = toYMD(calYear, calMonth, day);
    if (ymd > today) return; // no future
    onChange(ymd);
    setShowCal(false);
  }

  function openCal() {
    const d = new Date(date + "T00:00:00");
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
    setShowCal(true);
  }

  return (
    <div className="relative">
      {/* Strip nav */}
      <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl px-2 py-2">
        <button
          onClick={() => onChange(addDays(date, -1))}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Date display — tap to open calendar */}
        <button
          onClick={openCal}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-800 transition-colors group"
        >
          <CalendarDays size={14} className="text-gray-600 group-hover:text-brand-500 transition-colors" />
          <span className="text-sm font-medium text-gray-200">{formatDisplay(date)}</span>
          {isToday && (
            <span className="text-[10px] font-bold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded-md">TODAY</span>
          )}
        </button>

        <button
          onClick={() => onChange(addDays(date, 1))}
          disabled={isToday}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          aria-label="Next day"
        >
          <ChevronRight size={16} />
        </button>

        {/* Jump to today */}
        {!isToday && (
          <button
            onClick={() => onChange(today)}
            className="ml-1 px-2 py-1 text-xs font-semibold text-brand-500 hover:bg-brand-500/10 rounded-lg transition-colors"
          >
            Today
          </button>
        )}
      </div>

      {/* Calendar popover */}
      {showCal && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-gray-900 border border-gray-800 rounded-2xl shadow-card p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-gray-200">{formatMonth(calYear, calMonth)}</span>
            <button
              onClick={nextMonth}
              disabled={isNextMonthDisabled}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-600 pb-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const ymd = toYMD(calYear, calMonth, day);
              const isFuture = ymd > today;
              const isSelected = ymd === date;
              const isCurrentToday = ymd === today;

              return (
                <button
                  key={day}
                  disabled={isFuture}
                  onClick={() => selectDay(day)}
                  className={[
                    "h-8 w-full rounded-lg text-sm font-medium transition-all",
                    isFuture ? "text-gray-800 cursor-not-allowed" :
                    isSelected ? "bg-brand-500 text-white" :
                    isCurrentToday ? "border border-brand-500/50 text-brand-400 hover:bg-brand-500/10" :
                    "text-gray-300 hover:bg-gray-800",
                  ].join(" ")}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowCal(false)}
            className="mt-3 w-full flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <X size={12} /> Close
          </button>
        </div>
      )}
    </div>
  );
}
