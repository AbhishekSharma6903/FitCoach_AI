import { Skeleton } from "@/components/ui/skeleton";

/** All dashboard skeleton placeholders rendered simultaneously on load */
export function DashboardSkeletons() {
  return (
    <div className="space-y-6">
      {/* Calorie hero */}
      <Skeleton className="h-52 w-full rounded-2xl" />
      {/* Macros */}
      <Skeleton className="h-40 w-full rounded-2xl" />
      {/* Streak/BMI + Milestone row (mobile) */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      {/* Water */}
      <Skeleton className="h-44 w-full rounded-2xl" />
      {/* Chart */}
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

/** Right column skeletons (desktop only) */
export function RightColumnSkeletons() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  );
}
