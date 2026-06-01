"use client";
import { cn } from "@/lib/utils";

interface MacroBarProps {
  label: string;
  consumed: number;
  target: number;
  color: string;
  unit?: string;
}

export default function MacroBar({ label, consumed, target, color, unit = "g" }: MacroBarProps) {
  const pct = Math.min((consumed / (target || 1)) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span className="font-medium text-gray-300">{label}</span>
        <span>{Math.round(consumed)}/{Math.round(target)}{unit}</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
