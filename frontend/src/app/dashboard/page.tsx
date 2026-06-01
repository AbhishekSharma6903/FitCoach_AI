"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
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

export default function DashboardPage() {
  const router = useRouter();
  const { dashboard, isLoading, isValidating, error } = useDashboard();
  const { logWeight } = useWeightLog();
  const [weightInput, setWeightInput] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);

  // Only redirect to onboarding when we have a confirmed error with no
  // background revalidation in flight — prevents spurious redirects when SWR
  // returns a stale cached error immediately after the onboarding wizard
  // creates the profile and pushes to /dashboard.
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

  if (!isValidating && (error || !dashboard)) return null; // redirect in progress

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <DailySummaryBanner
          name={dashboard.user_name}
          date={dashboard.today_date}
          caloriesConsumed={dashboard.calories_consumed}
          caloriesTarget={dashboard.calories_target}
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
          <UserButton />
        </div>

        {/* Calories + Streak */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="col-span-2 flex flex-col items-center justify-center py-6">
            <CalorieRing consumed={dashboard.calories_consumed} target={dashboard.calories_target} />
          </Card>
          <Card className="flex flex-col justify-center items-center gap-4">
            <StreakCounter streak={dashboard.streak_days} />
            {dashboard.bmi && (
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-100">{dashboard.bmi.toFixed(1)}</p>
                <p className="text-xs text-gray-500">BMI</p>
              </div>
            )}
          </Card>
        </div>

        {/* Macros */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Today&apos;s Macros</h3>
          <MacroBarsGroup consumed={dashboard.macros_consumed} target={dashboard.macros_target} />
        </Card>

        {/* Milestone */}
        {dashboard.next_milestone && <MilestoneCard milestone={dashboard.next_milestone} />}

        {/* Water Intake */}
        <WaterIntakePanel
          initialTotal={dashboard.water.total_ml}
          initialGoal={dashboard.water.goal_ml}
        />

        {/* Weight Chart */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Weight Progress</h3>
          <WeightProgressChart entries={dashboard.weight_entries} goalWeight={dashboard.goal_weight_kg} />
        </Card>
      </div>
    </div>
  );
}
