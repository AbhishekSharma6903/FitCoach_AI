"use client";
import { useState } from "react";
import { Trash2, Plus, ChefHat, X, Leaf, Drumstick, Sprout, ArrowLeft } from "lucide-react";
import FoodSearchBar from "@/components/tracker/FoodSearchBar";
import DishNutritionPreview from "./DishNutritionPreview";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import type { FoodItem } from "@/types/nutrition";
import type { DishIngredientInput } from "@/types/dish";

interface Props {
  initialName?: string;
  initialIngredients?: DishIngredientInput[];
  dietFilter?: string;
  onSave: (name: string, ingredients: { food_item_id: number; quantity_g: number }[]) => Promise<void>;
  onCancel: () => void;
}

// ── Unit detection: classify every food into ml | g | qty ──────────────────

const LIQUID_CATEGORIES = new Set([
  "beverages", "beverage", "drinks,alcohol, beve", "drinks",
  "alcoholic beverages",
]);
const LIQUID_NAME_PATTERNS = [
  /\bmilk\b/, /\bjuice\b/, /\bwater\b/, /\btea\b/, /\bcoffee\b/,
  /\blassi\b/, /\bchaas\b/, /\bbuttermilk\b/, /\byogurt drink\b/,
  /\bsmoothie\b/, /\bnectar\b/, /\bcola\b/, /\bsoda\b/, /\bale\b/,
  /\blager\b/, /\bbeer\b/, /\bwine\b/, /\bwhey\b/, /\bkefir\b/,
];
const SOLID_DAIRY_NAMES = [
  "paneer", "khoa", "khoya", "cheese", "butter", "ghee", "cream", "curd",
  "yogurt", "yoghurt", "ice cream", "kulfi",
];

const QTY_CATEGORIES = new Set([
  "egg and egg products", "dairy and egg products", "egg dish",
]);
const QTY_NAME_PATTERNS = [
  /\begg\b.*\bwhole\b/, /^egg[,\s]/, /^egg$/,
  /\bslice\b/, /\bbread\b.*slice/, /^chapati/, /^roti$/, /^naan$/,
  /^puri$/, /^vada$/, /^idli$/, /^dosa$/,
  /\bcracker\b/, /\bbiscuit\b/,
  /^banana$/, /^apple$/, /^orange$/, /^mango$/,
];
const QTY_UNIT_WEIGHTS: Record<string, number> = {
  "egg": 50,
  "chapati": 40, "roti": 40, "naan": 80, "puri": 40, "bhatura": 100,
  "idli": 50, "dosa": 80, "vada": 75,
  "banana": 120, "apple": 182, "orange": 131, "mango": 200,
  "biscuit": 10, "cracker": 10, "bread": 30,
};

function detectUnit(item: FoodItem): "g" | "ml" | "qty" {
  const cat = (item.category ?? "").toLowerCase();
  const name = item.name.toLowerCase();

  if (QTY_CATEGORIES.has(cat)) return "qty";
  if (QTY_NAME_PATTERNS.some((p) => p.test(name))) return "qty";

  const isDairySolid = SOLID_DAIRY_NAMES.some((s) => name.includes(s));
  if (!isDairySolid) {
    if (LIQUID_CATEGORIES.has(cat)) return "ml";
    if (LIQUID_NAME_PATTERNS.some((p) => p.test(name))) return "ml";
  }

  return "g";
}

function unitWeightG(item: FoodItem): number {
  const name = item.name.toLowerCase();
  for (const [key, w] of Object.entries(QTY_UNIT_WEIGHTS)) {
    if (name.includes(key)) return w;
  }
  return 50;
}

function defaultQty(item: FoodItem, unit: "g" | "ml" | "qty"): number {
  if (unit === "qty") return 1;
  if (unit === "ml") return 200;
  return item.serving_size_g ?? 100;
}

function toGrams(amount: number, unit: "g" | "ml" | "qty", item: FoodItem): number {
  if (unit === "qty") return amount * unitWeightG(item);
  return amount;
}

function unitLabel(unit: "g" | "ml" | "qty", item: FoodItem): string {
  if (unit === "qty") {
    const w = unitWeightG(item);
    return `unit${" "}(≈${w}g ea.)`;
  }
  return unit;
}

type DietType = "veg" | "nonveg" | "vegan";

const DIET_OPTIONS: { value: DietType; label: string; icon: React.ReactNode; activeClass: string; inactiveHover: string }[] = [
  {
    value: "veg",
    label: "Veg",
    icon: <Leaf size={13} />,
    activeClass: "bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.15)]",
    inactiveHover: "hover:border-green-800 hover:text-green-600",
  },
  {
    value: "nonveg",
    label: "Non-Veg",
    icon: <Drumstick size={13} />,
    activeClass: "bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.15)]",
    inactiveHover: "hover:border-orange-800 hover:text-orange-600",
  },
  {
    value: "vegan",
    label: "Vegan",
    icon: <Sprout size={13} />,
    activeClass: "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
    inactiveHover: "hover:border-emerald-800 hover:text-emerald-600",
  },
];

export default function DishBuilder({ initialName = "", initialIngredients = [], dietFilter, onSave, onCancel }: Props) {
  const [name, setName] = useState(initialName);
  const [dietType, setDietType] = useState<DietType>("veg");
  const [ingredients, setIngredients] = useState<DishIngredientInput[]>(initialIngredients);
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null);
  const [pendingUnit, setPendingUnit] = useState<"g" | "ml" | "qty">("g");
  const [pendingAmt, setPendingAmt] = useState<number | "">(100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalWeight = ingredients.reduce((s, i) => s + i.quantity_g, 0);
  const canSave = name.trim().length > 0 && ingredients.length > 0;

  function handleFoodSelect(item: FoodItem) {
    if (item.is_custom) return;
    const unit = detectUnit(item);
    setPendingFood(item);
    setPendingUnit(unit);
    setPendingAmt(defaultQty(item, unit));
  }

  function addIngredient() {
    if (!pendingFood || pendingAmt === "" || Number(pendingAmt) <= 0) return;
    const qg = toGrams(Number(pendingAmt), pendingUnit, pendingFood);
    setIngredients((prev) => [
      ...prev,
      {
        food_item_id:   pendingFood!.id,
        food_name:      pendingFood!.name,
        quantity_g:     qg,
        display_amount: Number(pendingAmt),
        display_unit:   pendingUnit,
        item_ref:       pendingFood!,
        calories_kcal:  pendingFood!.calories_kcal,
        protein_g:      pendingFood!.protein_g,
        carbs_g:        pendingFood!.carbs_g,
        fat_g:          pendingFood!.fat_g,
        fiber_g:        pendingFood!.fiber_g,
        serving_size_g: pendingFood!.serving_size_g,
      },
    ]);
    setPendingFood(null);
    setPendingAmt(100);
  }

  function removeIngredient(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateAmount(idx: number, amt: number, unit: "g" | "ml" | "qty") {
    if (amt <= 0) return;
    setIngredients((prev) => prev.map((ing, i) => {
      if (i !== idx) return ing;
      const fakeFoodRef = { serving_size_g: ing.serving_size_g } as FoodItem;
      const itemRef = ing.item_ref ?? fakeFoodRef;
      return { ...ing, quantity_g: toGrams(amt, unit, itemRef), display_amount: amt, display_unit: unit };
    }));
  }

  async function handleSave() {
    if (!name.trim()) { setError("Give your dish a name."); return; }
    if (ingredients.length === 0) { setError("Add at least one ingredient."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave(name.trim(), ingredients.map((i) => ({
        food_item_id: i.food_item_id,
        quantity_g:   i.quantity_g,
      })));
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  const dietDot = (item: FoodItem) =>
    item.is_veg
      ? item.is_egg ? "bg-yellow-400" : "bg-brand-500"
      : "bg-red-500";

  return (
    /* Full-page backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0d0d0d] border border-gray-800 shadow-2xl">
        {/* Inner content */}
        <div className="space-y-6 p-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={17} />
              </button>
              <div className="flex items-center gap-2">
                <ChefHat size={18} className="text-brand-500" />
                <h2 className="text-base font-bold text-gray-100">
                  {initialName ? "Edit Dish" : "Build a Dish"}
                </h2>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Dish name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
              Dish Name <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full rounded-xl px-4 py-2.5 text-sm bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              placeholder="e.g. My Poha, Mom's Dal, Evening Smoothie…"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              autoFocus
            />
            {/* Name validation hint */}
            {name.trim().length === 0 && (
              <p className="mt-1.5 text-xs text-gray-600">Enter a name to enable saving</p>
            )}
          </div>

          {/* Diet type pill toggle — below dish name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
              Diet Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {DIET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDietType(opt.value)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all select-none ${
                    dietType === opt.value
                      ? opt.activeClass
                      : `border-gray-700 text-gray-500 bg-transparent ${opt.inactiveHover}`
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients section */}
          <div className="space-y-3">
            {/* Split label: heading + subtitle */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Ingredients
              </p>
              <p className="text-sm text-gray-400 mt-0.5">Search and add foods below</p>
            </div>

            <FoodSearchBar onSelect={handleFoodSelect} dietFilter={dietFilter} />

            {/* Pending food — confirm qty before adding */}
            {pendingFood && (
              <div className="rounded-xl border border-brand-500/40 bg-brand-500/5 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dietDot(pendingFood)}`} />
                  <p className="text-sm font-medium text-gray-100 flex-1 truncate">{pendingFood.name}</p>
                  <span className="text-xs text-gray-500">{pendingFood.calories_kcal.toFixed(0)} kcal/100g</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 shrink-0">How much?</span>
                  <input
                    type="number"
                    min={pendingUnit === "qty" ? 1 : 1}
                    step={pendingUnit === "qty" ? 1 : 10}
                    className="flex-1 rounded-xl px-3 py-2 text-sm bg-gray-800 border border-gray-700 text-gray-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    value={pendingAmt}
                    onChange={(e) => setPendingAmt(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                  <span className="text-sm text-gray-400 font-medium w-12 shrink-0">{unitLabel(pendingUnit, pendingFood)}</span>
                  <Button size="sm" onClick={addIngredient} className="flex items-center gap-1 shrink-0">
                    <Plus size={13} /> Add
                  </Button>
                </div>
                {pendingUnit === "qty" && (
                  <p className="text-xs text-gray-600">
                    1 unit ≈ {unitWeightG(pendingFood)}g — nutrition calculated from equivalent weight
                  </p>
                )}
                {pendingUnit === "ml" && (
                  <p className="text-xs text-gray-600">ml treated as equal weight in grams for nutrition calculation</p>
                )}
              </div>
            )}

            {/* Added ingredients */}
            {ingredients.length > 0 && (
              <div className="rounded-xl border border-gray-800 divide-y divide-gray-800 overflow-hidden">
                {ingredients.map((ing, idx) => {
                  const unit = ing.display_unit ?? "g";
                  const dispAmt = ing.display_amount ?? ing.quantity_g;
                  const perIngProt = (ing.protein_g / ing.serving_size_g) * ing.quantity_g;
                  const perIngCal  = (ing.calories_kcal / ing.serving_size_g) * ing.quantity_g;

                  return (
                    <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-gray-900 hover:bg-gray-800/60 transition-colors group">
                      {/* Name + macros */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-100 truncate">{ing.food_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="text-gray-300 font-medium">{perIngCal.toFixed(0)}</span>
                          <span className="text-gray-600"> kcal · </span>
                          <span className="text-blue-400 font-medium">{perIngProt.toFixed(1)}g</span>
                          <span className="text-gray-600"> protein</span>
                        </p>
                      </div>
                      {/* Qty edit */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min={1}
                          step={unit === "qty" ? 1 : 10}
                          className="w-16 rounded-lg px-2 py-1 text-sm text-center bg-gray-800 border border-gray-700 text-gray-100 outline-none focus:border-brand-500"
                          value={dispAmt}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > 0) updateAmount(idx, val, unit);
                          }}
                        />
                        <span className="text-xs text-gray-500 w-14">{unitLabel(unit, ing.item_ref ?? { serving_size_g: ing.serving_size_g, name: ing.food_name } as FoodItem)}</span>
                      </div>
                      {/* Remove */}
                      <button
                        onClick={() => removeIngredient(idx)}
                        className="p-1 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state with ghost skeleton preview */}
            {ingredients.length === 0 && !pendingFood && (
              <div className="space-y-2">
                {/* Ghost skeleton card */}
                <div className="rounded-xl border border-dashed border-gray-700 overflow-hidden">
                  {/* Skeleton row 1 */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/50">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="h-3 w-32 rounded-full bg-gray-800 animate-pulse" />
                      <div className="h-2.5 w-24 rounded-full bg-gray-800/70 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-16 h-7 rounded-lg bg-gray-800 animate-pulse" />
                      <div className="w-10 h-4 rounded bg-gray-800/70 animate-pulse" />
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-gray-800/50 animate-pulse" />
                  </div>
                  {/* Skeleton row 2 */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/30 border-t border-gray-800">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="h-3 w-40 rounded-full bg-gray-800/60 animate-pulse" />
                      <div className="h-2.5 w-20 rounded-full bg-gray-800/40 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-16 h-7 rounded-lg bg-gray-800/60 animate-pulse" />
                      <div className="w-10 h-4 rounded bg-gray-800/40 animate-pulse" />
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-gray-800/30 animate-pulse" />
                  </div>
                </div>
                {/* Empty state hint */}
                <div className="flex items-center justify-center gap-2 py-3 text-gray-600">
                  <ChefHat size={16} />
                  <span className="text-xs">Your ingredients will appear here — search above to get started</span>
                </div>
              </div>
            )}
          </div>

          {/* Nutrition preview */}
          {ingredients.length > 0 && (
            <DishNutritionPreview ingredients={ingredients} totalWeight={totalWeight} />
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Save / Cancel */}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
            <div className="flex-1 relative group">
              <Button
                onClick={handleSave}
                disabled={saving || !canSave}
                className={`w-full transition-all ${
                  !canSave ? "opacity-40 cursor-not-allowed" : ""
                }`}
              >
                {saving ? <><Spinner className="w-4 h-4 mr-1.5" />Saving…</> : "Save Dish"}
              </Button>
              {!canSave && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10">
                  {name.trim().length === 0 && ingredients.length === 0
                    ? "Enter a dish name and add at least one ingredient"
                    : name.trim().length === 0
                    ? "Enter a dish name first"
                    : "Add at least one ingredient"}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-700" />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}