"use client";

interface CalorieRingProps {
  consumed: number;
  target: number;
}

export default function CalorieRing({ consumed, target }: CalorieRingProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(consumed / (target || 1), 1);
  const offset = circumference * (1 - pct);
  const remaining = Math.max(0, target - consumed);
  const over = consumed > target;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#1f2937" strokeWidth="12" />
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={over ? "#ef4444" : "#22c55e"}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-gray-100">{Math.round(consumed)}</span>
          <span className="text-xs text-gray-500">kcal</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="text-sm text-gray-500">
          {over
            ? <span className="text-red-400 font-medium">{Math.round(consumed - target)} kcal over</span>
            : <span><span className="font-semibold text-brand-400">{Math.round(remaining)}</span> remaining</span>
          }
        </p>
        <p className="text-xs text-gray-600">of {Math.round(target)} kcal goal</p>
      </div>
    </div>
  );
}
