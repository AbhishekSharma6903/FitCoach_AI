# FitCoach AI — Product Roadmap & MVP Execution Plan

> Architect-level decision document. Written 2026-06-19.
> Single source of truth for what to build, why, in what order, and what's skippable.
> Update this when scope changes — don't create a new doc.

---

## Architect's Take — What Problem Are We Actually Solving?

Before prioritising features, we need to agree on the core user problem:

> **"I want to lose/gain weight and improve my fitness, but I don't know what to eat, how much to exercise, or whether what I'm doing is actually working."**

Every feature should be measured against: *does this directly help the user answer that question?*

This rules out a lot. Progress photos, body measurements, social sharing, and barcode scanners are not what makes or breaks this app for 90% of users. What does:

1. **Accurate food logging** — without this, nothing else works
2. **Seeing progress** — the app must reflect reality fast enough to motivate
3. **Knowing what to do next** — this is where AI creates real value, not just novelty

Everything else is polish or power-user features.

---

## Current State (What's Already Built)

| Feature | Status |
|---|---|
| Auth (Clerk) + onboarding (4-step) | ✅ Done |
| BMR/TDEE/macro calculation engine | ✅ Done |
| Dashboard (calories, macros, water, weight, streak, milestone) | ✅ Done |
| Food tracker (search, log, delete) with fuzzy search | ✅ Done |
| Water logging | ✅ Done |
| Weight logging + chart | ✅ Done |
| Admin panel (users, food catalog) | ✅ Done |
| Food dataset (8,644 items — USDA + IFCT 2017) | ✅ Built, not yet imported to DB |
| AI Coach | 🔴 Stubbed — `NotImplementedError` |
| Profile edit UI | 🔴 Missing (backend PUT /profile exists) |
| Workout tracking | 🔴 Not started |
| Meal plan generation | 🔴 Not started |
| Custom dish builder | 🔴 Not started |
| Weekly nutrition insights | 🔴 Not started |

---

## Feature Classification

### REQUIREMENT — App is broken without these

Features the app fundamentally needs to be useful to any user.

---

#### R1 — Import Food Dataset into DB
**What:** Run Alembic migration to replace the 50 seeded items with the full 8,644-item `food_items.csv`.

**Why it's a REQUIREMENT:** The tracker already exists but the food catalog is tiny (50 Indian items). Users will fail searches immediately. Nothing else in the food/meal stack works without data.

**Effort:** Small — 1 migration + data import script. Dataset pipeline already done.

**What already exists:** `food_items` table schema, seeder pattern in `seed_food_items_001.py`, fuzzy search endpoint live.

**What to do:**
- Write Alembic migration that truncates + bulk-inserts from `food_items.csv`
- Update fuzzy search to use PostgreSQL `tsvector` full-text search (current in-memory approach breaks at 8k+ items — documented known issue)
- Add `source`, `source_id`, `cuisine`, `aliases` columns to the table (from new schema)

---

#### R2 — Profile Edit Page
**What:** `/profile` page where users can update weight, goal weight, timeline, activity level, diet type. Triggers recalculation of TDEE/macros on save.

**Why it's a REQUIREMENT:** Users change. Weight changes weekly, goals change monthly. Without this the app becomes wrong within days of onboarding and users churn. Backend `PUT /profile` already exists — this is a UI gap only.

**Effort:** Small — 1 frontend page, all backend logic exists.

**What already exists:** `PUT /api/v1/profile`, calculation_engine already recalculates everything on update, `useProfile` SWR hook.

**What to do:**
- `/profile` page with pre-filled form (weight, goal weight, timeline, activity level, diet type)
- On save: call `PUT /profile`, invalidate dashboard SWR cache
- Show computed BMI, TDEE, macro targets on the same page (read-only)

---

#### R3 — Date Navigation in Tracker
**What:** Allow users to log and view food for past dates (today is the only option currently).

**Why it's a REQUIREMENT:** Users forget to log in the moment. If they can only log today, they'll either give up or have inaccurate data. The backend already supports `log_date` param.

**Effort:** Small — frontend-only change. Backend `GET /food/log?log_date=` already takes a date param.

**What to do:**
- Add date picker / prev/next day buttons to `/tracker`
- Pass selected date through to all `useFoodLog` calls

---

### PRIORITY — High value, builds on requirements, ships the real product

Features that differentiate FitCoach AI from a spreadsheet.

---

#### P1 — AI Coach (Chat Interface)
**What:** Floating chat panel accessible from any page. User asks questions, gets contextual answers. Claude `claude-sonnet-4-6` with streaming. Context includes user's profile, today's food log, today's workout (once built), 7-day trend.

**Why it's PRIORITY not REQUIREMENT:** The app works without it, but this is the entire "AI" in FitCoach AI. Without it the product is just a calorie counter, which is a commodity. This is the feature that justifies the product existing.

**Effort:** Large — backend streaming endpoint, frontend chat UI, system prompt engineering.

**What already exists:** `ai_coach_stub.py` placeholder, Claude model planned. **Note:** `anthropic` SDK is NOT yet in `requirements.txt` — add `anthropic>=0.40.0` as first step.

**What to do:**
- Backend: `POST /coach/chat` — streaming SSE endpoint (not WebSocket — simpler, works everywhere)
- Backend: build context payload (profile snapshot + today's log + 7-day calorie trend)
- Backend: `GET /coach/history` — last 20 messages per user (store in `coach_messages` table)
- Frontend: `ChatPanel` component (slide-in drawer), `MessageBubble`, streaming text display
- Frontend: accessible from bottom-right FAB on all authenticated pages

**Use cases to handle at launch:**
- "What should I eat for dinner?" → fits remaining macros
- "Am I on track to hit my goal?" → analyses trend
- "What's the protein in 150g paneer?" → nutrition lookup
- "Give me a 5-day workout split for beginner" → generates plan

---

#### P2 — Meal Plan Generator
**What:** `/meal-plan` page with 7-day grid. Claude generates a plan using foods from our database that hits the user's calorie + macro targets and respects diet type. Stored in DB so it persists between sessions.

**Why it's PRIORITY:** `wants_diet_plan: bool` is captured at onboarding and never used — this is a broken promise to users. Meal planning is also the #1 request in every fitness app. With our 8,644-item database it's actually grounded, not hallucinated.

**Effort:** Medium — 1 backend route + Claude call + frontend page.

**What already exists:** `wants_diet_plan` in `user_profiles`, food dataset, Claude SDK.

**What to do:**
- Backend: `POST /meal-plan/generate` — filter food_items to user's diet preference → Claude prompt with TDEE + macro targets → validate all returned foods exist in DB → store as JSONB
- Backend: `GET /meal-plan` — fetch stored plan
- Backend: `PATCH /meal-plan/day/{n}` — regenerate single day
- Frontend: 7-day grid, each cell shows food + macros, daily total row, "Regenerate day" button

---

#### P3 — Custom Dish Builder
**What:** Users create reusable composite dishes (e.g. "My Poha") by combining ingredients. Nutrition is computed from ingredients and stored per 100g. Dish appears in food search.

**Why it's PRIORITY:** Indian home cooking is not in any dataset. Every user will hit a wall when they try to log "dal makhani" or "mom's biryani". This solves the single biggest gap in the food catalog.

**Effort:** Medium — 2 new DB tables + 4 endpoints + frontend flow.

**What already exists:** `food_items` table with per-100g nutrition, food search, `AddFoodModal` pattern.

**What to do:**
- DB: `custom_dishes` + `custom_dish_ingredients` tables (schema defined in NUTRITION_FEATURE_IDEATION.md)
- Backend: CRUD for dishes + ingredient management + nutrition calculation endpoint
- Frontend: `/dishes` page — create/edit dish, ingredient search + gram input, live nutrition preview
- Food search: include `custom_dishes` for the logged-in user in search results

---

#### P4 — Workout Tracking
**What:** `/workout` page to log exercise sessions. Exercise library (like food_items for workouts). Dashboard shows calories burned; calorie ring becomes net calories (consumed − burned).

**Why it's PRIORITY:** App is called FitCoach AI. Zero workout tracking means the calorie balance is half the picture — consumed calories vs target is tracked, but energy expenditure from exercise is invisible. This breaks the core fitness loop.

**Effort:** Large — new tables, endpoints, frontend page, dashboard update.

**What already exists:** `wants_workout_split: bool` in onboarding (captured, unused), calorie ring on dashboard.

**What to do:**
- DB: `exercise_library` + `workout_logs` tables
- Backend: `GET /exercise/search`, `POST /exercise/log`, `GET /exercise/log?date=`, `DELETE /exercise/log/{id}`, `GET /exercise/history?days=30`
- Seed: ~100 common exercises with MET values for calorie burn calculation
- Frontend: `/workout` page mirroring tracker layout
- Dashboard: update `CalorieRing` to show net calories; add "Burned Today" widget

---

### GOOD TO HAVE — Real value, but not blocking the core loop

Features that improve retention and depth but aren't required for a complete MVP.

---

#### G1 — Weekly Nutrition Insights
**What:** Weekly automated analysis of logged meals. Surfaces deficiencies (e.g. "low on iron 5/7 days"), meal timing patterns, suggestions from the food database.

**Why it's GOOD TO HAVE:** High value for engaged users, but requires consistent logging data to be meaningful. Premature if users are still onboarding. Build after 4–6 weeks of real usage data.

**Effort:** Small-Medium — cron job + analysis logic + notification UI.

---

#### G2 — Ingredient Substitution Suggestions
**What:** When logging a food, suggest a healthier alternative from the same category (e.g. "swap white rice for brown rice for +3g fiber").

**Why it's GOOD TO HAVE:** Nice UX touch, but not core to the problem. Users need to be logging consistently before substitution advice is relevant.

**Effort:** Small — rules engine on `food_items`, no AI needed.

---

#### G3 — Analytics / Progress Reports Page
**What:** `/analytics` — 30-day calorie trend, macro consistency chart, weight projection to goal, streak/consistency score, top foods breakdown.

**Why it's GOOD TO HAVE:** The underlying data (food logs, weight logs) already exists. This is a pure frontend + one aggregate endpoint. Ships "for free" once there's enough data. Add after 30+ days of real usage.

**Effort:** Small — mostly Recharts components, one new `GET /analytics/summary` endpoint.

---

#### G4 — Settings Page
**What:** Water goal override (currently auto-calculated), unit preference (kg/lbs, cm/ft), account section (Clerk `<UserProfile />` component).

**Why it's GOOD TO HAVE:** The auto-calculated water goal works. Unit conversion is a polish item. Clerk's component is literally one JSX element. Add it alongside the profile edit page since it's almost free.

**Effort:** Tiny — 30 minutes.

---

### OUT OF SCOPE for MVP

| Feature | Why Skipped |
|---|---|
| Barcode scanner | Requires Open Food Facts API integration + mobile camera. Low ROI on web. |
| Voice input ("I had 2 rotis") | NLP parsing is hard to do reliably. Claude can do this in Phase 3+ as a chat command. |
| Photo meal logging | Computer vision complexity, cost. Not core. |
| Progress photos | Storage cost, privacy risk, not core to the nutrition loop. |
| Body measurements (waist, chest) | Data without action is noise. No calorie algorithm uses it. |
| Community / shared dishes | Moderation problem. Build private-only first. |
| Hydration reminders / push notifications | Needs PWA service worker or native app. Out of scope for web MVP. |
| Staging environment / CI/CD | Real infrastructure need, but not a feature. Do after first external user. |

---

## MVP Definition

**MVP = the app a real person can use for 30 days and feel like it's working.**

That requires:

1. ✅ Auth + onboarding (done)
2. ✅ Dashboard (done)
3. **R1** — Full food dataset (8,644 items)
4. ✅ Food tracker (done, unblocked by R1)
5. **R2** — Profile edit (weight changes; app must stay accurate)
6. **R3** — Date navigation in tracker (log past days)
7. **P1** — AI Coach (the differentiator)
8. **P3** — Custom Dish Builder (Indian home cooking gap)

P2 (Meal Plan) and P4 (Workout) are strong additions to MVP but the app is usable without them.

---

## Execution Order

```
Sprint 1 — Close the data gap (1–2 days)
  R1  Import full food dataset + DB migration
  R1  Fix fuzzy search scaling (PostgreSQL full-text search)
  R2  Profile edit page (/profile)
  G4  Settings page (water override, units) — free since we're touching /profile

Sprint 2 — Complete the logging loop (2–3 days)
  R3  Date navigation in tracker
  P3  Custom Dish Builder (backend + frontend)

Sprint 3 — AI features (3–4 days)
  P1  AI Coach chat interface (streaming SSE + context building)
  P2  Meal Plan Generator (built on same Claude infrastructure as P1)

Sprint 4 — Fitness loop (2–3 days)
  P4  Workout tracking (exercise library, log, dashboard net calories)

Sprint 5 — Depth & retention (1–2 days)
  G1  Weekly nutrition insights
  G2  Ingredient substitution suggestions
  G3  Analytics page

Total estimated MVP (Sprint 1–3): ~7–10 days of focused development
Total full product (Sprint 1–5): ~14–18 days
```

---

## What to Execute Right Now

Ordered task list. Each item is a concrete unit of work.

### Sprint 1

- [ ] **S1.1** Write Alembic migration: add `source`, `source_id`, `cuisine`, `aliases` columns to `food_items`
- [ ] **S1.2** Write data import script: load `datasets/output/food_items.csv` → `food_items` table (bulk insert, truncate seed data first)
- [ ] **S1.3** Upgrade food search: replace RapidFuzz in-memory with `pg_trgm` trigram similarity — `CREATE EXTENSION pg_trgm`, GIN index on `name_normalized`, similarity threshold 0.15 (lower than default 0.3 to handle short Indian food names)
- [ ] **S1.4** Frontend: `/profile` page — form (weight, goal weight, timeline, activity level, diet type), calls `PUT /api/v1/profile`, shows computed BMI + TDEE + macros
- [ ] **S1.5** Frontend: `/settings` page — water goal override input, unit preference toggle (kg/cm vs lbs/ft), Clerk `<UserProfile />` component
- [ ] **S1.6** Add `/profile` and `/settings` links to dashboard nav

### Sprint 2

- [ ] **S2.1** Frontend: date picker in `/tracker` (prev/next day arrows + date display), wire to `useFoodLog(date)`
- [ ] **S2.2** Backend: `custom_dishes` + `custom_dish_ingredients` tables (Alembic migration)
- [ ] **S2.3** Backend: `POST/GET/PUT/DELETE /dishes` + `POST /dishes/{id}/ingredients` + nutrition computation endpoint
- [ ] **S2.4** Frontend: `/dishes` page — create dish, ingredient search, quantity input, live nutrition preview, save
- [ ] **S2.5** Food search: include user's custom dishes in results (separate API call, merge client-side)

### Sprint 3

- [ ] **S3.1** Backend: `coach_messages` table (user_id, role, content, created_at)
- [ ] **S3.2** Backend: `POST /coach/chat` — build context payload (profile + today's log + 7d trend), stream Claude response via SSE
- [ ] **S3.3** Backend: `GET /coach/history` — last 20 messages
- [ ] **S3.4** Frontend: `ChatPanel` component (slide-in drawer), streaming message display, FAB trigger
- [ ] **S3.5** Backend: `POST /meal-plan/generate` — Claude call with filtered food_items, validate output, store as JSONB
- [ ] **S3.6** Backend: `GET /meal-plan`, `PATCH /meal-plan/day/{n}`
- [ ] **S3.7** Frontend: `/meal-plan` page — 7-day grid, daily macro totals, regenerate day button

### Sprint 4

- [ ] **S4.1** Backend: `exercise_library` + `workout_logs` tables
- [ ] **S4.2** Backend: seed ~100 exercises with MET values
- [ ] **S4.3** Backend: exercise search + log CRUD endpoints
- [ ] **S4.4** Frontend: `/workout` page — exercise search, log form, daily workout list
- [ ] **S4.5** Dashboard: update `CalorieRing` to net calories, add burned calories widget

---

## Technical Debt to Fix Before AI Features (Sprint 3 prerequisite)

These are from `CODEBASE_SUMMARY.md` and will cause problems at scale:

- [ ] **N+1 in food log GET** (`food_names` dict built per-entry in a loop) — fix before meal plan feature adds more log queries
- [ ] **CORS hardcoded to localhost:3000** — fix before any staging/demo deployment
- [ ] **`user.is_active` 500 bug** — `AdminUserPatch` has `is_active` field but `User` model has no column; will 500 if admin tries to deactivate a user

---

## Key Architectural Decisions for Upcoming Features

| Decision | Choice | Reason |
|---|---|---|
| AI streaming transport | SSE (Server-Sent Events), not WebSocket | FastAPI `StreamingResponse(media_type="text/event-stream")` — no extra lib, works with fetch/EventSource in Next.js. WebSocket adds connection state complexity for no gain in a chat use case. |
| Coach message history storage | PostgreSQL `coach_messages` table | Redis would need separate infra. Postgres is already running; 20-message window is tiny. Add Redis only if latency becomes a problem. |
| Food search at 8k+ items | **`pg_trgm` trigram GIN index** (not `tsvector`) | `tsvector` uses English stemming — bad for transliterated Indian names ("poha", "dal", "upma" don't stem). `pg_trgm` is character-based similarity — "paneer" matches "Cottage cheese, paneer" and handles typos. Zero new infra. |
| Meal plan structured output | Claude `tool_use` with `tool_choice: {type: "tool"}` | Forces Claude to always return the tool call (structured JSON) — no prose fallback. Use `strict: true` in tool definition to guarantee schema conformance. |
| Meal plan storage | JSONB column on `diet_plans` table | The plan structure is nested + variable. JSONB gives flexibility without a 5-table join. |
| Custom dish nutrition | Computed at save + stored per 100g | Same schema as `food_items` — logging uses identical code path. Recompute on edit, never on read. |
| Claude model for all AI features | `claude-sonnet-4-6` (API ID: `claude-sonnet-4-6`) | 1M token context, 128k max output, $3/$15 per MTok. Best speed/intelligence balance. Knowledge cutoff Aug 2025. |
| Exercise calorie calculation | MET formula: `METs × weight_kg × duration_h` | Standard, well-understood, no external API needed. Seed MET values with exercise library. |
| Exercise library data source | **free-exercise-db** (GitHub: `yuhonas/free-exercise-db`) + manual MET values | 800+ exercises with name, category, muscle groups, equipment, instructions. No MET values — add them manually for the ~50 most common exercises. MET values sourced from 2024 Adult Compendium of Physical Activities. |

---

## Integration Decisions (Research Findings)

### R1 — Food Search: `pg_trgm` over `tsvector`

**Decision: Use `pg_trgm` trigram similarity, not `tsvector`.**

`tsvector` uses English lexeme stemming which is useless for transliterated Indian food names:
- "poha" → no English stem match
- "dal makhani" → "dal" and "makhani" don't appear in any English lexicon
- "upma" → treated as unknown word

`pg_trgm` splits words into character trigrams and measures overlap — language-agnostic:
- "paneer" will match "Cottage cheese, paneer" (substring trigram overlap)
- Handles typos: "panir" → matches "paneer" via similarity score
- Works with both Hindi transliterations and English names

**Implementation:**
```sql
-- One-time setup
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_food_items_trgm ON food_items USING GIN (name_normalized gin_trgm_ops);

-- Search query
SELECT * FROM food_items
WHERE name_normalized % 'poha'       -- similarity operator, default threshold 0.3
ORDER BY similarity(name_normalized, 'poha') DESC
LIMIT 10;
```

**Python (SQLAlchemy):**
```python
from sqlalchemy import func, text
results = db.query(FoodItem)\
    .filter(func.similarity(FoodItem.name_normalized, query) > 0.15)\
    .order_by(func.similarity(FoodItem.name_normalized, query).desc())\
    .limit(limit).all()
```
Lower the threshold to 0.15 for short Indian food names (single words like "dal", "roti").

---

### P1 — AI Streaming: FastAPI SSE + Anthropic SDK

**No new packages needed.** FastAPI has native `StreamingResponse`. Anthropic SDK streams via context manager.

**Backend pattern:**
```python
# requirements: add `anthropic>=0.40.0`
import anthropic
from fastapi.responses import StreamingResponse

client = anthropic.Anthropic()

async def stream_claude(messages, system_prompt):
    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield f"data: {text}\n\n"

@router.post("/coach/chat")
async def chat(req: ChatRequest, user_id=Depends(get_current_user_id)):
    # build context payload here...
    return StreamingResponse(
        stream_claude(messages, system_prompt),
        media_type="text/event-stream"
    )
```

**Frontend (Next.js):**
```typescript
const res = await fetch('/api/v1/coach/chat', { method: 'POST', body: ... });
const reader = res.body.getReader();
// read chunks and append to message state
```

---

### P1/P2 — Claude Structured Output for Meal Plan

**Use `tool_use` with `tool_choice: {"type": "tool", "name": "generate_meal_plan"}`** — this forces Claude to always call the tool, giving you guaranteed JSON.

```python
tools = [{
    "name": "generate_meal_plan",
    "description": "Generate a 7-day meal plan",
    "input_schema": {
        "type": "object",
        "properties": {
            "days": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "day": {"type": "integer"},
                        "breakfast": {"$ref": "#/$defs/meal"},
                        "lunch": {"$ref": "#/$defs/meal"},
                        "dinner": {"$ref": "#/$defs/meal"},
                        "snack": {"$ref": "#/$defs/meal"},
                    }
                }
            }
        },
        "$defs": {
            "meal": {
                "type": "object",
                "properties": {
                    "food_name": {"type": "string"},  # must match food_items.name
                    "quantity_g": {"type": "number"},
                }
            }
        }
    }
}]

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    tools=tools,
    tool_choice={"type": "tool", "name": "generate_meal_plan"},
    messages=[{"role": "user", "content": prompt}]
)
# response.content[0].input is the validated JSON dict
meal_plan = response.content[0].input
```

**Anti-hallucination step:** After getting the plan, validate every `food_name` against `food_items` table. Replace any unmatched item with the closest trigram match.

---

### P4 — Exercise Library: free-exercise-db + MET values

**Base data:** `yuhonas/free-exercise-db` — 800+ exercises, JSON format, fields:
`name`, `category` (strength/cardio/stretching/plyometrics), `primaryMuscles`, `secondaryMuscles`, `equipment`, `level` (beginner/intermediate/expert), `instructions`

**Missing:** No MET values. Add manually for common categories using 2024 Compendium of Physical Activities:

| Category | Representative MET |
|---|---|
| Running (moderate, ~8km/h) | 8.0 |
| Running (fast, ~12km/h) | 11.5 |
| Walking (moderate) | 3.5 |
| Cycling (moderate) | 6.8 |
| Swimming (laps) | 6.0 |
| Weight training (moderate) | 3.5 |
| Yoga | 3.0 |
| HIIT / Plyometrics | 8.0 |
| Stretching | 2.3 |
| Jumping rope | 11.0 |

**Calorie burn formula:** `calories = MET × weight_kg × duration_hours`

Example: 70kg user, 30min weight training → `3.5 × 70 × 0.5 = 122.5 kcal`

**Import plan:** Download `exercises.json`, filter to ~200 most common, seed into `exercise_library` table with manually assigned MET values by category.

---

## Gaps Found in the Roadmap (Fixes Applied)

| Gap | What Was Missing | Fix |
|---|---|---|
| Food search tech choice was vague | "tsvector" was planned but wrong for Indian names | Changed to `pg_trgm` — language-agnostic, better for transliterated names |
| `anthropic` not in requirements.txt | SDK missing from backend | Add `anthropic>=0.40.0` to requirements.txt in S3.1 |
| Claude model ID wasn't verified | Roadmap said "claude-sonnet-4-6" without confirming | Confirmed: API ID is `claude-sonnet-4-6`, 1M context, 128k output, $3/$15 MTok |
| Meal plan hallucination risk not addressed | No validation step after Claude output | Add post-generation validation: match every food_name against food_items via trigram |
| Exercise MET values source unspecified | "seed MET values" with no source | Source confirmed: 2024 Compendium of Physical Activities + free-exercise-db base |
| SSE implementation was "TBD" | No code pattern documented | FastAPI `StreamingResponse` + Anthropic `.stream()` context manager — no extra packages |
| CORS issue noted but no fix specified | Hardcoded to localhost:3000 | Fix: move to `ALLOWED_ORIGINS` env var in `config.py`, read in `main.py` |
