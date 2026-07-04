"use client";
import { Target } from "lucide-react";
import type { Milestone } from "@/types/dashboard";

export default function MilestoneCard({ milestone }: { milestone: Milestone }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-brand-500/10 rounded-2xl border border-brand-500/20">
      <Target size={20} className="text-brand-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-brand-300">Next milestone: {milestone.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {milestone.target_weight_kg} kg — est.{" "}
          {new Date(milestone.estimated_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          <span className="ml-1 text-brand-500">({milestone.weeks_away} weeks away)</span>
        </p>
      </div>
    </div>
  );
}
