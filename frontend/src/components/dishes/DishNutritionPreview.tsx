"use client";

import { motion } from "motion/react";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { computeDishNutrition } from "@/lib/dishUtils";
import type { DishIngredientInput } from "@/types/dish";

interface DishNutritionPreviewProps {
  ingredients: DishIngredientInput[];
}

interface MacroBarProps {
  label: string;
  grams: number;
  maxGrams: number;
  colour: string;
  textColour: string;
}

function MacroBar({ label, grams, maxGrams, colour, textColour }: MacroBarProps) {
  const pct = maxGrams > 0 ? Math.min((grams / maxGrams) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={cn("text-xs font-medium w-12 shrink-0", textColour)}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#2A2A2A] overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", colour)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <span className="text-sm font-bold text-white tabular-nums shrink-0 w-12 text-right">
        {Math.round(grams)}g
      </span>
    </div>
  );
}

export default function DishNutritionPreview({ ingredients }: DishNutritionPreviewProps) {
  if (ingredients.length === 0) {
    return (
      <Card padding="md" className="text-center py-6">
        <p className="text-xs text-muted-foreground/50">
          Add ingredients to see nutrition
        </p>
      </Card>
    );
  }

  const n = computeDishNutrition(ingredients);
  const maxG = Math.max(n.protein, n.carbs, n.fat, 1);

  return (
    <Card padding="md" className="space-y-3">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
        Nutrition Preview
      </p>

      {/* Primary: total kcal */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white tabular-nums">
            {Math.round(n.kcal)}
          </span>
          <span className="text-sm text-muted-foreground">
            kcal total · {Math.round(n.totalWeight)}g dish
          </span>
        </div>
        {n.per100gKcal > 0 && (
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            Kcal/100g: {Math.round(n.per100gKcal)}
          </p>
        )}
      </div>

      {/* Macro bars */}
      <div className="space-y-2 pt-1 border-t border-[#2A2A2A]">
        <MacroBar label="Protein" grams={n.protein} maxGrams={maxG} colour="bg-blue-500"  textColour="text-blue-400" />
        <MacroBar label="Carbs"   grams={n.carbs}   maxGrams={maxG} colour="bg-amber-400" textColour="text-amber-400" />
        <MacroBar label="Fat"     grams={n.fat}     maxGrams={maxG} colour="bg-orange-500" textColour="text-orange-400" />
        {n.fiber > 0 && (
          <MacroBar label="Fiber" grams={n.fiber} maxGrams={maxG} colour="bg-violet-400" textColour="text-violet-400" />
        )}
      </div>
    </Card>
  );
}
