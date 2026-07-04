# FitCoach AI — UI Refactor Plan v2

## Definitive Reference Document

> Written: 2026-07-02. Updated: 2026-07-04.
> **This is the ONLY plan document needed. The original UI_REFACTOR_PLAN.md can be deleted.**
> Read Parts 1–3 before writing any code. Read Part 4 (feature inventory) to ensure nothing is missed.

---

## ⚠️ The Goal

**Full rebuild of the entire frontend from scratch.** The legacy frontend is preserved at `frontend_legacy/` for reference. The new frontend goes in a new `frontend/` directory built using:

- `shadcn/ui` component library (Radix UI primitives + Tailwind)
- 4-level warm-neutral dark surface hierarchy (Part 2)
- Bevel/Hevy-inspired typography — big numbers, weight contrast
- Mobile-first: bottom tab navigation, responsive grids, 44px touch targets
- One consistent design language across every component and page

**The test tool (`qa/page_audit.py`) runs after each page rebuild to score responsiveness and aesthetics. P0 target ≥ 8.0 before moving to the next page.**

---

## Part 1 — What's Wrong With the Current UI (Root Causes)

From a full audit of `frontend_legacy/`:

### Critical Architecture Problems

1. **No shared page shell** — 6 pages each duplicate `min-h-screen bg-[#0d0d0d] max-w-2xl mx-auto px-4 py-6`. Any padding change requires 6 edits.
2. **Blue-tinted dark palette** — Tailwind `gray-900` is `#111827` which has blue in it. Premium dark apps use warm/pure neutral darks (`#111111`, `#1A1A1A`). This makes cards feel cold.
3. **Only 2 surface levels** — background (`#0d0d0d`) and card (`bg-gray-900`). No elevated surface for modals/dropdowns, no control surface for inputs. Everything reads flat.
4. **No bottom navigation** — The whole app uses back arrows for navigation. On mobile this is unusable. Users expect a persistent bottom tab bar.
5. **Dashboard action bar disaster** — A single row containing: green "Log Food" button, 🏋️ emoji, 🍽️ emoji, weight number input, "Log" button, avatar. At 375px this overflows.

### Design System Fragmentation

- 3 different `<input>` implementations (Input.tsx, raw in AddFoodModal, raw in FoodSearchBar)
- 2 different `<select>` implementations (Select.tsx, inline `CustomSelect` in profile)
- Dead CSS in `globals.css` (`.btn-primary`, `.card`, `.badge` — never used)
- `--font-inter` CSS variable never actually set — all text falls back to `system-ui`

### Bugs Fixed in Phase 0 (already done in legacy)

- B1: Font variable (fixed)
- B2: React setState-during-render in profile (fixed)
- B3: `bg-brand-500/8` invalid Tailwind opacity (fixed)
- B4: Division by zero in AddFoodModal serving_size (fixed)
- B5: Workout date not navigable (fixed)
- B6/B7: Hidden div wrappers causing wasted renders (fixed)

---

## Part 2 — Design Language Specification

> **Every developer must read this section before writing any CSS or JSX.**
> This is the source of truth for all visual decisions in the new frontend.

### 2.1 Philosophy

Less is more. Big numbers. Lots of dark breathing room. Color only where it means something.

Reference apps: **Bevel**, **Hevy**, **Whoop**, **Strong**

### 2.2 Surface Hierarchy (4 levels)

```
Level 0 — Page background:  #0A0A0A  (near-black, warm-neutral)
Level 1 — Card surface:     #111111  (slightly lighter)
Level 2 — Elevated:         #1A1A1A  (modals, dropdowns, hover states)
Level 3 — Control:          #222222  (inputs, toggles, interactive elements)
Border:                     #2A2A2A  (subtle — NOT Tailwind gray-700 which is blue-tinted)
```

**CSS variables to define in globals.css:**

```css
:root {
  --color-bg:             #0A0A0A;
  --color-surface:        #111111;
  --color-elevated:       #1A1A1A;
  --color-control:        #222222;
  --color-border:         #2A2A2A;
  --color-border-subtle:  #1F1F1F;
  --color-text:           #F5F5F5;
  --color-text-muted:     #9CA3AF;
  --color-text-dim:       #6B7280;
  --color-text-faint:     #374151;
  --color-brand:          #22c55e;
  --color-brand-dim:      rgba(34,197,94,0.1);
  --color-brand-glow:     rgba(34,197,94,0.2);
  --color-error:          #ef4444;
  --color-warning:        #f59e0b;
  --color-info:           #60a5fa;
}
```

### 2.3 Brand Color Rules

Green `#22c55e` is used ONLY for:

- Primary CTA buttons (one per screen)
- Active state in bottom navigation
- Positive metrics (streak, goal achieved)
- Progress bar fill colors

**Never** use green for: decoration, secondary actions, background fills (max /10 opacity tint).

### 2.4 Typography Scale

```
Display:   48px / font-black (900) / tracking-tighter  — primary metric (calories, weight)
Heading 1: 28px / font-bold (700) / tracking-tight      — page title
Heading 2: 20px / font-bold (700)                        — section title
Heading 3: 16px / font-semibold (600)                    — card title
Body:      15px / font-normal (400) / leading-relaxed    — main content
Label:     13px / font-medium (500) / tracking-wide      — form labels
Caption:   11px / font-semibold (600) / tracking-widest / UPPERCASE — floating section headers
Micro:     10px — timestamps, tags (use sparingly)
```

Weight contrast is critical: mix `font-black` (primary metric) with `font-normal` (context label). Current app is flat because everything uses `font-bold` or `font-semibold`.

### 2.5 Spacing System (8px base grid)

```
4px  = gap-1   — icon + label
8px  = gap-2   — items in a row
12px = gap-3   — list items
16px = p-4     — card padding (mobile)
20px = p-5     — card padding (desktop)
24px = gap-6   — between cards
32px = gap-8   — major section breaks
```

### 2.6 Border Radius

```
4px  = rounded       — tags, badges
8px  = rounded-lg    — buttons, inputs
12px = rounded-xl    — cards (mobile)
16px = rounded-2xl   — large cards
24px = rounded-3xl   — modals, bottom sheets
∞    = rounded-full  — avatars, rings
```

### 2.7 Motion

```
Micro interactions:  120ms ease-out    — hover, focus rings
Content transitions: 200ms ease-in-out — modals, drawers
Page transitions:    250ms ease-in-out — route changes
Data updates:        300ms ease-out    — progress bars
Skeletons:           1.5s ease-in-out  — pulse
```

### 2.8 Semantic Colors

```
Protein:        #3b82f6  (blue-500)
Carbs:          #f59e0b  (amber-400)
Fat:            #f97316  (orange-500)
Fiber:          #a78bfa  (violet-400)
Burned cal:     #fb923c  (orange-400)
Cardio:         #ef4444  (red-400)
Strength:       #3b82f6  (blue-400)
Yoga:           #a78bfa  (purple-400)
Stretching:     #4ade80  (green-400)
Plyometrics:    #f97316  (orange-500)
```

### 2.9 Component Patterns

#### Cards

```
bg: var(--color-surface)     → #111111
border: 1px solid #2A2A2A
border-radius: rounded-2xl
padding: 20px (p-5)
shadow: none on mobile, subtle on desktop
```

#### Metric Display (Bevel pattern — primary numbers)

```
<span className="text-5xl font-black text-white">349</span>
<span className="text-sm text-gray-400 font-medium">kcal</span>
<span className="text-xs text-gray-600">of 2352 goal</span>
```

#### Section Headers (floating label style)

```
className="text-[11px] font-semibold tracking-[0.12em] uppercase text-gray-500 mb-2"
```

No box, no card header. Just a floating uppercase label above the section.

#### Progress Bars

```
track: h-2 rounded-full bg-[#2A2A2A]    (NOT Tailwind gray-800 — too blue)
fill:  h-2 rounded-full transition-all duration-300
label row (above bar):
  left:  text-xs font-medium text-gray-300
  right: text-xs font-semibold text-white + text-gray-600 for /target
```

#### Buttons

```
Primary:   h-11 bg-[#22c55e] text-black font-semibold rounded-lg hover:bg-green-400 active:scale-[0.98]
Secondary: h-11 bg-[#222222] border border-[#333333] text-gray-200 rounded-lg
Ghost:     transparent text-gray-400 hover:text-white hover:bg-[#1A1A1A]
Danger:    h-11 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg
Icon-only: min 44×44px bg-[#1A1A1A] rounded-xl
```

#### Bottom Navigation (mobile only, hidden md:+)

```
height:     64px + env(safe-area-inset-bottom)
background: rgba(17,17,17,0.85) backdrop-blur-xl
border-top: 1px solid #2A2A2A
position:   fixed bottom-0 left-0 right-0 z-50

Items: Dashboard | Tracker | Workout | Dishes | Profile
Icons: Home | UtensilsCrossed | Dumbbell | ChefHat | User

Active:
  icon: text-[#22c55e] (filled variant)
  label: text-[10px] font-semibold text-[#22c55e]
  dot indicator: 2px × 16px bg-[#22c55e] rounded-full above icon

Inactive:
  icon: text-gray-600 (outline)
  label: hidden
```

---

## Part 3 — Build Phases

> Phase 0 (bug fixes) is already complete in `frontend_legacy/`.
> The new `frontend/` starts at Phase 1 — a clean install.

---

### Phase 0 — Already Done (in frontend_legacy)

All critical bugs have been fixed. The legacy code has these corrections applied. Reference `frontend_legacy/` to see the fixed patterns when rebuilding.

---

### Phase 1 — Foundation: Design Tokens + shadcn/ui (~half day)

#### 1A — New Next.js App

```bash
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir
```

#### 1B — Install shadcn/ui

```bash
cd frontend
npx shadcn@latest init
# Style: New York, CSS variables ON, no CSS reset, src/components/ui
```

Map our CSS variables to shadcn's expected names:

```css
--background: var(--color-bg);
--card: var(--color-surface);
--border: var(--color-border);
--input: var(--color-control);
--primary: var(--color-brand);
--primary-foreground: #000000;
--muted: var(--color-elevated);
--muted-foreground: var(--color-text-muted);
```

Install components:

```bash
npx shadcn@latest add button input select badge progress tooltip
npx shadcn@latest add dialog drawer alert-dialog sheet
npx shadcn@latest add command popover
npx shadcn@latest add tabs separator scroll-area
```

#### 1C — Copy over

- Tailwind config (with color tokens)
- globals.css (with CSS variables)
- All types from `frontend_legacy/src/types/`
- All hooks from `frontend_legacy/src/hooks/`
- `lib/api.ts`, `lib/constants.ts`, `lib/utils.ts`
- Auth setup (AuthProvider, middleware, layout — see Part 5 for auth strategy)

**Verify:** `npm run build` passes on the empty shell.

---

### Phase 2 — Shared Layout Shell + Bottom Navigation (~half day)

#### 2A — PageShell Component

New `components/layout/PageShell.tsx`:

```tsx
interface PageShellProps {
  title?: string
  backHref?: string       // shows ChevronLeft if set
  isRootPage?: boolean    // no back arrow (for bottom nav tabs)
  headerRight?: ReactNode
  children: ReactNode
}
```

- `min-h-[100dvh] bg-[var(--color-bg)]`
- `max-w-2xl mx-auto px-4 pt-6 pb-[max(96px,calc(96px+env(safe-area-inset-bottom)))]`
- On `md:` breakpoint: `pb-6` (no bottom nav)
- Header: `h-14 flex items-center gap-3`

#### 2B — BottomNav Component

New `components/layout/BottomNav.tsx` — see 2.9 spec above.
Rendered in `app/layout.tsx`. Hidden on `/onboarding` and `/sign-in`. Uses `usePathname()` for active tab.

#### 2C — Dashboard Header Redesign

**Mobile (< md):** No action bar. Bottom nav handles navigation. Header shows greeting + date only.

**Desktop (≥ md):**

```
Avatar | Name + date | [spacer] | + Log Food | Workout | Settings icon
```

Inline weight logging is **removed from dashboard**. Users log weight from the Profile page.

---

### Phase 3 — Modal → Responsive Dialog/Drawer (~half day)

#### 3A — Replace Modal

New `components/ui/Modal.tsx` (same external API: `open`, `onClose`, `title`, `children`):

- On `md:` and above → shadcn `Dialog` (centered)
- Below `md:` → shadcn `Drawer` (Vaul bottom sheet, slides up)
- Drawer handle: `4px × 40px rounded-full bg-[#333] mx-auto mt-3`
- Panel background: `bg-[#1A1A1A]` (Level 2 elevated)
- `rounded-t-3xl`, max-height `90dvh`

#### 3B — AlertDialog replaces confirm()

Dishes delete → shadcn `AlertDialog` (Title: "Delete dish?" / Body: "This cannot be undone." / Cancel + Delete buttons)

#### 3C — Responsive grid fixes

- Nutrition preview in AddFoodModal: `grid-cols-2 sm:grid-cols-4`
- AddWorkoutModal strength fields: `grid-cols-1 sm:grid-cols-3`
- DateNavigator disabled days: `opacity-30 pointer-events-none`
- FoodSearchBar: add `touchstart` event alongside `mousedown` for iOS

---

### Phase 4 — Command Search (~half day)

#### 4A — SearchCommand Generic Component

`components/ui/SearchCommand.tsx` — wraps shadcn `Command` inside a `Popover`:

```tsx
interface SearchCommandProps<T> {
  placeholder: string
  onSearch: (q: string) => Promise<T[]>
  renderItem: (item: T) => { id: string|number; primary: string; secondary?: string; badge?: string }
  onSelect: (item: T) => void
  emptyText?: string
}
```

- Debounce 300ms
- `↑↓` navigate, `Enter` select, `Escape` close
- `role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`
- Opens above keyboard on mobile (`sideOffset` + `avoidCollisions`)

#### 4B — FoodSearchBar → SearchCommand

Result rendering: name, category·cuisine, MY DISH badge for custom, veg dot, kcal/100g

#### 4C — ExerciseSearchBar → SearchCommand

Result rendering: name, muscle·equipment, category pill (colored), MET value

---

### Phase 5 — Page Rebuilds (~2-3 sessions)

Run `qa/page_audit.py /{page}` after each page to verify P0 ≥ 8.0 before moving on.

#### 5A — Dashboard

**Section layout (mobile, top to bottom):**

1. Greeting + date (large, no banner box)
2. Hero card: 2-column grid
   - Left (60%): Calorie ring (140px diameter), big kcal number, "remaining" label
   - Right (40%): Streak (🔥 N days, font-black text-2xl), BMI badge
3. "TODAY'S MACROS" section header, 3 macro progress bars (colored)
4. Water intake panel (existing works well, keep structure)
5. Weight progress chart (existing works well)

#### 5B — Tracker

1. Date navigator (existing DateNavigator component)
2. Food search (SearchCommand)
3. Nutrition totals: big remaining kcal, macro bars
4. Meal tabs (Breakfast | Lunch | Dinner | Snacks) using shadcn Tabs
   - Each tab label shows kcal when non-zero: `Lunch · 380`
   - Entries per tab with delete buttons
   - Empty state per tab
5. Quick Add grid (6 popular Indian meals) — below tabs

#### 5C — Workout

1. Date navigator
2. Exercise search (SearchCommand)
3. Workout summary card (when entries exist): total burned, total volume
4. Workout log grouped by exercise name
5. Calories burned banner (orange, shown when > 0)

#### 5D — Dishes

1. Info banner ("dishes appear in food search")
2. Dish list with DishCard (name, badge, macros, edit/delete)
3. Client-side search filter
4. DishBuilder (create/edit form):
   - Dish name
   - Diet type toggle (Veg / Non-Veg / Vegan)
   - Ingredient search (SearchCommand, no custom dishes as ingredients)
   - Smart unit detection (ml for liquids, qty for eggs/bread/fruit, g for rest)
   - Ingredient list with inline quantity edit
   - Live DishNutritionPreview (total not per-100g)
5. Empty state with CTA

#### 5E — Profile

1. Identity card (initial avatar, name, age/gender/height)
2. Stats grid (BMI, TDEE, target kcal, protein/carbs/fat targets)
3. Update Goals form (weight, goal weight, timeline, activity, diet)
4. Account section: Re-do Onboarding link, Sign Out button
5. Dev mode notice (only in development)

#### 5F — Onboarding (4-step wizard, standalone layout — no PageShell)

1. Step 1: name, age, gender (3-button toggle), height
2. Step 2: current weight, goal weight, timeline (with live delta badge)
3. Step 3: experience level (3-card toggle), activity level
4. Step 4: diet type (3-card toggle), wants_workout_split flag, wants_diet_plan flag
5. Step indicator with labels
6. Validate → Submit → redirect `/dashboard`

#### 5G — Admin Pages (low priority, rebuild last)

- `/admin` — stats dashboard (total users, total foods)
- `/admin/users` — read-only user list
- `/admin/food` — full CRUD food catalog

---

### Phase 6 — wger Images + Workout UX (~1 session)

#### 6A — Backend: image_url column

New Alembic migration: `image_url VARCHAR(512)` nullable on `exercise_library`.
Re-fetch wger data to include `images[0].image` (first `is_main=true` entry).

#### 6B — Workout UX improvements

- Rename "Duration (min)" → "Session time (min)" with helper: "Total time including rest"
- Add intensity toggle for strength exercises: Light (MET 3.0) | Moderate (3.5) | Vigorous (6.0)
- Separate volume display from calories: show `3 × 10 @ 60kg` as distinct line

#### 6C — Exercise images in UI

- SearchCommand results: 36×36 thumbnail (lazy, fallback to category icon)
- AddWorkoutModal header: 64×64 image
- WorkoutLog entry row: 32×32 thumbnail
- Footer attribution: "Exercise images © wger.de (CC-BY-SA 4.0)"

---

### Phase 7 — Polish (~1 session)

- Swipe gestures: DateNavigator (swipe = change day), food log entries (swipe = delete)
- ARIA pass: all icon-only buttons get `aria-label`
- Micro-animations: page entry (y: 8→0, opacity 0→1, 200ms), progress bars (300ms ease-out)
- TypeScript strict pass: resolve all `any` types
- Lighthouse: target Accessibility ≥ 90 on all pages

---

## Part 4 — Feature Inventory (Complete Reference)

> This is the definitive list of every user-facing feature that must exist in the rebuilt frontend.
> Reference `frontend_legacy/` for implementation details when rebuilding.

### Authentication & Routing

| Feature             | Description                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Clerk sign-in       | Clerk-hosted sign-in page at`/sign-in`                                                  |
| Clerk sign-up       | Clerk-hosted sign-up page at`/sign-up`                                                  |
| Smart root redirect | `/` checks `/api/v1/me` → redirects to `/admin` (admins) or `/dashboard` (users) |
| Auth middleware     | All routes except`/sign-in`, `/sign-up` require Clerk session                         |
| Dev mode bypass     | `NEXT_PUBLIC_DEV_MODE=true` bypasses Clerk, uses dummy token                            |
| Sign out            | Clerk signOut (production) or redirect to /sign-in (dev)                                  |

### Onboarding (4-step wizard)

| Feature              | Description                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| Step 1: Personal     | Name, age (10–120), height (cm), gender (3-button toggle: M/F/Other)                  |
| Step 2: Weight goals | Current weight, goal weight, timeline weeks (min 4), live goal delta badge             |
| Step 3: Fitness      | Experience level (3-card toggle), activity level (dropdown)                            |
| Step 4: Diet         | Diet type (3-card: Veg/Egg/NonVeg), wants_workout_split toggle, wants_diet_plan toggle |
| Per-step validation  | Each step validates before advancing                                                   |
| Submit → profile    | POST to onboarding endpoint, server computes BMR/TDEE/macros, redirect to dashboard    |
| Step indicator       | Visual progress strip with labels                                                      |

### Dashboard

| Feature               | Description                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Greeting              | Time-aware ("Good morning/afternoon/evening") + user name + today's date                                                         |
| Calorie ring          | SVG donut ring: net calories (consumed - burned) vs target, big center number, remaining label, glow effect, turns red when over |
| Streak counter        | Consecutive logging days with flame icon, motivational text                                                                      |
| BMI display           | BMI value with color-coded category badge (Underweight/Healthy/Overweight/Obese)                                                 |
| Macro progress bars   | Protein (blue) / Carbs (amber) / Fat (orange) consumed vs target                                                                 |
| Milestone card        | Next weight milestone with target, estimated date, weeks away                                                                    |
| Water intake panel    | Circular SVG ring + bar, 4 preset buttons (150/250/500/750ml), custom ml input, entry list, delete per entry                     |
| Weight progress chart | Recharts line chart of weight over time with goal reference line                                                                 |
| Quick weight log      | Inline weight input on desktop dashboard                                                                                         |
| Navigation actions    | Links to Tracker, Workout, Dishes, Profile                                                                                       |

### Food Tracker

| Feature          | Description                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| Date navigation  | Prev/next day arrows, calendar popover (month view, future dates disabled), jump-to-today button             |
| Food search      | Debounced search (300ms) with dropdown results: name, category, veg dot, kcal/100g; MY DISH badge for custom |
| Add food modal   | Meal type selector, gram quantity input, live nutrition preview (scaled), confirm → log                     |
| Nutrition totals | Big remaining kcal, macro bars (P/C/F), calorie progress bar                                                 |
| Meal sections    | Breakfast / Lunch / Dinner / Snacks tabs — entries per meal with kcal subtotal in tab label                 |
| Quick Add grid   | 6 popular Indian meals with kcal labels for fast logging                                                     |
| Food log entries | Name, quantity, kcal, macros, delete button                                                                  |
| Diet filter      | Search respects user's diet_type (veg sees only veg items)                                                   |

### Workout Logger

| Feature                | Description                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Date navigation        | Same DateNavigator as tracker                                                                                   |
| Exercise search        | Debounced search with dropdown: name, muscle group, equipment, category pill (colored), MET value               |
| Add workout modal      | Sets/reps/weight fields (strength), session time field, live calorie burn preview (MET formula), confirm → log |
| Workout log            | Grouped by exercise: sets as mini-table, weight, volume, calories burned per entry                              |
| Calories burned banner | Orange banner showing total burned when > 0                                                                     |
| Exercise intensity     | Light/Moderate/Vigorous toggle (strength only) → adjusts MET value for calorie calc                            |

### Custom Dishes

| Feature            | Description                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Dish list          | Cards showing name, veg badge, ingredient count, weight, kcal, P/C/F macros (hover-reveal full labels)                                   |
| Client-side search | Filter dishes by name locally                                                                                                            |
| Info banner        | "Custom dishes appear in food search" explanation                                                                                        |
| Create dish        | Name input, diet type toggle, ingredient search, quantity with smart units (ml/qty/g), live nutrition preview (TOTAL not per-100g), save |
| Smart units        | ml for beverages/milk; qty (with per-unit gram weight) for eggs/chapati/idli/fruits; g for everything else                               |
| Edit dish          | Pre-fill form with existing dish data                                                                                                    |
| Delete dish        | AlertDialog confirmation                                                                                                                 |
| Nutrition preview  | Total kcal, macro bars (% of calories), kcal per 100g reference                                                                          |

### Profile

| Feature           | Description                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| Identity card     | Initials avatar, name, age, gender, height                              |
| Stats panel       | BMI, TDEE, target calories (highlighted), protein/carbs/fat targets     |
| Update goals form | Weight, goal weight, timeline, activity level, diet type → PUT profile |
| Re-do onboarding  | Link to /onboarding to change name/age/height/experience                |
| Sign out          | Clerks signOut or dev redirect                                          |

### Admin (low priority)

| Feature     | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| Admin stats | Total users + total food items counts                         |
| User list   | Read-only list of all user profiles                           |
| Food CRUD   | Search, create, edit, delete food items in the shared catalog |

---

## Part 5 — Authentication Strategy

### Overview

FitCoach AI uses **Clerk** for authentication. The strategy has two modes:

| Mode            | Clerk Active?        | When to Use                   |
| --------------- | -------------------- | ----------------------------- |
| Production      | ✅ Full Clerk        | Real users, deployed app      |
| Dev (Clerk ON)  | ✅ Real Clerk + flag | Testing with actual auth flow |
| Dev (Clerk OFF) | ❌ Bypassed          | Local dev, CI, screenshots    |

### Production Mode

Clerk is fully active. All routes except `/sign-in` and `/sign-up` require a valid Clerk session JWT. The `Authorization: Bearer <clerk-jwt>` header is injected by `AuthProvider` into every API call.

### Dev Mode (Clerk Bypassed)

Controlled by a single flag: `NEXT_PUBLIC_DEV_MODE=true` in `frontend/.env.local`.

When this flag is true:

1. `middleware.ts` — skips `auth.protect()`, returns `NextResponse.next()` immediately
2. `layout.tsx` — skips wrapping with `<ClerkProvider>`
3. `AuthProvider.tsx` — skips calling `useAuth()` / `setApiTokenGetter`
4. `lib/api.ts` — request interceptor sends `Authorization: Bearer dev-token` (a dummy, non-empty token)

The backend (`backend/.env`) must have `DEV_MODE=true` for this to work. When `DEV_MODE=true` is set on the backend, the JWT verification is bypassed and all requests are treated as the `DEV_USER_ID` user.

**Dev users (already seeded by Alembic migration `b9c8d7e6f5a4_seed_dev_user.py`):**

| User ID          | Name     | Role        | Profile                                                           |
| ---------------- | -------- | ----------- | ----------------------------------------------------------------- |
| `dev-user-001` | Dev User | Normal user | 28yo, 78kg → 72kg goal, veg, moderate activity, 2352 kcal target |

**Admin dev user:**
Admin access is controlled by `ADMIN_USER_IDS` env var in `backend/.env`. Set `ADMIN_USER_IDS=dev-user-001` to give the dev user admin privileges. A second technical user `dev-admin-001` can be seeded as a dedicated admin dev user if needed (add to the seed migration).

### Enabling/Disabling Clerk in Dev

```bash
# Disable Clerk (pure dev mode, no auth overhead)
# In frontend/.env.local:
NEXT_PUBLIC_DEV_MODE=true
# In backend/.env:
DEV_MODE=true

# Enable Clerk (test the full auth flow locally)
# In frontend/.env.local:
NEXT_PUBLIC_DEV_MODE=false
# In backend/.env:
DEV_MODE=false
# Also set CLERK_JWKS_URL and CLERK_SECRET_KEY
```

### Adding a Dev Admin User

To add a dedicated admin dev user (separate from the normal dev user), add to the seed migration `b9c8d7e6f5a4_seed_dev_user.py`:

```python
DEV_ADMIN_ID = "dev-admin-001"
# Insert into users + user_profiles with admin-appropriate profile
# Then in backend/.env: ADMIN_USER_IDS=dev-user-001,dev-admin-001
```

---

## Part 6 — QA / Testing Framework

All testing is handled by one script: **`qa/page_audit.py`**

### Usage

```bash
# From project root — evaluate one page at a time
python3 qa/page_audit.py /dashboard
python3 qa/page_audit.py /tracker
python3 qa/page_audit.py /tracker --state search   # with search open
python3 qa/page_audit.py /dishes --state create     # create form open
python3 qa/page_audit.py /workout --state exercise-search

# Screenshots only (no API cost, ~25s)
python3 qa/page_audit.py /dashboard --capture-only
```

### Viewports Tested

| ID             | Device      | Size      | Priority                       |
| -------------- | ----------- | --------- | ------------------------------ |
| `iphone-se`  | iPhone SE   | 375×667  | **P0 — must score ≥8** |
| `iphone-14`  | iPhone 14   | 390×844  | **P0 — must score ≥8** |
| `pixel-7`    | Pixel 7     | 412×915  | P1                             |
| `ipad`       | iPad        | 768×1024 | P1                             |
| `macbook-13` | MacBook 13" | 1280×800 | **P0 — must score ≥8** |

### Output

```
qa/
  page_audit.py              ← the script
  results/                   ← JSON + MD reports (commit after each phase)
    dashboard-{ts}.json
    dashboard-{ts}.md
    history.json
  screenshots/               ← PNGs (gitignored)
    dashboard-{ts}/
      iphone-se.png
      iphone-14.png
      ...
```

### The Loop

```
Build page → python3 qa/page_audit.py /{page} → read issues → fix → repeat until P0 ≥ 8.0
```

### Timing

~25s for screenshots, ~50s for full evaluation. Run one page at a time.

---

## Part 7 — Score Targets

| After Phase                  | Target                                    |
| ---------------------------- | ----------------------------------------- |
| Phase 2 (bottom nav + shell) | P0 ≥ 7.5 overall                         |
| Phase 5 (all pages rebuilt)  | P0 ≥ 8.5 on all pages                    |
| Phase 7 (final polish)       | P0 ≥ 9.0, Lighthouse Accessibility ≥ 90 |

---

## Part 8 — What NOT to Do

| Temptation                       | Why Not                                            |
| -------------------------------- | -------------------------------------------------- |
| Upgrade Tailwind to v4           | Breaking change — plan separately after refactor  |
| Add Framer Motion before Phase 7 | Bundle weight before design is stable              |
| Use shadcn`card` component     | Our Card.tsx is fine once tokens are set           |
| Build custom Calendar            | DateNavigator is already good — polish only       |
| Switch from Recharts             | Charts work correctly — not worth disruption      |
| Add light mode                   | Dark-only for now — separate sprint               |
| Patch legacy code                | Full rebuild only — legacy is read-only reference |

---

## Part 9 — File Structure (New Frontend)

```
frontend/
  src/
    app/
      layout.tsx              ← ClerkProvider (prod) or skip (dev), BottomNav, AuthProvider
      page.tsx                ← Smart redirect (me → admin/dashboard)
      dashboard/page.tsx
      tracker/page.tsx
      workout/page.tsx
      dishes/page.tsx
      profile/page.tsx
      onboarding/page.tsx
      admin/
        page.tsx
        users/page.tsx
        food/page.tsx
      sign-in/[[...sign-in]]/page.tsx
      sign-up/[[...sign-up]]/page.tsx
      globals.css             ← CSS variables + tailwind directives
    components/
      layout/
        PageShell.tsx         ← shared page container + header
        BottomNav.tsx         ← mobile bottom tab bar
      ui/                     ← shadcn components + custom overrides
        button.tsx, input.tsx, select.tsx, badge.tsx, progress.tsx
        dialog.tsx, drawer.tsx, alert-dialog.tsx, sheet.tsx
        command.tsx, popover.tsx
        tabs.tsx, separator.tsx, scroll-area.tsx
        tooltip.tsx, spinner.tsx, form-field.tsx, card.tsx, modal.tsx
        SearchCommand.tsx     ← generic search using Command + Popover
      dashboard/
        CalorieRing.tsx, MacroBar.tsx, MacroBarsGroup.tsx
        WaterIntakePanel.tsx, WeightProgressChart.tsx
        StreakCounter.tsx, MilestoneCard.tsx, DailySummaryBanner.tsx
      tracker/
        DateNavigator.tsx, FoodSearchBar.tsx, AddFoodModal.tsx
        FoodLog.tsx, FoodLogEntry.tsx, NutritionTotals.tsx
      workout/
        ExerciseSearchBar.tsx, AddWorkoutModal.tsx, WorkoutLog.tsx
      dishes/
        DishBuilder.tsx, DishNutritionPreview.tsx
      onboarding/
        OnboardingWizard.tsx, Step1Personal.tsx, Step2Weight.tsx
        Step3Fitness.tsx, Step4Diet.tsx, StepIndicator.tsx
      AuthProvider.tsx
    hooks/
      useDashboard.ts, useFoodLog.ts, useFoodSearch.ts
      useWorkoutLog.ts, useWaterLog.ts, useWeightLog.ts
      useProfile.ts, useCustomDishes.ts
    types/
      nutrition.ts, workout.ts, dish.ts, dashboard.ts, profile.ts
    lib/
      api.ts, constants.ts, utils.ts
    middleware.ts
```
