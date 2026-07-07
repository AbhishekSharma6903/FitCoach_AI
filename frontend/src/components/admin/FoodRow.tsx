"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AdminFoodItem } from "@/hooks/useAdminFood";

interface FoodRowProps {
  item:     AdminFoodItem;
  onEdit:   (item: AdminFoodItem) => void;
  onDelete: (item: AdminFoodItem) => void;
}

export default function FoodRow({ item, onEdit, onDelete }: FoodRowProps) {
  const vegDot = item.is_egg
    ? "bg-yellow-400"
    : item.is_veg
    ? "bg-green-500"
    : null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2.5 rounded-xl",
      "bg-[#111111] border border-[#2A2A2A]",
    )}>
      {/* Veg indicator dot */}
      <span
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          vegDot ?? "bg-transparent border border-[#3A3A3A]",
        )}
        title={item.is_egg ? "Egg" : item.is_veg ? "Vegetarian" : "Non-veg"}
      />

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-tight">
          {item.name}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {Math.round(item.calories_kcal)} kcal/100g
          {item.category ? ` · ${item.category}` : ""}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => onEdit(item)}
          aria-label={`Edit ${item.name}`}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-[#1A1A1A] transition-colors"
        >
          <Pencil size={12} aria-hidden="true" />
        </button>
        <button
          onClick={() => onDelete(item)}
          aria-label={`Delete ${item.name}`}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <Trash2 size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function FoodRowSkeleton() {
  return <Skeleton className="h-[52px] rounded-xl" />;
}
