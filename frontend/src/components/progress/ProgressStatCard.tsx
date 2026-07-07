"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProgressStatCardProps {
  icon:        React.ReactNode;
  value:       string;
  label:       string;
  valueColor?: string; // Tailwind text class e.g. "text-primary" or "text-amber-400"
}

export function ProgressStatCard({ icon, value, label, valueColor }: ProgressStatCardProps) {
  return (
    <div className="rounded-2xl bg-[#111111] border border-[#2A2A2A] p-4 flex flex-col gap-1.5 min-h-24">
      <div className="text-muted-foreground/50">{icon}</div>
      <p className={cn("text-lg font-black tabular-nums truncate leading-tight", valueColor ?? "text-foreground")}>
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider leading-tight">
        {label}
      </p>
    </div>
  );
}

export function ProgressStatCardSkeleton() {
  return <Skeleton className="h-24 rounded-2xl" />;
}
