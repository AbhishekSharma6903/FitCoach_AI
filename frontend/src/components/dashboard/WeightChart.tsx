"use client";

import {
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { computeWeeklyTrend, computePaceVsGoal } from "@/lib/dashboardUtils";
import type { WeightPoint } from "@/types/dashboard";

interface WeightChartProps {
  entries: WeightPoint[];
  goalWeightKg: number;
  timeToGoalWeeks: number;
}

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function WeightChart({
  entries,
  goalWeightKg,
  timeToGoalWeeks,
}: WeightChartProps) {
  if (entries.length === 0) return null; // empty state: hide card entirely

  const trend = computeWeeklyTrend(entries);
  const pace = computePaceVsGoal(entries, goalWeightKg, timeToGoalWeeks);

  const chartData = entries.map((e) => ({
    date: formatChartDate(e.log_date),
    weight: e.weight_kg,
  }));

  // Y-axis domain: min/max with small padding
  const weights = entries.map((e) => e.weight_kg);
  const yMin = Math.floor(Math.min(...weights, goalWeightKg) - 1);
  const yMax = Math.ceil(Math.max(...weights) + 1);

  // Trend text
  let trendText: string | null = null;
  let trendColor = "text-muted-foreground";
  if (trend !== null) {
    if (trend < -0.1) {
      trendText = `▼ Trending: −${Math.abs(trend).toFixed(1)} kg/week`;
      trendColor = "text-primary";
    } else if (trend > 0.1) {
      trendText = `▲ Gaining: +${trend.toFixed(1)} kg/week · Adjust intake ⚠️`;
      trendColor = "text-amber-400";
    } else {
      trendText = "→ Stable this week";
      trendColor = "text-muted-foreground";
    }
  }

  // Pace text
  let paceText: string | null = null;
  let paceColor = "text-muted-foreground/70";
  if (pace !== null) {
    const suffix =
      pace.deltaWeeks > 0
        ? `${pace.deltaWeeks} weeks ahead 🎉`
        : pace.deltaWeeks < 0
        ? `${Math.abs(pace.deltaWeeks)} weeks behind ⚠️`
        : "on schedule";
    paceText = `At current pace: goal in ~${pace.weeksAtPace} weeks · ${suffix}`;
    paceColor = pace.deltaWeeks >= 0 ? "text-primary/70" : "text-amber-400/70";
  }

  return (
    <Card padding="md" className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Weight Trend
      </p>

      {/* Trend + pace insight lines */}
      {trendText && (
        <p className={cn("text-xs font-medium", trendColor)}>{trendText}</p>
      )}
      {paceText && (
        <p className={cn("text-[10px]", paceColor)}>{paceText}</p>
      )}

      {/* Chart */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1A1A",
                border: "1px solid #2A2A2A",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#F5F5F5",
              }}
              formatter={(v) => [`${v ?? ""} kg`, "Weight"]}
            />
            {/* Goal reference line */}
            <ReferenceLine
              y={goalWeightKg}
              stroke="#22c55e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: `Goal ${goalWeightKg}kg`, position: "right", fontSize: 10, fill: "#22c55e" }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#F5F5F5"
              strokeWidth={2}
              dot={{ fill: "#22c55e", r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#22c55e" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
