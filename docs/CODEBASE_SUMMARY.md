# FitCoach AI — Complete Codebase Summary

> Auto-generated from full repo read on 2026-06-12. Use this as the single reference doc before making any changes — no need to re-explore the repo from scratch.

---

## 1. Project Overview

A personal fitness coaching web app. Users sign up, complete a 4-step onboarding, and then get a dashboard showing calorie/macro tracking, water intake, weight progress, and milestone goals. An AI coach is planned but stubbed out.

**Phase 1 (done):** Full nutrition + weight + water tracking with computed targets.  
**Phase 2 (planned):** Real AI coaching via the Anthropic SDK (`claude-sonnet-4-6`), streaming responses via WebSocket, message history in Redis.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| Auth | Clerk (`@clerk/nextjs ^7`) — JWT verified on backend |
| Backend | FastAPI (Python), Uvicorn |
| ORM/Migrations | SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 15 (Docker) |
| Data fetching | SWR (frontend) |
| Charts | Recharts |
| Fuzzy search | RapidFuzz (`fuzz.WRatio`) |
| HTTP client | Axios (frontend), HTTPX (backend JWKS fetch) |
| JWT verification | PyJWT[crypto] with Clerk JWKS |
| Tests | Playwright (e2e, auth routing) |
| Dev tooling | `dev.sh` (bash script to start/stop full stack) |

---

## 3. Repository Structure

```
FitCoach_AI/
├── dev.sh                        # start/stop/status script for the full stack
├── docker-compose.yml            # Postgres 15 on port 5433
├── .env.example
├── backend/
│   ├── .env                      # DATABASE_URL, CLERK_*, ADMIN_USER_IDS
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/versions/
│   │   ├── b2407a8a1a76_initial_schema.py   # full DB schema
│   │   ├── seed_food_items_001.py            # 50 Indian food items seeded
│   │   └── 568a34269995_add_water_log_table.py
│   └── app/
│       ├── main.py               # FastAPI app, CORS, router registration
│       ├── config.py             # Pydantic Settings (env vars)
│       ├── auth.py               # Clerk JWT verification + user upsert
│       ├── database.py           # SQLAlchemy engine + session
│       ├── models/               # SQLAlchemy ORM models
│       ├── schemas/              # Pydantic I/O schemas
│       ├── routers/              # FastAPI route handlers
│       └── services/             # Business logic
└── frontend/
    ├── package.json
    ├── tailwind.config.ts
    ├── playwright.config.ts
    ├── tests/                    # Playwright e2e tests
    └── src/
        ├── middleware.ts         # Clerk auth protection (all routes except /sign-in, /sign-up)
        ├── app/                  # Next.js App Router pages
        ├── components/           # React components
        ├── hooks/                # SWR data-fetching hooks
        ├── lib/                  # api.ts, constants.ts, utils.ts
        └── types/                # TypeScript interfaces
```

---

## 4. Database Schema

### Tables

**`users`**
- `id` (PK, String 64) — Clerk user ID (e.g. `user_2abc123`)
- `created_at`
- Auto-created on first login via `_upsert_user()`

**`user_profiles`**
- `user_id` (FK → users, CASCADE, UNIQUE)
- Personal: `name`, `age`, `gender`, `height_cm`
- Goals: `current_weight_kg`, `goal_weight_kg`, `time_to_reach_goal_weeks`
- Fitness: `experience_level` (`beginner/intermediate/advanced`), `activity_level` (`sedentary/light/moderate/intense/very_intense`)
- Diet: `diet_type` (`veg/egg/nonveg`), `wants_workout_split`, `wants_diet_plan`
- Computed + cached: `bmr_kcal`, `tdee_kcal`, `target_calories_kcal`, `bmi`, `protein_g`, `carbs_g`, `fat_g`

**`food_items`**
- Shared catalog (not user-specific)
- `name`, `name_normalized` (lowercase, indexed for search)
- `category`, `region`
- Per-serving nutrition: `serving_size_g`, `calories_kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sugar_g`
- `is_veg`, `is_egg` (diet filter flags)
- Index: `idx_food_items_name_normalized`

**`food_log_entries`**
- `user_id`, `food_item_id`, `log_date`, `meal_type` (`breakfast/lunch/dinner/snack`), `quantity_g`
- Denormalized at insert: `calories_kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`
- Index: `idx_food_log_user_date (user_id, log_date)`

**`water_log`**
- `user_id`, `log_date`, `amount_ml` (per entry, multiple entries per day)
- Index: `idx_water_log_user_date (user_id, log_date)`

**`weight_log`**
- `user_id`, `log_date`, `weight_kg`, `note`
- UniqueConstraint: `uq_weight_log_user_date` (upsert on conflict)
- Index: `idx_weight_log_user_date (user_id, log_date)`

### Seed Data
50 Indian food items seeded via `seed_food_items_001.py`, covering: dal/lentils, curries/sabzi, non-veg (chicken, mutton, fish, prawn), egg dishes, breads/rice/idli, snacks, fruits, dairy.

---

## 5. Authentication Architecture

**Flow:**
1. User authenticates via Clerk on frontend → receives session JWT
2. Frontend injects token: `Authorization: Bearer <clerk_session_token>`
3. Backend (`auth.py`) verifies JWT against Clerk's JWKS (public keys)
4. Extracts `sub` claim as `user_id`; auto-creates DB `User` row on first login

**Key decisions:**
- JWKS is cached in-memory for 60 min (`_JWKS_TTL = 3600`); stale cache served on fetch failure rather than crashing
- `audience` verification disabled (`verify_aud: False`) — Clerk tokens may not have `aud`
- Dev mode: if `CLERK_JWKS_URL` is empty/`REPLACE_ME`, any request is treated as `DEV_USER_ID = "dev-user-001"` (bypass for local dev without Clerk configured)
- Admin access: `ADMIN_USER_IDS` env var (comma-separated Clerk user IDs) → `require_admin` dependency raises 403 if not in the list

**Frontend token injection (`src/lib/api.ts`):**
- Axios instance with `setApiTokenGetter(getToken)` called at app startup via `AuthProvider`
- Request interceptor calls `getToken()` and injects the Bearer token before every request

---

## 6. Backend — API Endpoints

Base prefix: `/api/v1`

### Profile (`/profile`)
| Method | Path | Description |
|---|---|---|
| POST | `/onboarding` | Create/update profile + recalculate all metrics |
| GET | `` | Get current user's profile |
| PUT | `` | Update profile fields + recalculate metrics |

### Food (`/food`)
| Method | Path | Description |
|---|---|---|
| GET | `/search?q=&limit=&diet_filter=` | Fuzzy search food items |
| GET | `/items/{id}` | Get single food item |
| POST | `/log` | Log a food entry (denormalizes nutrition at insert time) |
| GET | `/log?log_date=` | Get daily food log + totals + targets |
| DELETE | `/log/{entry_id}` | Delete a food log entry |

### Weight (`/weight`)
| Method | Path | Description |
|---|---|---|
| POST | `/log` | Upsert weight entry for a date (PostgreSQL `ON CONFLICT DO UPDATE`) |
| GET | `/log?days=30` | Weight history (up to 365 days) with change delta |
| GET | `/log/latest` | Latest weight entry |

### Water (`/water`)
| Method | Path | Description |
|---|---|---|
| POST | `/log` | Add water entry |
| DELETE | `/log/{entry_id}` | Remove water entry |
| GET | `/log?log_date=` | Daily water summary (total, goal, pct, remaining) |

### Dashboard (`/dashboard`)
| Method | Path | Description |
|---|---|---|
| GET | `` | Full dashboard snapshot (single API call for all widgets) |

Returns: `user_name`, `today_date`, calories consumed/target/remaining, macros consumed/target, streak_days, weight_entries (30 days), next_milestone, bmi, tdee_kcal, goal_weight_kg, time_to_goal_weeks, water snapshot.

Auto-refreshes every 30 seconds on the frontend.

### Admin (`/admin`) — requires `require_admin` dependency
| Method | Path | Description |
|---|---|---|
| GET | `/users` | List all users with profile summaries (paginated) |
| GET | `/users/{id}` | Full profile for a user |
| PATCH | `/users/{id}` | Activate/deactivate user |
| GET | `/food` | List food items (paginated, searchable) |
| POST | `/food` | Create food item |
| PUT | `/food/{id}` | Update food item |
| DELETE | `/food/{id}` | Delete food item |
| GET | `/stats` | Platform counts (total users, total food items) |

### Other
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check → `{status: "ok", version: "1.0.0"}` |
| GET | `/api/v1/me` | Returns `user_id`, `is_admin` (used by root page for routing) |

---

## 7. Backend — Services / Business Logic

### `calculation_engine.py`

**BMR** (Mifflin-St Jeor equation):
- Male: `(10×kg) + (6.25×cm) - (5×age) + 5`
- Female: `(10×kg) + (6.25×cm) - (5×age) - 161`
- Other: average of male/female

**TDEE** = BMR × activity multiplier (`sedentary=1.2`, `light=1.375`, `moderate=1.55`, `intense=1.725`, `very_intense=1.9`)

**Target calories**: `TDEE + (weekly_delta_kg × 7700 / 7)`, clamped by safety floor (male: 1400, female: 1200, other: 1300 kcal)

**BMI**: `weight_kg / (height_m²)`

**Macros** (default split: 30% protein, 40% carbs, 30% fat):
- For `veg`/`egg` diet: minimum protein enforced at `1.6 × goal_weight_kg`; extra protein calories taken from carbs

**Milestones**: Calculates 5%, 25%, 50%, 75%, 100% progress milestones with estimated dates and weeks_away.

**Streak**: Counts consecutive calendar days with at least one food log entry (counts back from today; also accepts yesterday as start).

**Water goal**: `weight_kg × 35 ml`, clamped to [2000, 4000] ml.

### `food_service.py`

`fuzzy_search_foods()` using RapidFuzz `fuzz.WRatio`:
- Loads all food items from DB (no pagination — acceptable for current dataset size)
- Applies diet filter before fuzzy matching (`veg` = is_veg AND NOT is_egg; `egg` = is_veg OR is_egg)
- Score cutoff: 35; results sorted by score descending
- **Known scaling issue**: loads entire food table into memory on each search request

### `ai_coach_stub.py`

Placeholder. `get_ai_coaching_response()` raises `NotImplementedError`. Phase 2 target: `claude-sonnet-4-6` with streaming WebSocket + Redis message history.

---

## 8. Frontend — Pages & Routing

| Route | Component | Access |
|---|---|---|
| `/` | `app/page.tsx` | Auth → redirects to `/admin` or `/dashboard` based on `is_admin` |
| `/sign-in/[[...sign-in]]` | Clerk SignIn | Public |
| `/sign-up/[[...sign-up]]` | Clerk SignUp | Public |
| `/onboarding` | `OnboardingWizard` | Auth required |
| `/dashboard` | `DashboardPage` | Auth; redirects to `/onboarding` if no profile |
| `/tracker` | `TrackerPage` | Auth |
| `/admin` | `AdminPage` | Auth; redirects to `/dashboard` if not admin (403) |
| `/admin/users` | Admin user list | Auth + admin |
| `/admin/food` | Admin food dataset | Auth + admin |

**Middleware** (`src/middleware.ts`): Clerk middleware protects all routes except `/sign-in` and `/sign-up`. Static files and `_next` internals are excluded.

---

## 9. Frontend — Components

### Onboarding (`components/onboarding/`)
- `OnboardingWizard`: 4-step form with validation, state management, submit to `/api/v1/profile/onboarding`
- `Step1Personal`: name, age, gender, height
- `Step2Weight`: current weight, goal weight, timeline (weeks)
- `Step3Fitness`: experience level, activity level
- `Step4Diet`: diet type, optional workout split / diet plan flags
- `StepIndicator`: visual step progress bar

### Dashboard (`components/dashboard/`)
- `CalorieRing`: SVG circular progress ring for calories consumed vs target
- `MacroBar` / `MacroBarsGroup`: horizontal progress bars for protein/carbs/fat
- `WeightProgressChart`: Recharts `LineChart` with 30-day history and goal reference line
- `WaterIntakePanel`: Circular SVG progress + preset buttons (150/250/500/750 ml) + custom input + expandable entry list with delete
- `StreakCounter`: displays consecutive logging days
- `MilestoneCard`: shows next weight milestone with target, estimated date, weeks away
- `DailySummaryBanner`: header with name, date, calories consumed/target

### Tracker (`components/tracker/`)
- `FoodSearchBar`: search input, calls `/api/v1/food/search`, displays results; respects `dietFilter` from user profile
- `AddFoodModal`: modal for selecting meal type + quantity (g), shows live macro preview scaled to quantity
- `FoodLog` / `FoodLogEntry`: list of today's logged food with delete
- `NutritionTotals`: shows totals vs targets with progress bars

### UI Primitives (`components/ui/`)
- `Button`, `Card`, `FormField`, `Input`, `Modal`, `Select`, `Spinner`

---

## 10. Frontend — Hooks (SWR)

| Hook | Key | Refresh | Actions |
|---|---|---|---|
| `useDashboard` | `/api/v1/dashboard` | 30s | — |
| `useFoodLog(date?)` | `/api/v1/food/log?log_date=` | manual | `addEntry()`, `deleteEntry()` |
| `useFoodSearch` | — | — | search function |
| `useProfile` | `/api/v1/profile` | manual | — |
| `useWaterLog` | `/api/v1/water/log` | manual | `addWater(ml)`, `removeWater(id)` |
| `useWeightLog(days=30)` | `/api/v1/weight/log?days=` | manual | `logWeight(kg, note?)` |

**Cross-hook cache invalidation:** `useWaterLog.addWater/removeWater` mutates both `KEY` and `/api/v1/dashboard` so the dashboard water widget updates immediately.

---

## 11. Dev Setup

### Starting the stack
```bash
./dev.sh start    # starts Docker Desktop, Postgres, FastAPI backend, Next.js frontend
./dev.sh stop     # stops all three
./dev.sh status   # checks health of all services
```

### Ports
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5433` (container name: `fitcoach_postgres`, db/user/pass all: `fitcoach`)

### Backend setup
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# copy .env.example to .env and fill in values
alembic upgrade head   # creates tables + seeds food items
uvicorn app.main:app --reload
```

### Frontend setup
```bash
cd frontend
npm install
npm run dev
```

### Environment variables (backend `.env`)
```
DATABASE_URL=postgresql://fitcoach:fitcoach_dev@localhost:5433/fitcoach
CLERK_SECRET_KEY=sk_live_...
CLERK_JWKS_URL=https://<clerk-frontend-api>/.well-known/jwks.json
ADMIN_USER_IDS=user_2abc123
DEV_USER_ID=dev-user-001  # only used without Clerk configured
```

### Environment variables (frontend)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_API_BASE=http://localhost:8000   # default in constants.ts
```

---

## 12. Key Design Decisions

1. **Nutrition denormalized at insert time** (`food_log_entries`): macros are computed and stored when a food entry is logged, not recalculated on read. Means food item edits don't retroactively change historical logs — intentional.

2. **BMR/TDEE/macros cached on profile**: calculated once at onboarding/update, stored in `user_profiles`. Dashboard reads from cache, not recalculated on every request.

3. **Weight log upserts**: PostgreSQL `ON CONFLICT DO UPDATE` on `(user_id, log_date)` — only one weight entry per user per day, re-logging replaces it.

4. **Single dashboard endpoint**: all dashboard data (calories, macros, weight, water, streak, milestone) in one API call to minimize frontend round-trips.

5. **Admin via env var**: admin users are just Clerk IDs in `ADMIN_USER_IDS` — no `is_admin` column in the DB. Avoids a migration when adding/removing admins.

6. **Dev auth bypass**: when `CLERK_JWKS_URL` is not configured, backend accepts any request as `DEV_USER_ID`. Safe because this branch only activates on missing/placeholder config.

7. **Diet-aware food search**: `diet_filter` query param pre-filters the food catalog before fuzzy matching. Veg users only see veg items; egg users see veg + egg.

8. **Fuzzy search loads full table**: RapidFuzz operates in-memory over the entire `food_items` table. Fine at ~50–200 items; would need a vector DB or full-text search at scale.

9. **SWR stale-cache + isValidating guard on dashboard**: dashboard page only redirects to `/onboarding` when `!isLoading && !isValidating && error` — prevents spurious redirects when SWR returns a stale cached error immediately after onboarding completes.

10. **Water goal formula**: `weight_kg × 35 ml` clamped to [2000, 4000] ml. Dynamically computed per request from current profile weight.

---

## 13. Things to Improve / Enhance

### High Priority
- [ ] **AI Coach (Phase 2)**: implement `ai_coach_stub.py` — Claude API (`claude-sonnet-4-6`), system prompt with user profile context, Redis message history, streaming via WebSocket
- [ ] **Fuzzy search scalability**: currently loads all food items into memory. Add PostgreSQL full-text search (`tsvector`) or switch to a proper search backend when food catalog grows
- [ ] **Profile editing UI**: no frontend page to update profile post-onboarding (backend PUT `/profile` exists but no UI)
- [ ] **Date navigation in tracker**: tracker currently only shows today; need ability to log/view past dates

### Data & Features
- [ ] **Meal-level calorie breakdown**: dashboard currently shows only daily totals, not per-meal (breakfast/lunch/dinner/snack) breakdown
- [ ] **Custom food items**: users can't add their own food items — only admin can add to the shared catalog
- [ ] **Workout tracking**: `wants_workout_split` flag is captured at onboarding but no workout logging exists
- [ ] **Diet plan generation**: `wants_diet_plan` flag captured but not implemented
- [ ] **Hydration reminders**: `WaterIntakePanel` already has a "coming soon" placeholder
- [ ] **Progress photos**: no photo upload functionality
- [ ] **Body measurements** (waist, chest, etc.): only weight is tracked

### Technical Debt
- [ ] **N+1 query in admin `/users`**: fetches profile for each user in a loop — should join or use `selectinload`
- [ ] **N+1 query in food log GET**: `food_names` dict built by calling `db.get()` per entry in a loop
- [ ] **`user.is_active` field**: `AdminUserPatch` schema has `is_active` but the `User` model has no such column (would 500 if called)
- [ ] **No soft-delete**: deleting food log entries or water entries is permanent
- [ ] **No request-level rate limiting** on the backend
- [ ] **CORS hardcoded to `localhost:3000`** in `main.py` — needs env-var-driven config for staging/production
- [ ] **No backend tests**: only frontend has Playwright e2e tests; no pytest unit/integration tests

### UX / Polish
- [ ] **Streak logic edge case**: if no logs exist for today but yesterday had entries, streak starts at 1 (correct behavior) but could confuse users expecting 0
- [ ] **Weight chart empty state**: shows "no entries yet" but no call-to-action inline
- [ ] **Mobile responsiveness**: layout uses `max-w-2xl` which works but not verified across all mobile breakpoints
- [ ] **Error states**: most error paths show `null` (blank screen) or generic messages; inline user-friendly errors needed
- [ ] **Loading skeleton**: only `<Spinner>` used; no skeleton screens for content

### Infrastructure
- [ ] **No staging environment**: only local dev (docker-compose)
- [ ] **No CI/CD pipeline**
- [ ] **Playwright tests not integrated into CI**
- [ ] **Database backups** not configured
- [ ] **Redis** needed before Phase 2 AI coach history can be implemented

---

## 14. File Quick Reference

| What you're looking for | File |
|---|---|
| API routes registered | `backend/app/main.py` |
| Auth / JWT verification | `backend/app/auth.py` |
| Env config (backend) | `backend/app/config.py` |
| Calorie / macro formulas | `backend/app/services/calculation_engine.py` |
| Food fuzzy search | `backend/app/services/food_service.py` |
| AI coach stub | `backend/app/services/ai_coach_stub.py` |
| Food endpoints | `backend/app/routers/food.py` |
| Dashboard endpoint | `backend/app/routers/dashboard.py` |
| Admin endpoints | `backend/app/routers/admin.py` |
| DB models | `backend/app/models/` |
| Migrations | `backend/alembic/versions/` |
| Frontend auth setup | `frontend/src/components/AuthProvider.tsx` |
| Route protection | `frontend/src/middleware.ts` |
| API client (Axios) | `frontend/src/lib/api.ts` |
| Root redirect logic | `frontend/src/app/page.tsx` |
| Dashboard page | `frontend/src/app/dashboard/page.tsx` |
| Tracker page | `frontend/src/app/tracker/page.tsx` |
| Onboarding wizard | `frontend/src/components/onboarding/OnboardingWizard.tsx` |
| Water panel | `frontend/src/components/dashboard/WaterIntakePanel.tsx` |
| Weight chart | `frontend/src/components/dashboard/WeightProgressChart.tsx` |
| TypeScript types | `frontend/src/types/` |
| SWR hooks | `frontend/src/hooks/` |
| Dev start/stop | `dev.sh` |
| Docker Postgres | `docker-compose.yml` |
