"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { WeightPoint } from "@/types/dashboard";

interface Props {
  entries: WeightPoint[];
  goalWeight: number;
}

export default function WeightProgressChart({ entries, goalWeight }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-600 text-sm">
        <p>No weight entries yet</p>
        <p className="text-xs mt-1 text-gray-700">Log your weight to see progress</p>
      </div>
    );
  }

  const data = entries.map((e) => ({
    date: new Date(e.log_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    weight: e.weight_kg,
  }));

  const weights = entries.map((e) => e.weight_kg);
  const minY = Math.floor(Math.min(...weights, goalWeight) - 1);
  const maxY = Math.ceil(Math.max(...weights, goalWeight) + 1);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
        <YAxis domain={[minY, maxY]} tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #374151", background: "#111827", color: "#f9fafb" }}
          formatter={(v) => v != null ? [`${v} kg`, "Weight"] : ["", "Weight"]}
        />
        <ReferenceLine
          y={goalWeight}
          stroke="#22c55e"
          strokeDasharray="4 4"
          label={{ value: `Goal: ${goalWeight}kg`, position: "insideTopRight", fontSize: 10, fill: "#22c55e" }}
        />
        <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
