/**
 * dishUtils.ts — pure functions for the Dishes page.
 * No React, no API calls. Safe to unit-test.
 *
 * UNIT SYSTEM (2026-07-07):
 * Each food item gets multiple UnitOption choices derived from its category + name.
 * User selects the unit that matches how they naturally think about the food.
 * All units convert to grams for the API — nutrition is always per-100g in the DB.
 */
import type { FoodItem } from "@/types/nutrition";
import type { DishIngredientInput } from "@/types/dish";

// ── UnitOption ────────────────────────────────────────────────────────────────

export interface UnitOption {
  label:    string;    // displayed in picker: "tablespoon", "1 katori (150g)"
  weight_g: number;   // grams per 1 unit of this label
  default?: boolean;  // pre-selected option
}

// ── Category detectors ────────────────────────────────────────────────────────

const OIL_NAMES = [
  "oil", "ghee", "butter", "margarine", "vanaspati", "fat", "shortening",
];

const EGG_PATTERNS = [
  /^egg[,\s]/, /^egg$/, /\begg\b.*\bwhole\b/, /whole.*\begg\b/,
];

const LIQUID_CATEGORIES = new Set([
  "beverages", "beverage", "drinks", "alcoholic beverages",
  "drinks,alcohol, beve",
]);

const LIQUID_NAME_PATTERNS = [
  /\bmilk\b/, /\bjuice\b/, /\bwater\b/, /\btea\b/, /\bcoffee\b/,
  /\blassi\b/, /\bchaas\b/, /\bbuttermilk\b/, /\bsmoothie\b/,
  /\bnectar\b/, /\bcola\b/, /\bsoda\b/, /\bale\b/, /\bbeer\b/,
  /\bwine\b/, /\bwhey\b/, /\bkefir\b/, /\byogurt drink\b/,
];

const SOLID_DAIRY_NAMES = [
  "paneer", "khoa", "khoya", "cheese", "cream", "curd",
  "yogurt", "yoghurt", "ice cream", "kulfi",
];

const BREAD_PATTERNS = [
  /^chapati/, /^roti$/, /^naan$/, /^puri$/, /^bhatura$/, /^paratha/,
  /^phulka/, /^tortilla/, /\bslice.*bread/, /^bread.*slice/,
];

const BREAD_WEIGHTS: Record<string, number> = {
  chapati: 40, roti: 40, phulka: 30, naan: 80, puri: 40,
  bhatura: 100, paratha: 60, tortilla: 45,
};

const IDLI_PATTERNS = [/^idli/, /^dosa/, /^vada/, /^uttapam/, /^appam/];
const IDLI_WEIGHTS:  Record<string, number> = {
  idli: 50, dosa: 80, vada: 75, uttapam: 120, appam: 55,
};

const COOKED_GRAIN_PATTERNS = [
  /cooked.*rice/, /rice.*cooked/, /boiled.*rice/, /cooked.*dal/,
  /dal.*cooked/, /cooked.*lentil/, /cooked.*bean/, /cooked.*chickpea/,
  /cooked.*rajma/, /cooked.*chole/,
];

const CURRY_CATS = new Set(["curries", "curry", "sabzi", "dal"]);
const CURRY_PATTERNS = [
  /\bcurry\b/, /\bsabzi\b/, /\bgravy\b/, /\bmasala\b/, /\bdal\b/,
  /\bsambar\b/, /\bradish\b/, /\bpaneer.*dish/, /\bchicken.*dish/,
];

const WHOLE_FRUIT_NAMES = [
  "apple", "banana", "orange", "mango", "guava", "pear", "peach",
  "plum", "kiwi", "papaya", "watermelon", "pineapple", "grapes",
];

const FRUIT_WEIGHTS: Record<string, Record<"small"|"medium"|"large", number>> = {
  apple:      { small: 138, medium: 182, large: 223 },
  banana:     { small: 81,  medium: 118, large: 152 },
  orange:     { small: 96,  medium: 131, large: 184 },
  mango:      { small: 150, medium: 200, large: 280 },
  guava:      { small: 90,  medium: 130, large: 180 },
  pear:       { small: 120, medium: 166, large: 230 },
  watermelon: { small: 200, medium: 400, large: 600 },
  pineapple:  { small: 180, medium: 300, large: 500 },
  grapes:     { small: 80,  medium: 150, large: 250 },
  default:    { small: 80,  medium: 120, large: 180 },
};

const NUT_PATTERNS = [
  /\balmond/, /\bcashew/, /\bwalnut/, /\bpeanut/, /\bpistachio/,
  /\bpecan/, /\bsunflower.*seed/, /\bpumpkin.*seed/, /\bflax.*seed/,
  /\bchia.*seed/, /\bsesame/,
];

// ── Detector helpers ──────────────────────────────────────────────────────────

function isOil(name: string)         { return OIL_NAMES.some(o => name.includes(o)); }
function isEgg(name: string)         { return EGG_PATTERNS.some(p => p.test(name)); }
function isSolidDairy(name: string)  { return SOLID_DAIRY_NAMES.some(s => name.includes(s)); }
function isLiquid(name: string, cat: string) {
  return LIQUID_CATEGORIES.has(cat) || LIQUID_NAME_PATTERNS.some(p => p.test(name));
}
function isBread(name: string)       { return BREAD_PATTERNS.some(p => p.test(name)); }
function isIdli(name: string)        { return IDLI_PATTERNS.some(p => p.test(name)); }
function isCookedGrain(name: string) { return COOKED_GRAIN_PATTERNS.some(p => p.test(name)); }
function isCurry(name: string, cat: string) {
  return CURRY_CATS.has(cat) || CURRY_PATTERNS.some(p => p.test(name));
}
function isWholeFruit(name: string)  { return WHOLE_FRUIT_NAMES.some(f => name.includes(f)); }
function isNut(name: string)         { return NUT_PATTERNS.some(p => p.test(name)); }

function getBreadWeight(name: string): number {
  for (const [key, w] of Object.entries(BREAD_WEIGHTS)) {
    if (name.includes(key)) return w;
  }
  return 45;
}

function getIdliWeight(name: string): number {
  for (const [key, w] of Object.entries(IDLI_WEIGHTS)) {
    if (name.includes(key)) return w;
  }
  return 60;
}

function getFruitWeight(name: string, size: "small"|"medium"|"large"): number {
  for (const [fruit, weights] of Object.entries(FRUIT_WEIGHTS)) {
    if (name.includes(fruit)) return weights[size];
  }
  return FRUIT_WEIGHTS.default[size];
}

// ── Main unit API ─────────────────────────────────────────────────────────────

/**
 * Returns 3–5 sensible unit options for the given food item.
 * The user picks one; all options convert to grams for the API.
 */
export function getUnitOptions(item: FoodItem): UnitOption[] {
  const name = item.name.toLowerCase();
  const cat  = (item.category ?? "").toLowerCase();
  const srv  = item.serving_size_g ?? 100;

  // 1. Oils & fats
  if (isOil(name)) {
    return [
      { label: "teaspoon (5g)",   weight_g: 5,  default: srv <= 7 },
      { label: "tablespoon (13g)",weight_g: 13, default: srv > 7 && srv <= 20 },
      { label: "10g",             weight_g: 10 },
      { label: "50g",             weight_g: 50, default: srv > 20 },
    ];
  }

  // 2. Eggs
  if (isEgg(name)) {
    return [
      { label: "1 whole (50g)",  weight_g: 50,  default: true },
      { label: "2 whole (100g)", weight_g: 100 },
      { label: "100g",           weight_g: 100 },
    ];
  }

  // 3. Liquids (non-solid-dairy)
  if (isLiquid(name, cat) && !isSolidDairy(name)) {
    const opts: UnitOption[] = [
      { label: "100ml",         weight_g: 100, default: srv === 100 },
      { label: "1 cup (240ml)", weight_g: 240 },
      { label: "1 glass (250ml)", weight_g: 250, default: srv >= 200 },
      { label: "tablespoon (15ml)", weight_g: 15 },
    ];
    if (srv !== 100 && srv !== 240 && srv !== 250) {
      opts.push({ label: `${Math.round(srv)}ml`, weight_g: srv, default: true });
    }
    // deduplicate by weight_g
    const seen = new Set<number>();
    return opts.filter(o => { if (seen.has(o.weight_g)) return false; seen.add(o.weight_g); return true; });
  }

  // 4. Bread / chapati / roti / naan / paratha
  if (isBread(name)) {
    const w = getBreadWeight(name);
    return [
      { label: `1 piece (${w}g)`,   weight_g: w,    default: true },
      { label: `2 pieces (${w*2}g)`, weight_g: w*2 },
      { label: "100g",               weight_g: 100  },
    ];
  }

  // 5. Idli / dosa / vada
  if (isIdli(name)) {
    const w = getIdliWeight(name);
    return [
      { label: `1 piece (${w}g)`,    weight_g: w,    default: true },
      { label: `2 pieces (${w*2}g)`, weight_g: w*2 },
      { label: "100g",               weight_g: 100  },
    ];
  }

  // 6. Cooked grains / dal / lentils
  if (isCookedGrain(name)) {
    return [
      { label: "1 katori (150g)", weight_g: 150, default: srv <= 160 },
      { label: "1 cup (200g)",    weight_g: 200, default: srv > 160 },
      { label: "100g",            weight_g: 100 },
      { label: "50g",             weight_g: 50  },
    ];
  }

  // 7. Curries / sabzi / gravies
  if (isCurry(name, cat)) {
    return [
      { label: "1 katori (150g)", weight_g: 150, default: true },
      { label: "1 bowl (250g)",   weight_g: 250 },
      { label: "1 ladle (80g)",   weight_g: 80  },
      { label: "100g",            weight_g: 100 },
    ];
  }

  // 8. Whole fruits
  if (isWholeFruit(name)) {
    return [
      { label: `small (${getFruitWeight(name,"small")}g)`,   weight_g: getFruitWeight(name,"small") },
      { label: `medium (${getFruitWeight(name,"medium")}g)`, weight_g: getFruitWeight(name,"medium"), default: true },
      { label: `large (${getFruitWeight(name,"large")}g)`,   weight_g: getFruitWeight(name,"large") },
      { label: "100g", weight_g: 100 },
    ];
  }

  // 9. Nuts & seeds
  if (isNut(name)) {
    return [
      { label: "handful (30g)", weight_g: 30, default: srv <= 35 },
      { label: "10g",           weight_g: 10 },
      { label: "25g",           weight_g: 25, default: srv > 35 },
      { label: "100g",          weight_g: 100 },
    ];
  }

  // 10. Default: solid food — gram options with serving size
  const options: UnitOption[] = [];
  if (srv !== 100 && srv !== 50 && srv !== 200) {
    options.push({ label: `serving (${Math.round(srv)}g)`, weight_g: srv, default: true });
  }
  options.push(
    { label: "100g", weight_g: 100, default: !options.length },
    { label: "50g",  weight_g: 50 },
    { label: "200g", weight_g: 200 },
  );
  return options;
}

/** Returns the pre-selected default unit from a list of options. */
export function defaultOption(options: UnitOption[]): UnitOption {
  return options.find(o => o.default) ?? options[0];
}

// ── Nutrition computation ─────────────────────────────────────────────────────

export interface DishNutritionTotals {
  kcal:        number;
  protein:     number;
  carbs:       number;
  fat:         number;
  fiber:       number;
  totalWeight: number;
  per100gKcal: number;
}

export function computeDishNutrition(ingredients: DishIngredientInput[]): DishNutritionTotals {
  const totals = ingredients.reduce(
    (acc, ing) => {
      const ratio = ing.quantity_g / (ing.serving_size_g || 100);
      return {
        kcal:    acc.kcal    + ing.calories_kcal * ratio,
        protein: acc.protein + ing.protein_g     * ratio,
        carbs:   acc.carbs   + ing.carbs_g       * ratio,
        fat:     acc.fat     + ing.fat_g         * ratio,
        fiber:   acc.fiber   + ing.fiber_g       * ratio,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

  const totalWeight = ingredients.reduce((s, i) => s + i.quantity_g, 0);
  const per100gKcal = totalWeight > 0 ? (totals.kcal / totalWeight) * 100 : 0;

  return { ...totals, totalWeight, per100gKcal };
}

// ── Legacy compatibility (kept for any existing callers) ──────────────────────

/** @deprecated Use getUnitOptions() instead */
export type DishUnit = "g" | "ml" | "qty";
