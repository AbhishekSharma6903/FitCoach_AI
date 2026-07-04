"use client";

interface Props {
  name: string;
  date: string;
  caloriesConsumed: number;
  caloriesTarget: number;
}

export default function DailySummaryBanner({ name, date, caloriesConsumed, caloriesTarget }: Props) {
  const remaining = caloriesTarget - caloriesConsumed;
  const over = remaining < 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <h2 className="text-xl font-bold text-gray-100">{greeting}, {name} 👋</h2>
        <p className="text-sm text-gray-500">
          {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>
      <div className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
        over
          ? "bg-red-500/10 border-red-500/30 text-red-400"
          : "bg-brand-500/10 border-brand-500/30 text-brand-400"
      }`}>
        {over ? `${Math.abs(Math.round(remaining))} kcal over` : `${Math.round(remaining)} kcal left`}
      </div>
    </div>
  );
}
