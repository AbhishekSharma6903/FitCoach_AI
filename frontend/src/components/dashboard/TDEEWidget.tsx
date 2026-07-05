"use client";

import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface TDEEWidgetProps {
  tdeeKcal: number;
  caloriesTarget: number;
  caloriesNet: number;
}

export default function TDEEWidget({
  tdeeKcal,
  caloriesTarget,
  caloriesNet,
}: TDEEWidgetProps) {
  const delta = caloriesTarget - tdeeKcal; // negative = deficit
  const isDeficit = delta <= 0;
  const absDelta = Math.abs(Math.round(delta));

  // F-2: estimated fat tissue change today in grams (7700 kcal ≈ 1kg fat)
  const fatChangeG =
    caloriesNet > 0
      ? Math.round(((caloriesNet - tdeeKcal) / 7700) * 1000)
      : null;

  return (
    <Card padding="md" className="space-y-2">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Daily Setup
      </p>

      {/* Primary deficit/surplus number */}
      <div>
        <span
          className={cn(
            "text-3xl font-black tabular-nums",
            isDeficit ? "text-primary" : "text-amber-400",
          )}
        >
          {isDeficit ? "−" : "+"}
          {absDelta}
        </span>
        <span className="text-sm text-muted-foreground ml-1.5">kcal</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {isDeficit ? "deficit" : "surplus"} per day
      </p>

      {/* F-2: fat change today */}
      {fatChangeG !== null && (
        <p
          className={cn(
            "text-xs font-medium",
            fatChangeG < 0 ? "text-green-400" : "text-amber-400",
          )}
        >
          ≈ {fatChangeG < 0 ? "−" : "+"}
          {Math.abs(fatChangeG)}g fat change today
        </p>
      )}

      {/* Sub-labels */}
      <div className="pt-1 space-y-0.5 border-t border-[#2A2A2A]">
        <p className="text-[10px] text-muted-foreground/60">
          Target: {Math.round(caloriesTarget)} kcal · Maintenance: {Math.round(tdeeKcal)} kcal
        </p>
      </div>
    </Card>
  );
}
