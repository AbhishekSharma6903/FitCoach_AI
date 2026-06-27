"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function DashboardPage() {
  const router = useRouter();
  const { dashboard, isLoading, isValidating, error } = useDashboard();
  const { logWeight } = useWeightLog();
  const [weightInput, setWeightInput] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);

  useEffect(() => {
    if (!isLoading && !isValidating && error) {
      router.replace("/onboarding");
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
        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2 flex flex-col items-center justify-center py-6">
            <CalorieRing consumed={d.calories_consumed} target={d.calories_target} />
          </Card>
          <Card className="flex flex-col justify-center items-center gap-4">
            <StreakCounter streak={d.streak_days} />
            {d.bmi && (
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-100">{d.bmi.toFixed(1)}</p>
                <p className="text-xs text-gray-500">BMI</p>
              </div>
            )}
          </Card>
        </div>

        {/* Macros */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Today&apos;s Macros</h3>
          <MacroBarsGroup consumed={d.macros_consumed} target={d.macros_target} />
        </Card>

        {/* Milestone */}
        {d.next_milestone && <MilestoneCard milestone={d.next_milestone} />}

        {/* Water Intake */}
        <WaterIntakePanel
          initialTotal={d.water.total_ml}
          initialGoal={d.water.goal_ml}
        />

        {/* Weight Chart */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Weight Progress</h3>
          <WeightProgressChart entries={d.weight_entries} goalWeight={d.goal_weight_kg} />
        </Card>

      </div>
    </div>
  );
}
