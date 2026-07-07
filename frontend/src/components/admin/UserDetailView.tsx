"use client";

import { ArrowLeft } from "lucide-react";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_LABELS, DIET_LABELS, EXPERIENCE_LABELS,
} from "@/lib/profileUtils";
import { useAdminUserDetail } from "@/hooks/useAdminUsers";

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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[#2A2A2A] last:border-0">
      <p className="text-xs text-muted-foreground shrink-0 w-36">{label}</p>
      <p className="text-xs text-foreground text-right">{value ?? "—"}</p>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-lg font-black text-foreground tabular-nums">{value ?? "—"}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

interface UserDetailViewProps {
  userId: string;
  onBack: () => void;
}

export default function UserDetailView({ userId, onBack }: UserDetailViewProps) {
  const { user, isLoading } = useAdminUserDetail(userId);

  if (isLoading || !user) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={15} aria-hidden="true" /> Back
        </button>
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const initial = user.name?.[0]?.toUpperCase() ?? "?";
  const colour  = avatarColour(user.name);

  const weeklyPace = user.current_weight_kg && user.goal_weight_kg
    ? Math.abs(user.current_weight_kg - user.goal_weight_kg)
    : null;

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        aria-label="Back to user list"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back
      </button>

      {/* Identity card */}
      <Card padding="md">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shrink-0",
            colour,
          )}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-foreground truncate">{user.name ?? "Unknown"}</p>
            <p className="text-sm text-muted-foreground">
              {[user.age && `${user.age}y`, user.gender, user.height_cm && `${user.height_cm} cm`]
                .filter(Boolean).join(" · ")}
            </p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5 font-mono">
              {user.user_id.length > 20
                ? `${user.user_id.slice(0, 12)}…${user.user_id.slice(-6)}`
                : user.user_id}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats grid */}
      <Card padding="md">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile label="BMI"    value={user.bmi ? user.bmi.toFixed(1) : null} />
          <StatTile label="TDEE"   value={user.tdee_kcal ? `${Math.round(user.tdee_kcal)} kcal` : null} />
          <StatTile label="Target" value={user.target_calories_kcal ? `${Math.round(user.target_calories_kcal)} kcal` : null} />
          <StatTile label="Protein target" value={user.protein_g ? `${Math.round(user.protein_g)}g` : null} />
        </div>
      </Card>

      {/* Profile details */}
      <Card padding="md">
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
          Profile
        </p>
        <Row label="Current weight" value={user.current_weight_kg ? `${user.current_weight_kg} kg` : null} />
        <Row label="Goal weight"    value={user.goal_weight_kg ? `${user.goal_weight_kg} kg` : null} />
        <Row label="Activity level" value={user.activity_level ? (ACTIVITY_LABELS[user.activity_level] ?? user.activity_level) : null} />
        <Row label="Diet type"      value={user.diet_type ? (DIET_LABELS[user.diet_type] ?? user.diet_type) : null} />
        <Row label="Experience"     value={user.experience_level ? (EXPERIENCE_LABELS[user.experience_level] ?? user.experience_level) : null} />
        {weeklyPace !== null && (
          <Row label="Weight delta" value={`${weeklyPace.toFixed(1)} kg`} />
        )}
        <Row label="Wants workout plan" value={
          user.wants_workout_split === true ? (
            <Badge variant="outline" className="text-[10px] text-green-400 border-green-400/30">Yes</Badge>
          ) : user.wants_workout_split === false ? (
            <Badge variant="outline" className="text-[10px] text-muted-foreground border-[#2A2A2A]">No</Badge>
          ) : null
        } />
        <Row label="Wants meal plan" value={
          user.wants_diet_plan === true ? (
            <Badge variant="outline" className="text-[10px] text-green-400 border-green-400/30">Yes</Badge>
          ) : user.wants_diet_plan === false ? (
            <Badge variant="outline" className="text-[10px] text-muted-foreground border-[#2A2A2A]">No</Badge>
          ) : null
        } />
      </Card>
    </div>
  );
}
