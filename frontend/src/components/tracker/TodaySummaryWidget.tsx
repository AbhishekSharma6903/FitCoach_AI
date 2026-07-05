import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { FoodLogEntry, MacroTotals } from "@/types/nutrition";
import { countLoggedMeals, computeMealDistribution } from "@/lib/trackerUtils";

interface TodaySummaryWidgetProps {
  entries: FoodLogEntry[];
  totals: MacroTotals;
}

const MEAL_COLORS: Record<string, string> = {
  breakfast: "bg-amber-400",
  lunch:     "bg-yellow-400",
  dinner:    "bg-blue-400",
  snack:     "bg-orange-400",
};

/** Desktop right-column summary — not shown on mobile (covered by NutritionSummaryCard). */
export default function TodaySummaryWidget({ entries, totals }: TodaySummaryWidgetProps) {
  const mealCount = countLoggedMeals(entries);
  const dist = computeMealDistribution(entries);

  return (
    <Card padding="md" className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Today
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-2xl font-black text-white tabular-nums">
            {Math.round(totals.calories_kcal).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">kcal logged</p>
        </div>
        <div>
          <p className="text-2xl font-black text-white tabular-nums">{entries.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {entries.length === 1 ? "item" : "items"} · {mealCount} meal{mealCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Multi-meal badge (F-3) */}
      {mealCount >= 3 && (
        <p className="text-xs text-primary">
          📋 {mealCount} meals logged today
        </p>
      )}

      {/* Meal distribution */}
      {dist && dist.total > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Meal split
          </p>
          <div className="flex h-2 rounded-full overflow-hidden gap-px">
            {(["breakfast", "lunch", "dinner", "snack"] as const).map((s) => {
              const pct = dist.total > 0 ? (dist[s] / dist.total) * 100 : 0;
              return pct > 0 ? (
                <div
                  key={s}
                  style={{ width: `${pct}%` }}
                  className={cn("h-full", MEAL_COLORS[s])}
                  title={`${s}: ${Math.round(pct)}%`}
                />
              ) : null;
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground/50 italic">Nothing logged yet</p>
      )}
    </Card>
  );
}
