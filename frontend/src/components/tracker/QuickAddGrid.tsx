"use client";

import { motion } from "motion/react";
import type { MealSlot } from "@/store/useMealStore";

interface QuickAddGridProps {
  onSelect: (foodName: string, slot: MealSlot) => void;
  currentSlot: MealSlot;
}

const QUICK_FOODS = [
  { name: "Dal Tadka",     cal: 180, emoji: "🫕" },
  { name: "Roti",          cal: 70,  emoji: "🫓" },
  { name: "Paneer Sabzi",  cal: 220, emoji: "🥘" },
  { name: "Steamed Rice",  cal: 206, emoji: "🍚" },
  { name: "Idli (2 pcs)",  cal: 140, emoji: "🫔" },
  { name: "Curd Rice",     cal: 190, emoji: "🍛" },
] as const;

export default function QuickAddGrid({ onSelect, currentSlot }: QuickAddGridProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
        Quick Add
      </p>
      {/* 3-col on mobile and right panel; 6-col on single-col desktop (1024-1279px) */}
      <div className="grid grid-cols-3 lg:grid-cols-6 xl:grid-cols-3 gap-2">
        {QUICK_FOODS.map((food) => (
          <motion.button
            key={food.name}
            onClick={() => onSelect(food.name, currentSlot)}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-[#111111] border border-[#2A2A2A] hover:bg-[#1A1A1A] hover:border-[#333] transition-colors"
          >
            <span className="text-xl" aria-hidden="true">{food.emoji}</span>
            <span className="text-[10px] font-medium text-foreground text-center leading-tight">
              {food.name}
            </span>
            <span className="text-[10px] font-bold text-primary">{food.cal} kcal</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
