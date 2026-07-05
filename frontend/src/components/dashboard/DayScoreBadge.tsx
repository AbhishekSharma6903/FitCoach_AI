"use client";

import { motion } from "motion/react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DayScoreBadgeProps {
  score: number; // 0-100
}

const SMALL_RADIUS = 10;
const SMALL_CIRCUMFERENCE = 2 * Math.PI * SMALL_RADIUS;

const LARGE_RADIUS = 20;
const LARGE_CIRCUMFERENCE = 2 * Math.PI * LARGE_RADIUS;

function ScoreRing({ score, color }: { score: number; color: string }) {
  const offset = LARGE_CIRCUMFERENCE * (1 - Math.min(score / 100, 1));
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 48, height: 48 }}>
      <svg width={48} height={48} viewBox="0 0 48 48" className="-rotate-90" aria-hidden="true">
        <circle cx={24} cy={24} r={LARGE_RADIUS} fill="none" stroke="#2A2A2A" strokeWidth={4} />
        <motion.circle
          cx={24} cy={24} r={LARGE_RADIUS}
          fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={LARGE_CIRCUMFERENCE}
          initial={{ strokeDashoffset: LARGE_CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-[11px] font-black tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function DayScoreBadge({ score }: DayScoreBadgeProps) {
  const offset = SMALL_CIRCUMFERENCE * (1 - Math.min(score / 100, 1));

  const color =
    score >= 70 ? "#22c55e" :
    score >= 40 ? "#f59e0b" :
    "#6B7280";

  const label =
    score >= 70 ? "Great day! 🎉" :
    score >= 40 ? "Good progress 👍" :
    "Keep going 💪";

  return (
    <Popover>
      {/* Desktop: Tooltip on hover wraps the PopoverTrigger so both work independently */}
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              className="relative flex items-center justify-center shrink-0 cursor-pointer"
              style={{ width: 28, height: 28 }}
              aria-label={`Day score: ${score}%. Click for details.`}
            />
          }
        >
          {/* Small badge ring */}
          <svg width={28} height={28} viewBox="0 0 28 28" className="-rotate-90" aria-hidden="true">
            <circle cx={14} cy={14} r={SMALL_RADIUS} fill="none" stroke="#2A2A2A" strokeWidth={3} />
            <motion.circle
              cx={14} cy={14} r={SMALL_RADIUS}
              fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
              strokeDasharray={SMALL_CIRCUMFERENCE}
              initial={{ strokeDashoffset: SMALL_CIRCUMFERENCE }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            />
          </svg>
          <span
            className="absolute text-[8px] font-black tabular-nums pointer-events-none"
            style={{ color }}
          >
            {score}
          </span>
        </TooltipTrigger>

        {/* Hover tooltip — full card, desktop only */}
        <TooltipContent
          side="bottom"
          sideOffset={10}
          align="end"
          alignOffset={-4}
          hideArrow
          className="hidden lg:block w-64 bg-[#111111] border border-[#2A2A2A] rounded-2xl shadow-2xl shadow-black/60 p-4 space-y-3"
        >
          {/* Header: large ring + title */}
          <div className="flex items-center gap-3">
            <ScoreRing score={score} color={color} />
            <div>
              <p className="text-sm font-bold text-foreground">Day Score</p>
              <p className="text-xs font-medium" style={{ color }}>{label}</p>
            </div>
          </div>
          <div className="h-px bg-[#2A2A2A]" />
          {/* Breakdown */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
              Calculated from
            </p>
            {[
              { label: "Calories",  desc: "vs daily target" },
              { label: "Hydration", desc: "water goal %"    },
              { label: "Protein",   desc: "vs daily target" },
            ].map(({ label: l, desc }) => (
              <div key={l} className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-foreground">{l}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{desc}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-[#2A2A2A]" />
          {/* Legend */}
          <div className="flex justify-between text-[9px]">
            <span className="text-[#6B7280]">0–39 Keep going</span>
            <span className="text-amber-400">40–69 Good</span>
            <span className="text-primary">70+ Great</span>
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Click/tap popover — works on all devices */}
      <PopoverContent
        side="bottom"
        sideOffset={10}
        align="end"
        alignOffset={-4}
        className="w-64 bg-[#111111] border border-[#2A2A2A] rounded-2xl shadow-2xl shadow-black/60 p-4"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <ScoreRing score={score} color={color} />
            <div>
              <p className="text-sm font-bold text-foreground">Day Score</p>
              <p className="text-xs font-medium" style={{ color }}>{label}</p>
            </div>
          </div>
          <div className="h-px bg-[#2A2A2A]" />
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
              Calculated from
            </p>
            {[
              { label: "Calories",  desc: "vs daily target" },
              { label: "Hydration", desc: "water goal %"    },
              { label: "Protein",   desc: "vs daily target" },
            ].map(({ label: l, desc }) => (
              <div key={l} className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{l}</span>
                <span className="text-[10px] text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-[#2A2A2A]" />
          <div className="flex justify-between text-[9px]">
            <span className="text-[#6B7280]">0–39 Keep going</span>
            <span className="text-amber-400">40–69 Good</span>
            <span className="text-primary">70+ Great</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
