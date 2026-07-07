"use client";

import { motion } from "motion/react";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
  computeCaloriePace,
  computeMealDistribution,
  calorieStatus,
  macroPct,
} from "@/lib/trackerUtils";
import type { MacroTotals } from "@/types/nutrition";
import type { FoodLogEntry } from "@/types/nutrition";

interface NutritionSummaryCardProps {
  totals: MacroTotals;
  targets: MacroTotals;
  entries: FoodLogEntry[];
}

const MACROS = [
  { key: "protein_g" as const, label: "Protein", dot: "bg-blue-500",   bar: "bg-blue-500"   },
  { key: "carbs_g"   as const, label: "Carbs",   dot: "bg-amber-400",  bar: "bg-amber-400"  },
  { key: "fat_g"     as const, label: "Fat",     dot: "bg-orange-500", bar: "bg-orange-500" },
  { key: "fiber_g"   as const, label: "Fiber",   dot: "bg-violet-400", bar: "bg-violet-400" },
] as const;

const MEAL_COLORS: Record<string, string> = {
  breakfast: "bg-amber-400",
  lunch:     "bg-yellow-400",
  dinner:    "bg-blue-400",
  snack:     "bg-orange-400",
};

export default function NutritionSummaryCard({
  totals,
  targets,
  entries,
}: NutritionSummaryCardProps) {
  const { isOver, value: remainValue, label: remainLabel, color: remainColor } =
    calorieStatus(totals.calories_kcal, targets.calories_kcal);
  const calPct = macroPct(totals.calories_kcal, targets.calories_kcal);

  const pace = computeCaloriePace(totals.calories_kcal, targets.calories_kcal);
  const dist = computeMealDistribution(entries);

  return (
    <Card padding="md" className="space-y-4">
      {/* Hero calorie number */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <span className={cn("text-4xl font-black tabular-nums", remainColor)}>
            {remainValue.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground ml-2">kcal {remainLabel}</span>
        </div>
        <span className="text-xs text-muted-foreground/80 shrink-0 pb-1">
          of {Math.round(targets.calories_kcal).toLocaleString()} goal
        </span>
      </div>

      {/* Calorie progress bar */}
      <div className="h-2 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", isOver ? "bg-red-500" : "bg-primary")}
          initial={{ width: 0 }}
          animate={{ width: `${calPct}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>

      {/* ── Mobile: compact macro dots (no bars — saves vertical space) ─────── */}
      <div className="lg:hidden grid grid-cols-4 gap-1">
        {MACROS.map((m) => (
          <div key={m.key} className="flex flex-col items-center gap-0.5">
            <span className={cn("w-2 h-2 rounded-full", m.dot)} aria-hidden="true" />
            <span className="text-xs font-semibold text-white tabular-nums">
              {Math.round(totals[m.key])}g
            </span>
            <span className="text-[9px] text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </div>

      {/* ── Desktop: full labelled bars ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:flex-col lg:gap-3">
        {MACROS.map((m) => {
          const pct = macroPct(totals[m.key], targets[m.key]);
          return (
            <div key={m.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", m.dot)} aria-hidden="true" />
                  <span className="text-xs font-medium text-foreground/80">{m.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white tabular-nums">
                    {Math.round(totals[m.key])}g
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {Math.round(targets[m.key])}g
                  </span>
                  <span className="text-[10px] text-muted-foreground/80 w-7 text-right tabular-nums">
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="h-2 lg:h-2.5 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", m.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Calorie pace (F-1) — shown after noon when food logged */}
      {pace && (
        <p className={cn("text-xs", pace.color)}>
          On pace for ~{pace.projected.toLocaleString()} kcal today
        </p>
      )}

      {/* Meal distribution bar (F-2) — only when 2+ meal types logged */}
      {dist && dist.total > 0 && (
        <div className="space-y-1">
          <div className="flex h-2 rounded-full overflow-hidden gap-px">
            {(["breakfast", "lunch", "dinner", "snack"] as const).map((slot) => {
              const pct = (dist[slot] / dist.total) * 100;
              return pct > 0 ? (
                <div
                  key={slot}
                  style={{ width: `${pct}%` }}
                  className={cn("h-full", MEAL_COLORS[slot])}
                  title={`${slot}: ${Math.round(pct)}%`}
                />
              ) : null;
            })}
          </div>
          <div className="flex gap-3 flex-wrap">
            {(["breakfast", "lunch", "dinner", "snack"] as const)
              .filter((s) => dist[s] > 0)
              .map((s) => (
                <span key={s} className="text-[9px] text-muted-foreground capitalize">
                  <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle", MEAL_COLORS[s])} />
                  {s} {Math.round((dist[s] / dist.total) * 100)}%
                </span>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
}
