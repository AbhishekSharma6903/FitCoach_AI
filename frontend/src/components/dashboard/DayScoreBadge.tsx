"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface DayScoreBadgeProps {
  score: number; // 0-100
}

const RADIUS = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DayScoreBadge({ score }: DayScoreBadgeProps) {
  const pct = Math.min(score / 100, 1);
  const offset = CIRCUMFERENCE * (1 - pct);

  const color =
    score >= 70 ? "#22c55e" :
    score >= 40 ? "#f59e0b" :
    "#6B7280";

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      title={`Day score: ${score}% (Calories + Hydration + Protein)`}
      style={{ width: 28, height: 28 }}
    >
      <svg width={28} height={28} viewBox="0 0 28 28" className="-rotate-90" aria-hidden="true">
        <circle cx={14} cy={14} r={RADIUS} fill="none" stroke="#2A2A2A" strokeWidth={3} />
        <motion.circle
          cx={14} cy={14} r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <span
        className={cn("absolute text-[8px] font-black tabular-nums")}
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}
