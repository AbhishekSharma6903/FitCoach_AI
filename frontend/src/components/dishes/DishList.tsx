"use client";

import { Plus, ChefHat, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import DishCard from "./DishCard";
import type { CustomDishListItem } from "@/types/dish";

interface DishListProps {
  dishes: CustomDishListItem[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCreateNew: () => void;
  onEdit: (id: number) => void;
  onDeleteRequest: (dish: CustomDishListItem) => void;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center">
        <ChefHat size={28} className="text-muted-foreground/30" aria-hidden="true" />
      </div>
      <div className="max-w-xs">
        <p className="text-sm font-semibold text-foreground">No custom dishes yet</p>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Build dishes from ingredients and log them in the Tracker like any food item.
        </p>
      </div>
      <button
        onClick={onCreate}
        className="h-11 px-6 rounded-xl bg-primary text-black font-semibold text-sm
                   hover:bg-green-400 active:scale-[0.98] transition-all
                   flex items-center gap-2"
      >
        <Plus size={15} aria-hidden="true" />
        Create your first dish
      </button>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-muted-foreground">
        No dishes matching <span className="text-foreground">"{query}"</span>
      </p>
    </div>
  );
}

export default function DishList({
  dishes,
  isLoading,
  searchQuery,
  onSearchChange,
  onCreateNew,
  onEdit,
  onDeleteRequest,
}: DishListProps) {
  const filtered = searchQuery.trim()
    ? dishes.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : dishes;

  return (
    <div className="space-y-4">
      {/* Search + New Dish CTA row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
            aria-hidden="true"
          />
          <Input
            placeholder="Search my dishes…"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8 h-10 bg-[#1A1A1A] border-[#2A2A2A] focus:border-primary text-sm"
          />
        </div>
        <button
          onClick={onCreateNew}
          className="h-10 px-4 rounded-xl bg-primary text-black font-semibold text-sm
                     hover:bg-green-400 active:scale-[0.98] transition-all
                     flex items-center gap-1.5 shrink-0"
        >
          <Plus size={14} aria-hidden="true" />
          <span className="hidden sm:inline">New Dish</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Content states */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : dishes.length === 0 ? (
        <EmptyState onCreate={onCreateNew} />
      ) : filtered.length === 0 ? (
        <NoResults query={searchQuery} />
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground">
            My Dishes ({filtered.length})
          </p>
          {filtered.map(dish => (
            <DishCard
              key={dish.id}
              dish={dish}
              onEdit={() => onEdit(dish.id)}
              onDelete={() => onDeleteRequest(dish)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
