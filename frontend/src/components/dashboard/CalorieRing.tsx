"use client";
import { Flame } from "lucide-react";

interface CalorieRingProps {
  consumed: number;
  target: number;
  burned?: number;
}

export default function CalorieRing({ consumed, target, burned = 0 }: CalorieRingProps) {
  const radius       = 54;
  const circumference = 2 * Math.PI * radius;
  // Ring shows NET calories (consumed − burned) vs target
  const net     = Math.max(0, consumed - burned);
  const pct     = Math.min(net / (target || 1), 1);
  const offset  = circumference * (1 - pct);
  const remaining = Math.max(0, target - net);
  const over    = net > target;

  return (
    <div className="flex flex-col items-center p-6">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          {/* Track */}
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#1f2937" strokeWidth="13" />
          {/* Glow */}
          <circle cx="64" cy="64" r={radius} fill="none"
            stroke={over ? "#ef444440" : "#22c55e30"} strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} />
          {/* Progress */}
          <circle cx="64" cy="64" r={radius} fill="none"
            stroke={over ? "#ef4444" : "#22c55e"} strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-5xl font-black text-white leading-none">{Math.round(consumed)}</span>
          <span className="text-xs text-gray-400 mt-1 tracking-widest uppercase">kcal</span>
          {burned > 0 && (
            <span className="mt-0.5 text-[10px] text-orange-400 flex items-center gap-0.5">
              <Flame size={9} />−{Math.round(burned)} burned
            </span>
          )}
          <span className="mt-1 text-[10px] text-gray-500 tracking-wide">of {Math.round(target)}</span>
        </div>
      </div>

      <div className="mt-5 text-center">
        {over ? (
          <p className="text-sm font-semibold text-red-400">{Math.round(net - target)} kcal over goal</p>
        ) : (
          <p className="text-sm">
            <span className="font-bold text-white text-base">{Math.round(remaining)}</span>{" "}
            <span className="text-gray-400">{burned > 0 ? "net kcal remaining" : "kcal remaining"}</span>
          </p>
        )}
        <div className="mt-3 w-36 mx-auto">
          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(pct * 100, 100)}%`, backgroundColor: over ? "#ef4444" : "#22c55e" }} />
          </div>
          <p className="text-[10px] text-gray-600 mt-1">{Math.round(pct * 100)}% of daily goal</p>
        </div>
      </div>
    </div>
  );
}
