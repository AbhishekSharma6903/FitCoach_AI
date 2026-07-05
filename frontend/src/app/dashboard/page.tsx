"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { useDashboard } from "@/hooks/useDashboard";
import PageShell from "@/components/layout/PageShell";
import CalorieHeroCard from "@/components/dashboard/CalorieHeroCard";
import MacroBarsCard from "@/components/dashboard/MacroBarsCard";
import StreakBMICard from "@/components/dashboard/StreakBMICard";
import MilestoneCard from "@/components/dashboard/MilestoneCard";
import TDEEWidget from "@/components/dashboard/TDEEWidget";
import WaterIntakeCard from "@/components/dashboard/WaterIntakeCard";
import WeightChart from "@/components/dashboard/WeightChart";
import WeightLogWidget from "@/components/dashboard/WeightLogWidget";
import DayScoreBadge from "@/components/dashboard/DayScoreBadge";
import { DashboardSkeletons, RightColumnSkeletons } from "@/components/dashboard/DashboardSkeletons";
import { computeDayScore, getGreeting, formatDisplayDate } from "@/lib/dashboardUtils";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

import type { Variants } from "motion/react";

// Stagger animation variants (AG-6: 30ms, NOT 50ms)
const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function DashboardPage() {
  const router = useRouter();
  const { dashboard: d, isLoading, error } = useDashboard();

  useEffect(() => {
    if (!isLoading && error && !DEV_MODE) {
      router.replace("/onboarding");
    }
  }, [isLoading, error, router]);

  if (isLoading || (!d && !error)) {
    return (
      <PageShell noHeader>
        <div className="pt-4">
          <DashboardSkeletons />
        </div>
      </PageShell>
    );
  }

  if (!d) return null;

  const greeting = getGreeting();
  const firstName = d.user_name.split(" ")[0];
  const formattedDate = formatDisplayDate(d.today_date);
  const dayScore = computeDayScore(d);
  const hasLoggedFood = d.calories_consumed > 0;
  const currentWeightKg =
    d.weight_entries.length > 0
      ? d.weight_entries[d.weight_entries.length - 1].weight_kg
      : 0;

  // ── Left column cards (mobile stacks all; desktop shows left col) ──────────
  const leftColumn = (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* 1. Calorie Hero */}
      <motion.div variants={fadeUp}>
        <CalorieHeroCard
          consumed={d.calories_consumed}
          target={d.calories_target}
          burned={d.calories_burned_today}
        />
      </motion.div>

      {/* 2. Macros */}
      <motion.div variants={fadeUp}>
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
          Today&apos;s Macros
        </p>
        <MacroBarsCard
          consumed={d.macros_consumed}
          target={d.macros_target}
          currentWeightKg={currentWeightKg}
          hasLoggedFood={hasLoggedFood}
        />
      </motion.div>

      {/* 3. Streak + BMI (mobile only — desktop shows in right col) */}
      <motion.div variants={fadeUp} className="xl:hidden">
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
          Today&apos;s Stats
        </p>
        <StreakBMICard streakDays={d.streak_days} bmi={d.bmi} />
      </motion.div>

      {/* 4. Milestone (mobile only) */}
      {d.next_milestone && (
        <motion.div variants={fadeUp} className="xl:hidden">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
            Next Milestone
          </p>
          <MilestoneCard
            milestone={d.next_milestone}
            weightEntries={d.weight_entries}
            currentWeightKg={currentWeightKg}
          />
        </motion.div>
      )}

      {/* 5. Water */}
      <motion.div variants={fadeUp}>
        <WaterIntakeCard />
      </motion.div>

      {/* 6. Weight Chart */}
      {d.weight_entries.length > 0 && (
        <motion.div variants={fadeUp}>
          <WeightChart
            entries={d.weight_entries}
            goalWeightKg={d.goal_weight_kg}
            timeToGoalWeeks={d.time_to_goal_weeks}
          />
        </motion.div>
      )}
    </motion.div>
  );

  // ── Right column (desktop xl+ only) ───────────────────────────────────────
  const rightColumn = (
    <div className="hidden xl:block">
      <div className="sticky top-20 max-h-[calc(100vh-80px)] overflow-y-auto space-y-4">
        <StreakBMICard streakDays={d.streak_days} bmi={d.bmi} />

        {d.next_milestone && (
          <MilestoneCard
            milestone={d.next_milestone}
            weightEntries={d.weight_entries}
            currentWeightKg={currentWeightKg}
          />
        )}

        {d.tdee_kcal != null && (
          <TDEEWidget
            tdeeKcal={d.tdee_kcal}
            caloriesTarget={d.calories_target}
            caloriesNet={d.calories_net}
          />
        )}

        <WeightLogWidget />
      </div>
    </div>
  );

  return (
    <PageShell noHeader>
      <div className="pt-2 pb-6">

        {/* ── Greeting row ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {dayScore !== null && <DayScoreBadge score={dayScore} />}
            {/* Ghost "Log Food" shortcut — desktop only, dashboard page only */}
            {/* Not in TopNav (redundant + dead click on /tracker) — see DESIGN_OVERVIEW.md §Log Food CTA */}
            <Link
              href="/tracker"
              className="hidden lg:flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#2A2A2A] text-muted-foreground text-xs font-medium hover:border-[#3A3A3A] hover:text-foreground transition-colors duration-120"
            >
              <Plus size={12} aria-hidden="true" />
              Log Food
            </Link>
            {/* Avatar — mobile only, desktop avatar is in TopNav */}
            <div className="lg:hidden flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm ring-1 ring-primary/20">
              {firstName[0]?.toUpperCase() ?? "?"}
            </div>
          </div>
        </div>

        {/* ── 2-col grid at xl (1280px+), single col below ─────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {leftColumn}
          {rightColumn}
        </div>

      </div>
    </PageShell>
  );
}
