"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface AdminStatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

export function AdminStatCard({ icon, value, label }: AdminStatCardProps) {
  return (
    <div className="rounded-2xl bg-[#111111] border border-[#2A2A2A] p-4 flex flex-col gap-1.5">
      <div className="text-muted-foreground/50">{icon}</div>
      <p className="text-2xl font-black text-foreground tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

export function AdminStatCardSkeleton() {
  return (
    <Skeleton className="h-[88px] rounded-2xl" />
  );
}
