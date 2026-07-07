"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Users2 } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import AdminSubNav from "@/components/admin/AdminSubNav";
import UserRow, { UserRowSkeleton } from "@/components/admin/UserRow";
import UserDetailView from "@/components/admin/UserDetailView";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

type View = "list" | { userId: string };

const SLIDE_VARIANTS = {
  enter:   (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center:  { x: 0, opacity: 1, transition: { duration: 0.22 } },
  exit:    (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0, transition: { duration: 0.18 } }),
};

export default function AdminUsersPage() {
  useAdminCheck(); // redirect if not admin

  const { users, isLoading } = useAdminUsers();
  const [view, setView]     = useState<View>("list");
  const [search, setSearch] = useState("");
  const debouncedSearch     = useDebounce(search, 200);
  const dirRef              = useRef(1);

  const filtered = debouncedSearch.trim().length > 0
    ? users.filter(u => u.name?.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : users;

  function goDetail(userId: string) {
    dirRef.current = 1;
    setView({ userId });
  }

  function goList() {
    dirRef.current = -1;
    setView("list");
  }

  const isListView = view === "list";

  return (
    <PageShell title="Users">
      <div className="space-y-6 pt-2 overflow-hidden">

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">Admin Panel</h1>
          <AdminSubNav />
        </div>

        {/* Animated content */}
        <AnimatePresence initial={false} custom={dirRef.current} mode="wait">
          {isListView ? (
            <motion.div
              key="list"
              custom={dirRef.current}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-3"
            >
              {/* Search + count */}
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  placeholder="Filter users…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Filter users"
                  className={cn(
                    "flex-1 h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-foreground",
                    "px-3 text-sm placeholder:text-muted-foreground/50",
                    "outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors",
                  )}
                />
                {!isLoading && (
                  <span className="text-xs text-muted-foreground shrink-0 px-2">
                    {filtered.length} user{filtered.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* List */}
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <UserRowSkeleton key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center">
                    <Users2 size={22} className="text-muted-foreground/30" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {search ? "No users match your filter." : "No users yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(user => (
                    <UserRow key={user.user_id} user={user} onClick={() => goDetail(user.user_id)} />
                  ))}

                  {/* Summary row — fills empty space and provides context */}
                  {filtered.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#1A1A1A] mt-2">
                      <p className="text-xs text-muted-foreground/50">
                        {filtered.length} registered user{filtered.length !== 1 ? "s" : ""}
                        {search ? " match your filter" : " in total"}
                      </p>
                      <p className="text-[10px] text-muted-foreground/30 uppercase tracking-wider">
                        Click a row to view profile
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={typeof view === "object" ? view.userId : "detail"}
              custom={dirRef.current}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <UserDetailView
                userId={typeof view === "object" ? view.userId : ""}
                onBack={goList}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageShell>
  );
}
