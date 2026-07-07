"use client";

import { AnimatePresence, motion } from "motion/react";
import { Tabs } from "@base-ui/react/tabs";
import { Coffee, Sun, Moon, Cookie, Plus } from "lucide-react";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/lib/motionVariants";
import FoodLogEntryRow from "./FoodLogEntry";
import { cn } from "@/lib/utils";
import type { FoodLogEntry } from "@/types/nutrition";
import type { MealSlot } from "@/store/useMealStore";

interface MealTabsProps {
  entries: FoodLogEntry[];
  activeTab: MealSlot;
  onTabChange: (slot: MealSlot) => void;
  onDelete: (id: number) => Promise<void>;
  onAdd: (slot: MealSlot) => void;
}

const SLOTS = [
  { id: "breakfast" as MealSlot, label: "Breakfast", Icon: Coffee,  iconColor: "text-amber-400"  },
  { id: "lunch"     as MealSlot, label: "Lunch",     Icon: Sun,     iconColor: "text-yellow-400" },
  { id: "dinner"    as MealSlot, label: "Dinner",    Icon: Moon,    iconColor: "text-blue-400"   },
  { id: "snack"     as MealSlot, label: "Snack",     Icon: Cookie,  iconColor: "text-orange-400" },
] as const;

function EmptyMealState({ slot, onAdd }: { slot: MealSlot; onAdd: () => void }) {
  const label = SLOTS.find((s) => s.id === slot)?.label ?? "meal";
  return (
    <div className="flex flex-col items-center py-8 gap-4">
      <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center">
        <span className="text-2xl" aria-hidden="true">🍽️</span>
      </div>
      <p className="text-sm text-muted-foreground">Nothing logged for {label} yet</p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-black text-sm font-semibold hover:bg-green-400 active:scale-[0.98] transition-all"
      >
        <Plus size={14} aria-hidden="true" />
        Add food
      </button>
    </div>
  );
}

export default function MealTabs({
  entries,
  activeTab,
  onTabChange,
  onDelete,
  onAdd,
}: MealTabsProps) {
  return (
    // Use Base UI primitives directly — shadcn TabsList/TabsTrigger have conflicting
    // defaults (fixed h-8, whitespace-nowrap, inline-flex) that break our icon+label layout.
    <Tabs.Root value={activeTab} onValueChange={(v) => onTabChange(v as MealSlot)}>

      {/* Tab list — rounded pill container */}
      <Tabs.List className="flex w-full gap-1 rounded-xl bg-[#111111] border border-[#2A2A2A] p-1">
        {SLOTS.map(({ id, label, Icon, iconColor }) => {
          const slotKcal = entries
            .filter((e) => e.meal_type === id)
            .reduce((s, e) => s + e.calories_kcal, 0);

          return (
            <Tabs.Tab
              key={id}
              value={id}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5",
                "py-2 rounded-lg cursor-pointer transition-colors outline-none",
                "text-muted-foreground",
                "data-[selected]:bg-[#1A1A1A] data-[selected]:text-foreground",
              )}
            >
              <Icon size={16} className={cn(iconColor, "shrink-0")} aria-hidden="true" />
              {/* Hidden on mobile (icon is self-explanatory), visible on desktop */}
              <span className="hidden lg:block text-[10px] leading-none">{label}</span>
              {slotKcal > 0 && (
                <span className="text-[9px] text-primary tabular-nums leading-none">
                  {Math.round(slotKcal)}
                </span>
              )}
            </Tabs.Tab>
          );
        })}
      </Tabs.List>

      {/* Tab panels */}
      {SLOTS.map(({ id }) => {
        const slotEntries = entries.filter((e) => e.meal_type === id);
        return (
          <Tabs.Panel key={id} value={id} className="mt-3">
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden">
              {slotEntries.length === 0 ? (
                <EmptyMealState slot={id} onAdd={() => onAdd(id)} />
              ) : (
                <>
                  {/* Stagger on initial load; AnimatePresence handles individual add/remove */}
                  <motion.div
                    className="divide-y divide-[#2A2A2A]"
                    variants={STAGGER_CONTAINER}
                    initial="hidden"
                    animate="show"
                  >
                    <AnimatePresence initial={false}>
                      {slotEntries.map((entry) => (
                        <motion.div key={entry.id} variants={STAGGER_ITEM}>
                          <FoodLogEntryRow entry={entry} onDelete={onDelete} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                  <div className="border-t border-[#2A2A2A] px-4 py-3">
                    <button
                      onClick={() => onAdd(id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-green-400 transition-colors"
                    >
                      <Plus size={12} aria-hidden="true" />
                      Add more
                    </button>
                  </div>
                </>
              )}
            </div>
          </Tabs.Panel>
        );
      })}
    </Tabs.Root>
  );
}
