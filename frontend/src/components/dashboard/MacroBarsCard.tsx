"use client";

import { motion } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { computeMacroSplit } from "@/lib/dashboardUtils";
import type { MacroSnapshot } from "@/types/dashboard";

interface MacroBarsCardProps {
  consumed: MacroSnapshot;
  target: MacroSnapshot;
  currentWeightKg: number;
  hasLoggedFood: boolean;
}

const MACROS = [
  { key: "protein_g" as const, label: "Protein", dotColor: "bg-blue-500",    barColor: "bg-blue-500"    },
  { key: "carbs_g"   as const, label: "Carbs",   dotColor: "bg-amber-400",   barColor: "bg-amber-400"   },
  { key: "fat_g"     as const, label: "Fat",     dotColor: "bg-orange-500",  barColor: "bg-orange-500"  },
] as const;

const TARGET_PROTEIN_PER_KG = 1.6;

interface MacroBarRowProps {
  label: string;
  dotColor: string;
  barColor: string;
  consumed: number;
  targetVal: number;
}

function MacroBarRow({ label, dotColor, barColor, consumed, targetVal }: MacroBarRowProps) {
  const pct = targetVal > 0 ? Math.min((consumed / targetVal) * 100, 100) : 0;
  const completionPct = targetVal > 0 ? Math.round((consumed / targetVal) * 100) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor)} aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white tabular-nums">
            {Math.round(consumed)}g
          </span>
          <span className="text-xs text-muted-foreground">/ {Math.round(targetVal)}g</span>
          <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
            {completionPct}%
          </span>
        </div>
      </div>
      <div className="h-2 lg:h-2.5 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function MacroBarsCard({
  consumed,
  target,
  currentWeightKg,
  hasLoggedFood,
}: MacroBarsCardProps) {
  const split = computeMacroSplit(
    consumed.protein_g,
    consumed.carbs_g,
    consumed.fat_g,
  );

  const proteinPerKg = currentWeightKg > 0
    ? (consumed.protein_g / currentWeightKg)
    : 0;
  const proteinPerKgPct = Math.min(proteinPerKg / TARGET_PROTEIN_PER_KG, 1) * 100;

  return (
    <Card padding="md" className="space-y-4">
      {MACROS.map((m) => (
        <MacroBarRow
          key={m.key}
          label={m.label}
          dotColor={m.dotColor}
          barColor={m.barColor}
          consumed={consumed[m.key]}
          targetVal={target[m.key]}
        />
      ))}

      {/* Macro calorie split stacked bar */}
      <Separator className="bg-[#2A2A2A]" />
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
          Macro Split
        </p>
        <div className="flex h-2 rounded-full overflow-hidden">
          <div style={{ width: `${split.proteinPct}%` }} className="bg-blue-500" />
          <div style={{ width: `${split.carbsPct}%` }} className="bg-amber-400" />
          <div style={{ width: `${split.fatPct}%` }} className="bg-orange-500" />
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-blue-400">{split.proteinPct}% P</span>
          <span className="text-amber-400">{split.carbsPct}% C</span>
          <span className="text-orange-400">{split.fatPct}% F</span>
        </div>
      </div>

      {/* Protein density (F-1) — only when food is logged */}
      {hasLoggedFood && currentWeightKg > 0 && (
        <>
          <Separator className="bg-[#2A2A2A]" />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
                Protein Density
              </span>
              <span className="text-[10px] text-muted-foreground">
                Target: ≥{TARGET_PROTEIN_PER_KG} g/kg
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white tabular-nums shrink-0">
                {proteinPerKg.toFixed(1)} g/kg
              </span>
              <div className="flex-1 h-2 rounded-full bg-[#2A2A2A] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${proteinPerKgPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
