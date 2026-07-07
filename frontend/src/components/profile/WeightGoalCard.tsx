"use client";

import Card from "@/components/ui/Card";
import type { UserProfile } from "@/types/profile";

interface WeightGoalCardProps {
  profile: UserProfile;
}

export default function WeightGoalCard({ profile }: WeightGoalCardProps) {
  const current = profile.current_weight_kg;
  const goal    = profile.goal_weight_kg;
  const weeks   = profile.time_to_reach_goal_weeks;

  if (!current || !goal || !weeks) return null;

  const delta         = goal - current;
  const isLoss        = delta < 0;
  const weeklyPace    = Math.abs(delta / weeks);
  const directionWord = isLoss ? "lose" : "gain";

  return (
    <Card padding="md">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
        Weight Goal
      </p>

      {/* Goal summary */}
      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-2xl font-black text-white tabular-nums">{current}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">current</p>
        </div>

        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full h-px bg-[#2A2A2A] relative">
            <span className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[10px] font-semibold px-2 bg-[#111111] ${isLoss ? "text-primary" : "text-amber-400"}`}>
                {isLoss ? "↓" : "↑"} {Math.abs(delta).toFixed(1)} kg
              </span>
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/80">{weeks} weeks</p>
        </div>

        <div className="text-center">
          <p className={`text-2xl font-black tabular-nums ${isLoss ? "text-primary" : "text-amber-400"}`}>
            {goal}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">goal</p>
        </div>
      </div>

      {/* Required pace */}
      <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
        <p className="text-xs text-muted-foreground">
          Need to{" "}
          <span className={isLoss ? "text-primary" : "text-amber-400"}>
            {directionWord} {weeklyPace.toFixed(2)} kg/week
          </span>{" "}
          to hit goal in {weeks} weeks.
        </p>
        <p className="text-[10px] text-muted-foreground/80 mt-1">
          Check your weight trend on the dashboard for actual pace.
        </p>
      </div>
    </Card>
  );
}
