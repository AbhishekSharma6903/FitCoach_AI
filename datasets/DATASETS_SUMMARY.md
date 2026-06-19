# FitCoach AI — Food Dataset Summary

> Reference document. Use this instead of re-exploring the raw files.

---

## Overview of Available Datasets

| # | Dataset | Location | Foods | Source |
|---|---|---|---|---|
| 1 | **Kaggle Nutrition CSV** | `datasets/kaggle-dataset/nutrients_csvfile.csv` | 335 | Web-scraped/compiled |
| 2 | **USDA SR Legacy** | `datasets/FoodData_Central_sr_legacy_food_csv_2018-04/` | 7,793 | USDA FoodData Central |
| 3 | **IFCT 2017** | Not yet downloaded | 542 | National Institute of Nutrition, India (ICMR) |

---

## Dataset 1 — Kaggle `nutrients_csvfile.csv`

### What it is
A small, pre-cleaned CSV of common foods. Simple flat structure — one row per food, all values per serving.

### Schema (9 columns)
| Column | Type | Notes |
|---|---|---|
| `Food` | string | Food name |
| `Measure` | string | Human serving description e.g. "1 cup", "1 qt." |
| `Grams` | number | Weight of that serving in grams |
| `Calories` | number | kcal per serving |
| `Protein` | number | grams |
| `Fat` | number | total fat grams |
| `Sat.Fat` | number | saturated fat grams (some values are `t` = trace) |
| `Fiber` | number | grams |
| `Carbs` | number | grams |
| `Category` | string | e.g. "Dairy products", "Vegetables" |

### Assessment
- **Good for:** Quick start, prototyping, UI demos
- **Missing:** No micronutrients (vitamins, minerals), no sugar breakdown, no diet flags, no Indian foods
- **Data quality issues:** Some values are `t` (trace) strings instead of 0 — needs cleaning
- **Decision: Supplementary only** — too small and too sparse for production use

---

## Dataset 2 — USDA SR Legacy (April 2018)

### What it is
The gold-standard US government food composition database. Multi-file relational structure — you join on `fdc_id`. ~7,793 whole foods (raw ingredients, basic prepared foods), ~700 nutrients tracked.

### File Structure
```
FoodData_Central_sr_legacy_food_csv_2018-04/
├── food.csv                        ← main food table (fdc_id, description, category_id)
├── sr_legacy_food.csv              ← maps fdc_id → NDB_number (old ID system)
├── food_nutrient.csv               ← fdc_id × nutrient_id → amount (the big table)
├── nutrient.csv                    ← nutrient ID → name, unit, rank
├── food_category.csv               ← category ID → name (28 categories)
├── food_portion.csv                ← serving size descriptions per food
├── food_attribute.csv              ← extra metadata per food
├── measure_unit.csv                ← unit definitions
├── food_nutrient_derivation.csv    ← how each value was derived (lab/estimate/etc)
├── food_nutrient_source.csv        ← source references
├── retention_factor.csv            ← cooking retention factors
└── all_downloaded_table_record_counts.csv
```

### Key Nutrients Available (the ones that matter for FitCoach)
| Nutrient ID | Name | Unit |
|---|---|---|
| 1008 | Energy | KCAL |
| 1003 | Protein | G |
| 1004 | Total fat | G |
| 1005 | Carbohydrate | G |
| 1079 | Fiber, total dietary | G |
| 2000 / 1063 | Sugars, Total | G |
| 1253 | Cholesterol | MG |
| 1257–1266 | Saturated fatty acids (SFAs) | G |
| 1268–1279 | Monounsaturated fatty acids (MUFAs) | G |
| 1269–1280 | Polyunsaturated fatty acids (PUFAs) | G |
| 1093 | Sodium | MG |
| 1092 | Potassium | MG |
| 1087 | Calcium | MG |
| 1089 | Iron | MG |
| 1090 | Magnesium | MG |
| 1091 | Phosphorus | MG |
| 1095 | Zinc | MG |
| 1098 | Copper | MG |
| 1101 | Manganese | MG |
| 1103 | Selenium | UG |
| 1106 | Vitamin A, RAE | UG |
| 1165 | Thiamin (B1) | MG |
| 1166 | Riboflavin (B2) | MG |
| 1167 | Niacin (B3) | MG |
| 1175 | Vitamin B-6 | MG |
| 1177/1190 | Folate (total / DFE) | UG |
| 1178 | Vitamin B-12 | UG |
| 1162 | Vitamin C | MG |
| 1114 | Vitamin D (D2+D3) | UG |
| 1109 | Vitamin E (alpha-tocopherol) | MG |
| 1185 | Vitamin K | UG |
| 1180 | Choline | MG |

### Food Categories (28)
Dairy & Egg, Spices, Baby Foods, Fats & Oils, Poultry, Soups/Sauces, Sausages, Breakfast Cereals, Fruits, Pork, Vegetables, Nuts & Seeds, Beef, Beverages, Fish & Shellfish, Legumes, Lamb/Game, Baked Products, Sweets, Cereal Grains & Pasta, Fast Foods, Meals & Entrees, Snacks, American Indian Foods, Restaurant Foods, Branded Foods, Alcoholic Beverages

### Assessment
- **Good for:** Comprehensive nutrient coverage, reliable lab-verified values, good for all international/Western foods and ingredients
- **Missing:** Indian traditional foods (dal makhani, idli, chapati etc.), Indian spice blends, street foods
- **Data model:** Relational (requires join across 3+ files to get one food's nutrients) → needs a flattening step during import
- **Decision: Primary dataset** — use as the base, join food.csv + food_nutrient.csv + nutrient.csv

---

## Dataset 3 — IFCT 2017 (Indian Food Composition Tables)

### What it is
Official Indian food database published by National Institute of Nutrition (NIN), ICMR, Hyderabad. 542 key Indian foods with ~300 nutrient columns. This is the authoritative source for Indian food nutrition data.

### How to get the data
**The repo is a JavaScript library, not just a data dump.** The actual CSV is embedded in the source. Direct download:
```
https://raw.githubusercontent.com/nodef/ifct2017/refs/heads/main/compositions/index.csv
```

**Other data files also available at:**
```
https://raw.githubusercontent.com/nodef/ifct2017/refs/heads/main/{folder}/index.csv
```
Where `{folder}` is one of: `groups`, `descriptions`, `intakes`, `yieldfactors`, `codes`, `regions`, `columndescriptions`

### Key Columns in `compositions/index.csv`
| Column | Meaning |
|---|---|
| `code` | Unique food code (e.g. A001) |
| `name` | English food name |
| `scie` | Scientific name |
| `lang` | Language/regional name |
| `grup` | Food group |
| `regn` | Region of India |
| `enerc` | Energy (kcal) |
| `water` | Water (g) |
| `protcnt` | Protein (g) |
| `fatce` | Total fat (g) |
| `choavldf` | Carbohydrate available (g) |
| `fibtg` | Total dietary fiber (g) |
| `fasat` / `fams` / `fapu` | Saturated / Mono / Poly fat |
| `fatrn` | Trans fat |
| `cholc` | Cholesterol |
| `ca` | Calcium (mg) |
| `fe` | Iron (mg) |
| `mg` | Magnesium (mg) |
| `p` | Phosphorus (mg) |
| `k` | Potassium (mg) |
| `na` | Sodium (mg) |
| `zn` | Zinc (mg) |
| `cu` | Copper (mg) |
| `mn` | Manganese (mg) |
| `se` | Selenium (ug) |
| `vita` | Vitamin A (RAE, ug) |
| `vitb` | Vitamin B complex |
| `vitc` | Vitamin C (mg) |
| `vitd` | Vitamin D (ug) |
| `vite` | Vitamin E |
| `vitk` | Vitamin K |
| `thia` / `ribf` / `nia` | B1 / B2 / B3 |
| `vitb6c` | Vitamin B6 |
| `folsum` | Folate total |
| `cartbeq` | Beta-carotene equivalents |
| `amiac` | Total amino acids |
| `his`,`ile`,`leu`,`lys`... | Individual amino acids |
| `phytac` | Phytic acid (anti-nutrient) |
| `polyph` | Total polyphenols |
| `phystr` | Phytosterols |
| `sapon` | Saponins |
| `oxalt` | Oxalic acid total |
| `orgac` | Organic acids |
| Individual fatty acids | Full omega-3/6/9, EPA, DHA breakdown |

**`_e` suffix columns** = error/uncertainty estimates for each measurement (e.g. `enerc_e` = energy measurement error). These are scientific precision fields — **not needed for a fitness app.**

### Assessment
- **Good for:** All Indian foods — dal varieties, rice varieties, millets, Indian vegetables, spices, traditional preparations
- **Notable extras:** Anti-nutrients (phytic acid, oxalates, saponins) — useful for future "nutrient absorption" feature
- **Missing:** Branded/packaged Indian foods, restaurant foods, exact serving descriptions
- **Decision: Essential second source** — combine with USDA SR Legacy to get full Indian + international coverage

---

## Recommended Data Strategy

### Phase 1 — Production Database (build this first)
Combine USDA SR Legacy + IFCT 2017 into a flat `food_items` table.

```
USDA SR Legacy  →  7,793 foods  (Western, ingredients, packaged US)
       +
IFCT 2017       →    542 foods  (Indian whole foods, grains, legumes, vegetables)
─────────────────────────────────
Total:          ~8,335 foods (after deduplication)
```

### Phase 2 — Branded Foods
Add Indian branded products from Open Food Facts (Maggi, Amul, Parle, MTR, ITC etc.)
Filter: `countries_tags` contains `india` OR `en:india`

### Phase 3 — User Enrichment
Allow users/admins to submit new food items → stored with `source = 'user'`, `is_verified = false`

---

## Recommended Schema for `food_items` Table

```sql
CREATE TABLE food_items (
  -- Identity
  id                    SERIAL PRIMARY KEY,
  name                  VARCHAR(256)    NOT NULL,
  name_normalized       VARCHAR(256)    NOT NULL,         -- lowercase, no punctuation (for search)
  aliases               TEXT[],                           -- ["roti","chapati","phulka"]

  -- Classification
  category              VARCHAR(64),                      -- "dal", "vegetable", "fruit", "grain"
  subcategory           VARCHAR(64),
  cuisine               VARCHAR(64),                      -- "North Indian", "South Indian", "Global"
  food_group            VARCHAR(64),                      -- "legumes", "cereals", "dairy", "meat"

  -- Source traceability
  source                VARCHAR(32)     NOT NULL,         -- "USDA_SR", "IFCT2017", "OFF", "user"
  source_id             VARCHAR(64),                      -- original ID in source dataset
  barcode               VARCHAR(32),                      -- EAN/UPC for branded items

  -- Serving reference
  serving_size_g        NUMERIC(6,2)    NOT NULL DEFAULT 100,
  serving_description   VARCHAR(64),                      -- "1 bowl (250g)", "1 chapati (40g)"

  -- Core macros (per serving_size_g)
  calories_kcal         NUMERIC(7,2)    NOT NULL,
  protein_g             NUMERIC(6,2)    NOT NULL DEFAULT 0,
  carbs_g               NUMERIC(6,2)    NOT NULL DEFAULT 0,
  fat_g                 NUMERIC(6,2)    NOT NULL DEFAULT 0,
  fiber_g               NUMERIC(6,2)    NOT NULL DEFAULT 0,
  sugar_g               NUMERIC(6,2)    NOT NULL DEFAULT 0,

  -- Fat breakdown
  saturated_fat_g       NUMERIC(6,2),
  monounsaturated_fat_g NUMERIC(6,2),
  polyunsaturated_fat_g NUMERIC(6,2),
  trans_fat_g           NUMERIC(6,2),
  cholesterol_mg        NUMERIC(7,2),

  -- Key minerals
  sodium_mg             NUMERIC(7,2),
  potassium_mg          NUMERIC(7,2),
  calcium_mg            NUMERIC(7,2),
  iron_mg               NUMERIC(6,2),
  magnesium_mg          NUMERIC(6,2),
  phosphorus_mg         NUMERIC(6,2),
  zinc_mg               NUMERIC(5,2),

  -- Key vitamins
  vitamin_a_mcg         NUMERIC(7,2),   -- RAE
  vitamin_c_mg          NUMERIC(6,2),
  vitamin_d_mcg         NUMERIC(5,2),
  vitamin_b12_mcg       NUMERIC(5,2),
  folate_mcg            NUMERIC(6,2),   -- DFE

  -- Diet flags
  is_veg                BOOLEAN         NOT NULL DEFAULT TRUE,
  is_egg                BOOLEAN         NOT NULL DEFAULT FALSE,
  is_vegan              BOOLEAN         NOT NULL DEFAULT FALSE,
  is_gluten_free        BOOLEAN,
  is_dairy_free         BOOLEAN,

  -- Meta
  is_verified           BOOLEAN         NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_food_items_name_norm  ON food_items (name_normalized);
CREATE INDEX idx_food_items_category   ON food_items (category);
CREATE INDEX idx_food_items_source     ON food_items (source);
CREATE INDEX idx_food_items_barcode    ON food_items (barcode) WHERE barcode IS NOT NULL;
```

---

## Schema Field Decisions

### Fields included — why
| Field | Reason |
|---|---|
| `aliases` array | "roti" / "chapati" / "phulka" = same food. Critical for search recall |
| `cuisine` | replaces `region` — cleaner, maps to Indian food tagging in IFCT |
| `food_group` | standard grouping for macro analysis (legumes vs cereals vs dairy) |
| `source` + `source_id` | traceability — must know where each row came from |
| `barcode` | needed once we ingest Open Food Facts branded items |
| `serving_description` | "1 bowl" is more useful to users than "250g" |
| `saturated/mono/poly fat` | full fat profile — needed for heart health coaching |
| `cholesterol_mg` | relevant for eggs, meat, dairy — zero for plant foods |
| `sodium_mg` | critical for BP-conscious users, very common micronutrient |
| `calcium/iron/magnesium/zinc` | 4 most-deficient minerals in Indian diets (per NIN data) |
| `vitamin_a/C/D/B12/folate` | 5 most-deficient vitamins in Indian diets |
| `is_vegan` | separate from `is_veg` — dairy and honey distinction matters |
| `is_gluten_free` | growing user need, especially for millet-based Indian diets |
| `is_dairy_free` | lactose intolerance is very prevalent in India (~70%) |
| `is_verified` | admin approval gate for user-submitted items |

### Fields deliberately excluded
| Field | Reason excluded |
|---|---|
| `_e` error columns (IFCT) | Scientific precision metadata, not useful in a fitness app |
| 160+ individual fatty acid subtypes | Near-zero coverage for Indian foods, overkill |
| Individual amino acids (18 columns) | Phase 3 feature at earliest — for performance/bodybuilding profiles |
| Anti-nutrients (phytic, oxalic, saponins) | Interesting but no UI/logic uses them yet — add in Phase 3 |
| `glycemic_index` | No standardized source, values widely disputed |
| `starch_g` | Subsumed in `carbs_g` for practical purposes |
| `alcohol_g` | Edge case — add when needed |
| `omega_3/6_g` | Phase 3 — advanced analytics feature |
| `water_g` | Not useful for tracking |

---

## Import Pipeline (what to build)

### Step 1 — USDA SR Legacy importer
```
food.csv  ──────────────────────────────────┐
food_nutrient.csv  (join on fdc_id)          ├── flatten → food_items rows
nutrient.csv  (join on nutrient_id)         ──┘
food_category.csv  (join on food_category_id)
food_portion.csv   (for serving_description)
```
Filter nutrients to only the ~25 we keep. Default `serving_size_g = 100`.

### Step 2 — IFCT 2017 importer
```
compositions/index.csv  →  map column codes to our schema fields
descriptions/index.csv  →  fill `aliases` with regional names
groups/index.csv        →  fill `food_group` and `category`
yieldfactors/index.csv  →  optional: raw-to-cooked conversion metadata
```
Set `source = 'IFCT2017'`, `cuisine = 'Indian'`.

### Step 3 — Deduplication
Foods like "Rice, white, raw" appear in both datasets. Deduplicate by normalized name match. Prefer IFCT2017 values for Indian foods (more accurate for Indian varieties).

### Step 4 — Diet flags
- Set `is_veg = false` for USDA categories: Poultry, Pork, Beef, Lamb, Fish & Shellfish, Sausages, Fast Foods (review individually)
- Set `is_egg = true` for Dairy and Egg category items containing "egg"
- IFCT has `grup` (food group) — map similarly

---

## What's Still Missing

| Gap | Fix |
|---|---|
| Branded Indian packaged foods (Maggi, Parle-G, MTR etc.) | Ingest from Open Food Facts filtered to India |
| Restaurant / delivery foods (Zomato, Swiggy menu items) | Manual entry or third-party API |
| Indian composite dishes (dal makhani, biryani) | Recipe-level calculation from ingredient breakdown |
| Exact serving sizes for Indian foods | IFCT has gram weights; need to map to "1 katori", "1 chapati" |
| Glycemic Index | No free complete dataset exists — skip or use estimated ranges |

---

## Quick Reference — Download URLs

| Dataset | Download URL |
|---|---|
| USDA SR Legacy CSV | `https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip` |
| USDA Full (all types) | `https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_csv_2026-04-30.zip` |
| IFCT 2017 compositions | `https://raw.githubusercontent.com/nodef/ifct2017/refs/heads/main/compositions/index.csv` |
| IFCT 2017 descriptions | `https://raw.githubusercontent.com/nodef/ifct2017/refs/heads/main/descriptions/index.csv` |
| IFCT 2017 groups | `https://raw.githubusercontent.com/nodef/ifct2017/refs/heads/main/groups/index.csv` |
| IFCT 2017 yield factors | `https://raw.githubusercontent.com/nodef/ifct2017/refs/heads/main/yieldfactors/index.csv` |
| Open Food Facts CSV | `https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz` (~9GB unzipped) |
| Open Food Facts Parquet | `https://huggingface.co/datasets/openfoodfacts/product-database/resolve/main/food.parquet?download=true` |
