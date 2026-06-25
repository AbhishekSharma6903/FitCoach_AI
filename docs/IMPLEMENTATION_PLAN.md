# FitCoach AI — Implementation Plan (Non-AI Features)

> Written: 2026-06-25. Covers Sprint 1–4 from PRODUCT_ROADMAP.md — excludes AI Coach and Meal Plan (those require Anthropic SDK and are parked for Sprint 3).
> Designed for **parallel development**: Track A and Track B are independent and can run simultaneously.
> Update this doc as tasks complete — cross off items rather than creating new docs.

---

## What We're Building (and Why)

The app exists but isn't usable by a real person yet:

| Problem | Impact |
|---|---|
| Food catalog has 50 items | Search fails immediately for any non-seeded food |
| Search loads full table in memory | Will crash at 8k+ items (O(n) RapidFuzz) |
| No profile edit page | App targets wrong calories the moment user's weight changes |
| Tracker only shows today | Can't log yesterday's meals — users give up |
| No custom dish builder | Every Indian home meal is untrackable |
| No workout tracking | Calorie balance is half the picture |
| 3 live bugs | Will cause crashes during dev/demo |

---

## Pre-work: Fix 3 Known Bugs (~30 min total — do this first, anyone can do it)

### Bug 1 — N+1 in `GET /food/log`
**File:** `backend/app/routers/food.py` ~line 85
```python
# CURRENT (fires 1 DB query per log entry):
food_names = {e.food_item_id: db.get(FoodItem, e.food_item_id).name for e in entries}

# FIX (1 query total):
food_ids = [e.food_item_id for e in entries]
food_map = {f.id: f.name for f in db.query(FoodItem).filter(FoodItem.id.in_(food_ids)).all()}
```

### Bug 2 — `user.is_active` 500 error
**File:** `backend/app/routers/admin.py` — uses `AdminUserPatch` with `is_active` field
**Problem:** `User` model has no `is_active` column. 500 if admin tries to deactivate anyone.
**Fix:** Add `is_active: bool = True` column to `User` model + Alembic migration `fix_user_is_active`.

### Bug 3 — CORS hardcoded
**File:** `backend/app/main.py` line ~11 — `allow_origins=["http://localhost:3000"]`
**Fix:**
- `backend/app/config.py`: add `ALLOWED_ORIGINS: str = "http://localhost:3000"`
- `backend/app/main.py`: `allow_origins=settings.ALLOWED_ORIGINS.split(",")`
- `backend/.env.example`: add `ALLOWED_ORIGINS=http://localhost:3000`

---

## Track A — Backend Work

*Can be done independently. Frontend Track B runs at the same time.*

---

### Phase 1 — Food Dataset Import + Search Upgrade

**Deliverable:** 8,644 foods in DB, search returns results in <100ms, works for Indian food names.

#### Migration 1 — `add_food_items_extended_columns`
Chain after `568a34269995`. Add to `food_items` table:

| Column | Type | Default |
|---|---|---|
| `source` | `VARCHAR(32)` | NULL — "USDA_SR", "IFCT2017", "KAGGLE", "user" |
| `source_id` | `VARCHAR(64)` | NULL |
| `cuisine` | `VARCHAR(64)` | NULL — "Indian", "Global" |
| `aliases` | `TEXT` | NULL — semicolon-separated |
| `saturated_fat_g` | `NUMERIC(6,2)` | NULL |
| `sodium_mg` | `NUMERIC(7,2)` | NULL |
| `calcium_mg` | `NUMERIC(7,2)` | NULL |
| `iron_mg` | `NUMERIC(6,2)` | NULL |
| `vitamin_c_mg` | `NUMERIC(6,2)` | NULL |
| `is_vegan` | `BOOLEAN` | FALSE |

No data changes — existing 50 seed rows get NULL in new columns.

#### Migration 2 — `add_pg_trgm_food_search`
Chain after Migration 1.

```python
op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
op.execute("CREATE INDEX idx_food_items_trgm ON food_items USING GIN (name_normalized gin_trgm_ops)")
```

**Why pg_trgm and not tsvector:** tsvector uses English stemming. "poha", "dal", "upma" have no English stems and return zero results. pg_trgm is character-based — language-agnostic, handles typos, "paneer" matches "Cottage cheese, paneer".

#### Migration 3 — `import_full_food_dataset`
Chain after Migration 2.

**Import strategy (safe — preserves user data):**
1. `DELETE FROM food_items WHERE source IS NULL` — removes the 50 seeded rows (identified by NULL source)
2. `DELETE FROM food_log_entries WHERE food_item_id NOT IN (SELECT id FROM food_items)` — cleans up any dangling FK entries
3. Bulk insert from `datasets/output/food_items.csv` using Python's `csv` module (no pandas in Alembic). Batch 500 rows per INSERT.
4. CSV column → table column mapping (all 22 columns from the dataset schema)

**Re-run strategy when dataset is updated:** New migration: `DELETE FROM food_items WHERE source IN ('USDA_SR','IFCT2017','KAGGLE')` then re-insert. Preserves `source='user'` items.

File: `backend/alembic/versions/XXXX_import_full_food_dataset.py`
Note: The migration reads from `../../datasets/output/food_items.csv` relative to the migration file. The path must be resolved at runtime using `os.path` relative to `__file__`.

#### Code Change — Replace fuzzy_search_foods
**File:** `backend/app/services/food_service.py` — replace entire function.

```python
from sqlalchemy import func

def fuzzy_search_foods(query, db, limit=10, diet_filter=None):
    q = query.lower().strip()
    stmt = db.query(FoodItem).filter(
        func.similarity(FoodItem.name_normalized, q) > 0.15
    )
    if diet_filter == "veg":
        stmt = stmt.filter(FoodItem.is_veg == True, FoodItem.is_egg == False)
    elif diet_filter == "egg":
        stmt = stmt.filter(FoodItem.is_veg == True)
    results = (
        stmt.order_by(func.similarity(FoodItem.name_normalized, q).desc())
        .limit(limit).all()
    )
    return [_food_to_dict(f) for f in results]
```

No new pip packages — `func.similarity()` calls the pg_trgm function via SQLAlchemy.

Update `FoodItemSearchResult` in `backend/app/schemas/food.py`: change `score: float` from 0-100 RapidFuzz scale to 0.0-1.0 (or multiply by 100 if frontend displays it).

**Also update `FoodItem` model** (`backend/app/models/food_item.py`) to add the new columns from Migration 1.

---

### Phase 4A–E — Custom Dish Builder (Backend)

**Deliverable:** API for creating/editing/deleting composite dishes. Nutrition computed from ingredients. Custom dishes appear in food search.

**Dependency:** Phase 1 migrations must be run first (pg_trgm index needed for dish name search).

#### Migration 4 — `add_custom_dishes`

```sql
CREATE TABLE custom_dishes (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(256) NOT NULL,
  name_normalized VARCHAR(256) NOT NULL,
  total_weight_g NUMERIC(7,2) NOT NULL,
  calories_kcal NUMERIC(7,2),
  protein_g NUMERIC(6,2),
  carbs_g NUMERIC(6,2),
  fat_g NUMERIC(6,2),
  fiber_g NUMERIC(6,2),
  sugar_g NUMERIC(6,2),
  sodium_mg NUMERIC(7,2),
  is_veg BOOLEAN NOT NULL DEFAULT TRUE,
  is_egg BOOLEAN NOT NULL DEFAULT FALSE,
  is_vegan BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE custom_dish_ingredients (
  id SERIAL PRIMARY KEY,
  dish_id INTEGER NOT NULL REFERENCES custom_dishes(id) ON DELETE CASCADE,
  food_item_id INTEGER NOT NULL REFERENCES food_items(id),
  quantity_g NUMERIC(7,2) NOT NULL
);
CREATE INDEX idx_custom_dishes_user ON custom_dishes(user_id);
CREATE INDEX idx_custom_dishes_name ON custom_dishes USING GIN(name_normalized gin_trgm_ops);
```

#### New Files (backend)

**`backend/app/models/custom_dish.py`** — SQLAlchemy ORM for `custom_dishes` + `custom_dish_ingredients`

**`backend/app/schemas/dish.py`** — Pydantic models:
- `DishIngredientCreate`: `food_item_id: int`, `quantity_g: float`
- `DishCreate`: `name: str`, `ingredients: List[DishIngredientCreate]`
- `DishIngredientRead`: above + `food_name: str`
- `DishRead`: full dish with `ingredients: List[DishIngredientRead]`, all nutrition fields

**`backend/app/services/dish_service.py`** — nutrition computation:
```python
def compute_dish_nutrition(ingredients, db):
    """Sum weighted nutrients from all ingredients, return per-100g dict."""
    totals = defaultdict(float)
    total_weight = sum(i.quantity_g for i in ingredients)
    for ing in ingredients:
        item = db.get(FoodItem, ing.food_item_id)
        ratio = float(ing.quantity_g) / float(item.serving_size_g)
        for field in ["calories_kcal","protein_g","carbs_g","fat_g","fiber_g","sugar_g","sodium_mg"]:
            val = getattr(item, field, None)
            if val is not None:
                totals[field] += float(val) * ratio
    return {k: round(v / total_weight * 100, 2) for k, v in totals.items()}
```
- Diet flags: `is_veg = ALL(ingredient.is_veg)`, `is_egg = ANY(ingredient.is_egg)`, `is_vegan = ALL(ingredient.is_vegan)`

**`backend/app/routers/dishes.py`** — endpoints:
- `POST /dishes` — create, compute nutrition, save
- `GET /dishes` — list user's dishes
- `GET /dishes/{id}` — single dish + ingredients
- `PUT /dishes/{id}` — update name or ingredients, recompute nutrition
- `DELETE /dishes/{id}` — delete (CASCADE to ingredients)

#### Modified Files (backend)

**`backend/app/main.py`** — register dishes router: `app.include_router(dishes.router, prefix="/api/v1/dishes", tags=["dishes"])`

**`backend/app/routers/food.py`** — `GET /search`: after food_items query, also query `custom_dishes` where `user_id = current_user` and name matches trigram. Merge results. Add `is_custom: bool = False` to `FoodItemSearchResult` schema.

**`backend/app/schemas/food.py`** — add `is_custom: bool = False` to `FoodItemSearchResult`.

**`backend/app/models/__init__.py`** — export `CustomDish`, `CustomDishIngredient`.

---

### Phase 5A–F — Workout Tracking (Backend)

**Deliverable:** Exercise library seeded from wger API. Log workouts. Dashboard shows net calories.

**Dependency:** Phase 1 pg_trgm migration (needed for exercise search index).

#### Data Prep — Fetch Exercise Library from wger API

Before writing the migration, run a one-time script to fetch and save exercise data:

```
GET https://wger.de/api/v2/exerciseinfo/?format=json&language=2&limit=100
(paginate until no next page)
```

Fields to extract per exercise: `name`, `description` (strip HTML), `category.name`, `muscles[*].name_en` (join as comma-separated), `equipment[*].name` (join), `translations[0].aliases[*].alias`

Map `category.name` → our category + MET:

| wger Category | Our Category | MET |
|---|---|---|
| Cardio | cardio | 7.0 |
| Strength | strength | 3.5 |
| Stretching | stretching | 2.3 |
| Yoga | yoga | 3.0 |
| Plyometrics | plyometrics | 8.0 |
| Shoulders / Arms / Back / Chest / Legs / Abs | strength | 3.5 |

Save to `datasets/exercise_library.json`. This file feeds the seed migration.

**Why wger over free-exercise-db:** wger has description/instructions, aliases (alternate names improve search), and anatomical muscle names. Data license: CC-BY-SA 4.0 — compatible with our use.

#### Migration 5 — `add_workout_tables` + `seed_exercise_library`

Two migrations chained together:

**`add_workout_tables`:**
```sql
CREATE TABLE exercise_library (
  id SERIAL PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  name_normalized VARCHAR(256) NOT NULL,
  category VARCHAR(32) NOT NULL,
  muscle_group VARCHAR(128),
  equipment VARCHAR(64),
  level VARCHAR(16),
  met_value NUMERIC(4,1) NOT NULL,
  instructions TEXT,
  aliases TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE workout_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  exercise_id INTEGER REFERENCES exercise_library(id),
  exercise_name VARCHAR(256) NOT NULL,
  category VARCHAR(32) NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight_kg NUMERIC(6,2),
  duration_min NUMERIC(5,1),
  calories_burned NUMERIC(7,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exercise_library_trgm ON exercise_library USING GIN(name_normalized gin_trgm_ops);
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, log_date);
```

**`seed_exercise_library`:** Reads `datasets/exercise_library.json`, bulk inserts into `exercise_library`.

#### New Files (backend)

**`backend/app/models/workout_log.py`** — ORM for `exercise_library` + `workout_logs`

**`backend/app/schemas/workout.py`**:
- `ExerciseSearchResult`: id, name, category, muscle_group, equipment, level, met_value
- `WorkoutLogCreate`: exercise_id, log_date, sets?, reps?, weight_kg?, duration_min?, notes?
- `WorkoutLogRead`: all fields + calories_burned
- `DailyWorkoutRead`: log_date, entries, total_calories_burned

**`backend/app/services/workout_service.py`**:
```python
def calculate_calories_burned(met: float, weight_kg: float, duration_min: float) -> float:
    # MET formula: METs × body_weight_kg × duration_hours
    return round(met * weight_kg * (duration_min / 60), 2)
```

**`backend/app/routers/workout.py`**:
- `GET /workout/search?q=` — trigram search on `exercise_library`
- `POST /workout/log` — insert, compute calories_burned using `profile.current_weight_kg`
- `GET /workout/log?date=` — daily log + total_calories_burned
- `DELETE /workout/log/{id}`
- `GET /workout/history?days=30`

#### Modified Files (backend)

**`backend/app/main.py`** — register workout router

**`backend/app/routers/dashboard.py`** — add to dashboard response:
- `calories_burned_today: float` — `SUM(workout_logs.calories_burned) WHERE user_id AND log_date=today`
- `calories_net: float` — `calories_consumed - calories_burned_today`

**`backend/app/schemas/dashboard.py`** — add `calories_burned_today` and `calories_net` fields

---

## Track B — Frontend Work

*Can be done independently. Track A runs at the same time.*

---

### Phase 2 — Profile Edit + Settings Pages

**Deliverable:** Users can update weight/goals. Dashboard recalculates. No backend changes needed — `PUT /api/v1/profile` already exists.

#### New file: `frontend/src/app/profile/page.tsx`

Form pre-filled from `useProfile()` hook. Editable fields: `current_weight_kg`, `goal_weight_kg`, `time_to_reach_goal_weeks`, `activity_level`, `diet_type`.

Read-only display below form: BMI, TDEE (kcal/day), daily calorie target, protein/carbs/fat targets — pulled from `profile.bmr_kcal`, `profile.tdee_kcal`, `profile.target_calories_kcal`, `profile.protein_g`, etc.

On save: `PUT /api/v1/profile` → invalidate both `useProfile` and `useDashboard` SWR caches so dashboard updates immediately.

Reuse: `Card`, `Button`, `Input`, `Select`, `FormField` from `components/ui/`. `UserProfile` type from `types/profile.ts`. `useProfile` hook from `hooks/useProfile.ts`.

#### New hook: `frontend/src/hooks/useProfileUpdate.ts`
```typescript
export function useProfileUpdate() {
  const { mutate: mutateProfile } = useProfile();
  const { mutate: mutateDashboard } = useDashboard();
  async function updateProfile(data: Partial<OnboardingFormData>) {
    await api.put("/api/v1/profile", data);
    mutateProfile();
    mutateDashboard();
  }
  return { updateProfile };
}
```

#### New file: `frontend/src/app/settings/page.tsx`

Three sections:
1. **Account** — `<UserProfile />` from `@clerk/nextjs` (one JSX element — renders full profile manager)
2. **Unit preferences** — kg/lbs toggle stored in `localStorage` (client-side only, conversion in display layer)
3. **Link to Profile** — "Update goals & weight →"

#### Modified: `frontend/src/app/dashboard/page.tsx`

Add nav links to the existing action bar area:
- User name or avatar → links to `/profile`
- Gear icon → links to `/settings`
- "Workout" button → links to `/workout` (add alongside "Log Food")

---

### Phase 3 — Date Navigation in Tracker

**Deliverable:** Users can log/view food for any past date. All backend support already exists (`log_date` param on all food endpoints).

#### Modified: `frontend/src/app/tracker/page.tsx`

Add `const [selectedDate, setSelectedDate] = useState<string>(today)`.
Change `useFoodLog()` → `useFoodLog(selectedDate)`.
Pass `selectedDate` into `<AddFoodModal>`.
Add `<DateNavigator date={selectedDate} onChange={setSelectedDate} />` below the page header.

#### New component: `frontend/src/components/tracker/DateNavigator.tsx`

```
← [Monday, 23 June 2025]  [Today]  →
```
- Left arrow: subtract 1 day from selectedDate
- Right arrow: add 1 day (disabled when selectedDate === today — no future logging)
- "Today" button: reset to today (hidden when already on today)
- Date formatted using en-IN locale (matches existing date formatting in tracker)

#### Modified: `frontend/src/components/tracker/AddFoodModal.tsx`

Accept `logDate: string` as prop. Change `log_date: new Date().toISOString().split("T")[0]` → `log_date: logDate`.

---

### Phase 4F–G — Custom Dish Builder (Frontend)

**Dependency:** Track A must complete Phase 4A-E first.

#### New file: `frontend/src/app/dishes/page.tsx`

List of user's dishes + "Create New Dish" button. Each dish card shows name + total nutrition per 100g + ingredient count.

#### New component: `frontend/src/components/dishes/DishBuilder.tsx`

Step 1 — Name the dish (text input).
Step 2 — Add ingredients:
- Reuse `FoodSearchBar` for ingredient search (pass `dietFilter` from user profile)
- Each added ingredient gets a gram quantity input
- Live nutrition preview updates as ingredients are added/removed

#### New component: `frontend/src/components/dishes/DishNutritionPreview.tsx`

Shows computed per-100g nutrition: calories, protein, carbs, fat, fiber. Calculated client-side (same formula as backend: sum proportional, scale to 100g). Shows a "matches your diet" badge if all ingredients match user's diet_type.

#### New hook: `frontend/src/hooks/useCustomDishes.ts`

SWR hook over `GET /api/v1/dishes`. Provides `dishes`, `createDish(payload)`, `deleteDish(id)`.

#### Modified: `frontend/src/hooks/useFoodSearch.ts`

After main food search result arrives, also query `GET /api/v1/dishes` (cached via SWR). Filter dishes by name similarity locally. Merge with `is_custom: true` marker. Show custom dishes with a small "custom" badge in `FoodSearchBar` results.

#### Modified: `frontend/src/types/nutrition.ts`

Add `is_custom?: boolean` to `FoodItem` interface.

---

### Phase 5G — Workout Page (Frontend)

**Dependency:** Track A must complete Phase 5B-F first.

#### New file: `frontend/src/app/workout/page.tsx`

Mirrors `/tracker` layout exactly:
- `ExerciseSearchBar` — search exercise library
- `AddWorkoutModal` — sets, reps, weight_kg, duration_min inputs; shows estimated calories burned preview
- `WorkoutLog` — grouped by exercise, shows calories burned per entry
- Total calories burned banner at top

#### New components

`frontend/src/components/workout/ExerciseSearchBar.tsx` — same pattern as `FoodSearchBar`, calls `GET /api/v1/workout/search?q=`

`frontend/src/components/workout/AddWorkoutModal.tsx` — same pattern as `AddFoodModal`. Fields: sets, reps, weight_kg (optional), duration_min (required for calories). Shows live calorie burn estimate: `MET × user_weight × (duration/60)`.

`frontend/src/components/workout/WorkoutLog.tsx` — same pattern as `FoodLog`.

#### New hook: `frontend/src/hooks/useWorkoutLog.ts`

Same pattern as `useFoodLog`. SWR over `GET /api/v1/workout/log?date=`. Provides `addEntry`, `deleteEntry`.

#### New types: `frontend/src/types/workout.ts`

```typescript
export interface Exercise {
  id: number; name: string; category: string;
  muscle_group: string | null; equipment: string | null;
  level: string | null; met_value: number;
}
export interface WorkoutLogEntry {
  id: number; user_id: string; log_date: string;
  exercise_id: number | null; exercise_name: string;
  category: string; sets: number | null; reps: number | null;
  weight_kg: number | null; duration_min: number | null;
  calories_burned: number; notes: string | null; created_at: string;
}
export interface DailyWorkout {
  log_date: string; entries: WorkoutLogEntry[]; total_calories_burned: number;
}
```

#### Modified: `frontend/src/components/dashboard/CalorieRing.tsx`

Accept optional `burned?: number` prop. When provided:
- Show calories burned as a secondary label inside the ring
- Show net calories (consumed − burned) as the main ring fill
- Keep ring color green when net < target, red when over

#### Modified: `frontend/src/types/dashboard.ts`

Add `calories_burned_today: number` and `calories_net: number` to `DashboardData`.

---

## Parallel Development Guide

```
Day 1
  Track A: Pre-work bugs + Phase 1 (migrations 1A, 1B, 1C + food_service.py rewrite)
  Track B: Phase 2 (profile edit + settings pages) + Phase 3 (date navigation)

Day 2
  Track A: Phase 4A–E (custom dish backend — models, service, router, search integration)
  Track B: (waiting for Track A Phase 4) — can prepare dish type files and hook scaffolding

Day 3
  Track A: Phase 5 data prep (fetch wger exercises → exercise_library.json) + migrations + backend
  Track B: Phase 4F–G (custom dish frontend — now that backend is ready)

Day 4
  Track A: Phase 5B–F (workout tables, service, router, dashboard updates)
  Track B: Phase 5G (workout page — implement after Track A finishes API)

Day 5
  Both: Integration testing, edge cases, verification
```

---

## Migration Chain

```
None
  └─ b2407a8a1a76 (initial schema — users, food_items, food_log_entries, user_profiles, weight_log)
       └─ seed_food_items_001 (50 Indian items)
            └─ 568a34269995 (water_log table)
                 └─ fix_user_is_active (adds is_active to users)
                      └─ add_food_items_extended_columns (source, cuisine, aliases, micronutrients)
                           └─ add_pg_trgm_food_search (extension + GIN index)
                                └─ import_full_food_dataset (8,644 items from CSV)
                                     └─ add_custom_dishes (custom_dishes + custom_dish_ingredients)
                                          └─ add_workout_tables (exercise_library + workout_logs)
                                               └─ seed_exercise_library (wger data)
```

Run after any migration change: `cd backend && source venv/bin/activate && alembic upgrade head`

---

## Verification Checklist

### Phase 1
- [ ] `alembic upgrade head` completes without error
- [ ] `GET /api/v1/food/search?q=paneer` returns ≥5 results from 8,644-item catalog
- [ ] `GET /api/v1/food/search?q=poha` returns ≥1 result (IFCT2017 item)
- [ ] `GET /api/v1/food/search?q=dal makhani` returns result with `source=IFCT2017`
- [ ] Search response time < 200ms (check uvicorn logs)
- [ ] Diet filter still works: `?q=chicken&diet_filter=veg` returns 0 results

### Phase 2
- [ ] `/profile` page loads with current weight/goal pre-filled
- [ ] Changing weight + saving: dashboard calorie target updates immediately (no page reload)
- [ ] `/settings` page renders Clerk `<UserProfile />` without errors

### Phase 3
- [ ] Tracker shows today's date by default
- [ ] Click ← → shows previous day's log (empty if nothing logged)
- [ ] Log food on previous day → appears in that day's log, not today's
- [ ] Right arrow disabled on today (can't navigate to future)

### Phase 4
- [ ] Create "My Dal Khichdi" with rice (150g) + moong dal (80g) + ghee (10g) → nutrition sums correctly
- [ ] Search "dal khichdi" in tracker → returns custom dish with badge
- [ ] Log custom dish → appears in food log with correct scaled macros

### Phase 5
- [ ] Search "push up" → returns exercise from library with category=strength, met_value=3.5
- [ ] Log push-ups: 3 sets × 10 reps, 10 min, user weight 70kg → calories_burned = 3.5 × 70 × (10/60) = 40.8 kcal
- [ ] Dashboard CalorieRing shows net calories when workout logged

---

## Files Summary

### New Backend Files (15)
- `backend/alembic/versions/fix_user_is_active.py`
- `backend/alembic/versions/add_food_items_extended_columns.py`
- `backend/alembic/versions/add_pg_trgm_food_search.py`
- `backend/alembic/versions/import_full_food_dataset.py`
- `backend/alembic/versions/add_custom_dishes.py`
- `backend/alembic/versions/add_workout_tables.py`
- `backend/alembic/versions/seed_exercise_library.py`
- `backend/app/models/custom_dish.py`
- `backend/app/models/workout_log.py`
- `backend/app/routers/dishes.py`
- `backend/app/routers/workout.py`
- `backend/app/schemas/dish.py`
- `backend/app/schemas/workout.py`
- `backend/app/services/dish_service.py`
- `backend/app/services/workout_service.py`

### Modified Backend Files (9)
- `backend/app/main.py` — register 2 new routers, fix CORS
- `backend/app/config.py` — add ALLOWED_ORIGINS
- `backend/app/models/food_item.py` — add new columns
- `backend/app/models/__init__.py` — export new models
- `backend/app/services/food_service.py` — replace RapidFuzz with pg_trgm
- `backend/app/routers/food.py` — fix N+1 bug, include custom dishes in search
- `backend/app/routers/dashboard.py` — add calories_burned_today, calories_net
- `backend/app/schemas/food.py` — add is_custom field
- `backend/app/schemas/dashboard.py` — add new workout fields

### New Frontend Files (12)
- `frontend/src/app/profile/page.tsx`
- `frontend/src/app/settings/page.tsx`
- `frontend/src/app/dishes/page.tsx`
- `frontend/src/app/workout/page.tsx`
- `frontend/src/components/tracker/DateNavigator.tsx`
- `frontend/src/components/dishes/DishBuilder.tsx`
- `frontend/src/components/dishes/DishNutritionPreview.tsx`
- `frontend/src/components/workout/ExerciseSearchBar.tsx`
- `frontend/src/components/workout/AddWorkoutModal.tsx`
- `frontend/src/components/workout/WorkoutLog.tsx`
- `frontend/src/hooks/useProfileUpdate.ts`
- `frontend/src/hooks/useCustomDishes.ts`
- `frontend/src/hooks/useWorkoutLog.ts`
- `frontend/src/types/workout.ts`

### Modified Frontend Files (8)
- `frontend/src/app/tracker/page.tsx` — add date state + DateNavigator
- `frontend/src/app/dashboard/page.tsx` — add nav links + workout button
- `frontend/src/components/tracker/AddFoodModal.tsx` — accept logDate prop
- `frontend/src/components/tracker/FoodSearchBar.tsx` — show is_custom badge
- `frontend/src/components/dashboard/CalorieRing.tsx` — add burned calories display
- `frontend/src/hooks/useFoodSearch.ts` — merge custom dishes into results
- `frontend/src/types/nutrition.ts` — add is_custom to FoodItem
- `frontend/src/types/dashboard.ts` — add calories_burned_today, calories_net
