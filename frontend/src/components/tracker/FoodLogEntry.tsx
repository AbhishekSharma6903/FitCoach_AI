"use client";

import { X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import type { FoodLogEntry as FoodLogEntryType } from "@/types/nutrition";

interface FoodLogEntryProps {
  entry: FoodLogEntryType;
  onDelete: (id: number) => Promise<void>;
}

export default function FoodLogEntry({ entry, onDelete }: FoodLogEntryProps) {
  async function handleDelete() {
    await onDelete(entry.id);
    toast(`${entry.food_name} removed`, {
      duration: 4000,
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.18 }}
      className="flex items-start gap-3 px-4 py-3 group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{entry.food_name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {entry.quantity_g}g
          <span className="mx-1.5 text-muted-foreground/30">·</span>
          <span className="text-blue-400">{Math.round(entry.protein_g)}P</span>
          <span className="mx-1 text-muted-foreground/30">·</span>
          <span className="text-amber-400">{Math.round(entry.carbs_g)}C</span>
          <span className="mx-1 text-muted-foreground/30">·</span>
          <span className="text-orange-400">{Math.round(entry.fat_g)}F</span>
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold text-white tabular-nums">
          {Math.round(entry.calories_kcal)} kcal
        </span>
        <button
          onClick={handleDelete}
          aria-label={`Delete ${entry.food_name}`}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}
