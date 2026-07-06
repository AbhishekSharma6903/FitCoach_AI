"use client";

import { Skeleton } from "@/components/ui/skeleton";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/layout/PageShell";
import IdentityCard from "@/components/profile/IdentityCard";
import StatsGrid from "@/components/profile/StatsGrid";
import WeightGoalCard from "@/components/profile/WeightGoalCard";
import MacrosCard from "@/components/profile/MacrosCard";
import UpdateGoalsForm from "@/components/profile/UpdateGoalsForm";
import AccountSection from "@/components/profile/AccountSection";
import { useProfile } from "@/hooks/useProfile";
import { useDashboard } from "@/hooks/useDashboard";
import Link from "next/link";

function ProfileSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-52 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

export default function ProfilePage() {
  const { profile, isLoading, mutate: mutateProfile } = useProfile();
  const { mutate: mutateDashboard }                   = useDashboard();

  // Called after a successful PUT — revalidate both SWR caches
  function handleSaved() {
    mutateProfile();
    mutateDashboard();
  }

  return (
    <PageShell title="Profile">
      <div className="space-y-5 pt-2 pb-6">

        {isLoading && <ProfileSkeleton />}

        {/* Profile 404 — onboarding not done */}
        {!isLoading && !profile && (
          <Card padding="md" className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">No profile found</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Complete onboarding to set up your calorie targets, macros, and goals.
            </p>
            <Link
              href="/onboarding"
              className="h-10 px-5 bg-primary text-black text-sm font-semibold rounded-xl
                         hover:bg-green-400 active:scale-[0.98] transition-all inline-flex items-center"
            >
              Start Onboarding
            </Link>
          </Card>
        )}

        {profile && (
          <>
            {/* Desktop page heading (mobile gets it from PageShell title) */}
            <h1 className="hidden lg:block text-2xl font-bold text-foreground">Profile</h1>

            <IdentityCard profile={profile} />
            <StatsGrid profile={profile} />
            <WeightGoalCard profile={profile} />
            <MacrosCard profile={profile} />
            <UpdateGoalsForm profile={profile} onSaved={handleSaved} />
            <AccountSection />
          </>
        )}

      </div>
    </PageShell>
  );
}
