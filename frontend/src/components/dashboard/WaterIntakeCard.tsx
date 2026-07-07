"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Droplets, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Card from "@/components/ui/Card";
import CountUp from "./CountUp";
import { useWaterLog } from "@/hooks/useWaterLog";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "Small cup", ml: 150 },
  { label: "Glass",     ml: 250 },
  { label: "Bottle",    ml: 500 },
  { label: "Large",     ml: 750 },
];

function mlLabel(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`;
}

const WATER_RING_RADIUS = 28;
const WATER_CIRCUMFERENCE = 2 * Math.PI * WATER_RING_RADIUS;

export default function WaterIntakeCard() {
  const { water, addWater, removeWater } = useWaterLog();
  const [customMl, setCustomMl] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [showEntries, setShowEntries] = useState(false);

  const totalMl = water?.total_ml ?? 0;
  const goalMl = water?.goal_ml ?? 2500;
  const pct = goalMl > 0 ? Math.min(totalMl / goalMl, 1) : 0;
  const remaining = Math.max(0, goalMl - totalMl);
  const isComplete = totalMl >= goalMl;
  const ringOffset = WATER_CIRCUMFERENCE * (1 - pct);

  async function handlePreset(ml: number) {
    setAdding(true);
    try { await addWater(ml); } finally { setAdding(false); }
  }

  async function handleCustom() {
    const ml = Number(customMl);
    if (!ml || ml <= 0) return;
    setAdding(true);
    try { await addWater(ml); setCustomMl(""); } finally { setAdding(false); }
  }

  return (
    <Card padding="md" className="space-y-4">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Hydration
      </p>

      {/* Ring + stats row */}
      <div className="flex items-center gap-5">
        {/* Mini SVG ring */}
        <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
          <svg width={72} height={72} viewBox="0 0 72 72" className="-rotate-90" aria-hidden="true">
            <circle cx={36} cy={36} r={WATER_RING_RADIUS} fill="none" stroke="#2A2A2A" strokeWidth={8} />
            <motion.circle
              cx={36} cy={36} r={WATER_RING_RADIUS}
              fill="none"
              stroke={isComplete ? "#22c55e" : "#3b82f6"}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={WATER_CIRCUMFERENCE}
              initial={{ strokeDashoffset: WATER_CIRCUMFERENCE }}
              animate={{ strokeDashoffset: ringOffset }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets
              size={14}
              className={isComplete ? "text-primary" : "text-blue-400"}
              aria-hidden="true"
            />
            <span className="text-[10px] font-bold text-white mt-0.5">
              {Math.round(pct * 100)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Consumed</span>
            <span className="text-sm font-bold text-white tabular-nums">
              <CountUp to={totalMl} duration={0.4} />ml
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#2A2A2A] overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", isComplete ? "bg-primary" : "bg-blue-500")}
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground/80">
            <span>Daily goal</span>
            <span>{mlLabel(goalMl)}</span>
          </div>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <motion.button
            key={p.ml}
            onClick={() => handlePreset(p.ml)}
            disabled={adding}
            whileTap={{ scale: 0.95 }}
            aria-label={`Add ${mlLabel(p.ml)}`}
            className={cn(
              "flex flex-col items-center py-2 rounded-xl border text-[10px] transition-colors",
              "border-[#2A2A2A] text-muted-foreground",
              "hover:border-blue-500/40 hover:text-blue-300 hover:bg-blue-500/5",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <span className="font-semibold">{mlLabel(p.ml)}</span>
            <span className="text-muted-foreground/80 mt-0.5">{p.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex gap-2">
        <Input
          type="number"
          min={1}
          max={2000}
          placeholder="Custom ml"
          value={customMl}
          onChange={(e) => setCustomMl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCustom()}
          aria-label="Custom water amount in ml"
          className="bg-[#1A1A1A] border-[#2A2A2A] focus:border-blue-500 focus:ring-blue-500/20"
        />
        <Button
          onClick={handleCustom}
          disabled={!customMl || adding}
          size="sm"
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 shrink-0"
        >
          Add
        </Button>
      </div>

      {/* Entry history toggle */}
      {water && water.entries && water.entries.length > 0 && (
        <div>
          <button
            onClick={() => setShowEntries((v) => !v)}
            className="text-[11px] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
          >
            {showEntries ? "Hide" : "Show"} entries ({water.entries.length})
          </button>
          {showEntries && (
            <div className="mt-2 space-y-1">
              {water.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Droplets size={10} className="text-blue-400" aria-hidden="true" />
                    <span className="text-white font-medium">{mlLabel(entry.amount_ml)}</span>
                  </div>
                  <button
                    onClick={() => removeWater(entry.id)}
                    aria-label={`Remove ${mlLabel(entry.amount_ml)}`}
                    className="text-muted-foreground/30 hover:text-red-400 transition-colors p-0.5"
                  >
                    <X size={11} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
