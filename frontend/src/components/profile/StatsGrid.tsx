"use client";

import { motion } from "motion/react";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import CountUp from "@/components/dashboard/CountUp";
import { cn } from "@/lib/utils";
import { getBmiCategory, BMI_COLOURS } from "@/lib/profileUtils";
import type { UserProfile } from "@/types/profile";

interface StatsGridProps {
  profile: UserProfile;
}

interface StatCellProps {
  label: string;
  sublabel: string;
  value: number | null | undefined;
  decimals?: number;
  highlight?: boolean;
  badge?: React.ReactNode;
  extra?: React.ReactNode;
}

function StatCell({ label, sublabel, value, decimals = 0, highlight, badge, extra }: StatCellProps) {
  const display = value != null
    ? decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value)
    : null;

  return (
    <div className={cn(
      "flex flex-col items-center gap-1 p-3 rounded-xl border",
      highlight
        ? "bg-primary/5 border-primary/20"
        : "bg-[#1A1A1A] border-[#2A2A2A]",
    )}>
      {display != null ? (
        decimals > 0 ? (
          <span className={cn(
            "text-2xl font-black tabular-nums",
            highlight ? "text-primary" : "text-white",
          )}>
            {display}
          </span>
        ) : (
          <CountUp
            to={typeof display === "number" ? display : Number(display)}
            className={cn(
              "text-2xl font-black tabular-nums",
              highlight ? "text-primary" : "text-white",
            )}
          />
        )
      ) : (
        <span className="text-2xl font-black text-muted-foreground/30">—</span>
      )}
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-[10px] text-muted-foreground/50">{sublabel}</span>
      {badge}
      {extra}
    </div>
  );
}

export default function StatsGrid({ profile }: StatsGridProps) {
  const bmiCat = getBmiCategory(profile.bmi);
  const bmiColour = BMI_COLOURS[bmiCat];
  const delta = (profile.target_calories_kcal ?? 0) - (profile.tdee_kcal ?? 0);
  const isDeficit = delta < 0;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Your Stats
      </p>

      {/* 2-col mobile, 4-col sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCell
          label="BMI"
          sublabel="Body index"
          value={profile.bmi}
          decimals={1}
          badge={
            <Badge variant="outline" className={cn("text-[9px] mt-0.5", bmiColour)}>
              {bmiCat}
            </Badge>
          }
        />

        <StatCell
          label="Maintenance"
          sublabel="kcal/day"
          value={profile.tdee_kcal}
          extra={
            delta !== 0 && profile.target_calories_kcal ? (
              <span className={cn("text-[9px] mt-0.5", isDeficit ? "text-primary/70" : "text-amber-400/70")}>
                {isDeficit
                  ? `${Math.abs(Math.round(delta))} kcal deficit`
                  : `${Math.round(delta)} kcal surplus`}
              </span>
            ) : null
          }
        />

        <StatCell
          label="Target"
          sublabel="kcal/day"
          value={profile.target_calories_kcal}
          highlight
        />

        <StatCell
          label="Protein"
          sublabel="g / day"
          value={profile.protein_g}
        />
      </div>
    </div>
  );
}
