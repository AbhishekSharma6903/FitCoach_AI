"use client";
import { useState } from "react";
import { Droplets, Plus, X } from "lucide-react";
import { useWaterLog } from "@/hooks/useWaterLog";
import { cn } from "@/lib/utils";

// Quick-add presets in ml
const PRESETS = [
  { label: "Small cup", ml: 150 },
  { label: "Glass", ml: 250 },
  { label: "Bottle", ml: 500 },
  { label: "Large bottle", ml: 750 },
];

function mlToDisplay(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`;
  return `${ml}ml`;
}

interface Props {
  /** Pass snapshot from dashboard to avoid extra API call on first render */
  initialTotal?: number;
  initialGoal?: number;
}

export default function WaterIntakePanel({ initialTotal, initialGoal }: Props) {
  const { water, addWater, removeWater, isLoading } = useWaterLog();
  const [customMl, setCustomMl] = useState<number | "">("");
  const [adding, setAdding] = useState(false);
  const [showEntries, setShowEntries] = useState(false);

  // Prefer live data; fall back to dashboard snapshot while loading
  const totalMl = water?.total_ml ?? initialTotal ?? 0;
  const goalMl = water?.goal_ml ?? initialGoal ?? 2500;
  const pct = Math.min(totalMl / goalMl, 1);
  const remainingMl = Math.max(0, goalMl - totalMl);
  const isComplete = totalMl >= goalMl;

  async function handlePreset(ml: number) {
    setAdding(true);
    try { await addWater(ml); } finally { setAdding(false); }
  }

  async function handleCustom() {
    if (!customMl || Number(customMl) <= 0) return;
    setAdding(true);
    try { await addWater(Number(customMl)); setCustomMl(""); } finally { setAdding(false); }
  }

  // Wave fill height as percentage (inverted for top-origin SVG)
  const wavePct = Math.round(pct * 100);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets size={18} className={isComplete ? "text-brand-400" : "text-blue-400"} />
          <h3 className="text-sm font-semibold text-gray-300">Water Intake</h3>
        </div>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-medium border",
          isComplete
            ? "bg-brand-500/10 border-brand-500/20 text-brand-400"
            : "bg-blue-500/10 border-blue-500/20 text-blue-400"
        )}>
          {isComplete ? "Goal reached! 🎉" : `${mlToDisplay(remainingMl)} to go`}
        </span>
      </div>

      {/* Progress row */}
      <div className="flex items-center gap-4">
        {/* Circular water level indicator */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#1f2937" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke={isComplete ? "#22c55e" : "#3b82f6"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - pct)}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-gray-100 leading-tight">{wavePct}%</span>
            <Droplets size={12} className={isComplete ? "text-brand-400" : "text-blue-400"} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Consumed</span>
            <span className="font-semibold text-gray-200">{mlToDisplay(totalMl)}</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isComplete ? "bg-brand-500" : "bg-blue-500"
              )}
              style={{ width: `${wavePct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Daily goal</span>
            <span>{mlToDisplay(goalMl)}</span>
          </div>
        </div>
      </div>

      {/* Quick-add presets */}
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.ml}
            onClick={() => handlePreset(p.ml)}
            disabled={adding}
            className={cn(
              "flex flex-col items-center py-2 rounded-xl border text-xs font-medium transition-all",
              "border-gray-700 text-gray-400 hover:border-blue-500/50 hover:text-blue-300 hover:bg-blue-500/5",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Plus size={12} className="mb-0.5" />
            <span>{mlToDisplay(p.ml)}</span>
            <span className="text-gray-600 font-normal">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Custom amount input */}
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          max={2000}
          placeholder="Custom ml"
          value={customMl}
          onChange={(e) => setCustomMl(e.target.value === "" ? "" : Number(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && handleCustom()}
          className="flex-1 rounded-xl border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-600 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          onClick={handleCustom}
          disabled={!customMl || adding}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      {/* Entry history toggle */}
      {water && water.entries.length > 0 && (
        <div>
          <button
            onClick={() => setShowEntries((v) => !v)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            {showEntries ? "Hide" : "Show"} today&apos;s entries ({water.entries.length})
          </button>
          {showEntries && (
            <div className="mt-2 space-y-1">
              {water.entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-800 text-xs">
                  <div className="flex items-center gap-2">
                    <Droplets size={11} className="text-blue-400" />
                    <span className="text-gray-300 font-medium">{mlToDisplay(entry.amount_ml)}</span>
                  </div>
                  <button
                    onClick={() => removeWater(entry.id)}
                    className="text-gray-700 hover:text-red-400 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Future: notification hint */}
      <p className="text-xs text-gray-700 italic">
        💡 Hydration reminders — coming soon
      </p>
    </div>
  );
}
