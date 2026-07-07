"use client";

import { motion } from "motion/react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DishIngredientInput } from "@/types/dish";
import type { UnitOption } from "@/lib/dishUtils";

interface IngredientRowProps {
  ingredient: DishIngredientInput;
  onAmountChange: (amount: number) => void;
  onUnitChange: (unit: UnitOption) => void;
  onRemove: () => void;
}

export default function IngredientRow({
  ingredient,
  onAmountChange,
  onUnitChange,
  onRemove,
}: IngredientRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2.5 py-2.5 border-b border-[#2A2A2A] last:border-0"
    >
      {/* Diet dot */}
      <span
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          ingredient.item_ref?.is_veg ? "bg-green-500" : "bg-red-400",
        )}
        aria-hidden="true"
      />

      {/* Food name */}
      <span className="text-sm text-foreground flex-1 min-w-0 truncate">
        {ingredient.food_name}
      </span>

      {/* Amount input */}
      <Input
        type="number"
        min={0.1}
        step={ingredient.selected_unit.label.includes("piece") ? 1 : 0.5}
        value={ingredient.display_amount}
        onChange={e => onAmountChange(Number(e.target.value))}
        className="w-16 h-8 bg-[#222222] border-[#2A2A2A] text-sm text-right tabular-nums
                   focus:border-primary shrink-0"
        aria-label={`Amount of ${ingredient.food_name}`}
      />

      {/* Unit selector */}
      {ingredient.unit_options.length > 1 ? (
        <select
          value={ingredient.selected_unit.label}
          onChange={e => {
            const unit = ingredient.unit_options.find(u => u.label === e.target.value);
            if (unit) onUnitChange(unit);
          }}
          aria-label={`Unit for ${ingredient.food_name}`}
          className="h-8 px-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A]
                     text-xs text-muted-foreground focus:border-primary focus:outline-none
                     cursor-pointer shrink-0 min-w-20 max-w-32"
        >
          {ingredient.unit_options.map(opt => (
            <option key={opt.label} value={opt.label}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="text-[10px] text-muted-foreground/50 min-w-10 text-left shrink-0">
          {ingredient.selected_unit.label}
        </span>
      )}

      {/* Remove */}
      <button
        onClick={onRemove}
        aria-label={`Remove ${ingredient.food_name}`}
        className="w-8 h-8 flex items-center justify-center rounded-lg
                   text-muted-foreground/30 hover:text-red-400 transition-colors shrink-0"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </motion.div>
  );
}
