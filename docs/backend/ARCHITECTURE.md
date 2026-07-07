# FitCoach AI — Backend Architecture

> Current as of 2026-07-07.

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | FastAPI | ≥0.110 |
| Server | Uvicorn (standard) | ≥0.29 |
| ORM | SQLAlchemy | ≥2.0 |
| Migrations | Alembic | ≥1.13 |
| Database | PostgreSQL 15 | Docker, port 5433 |
| Auth | Clerk (JWT via JWKS) | PyJWT[crypto] ≥2.8 |
| HTTP client | HTTPX | ≥0.27 (JWKS fetch only) |
| Search | pg_trgm (PostgreSQL extension) | — |
| Python | 3.11+ | — |

---

## Project Layout

```
backend/
├── .env                          # secrets — never committed
├── .env.example                  # placeholder template
├── requirements.txt
├── alembic.ini
├── alembic/versions/             # migration chain (see below)
└── app/
    ├── main.py                   # FastAPI app, CORS, router registration
    ├── config.py                 # Pydantic Settings (reads .env)
    ├── auth.py                   # Clerk JWT verification + user auto-upsert
    ├── database.py               # SQLAlchemy engine + SessionLocal
    ├── models/                   # ORM models (SQLAlchemy 2.0 mapped_column)
    ├── schemas/                  # Pydantic I/O schemas
    ├── routers/                  # FastAPI route handlers
    └── services/                 # Pure business logic (no FastAPI deps)
```

---

## Environment Variables

Defined in `app/config.py` via `pydantic_settings.BaseSettings`.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:port/db` |
| `DEV_MODE` | — | `true` skips Clerk — all requests treated as `DEV_USER_ID`. Default: `false`. |
| `DEV_USER_ID` | — | User ID used in dev mode. Default: `dev-user-001`. |
| `CLERK_SECRET_KEY` | Production | `sk_test_...` or `sk_live_...` |
| `CLERK_JWKS_URL` | Production | `https://<clerk-frontend-api>/.well-known/jwks.json` |
| `ADMIN_USER_IDS` | — | Comma-separated Clerk user IDs with admin access. |
| `ALLOWED_ORIGINS` | — | Comma-separated CORS origins. Default: `http://localhost:3000`. |

---

## Authentication

Flow: Clerk issues a JWT on login → frontend sends `Authorization: Bearer <token>` → `auth.py` verifies against Clerk JWKS → extracts `sub` as `user_id` → auto-creates a `users` row on first login.

- JWKS is cached in-memory for 60 min. Stale cache is served on fetch failure rather than crashing.
- When `DEV_MODE=true`, all requests bypass JWT and use `DEV_USER_ID`. Safe — only activates on explicit env flag.
- Admin check: `require_admin` dependency reads `ADMIN_USER_IDS`. Raises 403 if the user is not in the set. No DB column for admin status.

---

## Database Schema

### Migration Chain (Alembic)

Applied in this order:

```
b2407a8a1a76   initial_schema           users, user_profiles, food_items, food_log_entries, weight_log
seed_food_items_001                      seeds ~50 legacy food items (superseded)
568a34269995   add_water_log_table       water_log table
b9c8d7e6f5a4   seed_dev_user             dev-user-001 inserted for local dev
bc8e87178e50   add_food_items_extended   source, cuisine, aliases, saturated_fat, sodium, etc. on food_items
d1f9a2c3e4b5   add_pg_trgm_food_search   CREATE EXTENSION pg_trgm; GIN index on food_items.name_normalized
e2a3b4c5d6e7   import_full_food_dataset  8,644 food items from USDA/IFCT2017/Kaggle datasets
a1b2c3d4e5f6   add_custom_dishes         custom_dishes + custom_dish_ingredients tables
c1d2e3f4a5b6   add_workout_tables        exercise_library + workout_logs tables; GIN trgm index
d2e3f4a5b6c7   seed_exercise_library     825 exercises seeded from wger API
f3b4c5d6e7f8   seed_curated_indian_dishes  curated Indian dishes seeded
g4h5i6j7k8l9   add_exercise_image_columns  image_url, image_url_thumb, wger_id, muscle IDs on exercise_library
```

### Tables

**`users`**
- `id` VARCHAR(64) PK — Clerk user ID (e.g. `user_2abc123`)
- `created_at` TIMESTAMPTZ

**`user_profiles`**
- `user_id` VARCHAR(64) FK → users, UNIQUE
- Identity: `name`, `age`, `gender`, `height_cm`
- Goals: `current_weight_kg`, `goal_weight_kg`, `time_to_reach_goal_weeks`
- Fitness: `experience_level` (`beginner/intermediate/advanced`), `activity_level` (`sedentary/light/moderate/intense/very_intense`)
- Diet: `diet_type` (`veg/egg/nonveg`), `wants_workout_split`, `wants_diet_plan`
- Computed + cached: `bmr_kcal`, `tdee_kcal`, `target_calories_kcal`, `bmi`, `protein_g`, `carbs_g`, `fat_g`

**`food_items`** — shared catalog (8,644 items)
- Core: `name`, `name_normalized` (GIN trgm index), `category`, `region`
- Nutrition per serving: `serving_size_g`, `calories_kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sugar_g`
- Diet flags: `is_veg`, `is_egg`, `is_vegan`
- Extended: `source`, `source_id`, `cuisine`, `aliases`, `saturated_fat_g`, `sodium_mg`, `calcium_mg`, `iron_mg`, `vitamin_c_mg`

**`food_log_entries`**
- `user_id`, `food_item_id`, `log_date`, `meal_type` (`breakfast/lunch/dinner/snack`), `quantity_g`
- Denormalized at insert: `calories_kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`
- Index: `(user_id, log_date)`

**`water_log`**
- `user_id`, `log_date`, `amount_ml` — multiple rows per day, one per entry
- Index: `(user_id, log_date)`

**`weight_log`**
- `user_id`, `log_date`, `weight_kg`, `note`
- Unique constraint: `(user_id, log_date)` — upsert replaces same-day entry
- Index: `(user_id, log_date)`

**`custom_dishes`** — user-owned composite recipes
- `user_id`, `name`, `name_normalized`, `total_weight_g`
- Nutrition per 100g: `calories_kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sugar_g`, `sodium_mg`
- `is_veg`, `is_egg`, `is_vegan`
- Index: `(user_id)`

**`custom_dish_ingredients`**
- `dish_id` FK → custom_dishes, `food_item_id` FK → food_items, `quantity_g`

**`exercise_library`** — 825 exercises (seeded from wger)
- `name`, `name_normalized`, `category` (`cardio/strength/yoga/stretching/plyometrics`)
- `muscle_group`, `equipment`, `level`, `met_value`
- `instructions` (TEXT), `aliases` (semicolon-separated), `is_custom`
- Phase 6 additions: `image_url`, `image_url_thumb`, `wger_id`, `primary_muscle_ids`, `secondary_muscle_ids`
- Index: GIN trgm on `name_normalized`

**`workout_logs`** — per-set entries
- `user_id`, `log_date`, `exercise_id` FK → exercise_library, `exercise_name` (denormalized)
- `category`, `sets`, `reps`, `weight_kg`, `duration_min`
- `calories_burned` — computed at insert: `MET × user_weight_kg × duration_h`
- Index: `(user_id, log_date)`

---

## API Endpoints

Base prefix: `/api/v1`

### `/health`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Returns `{status: "ok", version: "1.0.0"}` |

### `/api/v1/me`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | User | Returns `{user_id, is_admin}` |

### `/profile`
| Method | Path | Description |
|---|---|---|
| POST | `/onboarding` | Create or update full profile; recomputes all metrics |
| GET | `` | Current user's profile |
| PUT | `` | Partial update; recomputes metrics |

### `/food`
| Method | Path | Description |
|---|---|---|
| GET | `/search?q=&limit=&diet_filter=` | pg_trgm + ILIKE hybrid search |
| GET | `/items/{id}` | Single food item |
| POST | `/log` | Log a food entry (nutrition denormalized at insert) |
| GET | `/log?log_date=` | Daily food log + totals + targets |
| PATCH | `/log/{entry_id}` | Update a log entry quantity |
| DELETE | `/log/{entry_id}` | Delete a food log entry |

### `/weight`
| Method | Path | Description |
|---|---|---|
| POST | `/log` | Upsert weight entry (`ON CONFLICT DO UPDATE` on user+date) |
| GET | `/log?days=30` | Weight history with start/current/change delta |
| GET | `/log/latest` | Latest weight entry |

### `/water`
| Method | Path | Description |
|---|---|---|
| POST | `/log` | Add a water entry |
| DELETE | `/log/{entry_id}` | Remove a water entry |
| GET | `/log?log_date=` | Daily water summary |

### `/dashboard`
| Method | Path | Description |
|---|---|---|
| GET | `` | Full snapshot: calories, macros, streak, weight history (30d), milestone, water, BMI, TDEE |

### `/dishes`
| Method | Path | Description |
|---|---|---|
| GET | `` | List user's custom dishes |
| POST | `` | Create a dish (nutrition computed from ingredients) |
| GET | `/{id}` | Single dish with ingredients |
| PUT | `/{id}` | Update dish |
| DELETE | `/{id}` | Delete dish |

### `/workout`
| Method | Path | Description |
|---|---|---|
| GET | `/search?q=` | Exercise search (pg_trgm) |
| POST | `/log` | Log a workout set (calories computed at insert) |
| GET | `/log?date=` | Daily workout log + total calories burned |
| PATCH | `/log/{id}` | Update a workout entry |
| DELETE | `/log/{id}` | Delete a workout entry |
| GET | `/history?days=30` | Workout history (flat list, up to 365 days) |

### `/admin` (requires admin)
| Method | Path | Description |
|---|---|---|
| GET | `/stats` | `{total_users, total_food_items, total_exercises, exercises_with_images}` |
| GET | `/users` | All user summaries (paginated) |
| GET | `/users/{id}` | Full user profile detail |
| GET | `/food?search=&skip=&limit=` | Paginated food catalog |
| POST | `/food` | Create food item |
| PUT | `/food/{id}` | Update food item |
| DELETE | `/food/{id}` | Delete food item |

---

## Business Logic (`services/`)

### `calculation_engine.py`

**BMR (Mifflin-St Jeor):**
- Male: `(10×kg) + (6.25×cm) - (5×age) + 5`
- Female: `(10×kg) + (6.25×cm) - (5×age) - 161`
- Other: average of male/female

**TDEE:** `BMR × activity_multiplier`

| Activity level | Multiplier |
|---|---|
| sedentary | 1.200 |
| light | 1.375 |
| moderate | 1.550 |
| intense | 1.725 |
| very_intense | 1.900 |

**Target calories:** `TDEE + (weekly_delta_kg × 7700 / 7)`, clamped to safety floor (male: 1400, female: 1200, other: 1300 kcal).

**BMI:** `weight_kg / height_m²`

**Macros (default 30/40/30 split):**
- Protein: 30% of target ÷ 4 kcal/g
- Carbs: 40% ÷ 4 kcal/g
- Fat: 30% ÷ 9 kcal/g
- Veg/egg: minimum protein enforced at `1.6g × goal_weight_kg`; deficit taken from carbs

**Milestones:** 5%, 25%, 50%, 75%, 100% progress milestones with estimated dates at current weekly pace.

**Streak:** Consecutive calendar days with at least one `food_log_entries` row. Yesterday counts as today-minus-1 (so logging yesterday counts toward today's streak).

**Water goal:** `weight_kg × 35 ml`, clamped to [2000, 4000] ml.

### `food_service.py`

**`fuzzy_search_foods(query, db, limit, diet_filter)`**

Hybrid search: `pg_trgm similarity > 0.1 OR ILIKE '%query%'`, ordered by similarity DESC. Short words (< 5 chars) get poor trigram coverage, ILIKE catches them. Diet filter applied before query: `veg` = is_veg AND NOT is_egg; `egg` = is_veg (includes egg dishes).

### `workout_service.py`

**`calculate_calories_burned(met, weight_kg, duration_min)`**
Formula: `MET × weight_kg × (duration_min / 60)`. Industry-standard from 2024 Compendium of Physical Activities.

**`estimate_strength_duration(reps, barbell_kg, body_kg)`**
Estimates active set duration: `(reps × 3s active + 90s rest) × load_factor`. Load factor: `1 + (barbell_kg / body_kg) × 0.3`. Used when no explicit duration is supplied.

### `dish_service.py`

Computes dish nutrition from ingredients: sums `(food_item nutrition × quantity_g / serving_size_g)`, then scales to per-100g values stored on the dish. Users see full-dish totals in the UI.

---

## Dev Setup

```bash
# 1. Start Postgres
docker-compose up -d

# 2. Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in values
alembic upgrade head   # creates all tables + seeds data
uvicorn app.main:app --reload --port 8001
```

Ports: backend `8001`, Postgres `5433`.

To enable dev mode (no Clerk required): set `DEV_MODE=true` in `backend/.env`.
