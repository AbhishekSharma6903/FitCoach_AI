# Nutrition Feature Ideation
> Decision log for the food dataset integration and meal-tracking features.
> Written: 2026-06-19. Update this doc as decisions change — don't create a new one.

---

## Context

We now have a merged food dataset (`datasets/output/food_items.csv`) with **8,644 foods** across:
- **USDA SR Legacy** — 7,793 international/ingredient-level foods
- **IFCT 2017** — 540 Indian whole foods (official NIN/ICMR data)
- **Kaggle** — 311 common foods (macros only)

All values are per 100g. Schema has 35 columns: macros, fat breakdown, 7 minerals, 5 vitamins, diet flags, source traceability.

The app currently stubs out food tracking. This doc captures every feature idea, the decisions behind them, and what to build first.

---

## Feature 1 — Meal Logger (Core)

### What it is
Users log what they ate. Each log entry = one food item × quantity. The app sums up daily nutrition and compares it to their targets (already computed from onboarding: TDEE, protein/carb/fat split).

### How it works
1. User opens "Log Meal" — picks a meal slot: Breakfast / Lunch / Dinner / Snack
2. Types a food name → fuzzy search hits `food_items` table (we already have RapidFuzz in the backend)
3. Selects a result, adjusts quantity (grams or "servings")
4. App stores the log entry and updates the daily dashboard totals in real time

### Schema additions needed

```sql
CREATE TABLE meal_logs (
  id              SERIAL PRIMARY KEY,
  user_id         VARCHAR(64)   NOT NULL,   -- Clerk user_id
  logged_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  meal_slot       VARCHAR(16)   NOT NULL,   -- 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_item_id    INTEGER       REFERENCES food_items(id),
  custom_dish_id  INTEGER       REFERENCES custom_dishes(id),  -- nullable
  quantity_g      NUMERIC(7,2)  NOT NULL,   -- how many grams the user ate
  -- denormalised snapshot at log time (so edits to food_items don't break history)
  calories_kcal   NUMERIC(7,2)  NOT NULL,
  protein_g       NUMERIC(6,2)  NOT NULL,
  carbs_g         NUMERIC(6,2)  NOT NULL,
  fat_g           NUMERIC(6,2)  NOT NULL,
  fiber_g         NUMERIC(6,2),
  notes           TEXT
);
```

### Key decisions
| Decision | Choice | Reason |
|---|---|---|
| Store nutrient snapshot at log time | YES | If food_items data is corrected later, historical logs must not change |
| Fuzzy search backend or frontend | Backend (FastAPI) | RapidFuzz already wired; keeps dataset off the client |
| Default quantity | 100g | All our values are per 100g; simple to reason about |
| Serving size UI | Show "1 bowl ≈ 250g", "1 chapati ≈ 40g" presets from `serving_description` | Reduces friction — users think in servings not grams |
| Meal slots | 4 fixed + free-form notes | Simple to aggregate, easy to show a daily timeline |

### What to improve later
- Barcode scanner (Open Food Facts API) for packaged items
- Voice input: "I had 2 rotis and dal" → parse via Claude API
- Photo logging: snap a plate, Claude Vision estimates portions

---

## Feature 2 — Custom Dish Builder

### What it is
Users create a reusable "dish" by combining ingredients (from `food_items`). FitCoach calculates the dish's total nutrition. Once saved, the dish appears in food search just like any other item — user logs it like any meal.

### Why this matters
Indian home cooking is almost entirely composite dishes that don't exist in any dataset. Dal makhani, poha, upma, biryani — the user's version is unique. This is the gap no dataset can fill. The app bridges it by letting users define their own.

### How it works

```
User creates "My Poha":
  Poha (flattened rice)    80g   → IFCT2017 nutrients × 0.8
  Onion                    50g   → IFCT2017 nutrients × 0.5
  Mustard oil              10g   → USDA_SR  nutrients × 0.1
  Peanuts                  20g   → IFCT2017 nutrients × 0.2
  ─────────────────────────────────────────────────
  Total dish weight:      160g
  Total nutrition:        sum of all ingredient contributions

  Per-100g values = totals ÷ 1.6  ← stored as the dish's nutrition profile
```

### Schema additions needed

```sql
CREATE TABLE custom_dishes (
  id              SERIAL PRIMARY KEY,
  user_id         VARCHAR(64)  NOT NULL,
  name            VARCHAR(256) NOT NULL,
  name_normalized VARCHAR(256) NOT NULL,
  total_weight_g  NUMERIC(7,2) NOT NULL,    -- sum of ingredient weights
  -- computed nutrition per 100g (calculated at save time, recalculated on edit)
  calories_kcal   NUMERIC(7,2),
  protein_g       NUMERIC(6,2),
  carbs_g         NUMERIC(6,2),
  fat_g           NUMERIC(6,2),
  fiber_g         NUMERIC(6,2),
  sugar_g         NUMERIC(6,2),
  sodium_mg       NUMERIC(7,2),
  is_veg          BOOLEAN,    -- true only if ALL ingredients are veg
  is_vegan        BOOLEAN,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE custom_dish_ingredients (
  id             SERIAL PRIMARY KEY,
  dish_id        INTEGER      NOT NULL REFERENCES custom_dishes(id) ON DELETE CASCADE,
  food_item_id   INTEGER      NOT NULL REFERENCES food_items(id),
  quantity_g     NUMERIC(7,2) NOT NULL
);
```

### Key decisions
| Decision | Choice | Reason |
|---|---|---|
| Store nutrition per 100g on the dish | YES | Uniform with `food_items` — same logging logic, no special cases |
| Recalculate on ingredient edit | YES, immediately | Stored value must always match ingredients; stale data is worse than a recompute |
| Cooked vs raw weight | Raw weight input only (Phase 1) | Yield factors exist in IFCT but add UI complexity; document as known gap |
| Shared dishes (public) | No, user-private only (Phase 1) | Community sharing is a different trust/moderation problem; add Phase 3 |
| Diet flags on dish | AND logic across ingredients | A dish is veg only if every ingredient is veg — any meat makes it non-veg |

### Expansion ideas
- **Yield factor**: user inputs "I cooked this for 2 servings" → auto-split
- **Template dishes**: pre-seeded common Indian meals (dal, sabzi, roti combo) as starting points
- **Nutrition diff**: show user which ingredient is the biggest calorie contributor (pie chart)
- **Substitution suggestions**: "swap butter for Greek yogurt in this recipe to save 80 kcal"

---

## Feature 3 — AI Diet Plan Generator

### What it is
Based on the user's onboarding profile (goal, weight, height, activity level, dietary preference), the app generates a personalised weekly meal plan using the food dataset + Claude AI.

### How it works

```
Inputs (from user profile):
  - TDEE target (already computed)
  - Macro split (protein/carbs/fat targets)
  - Dietary preference: veg / egg / non-veg / vegan
  - Cuisine preference: Indian / Continental / Mixed
  - Allergies / exclusions

Claude API call:
  System: "You are a nutrition expert. Given a user's daily targets and food database,
           generate a 7-day meal plan. Each meal must use only foods from the provided
           dataset. Return structured JSON."
  Context: user profile + filtered food_items (veg/Indian subset, ~500 items)

Output: structured 7-day plan with meals, quantities, daily totals
```

### Schema additions needed

```sql
CREATE TABLE diet_plans (
  id           SERIAL PRIMARY KEY,
  user_id      VARCHAR(64)  NOT NULL,
  generated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  plan_data    JSONB        NOT NULL,  -- full structured plan
  notes        TEXT                   -- AI rationale / summary
);
```

### Key decisions
| Decision | Choice | Reason |
|---|---|---|
| AI model | `claude-sonnet-4-6` (already planned for Phase 2) | Best balance of reasoning and speed; structured output via tool_use |
| Plan length | 7 days | Fits weekly grocery shopping mental model; not overwhelming |
| Regeneration | On demand (user can tap "Regenerate") | Preferences change; fixed plan feels rigid |
| Variety constraint | Enforce no repeated main dish within 3 days | Prevents AI from lazily repeating the same meals |
| Dataset filtering before prompt | YES — filter to user's diet preference first | Reduces token count, prevents hallucination of foods not in DB |

### Risks
- Claude might suggest foods not in our dataset → validate every suggestion against `food_items` before showing to user
- Macro totals might not exactly hit targets → acceptable ±10%, show daily summary with delta
- Indian regional diversity is hard to capture in a 7-day plan → add "regional cuisine" preference later

---

## Feature 4 — Smart Nutrition Insights (Suggested)

### What it is
Weekly digest: the app analyses the user's logged meals and surfaces actionable insights. Not a chatbot — structured, data-driven nudges.

### Examples
- "You've been consistently low on iron this week (avg 6mg vs 15mg target). Top sources from your preferences: Ragi, Rajma, Palak."
- "Your protein was on target 5/7 days. The 2 days you missed were days you skipped breakfast."
- "Your Friday meals averaged 600 kcal over target. Pattern: dinner was the overflow meal."

### Why this is valuable
This turns raw logs into behaviour change — the core promise of a fitness coach. It uses the micronutrient data (iron, calcium, vitamin D) that would otherwise be invisible to users.

### How it works
```
Weekly cron (Sunday night):
  1. Aggregate last 7 days of meal_logs per user
  2. Compute per-nutrient daily averages vs targets
  3. Find deficiency patterns (< 80% of target on 4+ days)
  4. Find meal-slot patterns (which slot drives overages)
  5. Query food_items for top sources of deficient nutrients
     filtered to user's diet preference
  6. Format as 3-5 bullet insights
  7. Push via in-app notification or email
```

### Schema additions needed
```sql
CREATE TABLE weekly_insights (
  id           SERIAL PRIMARY KEY,
  user_id      VARCHAR(64)  NOT NULL,
  week_start   DATE         NOT NULL,
  insights     JSONB        NOT NULL,  -- array of insight objects
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
```

---

## Feature 5 — Ingredient Substitution Engine (Suggested)

### What it is
When a user adds a food item, the app can suggest a healthier or lower-calorie alternative from the same food category with similar taste profile.

### Examples
- White rice → Brown rice (more fiber, same carbs)
- Butter → Coconut oil (for vegan users)
- Full-fat milk → Skimmed milk (same protein, fewer calories)
- Maida (refined flour) → Whole wheat atta (more fiber)

### How it works
Simple rules engine first (no AI needed):
1. Same `category` or `food_group`
2. Similar macro profile (protein within ±20%, carbs within ±30%)
3. Better on at least one target metric (lower fat, higher fiber, lower sugar)
4. Matches user's diet flags

---

## Build Order (Recommended)

```
Phase 2a — Foundation
  ├── Import food_items into PostgreSQL (Alembic migration)
  ├── Food search API endpoint (fuzzy, filtered by diet flag)
  └── Meal Logger UI + API

Phase 2b — Personalisation
  ├── Custom Dish Builder UI + API
  └── Dashboard: daily nutrition progress bars (vs targets)

Phase 3a — AI Features
  ├── AI Diet Plan Generator
  └── Weekly Nutrition Insights

Phase 3b — Power Features
  └── Ingredient Substitution Engine
  └── Barcode scanner / photo logging
```

---

## Open Questions

| Question | Status |
|---|---|
| Cooked vs raw weight for custom dishes — how to handle? | Deferred to Phase 2b; document as known gap for users |
| Should custom dishes be shareable between users? | No for Phase 2; revisit when community features added |
| Which nutrients to surface in the UI? (all 35 columns vs subset) | Show 6 core (cal/protein/carbs/fat/fiber/sodium) + reveal more on tap |
| How to handle user corrections to food data? | Flag + queue for admin review; store as `source='user'`, `is_verified=false` |
| Weekly diet plan: regenerate on demand or locked? | On demand — let user regenerate up to 3x/week to prevent abuse |
| What happens when a food_items row is updated? | Meal log snapshots are immune (denormalised); custom dish recomputes on next open |
