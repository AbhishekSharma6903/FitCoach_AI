"use client";

import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Card from "@/components/ui/Card";
import { getBmiCategory, getStreakMotivation } from "@/lib/dashboardUtils";
import { cn } from "@/lib/utils";

interface StreakBMICardProps {
  streakDays: number;
  bmi: number | null;
}

export default function StreakBMICard({ streakDays, bmi }: StreakBMICardProps) {
  const motivation = getStreakMotivation(streakDays);

  return (
    <Card padding="md">
      <div className="grid grid-cols-2">
        {/* Streak — border-r divider (NOT Separator in grid — would create 3rd cell) */}
        <div className="flex flex-col items-center gap-1 pr-4 border-r border-[#2A2A2A]">
          <Flame size={20} className="text-orange-400" aria-hidden="true" />
          <span className="text-5xl font-black text-white tabular-nums leading-none">
            {streakDays}
          </span>
          <span className="text-xs text-muted-foreground">day streak</span>
          <span className="text-[10px] text-muted-foreground/80 text-center leading-tight mt-0.5">
            {motivation}
          </span>
        </div>

        {/* BMI */}
        <div className="flex flex-col items-center gap-1 pl-4">
          {bmi != null ? (
            <>
              <span className="text-4xl font-black text-white tabular-nums leading-none">
                {bmi.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">BMI</span>
              {(() => {
                const cat = getBmiCategory(bmi);
                return (
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] mt-1", cat.color)}
                  >
                    {cat.label}
                  </Badge>
                );
              })()}
            </>
          ) : (
            <span className="text-xs text-muted-foreground text-center">
              BMI not available
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
