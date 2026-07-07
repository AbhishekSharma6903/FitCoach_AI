"use client";

import { motion } from "motion/react";
import {
  Users2, UtensilsCrossed, Dumbbell, ImageIcon,
} from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import AdminSubNav from "@/components/admin/AdminSubNav";
import { AdminStatCard, AdminStatCardSkeleton } from "@/components/admin/AdminStatCard";
import UserRow, { UserRowSkeleton } from "@/components/admin/UserRow";
import Card from "@/components/ui/Card";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/lib/motionVariants";
import { DIET_LABELS } from "@/lib/profileUtils";

const STAT_ICONS = [
  { key: "total_users",             icon: <Users2 size={14} />,          label: "Users" },
  { key: "total_food_items",        icon: <UtensilsCrossed size={14} />, label: "Food Items" },
  { key: "total_exercises",         icon: <Dumbbell size={14} />,        label: "Exercises" },
  { key: "exercises_with_images",   icon: <ImageIcon size={14} />,       label: "With Images" },
] as const;

export default function AdminPage() {
  const { stats, loading: statsLoading } = useAdminCheck();
  const { users, isLoading: usersLoading } = useAdminUsers();

  // Show last 5 for the preview strip
  const recentUsers = users.slice(0, 5);

  return (
    <PageShell title="Admin">
      <div className="space-y-6 pt-2">

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground lg:text-2xl">Admin Panel</h1>
          </div>
          <AdminSubNav />
        </div>

        {/* Stat cards */}
        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <AdminStatCardSkeleton key={i} />
            ))}
          </div>
        ) : stats ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="show"
          >
            {STAT_ICONS.map(({ key, icon, label }) => (
              <motion.div key={key} variants={STAGGER_ITEM}>
                <AdminStatCard
                  icon={icon}
                  value={stats[key]}
                  label={label}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {/* Recent users strip */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            Recent Users
          </p>

          {usersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <UserRowSkeleton key={i} />)}
            </div>
          ) : recentUsers.length === 0 ? (
            <Card padding="md">
              <p className="text-sm text-muted-foreground text-center py-4">No users yet.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentUsers.map(user => {
                const dietLabel = user.diet_type ? (DIET_LABELS[user.diet_type] ?? user.diet_type) : "";
                const summary   = [
                  user.age ? `${user.age}y` : null,
                  dietLabel || null,
                ].filter(Boolean).join(" · ");

                return (
                  <div
                    key={user.user_id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111111] border border-[#2A2A2A]"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                      {user.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{summary}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </PageShell>
  );
}
