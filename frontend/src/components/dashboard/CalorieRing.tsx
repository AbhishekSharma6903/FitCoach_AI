"use client";

import { motion } from "motion/react";
import CountUp from "./CountUp";
import { cn } from "@/lib/utils";

interface CalorieRingProps {
  consumed: number;
  target: number;
  burned?: number;
  /** px diameter — 160 mobile, 200 desktop */
  size?: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // 326.7

/**
 * SVG donut ring showing calories consumed vs target.
 * Draws in from 0 using strokeDashoffset (AG-6 — NOT pathLength).
 * Used inside CalorieHeroCard — purely presentational.
 */
export default function CalorieRing({
  consumed,
  target,
  burned = 0,
  size = 160,
}: CalorieRingProps) {
  const net = Math.max(0, consumed - burned);
  const pct = target > 0 ? Math.min(net / target, 1) : 0;
  const isOver = consumed > target;
  const strokeColor = isOver ? "#ef4444" : "#22c55e";
  const glowColor = isOver ? "#ef444430" : "#22c55e30";
  const targetOffset = CIRCUMFERENCE * (1 - pct);

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={64} cy={64} r={RADIUS}
          fill="none"
          stroke="#2A2A2A"
          strokeWidth={12}
        />
        {/* Glow layer */}
        <motion.circle
          cx={64} cy={64} r={RADIUS}
          fill="none"
          stroke={glowColor}
          strokeWidth={18}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: 1.0, ease: "easeOut" }}
        />
        {/* Progress arc */}
        <motion.circle
          cx={64} cy={64} r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ duration: 1.0, ease: "easeOut" }}
        />
      </svg>

      {/* Centre text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <CountUp
          to={consumed}
          duration={1.2}
          className={cn(
            "font-black text-white tabular-nums leading-none",
            size >= 180 ? "text-5xl" : "text-4xl",
          )}
        />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
          kcal
        </span>
        {burned > 0 && (
          <span className="text-[10px] text-orange-400 mt-0.5">
            🔥 −{burned}
          </span>
        )}
      </div>
    </div>
  );
}
