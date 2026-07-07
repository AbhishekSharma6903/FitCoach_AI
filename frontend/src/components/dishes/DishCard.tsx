"use client";

import { Pencil, Trash2 } from "lucide-react";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomDishListItem } from "@/types/dish";

interface DishCardProps {
  dish: CustomDishListItem;
  onEdit: () => void;
  onDelete: () => void;
}

function DietBadge({ dish }: { dish: CustomDishListItem }) {
  if (!dish.is_veg) {
    return (
      <Badge variant="outline" className="text-[10px] text-red-400 border-red-500/30 shrink-0">
        Non-veg
      </Badge>
    );
  }
  if (dish.is_egg) {
    return (
      <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 shrink-0">
        Egg
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] text-green-400 border-green-500/30 shrink-0">
      Veg
    </Badge>
  );
}

// Convert per-100g to total dish value
function toTotal(per100g: number | null, totalWeightG: number): number {
  if (per100g == null) return 0;
  return Math.round(per100g * totalWeightG / 100);
}

export default function DishCard({ dish, onEdit, onDelete }: DishCardProps) {
  const totalKcal   = toTotal(dish.calories_kcal, dish.total_weight_g);
  const totalProtein = toTotal(dish.protein_g, dish.total_weight_g);
  const totalCarbs   = toTotal(dish.carbs_g, dish.total_weight_g);
  const totalFat     = toTotal(dish.fat_g, dish.total_weight_g);

  return (
    <Card padding="md" className="space-y-2">
      {/* Header: name + diet badge + action buttons */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <p className="text-sm font-bold text-foreground truncate">{dish.name}</p>
          <DietBadge dish={dish} />
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onEdit}
            aria-label={`Edit ${dish.name}`}
            className="w-10 h-10 flex items-center justify-center rounded-xl
                       text-muted-foreground/40 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            aria-label={`Delete ${dish.name}`}
            className="w-10 h-10 flex items-center justify-center rounded-xl
                       text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Meta: ingredient count + total weight */}
      <p className="text-xs text-muted-foreground">
        {dish.ingredient_count} ingredient{dish.ingredient_count !== 1 ? "s" : ""} ·{" "}
        {Math.round(dish.total_weight_g)}g total
      </p>

      {/* Nutrition (total dish, not per-100g) */}
      {dish.calories_kcal != null && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-bold text-white tabular-nums">
            {totalKcal} kcal
          </span>
          <span className="text-xs text-blue-400 tabular-nums">{totalProtein}g P</span>
          <span className="text-xs text-amber-400 tabular-nums">{totalCarbs}g C</span>
          <span className="text-xs text-orange-400 tabular-nums">{totalFat}g F</span>
        </div>
      )}
    </Card>
  );
}
