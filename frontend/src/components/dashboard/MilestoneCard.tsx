"use client";

import { Target } from "lucide-react";
import { motion } from "motion/react";
import Card from "@/components/ui/Card";
import type { Milestone, WeightPoint } from "@/types/dashboard";

interface MilestoneCardProps {
  milestone: Milestone;
  weightEntries: WeightPoint[];
  currentWeightKg: number;
}

export default function MilestoneCard({
  milestone,
  weightEntries,
  currentWeightKg,
}: MilestoneCardProps) {
  // Starting weight: first entry in 30-day window, or current weight as fallback
  const startWeight = weightEntries.length > 0
    ? weightEntries[0].weight_kg
    : currentWeightKg;

  const targetWeight = milestone.target_weight_kg;
  const totalChange = Math.abs(startWeight - targetWeight);
  const progressChange = Math.abs(currentWeightKg - startWeight);
  const progressPct = totalChange > 0
    ? Math.min((progressChange / totalChange) * 100, 100)
    : 0;

  const formattedDate = new Date(milestone.estimated_date + "T00:00:00")
    .toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <Card padding="md" className="border-l-[3px] border-l-primary">
      <div className="flex items-start gap-2 mb-3">
        <Target size={14} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{milestone.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {targetWeight} kg — est. {formattedDate}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            {milestone.weeks_away.toFixed(1)} weeks away
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2 w-full rounded-full bg-[#2A2A2A] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-right">
          {Math.round(progressPct)}% to milestone
        </p>
      </div>
    </Card>
  );
}
