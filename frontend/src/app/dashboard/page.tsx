"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useWeightLog } from "@/hooks/useWeightLog";
import Card from "@/components/ui/Card";
import CalorieRing from "@/components/dashboard/CalorieRing";
import MacroBarsGroup from "@/components/dashboard/MacroBarsGroup";
import WeightProgressChart from "@/components/dashboard/WeightProgressChart";
import StreakCounter from "@/components/dashboard/StreakCounter";
import MilestoneCard from "@/components/dashboard/MilestoneCard";
import DailySummaryBanner from "@/components/dashboard/DailySummaryBanner";
import WaterIntakePanel from "@/components/dashboard/WaterIntakePanel";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

// Loaded only in non-dev mode to avoid Clerk calls during development
function ClerkUserButton() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { UserButton } = require("@clerk/nextjs");
  return <UserButton />;
}

function getBmiCategory(bmi: number): { label: string; color: string; bg: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400", bg: "bg-blue-500/15" };
  if (bmi < 25) return { label: "Healthy", color: "text-green-400", bg: "bg-green-500/15" };
  if (bmi < 30) return { label: "Overweight", color: "text-yellow-400", bg: "bg-yellow-500/15" };
  return { label: "Obese", color: "text-red-400", bg: "bg-red-500/15" };
}

export default function DashboardPage() {
  const router = useRouter();
  const { dashboard, isLoading, isValidating, error } = useDashboard();
  const { logWeight } = useWeightLog();
  const [weightInput, setWeightInput] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);

  useEffect(() => {
    if (!isLoading && !isValidating && error) {
      // In dev mode the profile is always pre-seeded via migration — never redirect
      // to onboarding. If the API is down, stay on dashboard with an error state.
      if (!DEV_MODE) {
        router.replace("/onboarding");
      }
    }
  }, [isLoading, isValidating, error, router]);

  async function handleLogWeight() {
    if (!weightInput || isNaN(Number(weightInput))) return;
    setLoggingWeight(true);
    try {
      await logWeight(Number(weightInput));
      setWeightInput("");
    } finally {
      setLoggingWeight(false);
    }
  }

  if (isLoading || (isValidating && !dashboard && !error) || (!dashboard && !error)) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <Spinner className="w-8 h-8" />
    </div>
  );

  if (!dashboard) return null; // redirect in progress

  // dashboard is guaranteed non-null from here
  const d = dashboard;

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <DailySummaryBanner
          name={d.user_name}
          date={d.today_date}
          caloriesConsumed={d.calories_consumed}
          caloriesTarget={d.calories_target}
        />

        {/* Action bar */}
        <div className="flex gap-2 items-center">
          <Link href="/tracker" className="flex-1">
            <Button className="w-full" size="sm">+ Log Food</Button>
          </Link>
          <Link href="/workout">
            <Button variant="secondary" size="sm" title="Log workout">🏋️</Button>
          </Link>
          <Link href="/dishes">
            <Button variant="secondary" size="sm" title="My custom dishes">🍽️</Button>
          </Link>
          <div className="flex-1 flex gap-2">
            <input
              type="number"
              placeholder="Weight (kg)"
              className="flex-1 rounded-xl border border-gray-700 bg-gray-800 text-gray-100 placeholder-gray-600 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              step={0.1}
            />
            <Button variant="secondary" size="sm" onClick={handleLogWeight} disabled={loggingWeight}>
              {loggingWeight ? "..." : "Log"}
            </Button>
          </div>
          {/* Avatar → /profile */}
          <Link href="/profile" className="p-1 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-gray-800 transition-colors" title="Edit profile">
            <span className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-400 font-bold text-sm flex items-center justify-center">
              {d.user_name?.[0]?.toUpperCase() ?? "?"}
            </span>
          </Link>
          {!DEV_MODE && <ClerkUserButton />}
        </div>

        {/* Calories + Streak */}
        <div className="grid grid-cols-3 gap-5">
          {/* Calorie Ring Card */}
          <Card className="col-span-2 p-5 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-1 mb-3">
              <span className="text-5xl font-black text-white leading-none">
                {d.calories_consumed}
              </span>
              <span className="text-sm text-gray-400 font-medium">kcal consumed</span>
              <span className="text-xs text-gray-500">of {d.calories_target} kcal goal</span>
            </div>
            <CalorieRing consumed={d.calories_consumed} target={d.calories_target} burned={d.calories_burned_today} />
          </Card>

          {/* Streak + BMI Card */}
          <Card className="p-5 flex flex-col justify-center items-center gap-4">
            {/* Streak section */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500/15 mb-1">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-3xl font-black text-white leading-none">
                {d.streak_days}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {d.streak_days > 0 ? "day streak 🔥" : "day streak"}
              </span>
              <span className="text-xs text-gray-500 text-center leading-tight">
                {d.streak_days === 0 ? "Start today!" : d.streak_days === 1 ? "Keep it up!" : "Amazing work!"}
              </span>
            </div>

            {/* BMI section */}
            {d.bmi && (() => {
              const bmiCat = getBmiCategory(d.bmi);
              return (
                <div className="text-center border-t border-gray-800 pt-4 w-full flex flex-col items-center gap-1.5">
                  <p className="text-2xl font-bold text-gray-100 leading-none">{d.bmi.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">BMI</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${bmiCat.bg} ${bmiCat.color}`}>
                    {bmiCat.label}
                  </span>
                </div>
              );
            })()}
          </Card>
        </div>

        {/* Macros */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Today&apos;s Macros</h3>
          {/* Macro bars with visible track even at zero state */}
          <div className="space-y-3">
            {[
              { label: "Protein", consumed: d.macros_consumed?.protein ?? 0, target: d.macros_target?.protein ?? 0, color: "bg-blue-500" },
              { label: "Carbs", consumed: d.macros_consumed?.carbs ?? 0, target: d.macros_target?.carbs ?? 0, color: "bg-amber-500" },
              { label: "Fat", consumed: d.macros_consumed?.fat ?? 0, target: d.macros_target?.fat ?? 0, color: "bg-orange-500" },
            ].map(({ label, consumed, target, color }) => {
              const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-xs font-medium text-gray-400">{label}</span>
                    <span className="text-xs text-gray-500">
                      <span className="text-gray-200 font-semibold">{consumed}g</span>
                      {" / "}{target}g
                    </span>
                  </div>
                  {/* Track always visible */}
                  <div className="w-full bg-gray-700 h-2 rounded-full">
                    <div
                      className={`${color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Also render the original component for any extra logic it handles */}
          <div className="hidden">
            <MacroBarsGroup consumed={d.macros_consumed} target={d.macros_target} />
          </div>
        </Card>

        {/* Milestone */}
        {d.next_milestone && <MilestoneCard milestone={d.next_milestone} />}

        {/* Water Intake */}
        <WaterIntakePanel
          initialTotal={d.water.total_ml}
          initialGoal={d.water.goal_ml}
        />

        {/* Weight Chart */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Weight Progress</h3>
          <div className="[&_.recharts-cartesian-axis-tick-value]:!text-[11px] [&_.recharts-cartesian-axis-tick-value]:!fill-[#9ca3af]">
            <WeightProgressChart entries={d.weight_entries} goalWeight={d.goal_weight_kg} />
          </div>
        </Card>

      </div>
    </div>
  );
}