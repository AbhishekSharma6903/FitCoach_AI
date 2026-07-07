"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { aggregateByDay, categoryBreakdown } from "@/lib/progressUtils";
import type { WorkoutLogEntry } from "@/types/workout";

interface WorkoutVolumeChartProps {
  entries: WorkoutLogEntry[];
}

const CAT_COLOURS = {
  strength: "#22c55e",
  cardio:   "#3b82f6",
  other:    "#a855f7",
} as const;

export default function WorkoutVolumeChart({ entries }: WorkoutVolumeChartProps) {
  if (entries.length === 0) {
    return (
      <Card padding="md">
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2">
          Workout Volume
        </p>
        <div className="flex flex-col items-center py-8 gap-3 text-center">
          <p className="text-sm text-muted-foreground">No workouts in this period.</p>
          <Link
            href="/workout"
            className="text-xs text-primary hover:text-green-400 transition-colors"
          >
            Log a workout →
          </Link>
        </div>
      </Card>
    );
  }

  const data      = aggregateByDay(entries);
  const breakdown = categoryBreakdown(entries);

  return (
    <Card padding="md" className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Workout Volume
      </p>

      {/* Stacked bar chart */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1A1A",
                border: "1px solid #2A2A2A",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#F5F5F5",
              }}
              formatter={(v, name) => {
                const n = String(name ?? "");
                return [`${Math.round(Number(v ?? 0))} kcal`, n.charAt(0).toUpperCase() + n.slice(1)];
              }}
              cursor={{ fill: "#ffffff08" }}
            />
            <Bar dataKey="strength" stackId="a" fill={CAT_COLOURS.strength} radius={[0, 0, 0, 0]} />
            <Bar dataKey="cardio"   stackId="a" fill={CAT_COLOURS.cardio}   radius={[0, 0, 0, 0]} />
            <Bar dataKey="other"    stackId="a" fill={CAT_COLOURS.other}    radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown pills */}
      <div className="flex items-center gap-4 pt-1">
        {(["strength", "cardio", "other"] as const).map(cat => {
          const pct = breakdown[cat];
          if (pct === 0) return null;
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: CAT_COLOURS[cat] }}
              />
              <span className="text-[11px] text-muted-foreground capitalize">{cat}</span>
              <span className="text-[11px] font-semibold text-foreground">{pct}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function WorkoutVolumeChartSkeleton() {
  return <Skeleton className="h-55 rounded-2xl" />;
}
