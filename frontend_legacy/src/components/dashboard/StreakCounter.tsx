"use client";
import { Flame } from "lucide-react";

export default function StreakCounter({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-2">
      <Flame
        size={24}
        className={streak > 0 ? "text-orange-400 animate-pulse" : "text-gray-700"}
        fill={streak > 0 ? "#fb923c" : "none"}
      />
      <div>
        <p className="text-xl font-bold text-gray-100">{streak}</p>
        <p className="text-xs text-gray-500">day streak</p>
      </div>
    </div>
  );
}
