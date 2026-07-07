"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

/**
 * Probes GET /admin/stats to determine admin status.
 * 200 → isAdmin=true. 403 → redirect to /dashboard.
 *
 * Also returns the stats payload so the /admin page avoids a second fetch.
 * (Decision A from DESIGN_OVERVIEW.md §Page 7)
 */
export interface AdminStats {
  total_users: number;
  total_food_items: number;
  total_exercises: number;
  exercises_with_images: number;
}

export function useAdminCheck() {
  const router = useRouter();
  const [isAdmin, setIsAdmin]   = useState<boolean | null>(null); // null = loading
  const [stats, setStats]       = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>("/api/v1/admin/stats")
      .then(r => {
        setIsAdmin(true);
        setStats(r.data);
      })
      .catch(err => {
        if (err?.response?.status === 403) {
          router.replace("/dashboard");
        }
        setIsAdmin(false);
      });
  // Run once on mount — no deps needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isAdmin, stats, loading: isAdmin === null };
}
