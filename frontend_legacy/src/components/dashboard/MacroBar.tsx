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

  // Determine macro-specific color classes based on label for consistent color coding
  const getMacroColorClass = (label: string, fallbackColor: string): string => {
    const lower = label.toLowerCase();
    if (lower.includes("protein")) return "bg-blue-500";
    if (lower.includes("carb")) return "bg-amber-500";
    if (lower.includes("fat")) return "bg-orange-500";
    return fallbackColor;
  };

  const barColor = getMacroColorClass(label, color);

  // Percentage indicator color
  const getPctColor = (pct: number) => {
    if (pct >= 100) return "text-green-400";
    if (pct >= 75) return "text-yellow-400";
    return "text-gray-400";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Macro color dot indicator */}
          <span className={cn("inline-block w-2 h-2 rounded-full flex-shrink-0", barColor)} />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide truncate">
            {label}
          </span>
        </div>
        <div className="flex items-baseline gap-1 flex-shrink-0">
          <span className="text-sm text-gray-200 font-semibold">{Math.round(consumed)}</span>
          <span className="text-xs text-gray-500">
            /{Math.round(target)}{unit}
          </span>
          <span className={cn("text-xs font-medium ml-0.5", getPctColor(pct))}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      <div className="w-full h-2.5 bg-gray-700/80 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            barColor,
            pct >= 100 ? "opacity-100" : "opacity-90"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}