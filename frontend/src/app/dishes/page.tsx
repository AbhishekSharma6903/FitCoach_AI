"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, ChefHat, Trash2, Pencil, UtensilsCrossed, Info, Search } from "lucide-react";
import { useCustomDishes } from "@/hooks/useCustomDishes";
import { useProfile } from "@/hooks/useProfile";
import DishBuilder from "@/components/dishes/DishBuilder";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
import type { CustomDishListItem } from "@/types/dish";

type View = "list" | "create" | "edit";

function MacroPill({ label, fullLabel, value, color }: { label: string; fullLabel: string; value: number | null; color: string }) {
  const [hovered, setHovered] = useState(false);
  if (value == null) return null;
  return (
    <span
      className={`text-sm font-medium ${color} cursor-default transition-all duration-150`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
    >
      {hovered ? (
        <span>{fullLabel}: {value.toFixed(1)}g</span>
      ) : (
        <span>{value.toFixed(1)}g <span className="text-gray-600">{label}</span></span>
      )}
    </span>
  );
}

function DishCard({ dish, onEdit, onDelete }: {
  dish: CustomDishListItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const mockMeta = dish.ingredient_count % 3 === 0
    ? "Logged 5 times"
    : dish.ingredient_count % 2 === 0
    ? "Last used: 2 days ago"
    : "Last used: today";

  const servingWeight = dish.total_weight_g.toFixed(0);

  return (
    <div className="flex items-start gap-3 py-4 border-b border-gray-800 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
        <ChefHat size={18} className="text-brand-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-100 truncate">{dish.name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-md ${dish.is_veg ? "bg-brand-500/10 text-brand-400" : "bg-red-500/10 text-red-400"}`}>
            {dish.is_veg ? (dish.is_egg ? "egg" : "veg") : "non-veg"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className="text-xs text-gray-500">
            {dish.ingredient_count} ingredient{dish.ingredient_count !== 1 ? "s" : ""} · {servingWeight}g total
          </p>
          <span className="text-gray-700 text-xs">·</span>
          <p className="text-xs text-gray-600">{mockMeta}</p>
        </div>
        {dish.calories_kcal != null && (
          <div className="flex gap-3 mt-1.5 flex-wrap items-center">
            <span className="text-sm font-bold text-gray-200">
              {dish.calories_kcal.toFixed(0)} kcal
              <span className="text-xs font-normal text-gray-500"> per serving ({servingWeight}g)</span>
            </span>
            <MacroPill label="P" fullLabel="Protein" value={dish.protein_g} color="text-blue-400" />
            <MacroPill label="C" fullLabel="Carbs"   value={dish.carbs_g}   color="text-amber-400" />
            <MacroPill label="F" fullLabel="Fat"     value={dish.fat_g}     color="text-orange-400" />
          </div>
        )}
      </div>
      <div className="flex gap-0.5 shrink-0">
        <button
          onClick={onEdit}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          aria-label="Edit dish"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={onDelete}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-800 transition-colors"
          aria-label="Delete dish"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function AddAnotherCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full mt-3 flex items-center justify-center gap-2 py-4 px-4 rounded-xl border border-dashed border-gray-700 text-gray-500 hover:border-brand-500/50 hover:text-brand-400 hover:bg-brand-500/5 transition-all duration-200 group"
    >
      <Plus size={16} className="group-hover:scale-110 transition-transform duration-150" />
      <span className="text-sm font-medium">Add another dish</span>
    </button>
  );
}

function InfoBanner() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-brand-500/8 border border-brand-500/20">
      <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0 mt-0.5">
        <Info size={15} className="text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-300 leading-snug">Custom dishes appear in food search</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
          Any dish you create here will show up automatically when you search for food while logging meals — making it easy to track home-cooked recipes.
        </p>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search your dishes…"
        className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-colors"
      />
    </div>
  );
}

export default function DishesPage() {
  const { dishes, isLoading, createDish, updateDish, deleteDish } = useCustomDishes();
  const { profile } = useProfile();
  const [view, setView] = useState<View>("list");
  const [editingDish, setEditingDish] = useState<CustomDishListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  async function handleCreate(name: string, ingredients: { food_item_id: number; quantity_g: number }[]) {
    await createDish({ name, ingredients });
    setView("list");
  }

  async function handleUpdate(name: string, ingredients: { food_item_id: number; quantity_g: number }[]) {
    if (!editingDish) return;
    await updateDish(editingDish.id, { name, ingredients });
    setEditingDish(null);
    setView("list");
  }

  async function handleDelete(dish: CustomDishListItem) {
    if (!confirm(`Delete "${dish.name}"?`)) return;
    await deleteDish(dish.id);
  }

  const filteredDishes = dishes.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <Spinner className="w-8 h-8" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-300 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-100">My Dishes</h1>
            <p className="text-xs text-gray-500">Custom recipes with computed nutrition</p>
          </div>
          {view === "list" && (
            <Button size="sm" onClick={() => setView("create")} className="flex items-center gap-1.5">
              <Plus size={14} /> New Dish
            </Button>
          )}
        </div>

        {/* Onboarding info banner — always visible on list view */}
        {view === "list" && <InfoBanner />}

        {/* Create / Edit form */}
        {(view === "create" || view === "edit") && (
          <Card>
            <p className="text-sm font-semibold text-gray-200 mb-4">
              {view === "edit" ? `Edit "${editingDish?.name}"` : "Create New Dish"}
            </p>
            <DishBuilder
              initialName={view === "edit" ? editingDish?.name : ""}
              dietFilter={profile?.diet_type}
              onSave={view === "edit" ? handleUpdate : handleCreate}
              onCancel={() => { setView("list"); setEditingDish(null); }}
            />
          </Card>
        )}

        {/* Dish list */}
        {view === "list" && (
          <>
            {dishes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-5">
                {/* Illustration */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                    <UtensilsCrossed size={40} className="text-gray-700" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                    <ChefHat size={14} className="text-brand-500" />
                  </div>
                </div>

                {/* Copy */}
                <div className="space-y-2 max-w-xs">
                  <h2 className="text-lg font-bold text-gray-100">Create your first dish</h2>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Build custom recipes from individual ingredients and get accurate nutrition for home-cooked meals — perfect for Indian dishes not in the catalog.
                  </p>
                </div>

                {/* Benefits */}
                <div className="w-full max-w-xs space-y-2">
                  {[
                    "Auto-calculates calories & macros",
                    "Reuse dishes across any meal log",
                    "Track your home-cooked meals accurately",
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2 text-left">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                      <span className="text-xs text-gray-500">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button size="sm" onClick={() => setView("create")} className="mt-2 flex items-center gap-1.5">
                  <Plus size={14} /> Create your first dish
                </Button>
              </div>
            ) : (
              <>
                {/* Search bar */}
                <SearchBar value={searchQuery} onChange={setSearchQuery} />

                <Card padding="sm">
                  {filteredDishes.length > 0 ? (
                    filteredDishes.map((dish) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        onEdit={() => { setEditingDish(dish); setView("edit"); }}
                        onDelete={() => handleDelete(dish)}
                      />
                    ))
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-sm text-gray-500">No dishes match <span className="text-gray-300">"{searchQuery}"</span></p>
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </Card>

                {/* Add another ghost card */}
                <AddAnotherCard onClick={() => setView("create")} />
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}