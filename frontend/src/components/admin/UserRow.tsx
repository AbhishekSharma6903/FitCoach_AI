"use client";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DIET_LABELS } from "@/lib/profileUtils";
import type { AdminUserSummary } from "@/hooks/useAdminUsers";

// Deterministic colour from name initial — 8 palette options
const AVATAR_PALETTE = [
  "bg-blue-500/15 text-blue-400",
  "bg-purple-500/15 text-purple-400",
  "bg-orange-500/15 text-orange-400",
  "bg-pink-500/15 text-pink-400",
  "bg-cyan-500/15 text-cyan-400",
  "bg-yellow-500/15 text-yellow-400",
  "bg-green-500/15 text-green-400",
  "bg-red-500/15 text-red-400",
];

function avatarColour(name: string | null) {
  if (!name) return AVATAR_PALETTE[0];
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

interface UserRowProps {
  user: AdminUserSummary;
  onClick: () => void;
}

export default function UserRow({ user, onClick }: UserRowProps) {
  const initial = user.name?.[0]?.toUpperCase() ?? "?";
  const colour  = avatarColour(user.name);
  const dietLabel = user.diet_type ? (DIET_LABELS[user.diet_type] ?? user.diet_type) : null;
  const summary = [
    user.age ? `${user.age}y` : null,
    user.current_weight_kg && user.goal_weight_kg
      ? `${user.current_weight_kg}→${user.goal_weight_kg} kg`
      : null,
  ].filter(Boolean).join(" · ");

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
        "bg-[#111111] border border-[#2A2A2A]",
        "hover:bg-[#1A1A1A] transition-colors text-left",
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0",
        colour,
      )}>
        {initial}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {user.name ?? "Unknown user"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {summary || `ID: ${user.user_id.slice(0, 12)}…`}
        </p>
      </div>

      {/* Diet badge + chevron */}
      <div className="flex items-center gap-2 shrink-0">
        {dietLabel && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-[#2A2A2A]">
            {dietLabel}
          </Badge>
        )}
        <ChevronRight size={15} className="text-muted-foreground/40" aria-hidden="true" />
      </div>
    </button>
  );
}

export function UserRowSkeleton() {
  return <Skeleton className="h-[60px] rounded-xl" />;
}
