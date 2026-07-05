"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTrackerStore } from "@/store/useTrackerStore";
import { cn } from "@/lib/utils";

const MONTHS = ["January","February","March","April","May","June",
                 "July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function formatDateDisplay(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function padDate(n: number) { return String(n).padStart(2, "0"); }

/** Custom calendar popover — Bevel-style dark, no native OS widget */
export default function DateNavigator() {
  const { selectedDate, setSelectedDate, goToPrevDay, goToNextDay, resetToToday, isToday } =
    useTrackerStore();
  const todayActive = isToday();
  const todayStr = new Date().toISOString().split("T")[0];

  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  // Calendar view state — initialise to selected date's month
  const selParts = selectedDate.split("-").map(Number);
  const [viewYear,  setViewYear]  = useState(selParts[0]);
  const [viewMonth, setViewMonth] = useState(selParts[1] - 1);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setCalOpen(false);
      }
    }
    if (calOpen) {
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler);
    }
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [calOpen]);

  function openCal() {
    const p = selectedDate.split("-").map(Number);
    setViewYear(p[0]); setViewMonth(p[1] - 1);
    setCalOpen(true);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    const todayParts = todayStr.split("-").map(Number);
    const isCurrentMonth = viewYear === todayParts[0] && viewMonth === todayParts[1] - 1;
    if (isCurrentMonth) return; // don't go past current month
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function pickDay(day: number) {
    const picked = `${viewYear}-${padDate(viewMonth + 1)}-${padDate(day)}`;
    if (picked <= todayStr) {
      setSelectedDate(picked);
      setCalOpen(false);
    }
  }

  const todayParts = todayStr.split("-").map(Number);
  const isCurrentViewMonth = viewYear === todayParts[0] && viewMonth === todayParts[1] - 1;
  const cells = buildCalendarGrid(viewYear, viewMonth);

  return (
    <div className="relative" ref={calRef}>
      {/* ── Navigation bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 py-1">
        {/* Prev arrow */}
        <button
          onClick={goToPrevDay}
          aria-label="Previous day"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111111] border border-[#2A2A2A] text-muted-foreground hover:text-foreground hover:bg-[#1A1A1A] transition-colors active:scale-95 shrink-0"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Centre: date + calendar trigger */}
        <button
          onClick={openCal}
          className="flex flex-1 items-center justify-center gap-2 min-w-0 py-2 px-3 rounded-xl hover:bg-[#1A1A1A] transition-colors group"
          aria-label="Open calendar"
        >
          <CalendarDays size={15} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
          <span className="text-sm font-semibold text-foreground truncate">
            {todayActive ? "Today" : formatDateDisplay(selectedDate)}
          </span>
          {!todayActive && (
            <Badge
              variant="outline"
              className="text-[10px] border-primary/30 text-primary shrink-0"
            >
              Today
            </Badge>
          )}
        </button>

        {/* Next arrow */}
        <button
          onClick={goToNextDay}
          disabled={todayActive}
          aria-label="Next day"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors active:scale-95 shrink-0",
            todayActive
              ? "bg-[#111111] border-[#2A2A2A] text-muted-foreground/30 cursor-not-allowed"
              : "bg-[#111111] border-[#2A2A2A] text-muted-foreground hover:text-foreground hover:bg-[#1A1A1A]",
          )}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Calendar popover ───────────────────────────────────────── */}
      {calOpen && (
        <div className={cn(
          "absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50",
          "w-[320px] rounded-2xl bg-[#111111] border border-[#2A2A2A]",
          "shadow-2xl shadow-black/60 p-4",
        )}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-[#1A1A1A] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              disabled={isCurrentViewMonth}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                isCurrentViewMonth
                  ? "text-muted-foreground/20 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-[#1A1A1A]",
              )}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground/50 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;

              const dateStr = `${viewYear}-${padDate(viewMonth + 1)}-${padDate(day)}`;
              const isFuture = dateStr > todayStr;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={day}
                  onClick={() => !isFuture && pickDay(day)}
                  disabled={isFuture}
                  className={cn(
                    "h-9 w-full rounded-lg text-sm font-medium transition-all",
                    isFuture && "text-muted-foreground/20 cursor-not-allowed",
                    !isFuture && !isSelected && "text-foreground hover:bg-[#1A1A1A]",
                    isSelected && "bg-primary text-black font-bold",
                    isToday && !isSelected && "border border-primary/40 text-primary",
                  )}
                  aria-label={dateStr}
                  aria-pressed={isSelected}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer: Today shortcut + close */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2A2A2A]">
            <button
              onClick={() => { setSelectedDate(todayStr); setCalOpen(false); }}
              className="text-xs font-semibold text-primary hover:text-green-400 transition-colors"
            >
              Jump to Today
            </button>
            <button
              onClick={() => setCalOpen(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close calendar"
            >
              <X size={12} />
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
