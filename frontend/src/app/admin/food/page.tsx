"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Search, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import PageShell from "@/components/layout/PageShell";
import AdminSubNav from "@/components/admin/AdminSubNav";
import FoodRow, { FoodRowSkeleton } from "@/components/admin/FoodRow";
import FoodForm from "@/components/admin/FoodForm";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAdminFood } from "@/hooks/useAdminFood";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import type { AdminFoodItem, AdminFoodCreate } from "@/hooks/useAdminFood";

type FormMode = "create" | "edit";
type MobileView = "list" | "form";

export default function AdminFoodPage() {
  useAdminCheck(); // redirect if not admin

  const [search, setSearch]         = useState("");
  const debouncedSearch             = useDebounce(search, 350);
  const { items, isLoading, loadingMore, hasMore, loadedCount, loadMore,
          createFood, updateFood, deleteFood } = useAdminFood(debouncedSearch);

  const [formMode, setFormMode]     = useState<FormMode>("create");
  const [editItem, setEditItem]     = useState<AdminFoodItem | null>(null);
  const [formVisible, setFormVisible] = useState(false);  // desktop form panel visible
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [deleteTarget, setDeleteTarget] = useState<AdminFoodItem | null>(null);

  const dirRef = useRef(1);

  function openCreate() {
    setFormMode("create");
    setEditItem(null);
    setFormVisible(true);
    dirRef.current = 1;
    setMobileView("form");
  }

  function openEdit(item: AdminFoodItem) {
    setFormMode("edit");
    setEditItem(item);
    setFormVisible(true);
    dirRef.current = 1;
    setMobileView("form");
  }

  function closeForm() {
    setFormVisible(false);
    dirRef.current = -1;
    setMobileView("list");
    setEditItem(null);
  }

  async function handleSave(payload: AdminFoodCreate, id?: number) {
    try {
      if (formMode === "edit" && id !== undefined) {
        await updateFood(id, payload);
        toast.success("Food item updated");
      } else {
        await createFood(payload);
        toast.success("Food item added");
      }
      closeForm();
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteFood(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
    } catch {
      toast.error("Failed to delete. Please try again.");
    } finally {
      setDeleteTarget(null);
    }
  }

  const SLIDE_VARIANTS = {
    enter:  (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.22 } },
    exit:   (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0, transition: { duration: 0.18 } }),
  };

  const listPanel = (
    <div className="space-y-3">
      {/* Search + Add */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search food catalog…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search food catalog"
              className={cn(
                "w-full h-10 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] text-foreground",
                "pl-9 pr-3 text-sm placeholder:text-muted-foreground/50",
                "outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors",
              )}
            />
          </div>
          <button
            onClick={openCreate}
            aria-label="Add food item"
            className="h-10 px-3 rounded-xl bg-primary text-black text-sm font-semibold hover:bg-green-400 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
        {!isLoading && items.length > 0 && (
          <p className="text-[11px] text-muted-foreground/50 px-1">
            {loadedCount.toLocaleString()} item{loadedCount !== 1 ? "s" : ""} loaded
            {hasMore ? " — scroll down to load more" : ""}
          </p>
        )}
      </div>

      {/* Food list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <FoodRowSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center">
            <UtensilsCrossed size={22} className="text-muted-foreground/30" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">No food items match your search.</p>
        </div>
      ) : (
        <>
          <AnimatePresence initial={false}>
            <div className="space-y-1.5">
              {items.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.18 } }}
                >
                  <FoodRow
                    item={item}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* Load more */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <p className="text-xs text-muted-foreground">
              Showing {loadedCount} item{loadedCount !== 1 ? "s" : ""}
              {!hasMore && search ? " for this search" : ""}
            </p>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-xs text-primary hover:text-green-400 transition-colors disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load 100 more"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <PageShell title="Food Catalog">
      <div className="space-y-6 pt-2">

        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-xl font-bold text-foreground lg:text-2xl">Admin Panel</h1>
          <AdminSubNav />
        </div>

        {/* ── Desktop: two-column (list | sticky form) ── */}
        <div className="hidden xl:grid xl:grid-cols-[1fr_360px] xl:gap-6 xl:items-start">
          {listPanel}

          {/* Sticky form panel */}
          <div className="sticky top-20 space-y-3">
            {formVisible ? (
              <FoodForm
                mode={formMode}
                initial={editItem}
                onSave={handleSave}
                onCancel={closeForm}
              />
            ) : (
              <div className="rounded-2xl bg-[#111111] border border-[#2A2A2A] p-6 flex flex-col items-center justify-center gap-3 text-center min-h-40">
                <UtensilsCrossed size={22} className="text-muted-foreground/20" aria-hidden="true" />
                <p className="text-xs text-muted-foreground/50">
                  Select a food to edit, or click Add Food to create one.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile/tablet: state machine list ↔ form ── */}
        <div className="xl:hidden overflow-hidden">
          <AnimatePresence initial={false} custom={dirRef.current} mode="wait">
            {mobileView === "list" ? (
              <motion.div
                key="list"
                custom={dirRef.current}
                variants={SLIDE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {listPanel}
              </motion.div>
            ) : (
              <motion.div
                key="form"
                custom={dirRef.current}
                variants={SLIDE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <FoodForm
                  mode={formMode}
                  initial={editItem}
                  onSave={handleSave}
                  onCancel={closeForm}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This food item will be permanently removed from the catalog."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />

      <Toaster position="bottom-center" richColors />
    </PageShell>
  );
}
