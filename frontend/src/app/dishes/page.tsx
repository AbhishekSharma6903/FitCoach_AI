"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import PageShell from "@/components/layout/PageShell";
import InfoBanner from "@/components/dishes/InfoBanner";
import DishList from "@/components/dishes/DishList";
import DishBuilder from "@/components/dishes/DishBuilder";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import { useCustomDishes } from "@/hooks/useCustomDishes";
import { getUnitOptions, defaultOption } from "@/lib/dishUtils";
import type { CustomDish, CustomDishListItem, DishIngredientInput } from "@/types/dish";
import type { FoodItem } from "@/types/nutrition";
import api from "@/lib/api";

// ── View state machine ────────────────────────────────────────────────────────

type View =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; dishId: number; name: string; ingredients: DishIngredientInput[] };

// Convert a saved DishIngredient to DishIngredientInput (builder-compatible)
// Saved ingredients only have quantity_g — we reconstruct best-effort unit options
// using a synthetic FoodItem with just the fields dishUtils needs.
function toBuilderIngredients(dish: CustomDish): DishIngredientInput[] {
  return dish.ingredients.map(ing => {
    // Build a minimal FoodItem so getUnitOptions() can detect the category
    const syntheticItem = {
      id: ing.food_item_id,
      name: ing.food_name,
      category: null,
      region: null,
      serving_size_g: ing.quantity_g,
      calories_kcal: 0,
      protein_g: 0, carbs_g: 0, fat_g: 0,
      fiber_g: 0, sugar_g: 0,
      is_veg: true, is_egg: false,
    } as FoodItem;

    const opts     = getUnitOptions(syntheticItem);
    // Find the option closest in weight to the saved quantity_g
    const bestUnit = opts.reduce((best, opt) =>
      Math.abs(opt.weight_g - ing.quantity_g) < Math.abs(best.weight_g - ing.quantity_g)
        ? opt : best
    , opts[0]);
    const displayAmount = bestUnit.weight_g > 0
      ? Math.round((ing.quantity_g / bestUnit.weight_g) * 10) / 10
      : ing.quantity_g;

    return {
      food_item_id:   ing.food_item_id,
      food_name:      ing.food_name,
      quantity_g:     ing.quantity_g,
      display_amount: displayAmount,
      unit_options:   opts,
      selected_unit:  bestUnit,
      item_ref:       syntheticItem,
      calories_kcal:  0,
      protein_g:      0, carbs_g: 0, fat_g: 0,
      fiber_g:        0, serving_size_g: ing.quantity_g,
    };
  });
}

export default function DishesPage() {
  const { dishes, isLoading, createDish, updateDish, deleteDish } = useCustomDishes();

  const [view, setView]           = useState<View>({ kind: "list" });
  const [searchQuery, setSearch]  = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CustomDishListItem | null>(null);
  const [loadingEdit, setLoadingEdit]   = useState(false);

  // Direction ref for AnimatePresence slide: 1 = enter builder, -1 = back to list
  const slideDir = useRef(1);

  function goToList() {
    slideDir.current = -1;
    setView({ kind: "list" });
  }

  function goToCreate() {
    slideDir.current = 1;
    setView({ kind: "create" });
  }

  async function goToEdit(dishId: number) {
    slideDir.current = 1;
    setLoadingEdit(true);
    try {
      const res = await api.get(`/api/v1/dishes/${dishId}`);
      const full: CustomDish = res.data;
      setView({
        kind: "edit",
        dishId: full.id,
        name: full.name,
        ingredients: toBuilderIngredients(full),
      });
    } catch {
      toast.error("Couldn't load dish. Try again.");
    } finally {
      setLoadingEdit(false);
    }
  }

  async function handleCreate(name: string, ingredients: { food_item_id: number; quantity_g: number }[]) {
    await createDish({ name, ingredients });
    toast.success(`"${name}" saved`);
    goToList();
  }

  async function handleUpdate(name: string, ingredients: { food_item_id: number; quantity_g: number }[]) {
    if (view.kind !== "edit") return;
    await updateDish(view.dishId, { name, ingredients });
    toast.success(`"${name}" updated`);
    goToList();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    await deleteDish(deleteTarget.id);
    toast.success(`"${name}" deleted`);
    setDeleteTarget(null);
  }

  return (
    <PageShell title="Dishes">
      <div className="space-y-5 pt-2 pb-6">
        {/* Desktop page heading */}
        <h1 className="hidden lg:block text-2xl font-bold text-foreground">Dishes</h1>

        <InfoBanner />

        {/* View transitions */}
        <AnimatePresence mode="wait" initial={false}>
          {view.kind === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: slideDir.current * -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDir.current * -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <DishList
                dishes={dishes}
                isLoading={isLoading || loadingEdit}
                searchQuery={searchQuery}
                onSearchChange={setSearch}
                onCreateNew={goToCreate}
                onEdit={goToEdit}
                onDeleteRequest={setDeleteTarget}
              />
            </motion.div>
          )}

          {view.kind === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: slideDir.current * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDir.current * 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <DishBuilder
                title="Create Dish"
                onSave={handleCreate}
                onCancel={goToList}
              />
            </motion.div>
          )}

          {view.kind === "edit" && (
            <motion.div
              key={`edit-${view.dishId}`}
              initial={{ opacity: 0, x: slideDir.current * 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDir.current * 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <DishBuilder
                title="Edit Dish"
                initialName={view.name}
                initialIngredients={view.ingredients}
                onSave={handleUpdate}
                onCancel={goToList}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete confirmation dialog */}
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={open => !open && setDeleteTarget(null)}
          title="Delete dish?"
          description={
            deleteTarget
              ? `"${deleteTarget.name}" will be permanently deleted.`
              : "This cannot be undone."
          }
          confirmLabel="Delete"
          onConfirm={handleDelete}
        />

        <Toaster position="bottom-center" richColors />
      </div>
    </PageShell>
  );
}
