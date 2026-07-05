"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import PageShell from "@/components/layout/PageShell";
import DateNavigator from "@/components/tracker/DateNavigator";
import NutritionSummaryCard from "@/components/tracker/NutritionSummaryCard";
import MealTabs from "@/components/tracker/MealTabs";
import AddFoodModal from "@/components/tracker/AddFoodModal";
import QuickAddGrid from "@/components/tracker/QuickAddGrid";
import TodaySummaryWidget from "@/components/tracker/TodaySummaryWidget";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useTrackerStore } from "@/store/useTrackerStore";
import { useMealStore } from "@/store/useMealStore";
import type { MealSlot } from "@/store/useMealStore";

export default function TrackerPage() {
  const { selectedDate } = useTrackerStore();
  const { setPendingMealSlot, clearPendingMealSlot } = useMealStore();
  const { log, isLoading, addEntry, deleteEntry } = useFoodLog(selectedDate);

  // activeTab is page-level state — passed to both MealTabs and QuickAddGrid (fixes B-4)
  const [activeTab, setActiveTab] = useState<MealSlot>("breakfast");
  const [modalOpen, setModalOpen] = useState(false);
  const [prefilledQuery, setPrefilledQuery] = useState("");

  function openModal(slot?: MealSlot, foodQuery?: string) {
    const target = slot ?? activeTab;
    setActiveTab(target);
    setPendingMealSlot(target);
    setPrefilledQuery(foodQuery ?? "");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    clearPendingMealSlot();
  }

  const entries = log?.entries ?? [];
  const totals  = log?.totals;
  const targets = log?.targets;

  // Loading skeleton
  if (isLoading) {
    return (
      <PageShell title="Tracker">
        <div className="space-y-4 pt-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  const leftColumn = (
    <div className="space-y-5">
      {/* Nutrition summary */}
      {totals && targets && (
        <NutritionSummaryCard
          totals={totals}
          targets={targets}
          entries={entries}
        />
      )}

      {/* Meal tabs — activeTab lifted here */}
      {totals && (
        <MealTabs
          entries={entries}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onDelete={deleteEntry}
          onAdd={openModal}
        />
      )}

      {/* Quick Add — mobile only (right col on desktop xl:) */}
      <div className="xl:hidden">
        <QuickAddGrid
          currentSlot={activeTab}
          onSelect={(foodName, slot) => openModal(slot, foodName)}
        />
      </div>
    </div>
  );

  const rightColumn = (
    <div className="hidden xl:flex xl:flex-col gap-4 sticky top-20">
      {/* Quick Add */}
      <QuickAddGrid
        currentSlot={activeTab}
        onSelect={(foodName, slot) => openModal(slot, foodName)}
      />
      {/* Today summary */}
      {totals && (
        <TodaySummaryWidget entries={entries} totals={totals} />
      )}
    </div>
  );

  return (
    <PageShell title="Tracker">
      <div className="space-y-5 pt-2 pb-6">

        {/* Date navigation */}
        <DateNavigator />

        {/* 2-col at xl:, single col below */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
          {leftColumn}
          {rightColumn}
        </div>

      </div>

      {/* Add food modal */}
      <AddFoodModal
        open={modalOpen}
        onClose={closeModal}
        logDate={selectedDate}
        initialMealSlot={activeTab}
        prefilledQuery={prefilledQuery}
        onAdd={async (payload) => {
          await addEntry(payload);
        }}
      />

      {/* Sonner toast container */}
      <Toaster position="bottom-center" richColors />
    </PageShell>
  );
}
