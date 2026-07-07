# FitCoach AI — Frontend Architecture

> Current as of 2026-07-07.

---

## Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js (App Router) | 16.2.10 | Framework, SSR, routing |
| React | 19.2.4 | UI |
| TypeScript | ^5 | Type safety (`"strict": true`) |
| Tailwind CSS | ^4 | Styling (CSS-first, `@import "tailwindcss"`) |
| shadcn | 4.13.0 | Component library — uses `@base-ui/react` NOT Radix UI |
| @base-ui/react | ^1.6.0 | Headless primitives (Select, Tabs, AlertDialog) |
| Motion for React | ^12.42.2 | Animations (`motion/react`) |
| Zustand | ^5.0.14 | Global UI state (selected date only) |
| SWR | ^2.4.2 | Server state / data fetching |
| Axios | ^1.18.1 | HTTP client |
| Recharts | ^3.9.2 | Charts (weight trend, workout volume) |
| Sonner | ^2.0.7 | Toast notifications |
| Lucide React | ^1.23.0 | Icons |
| Clerk (`@clerk/nextjs`) | ^7.5.12 | Authentication |

---

## Project Layout

```
frontend/src/
├── app/                       # Next.js App Router pages
│   ├── layout.tsx             # Root layout — ClerkProvider, MotionConfig, fonts
│   ├── page.tsx               # Root redirect (→ /dashboard or /onboarding)
│   ├── dashboard/page.tsx
│   ├── tracker/page.tsx
│   ├── workout/page.tsx
│   ├── dishes/page.tsx
│   ├── progress/page.tsx
│   ├── profile/page.tsx
│   ├── onboarding/            # Wizard + 4 step components + StepIndicator
│   └── admin/                 # /admin, /admin/users, /admin/food
├── components/
│   ├── layout/                # PageShell, TopNav, BottomNav
│   ├── ui/                    # Shared primitives (Card, DeleteConfirmDialog, etc.)
│   ├── dashboard/             # CalorieHeroCard, WeightChart, WaterIntakeCard, etc.
│   ├── tracker/               # MealTabs, FoodLogEntry, DateNavigator, etc.
│   ├── workout/               # WorkoutLogCard, AddWorkoutModal, ExerciseImage, MuscleMap
│   ├── dishes/                # DishCard, DishBuilder, DishNutritionPreview, etc.
│   ├── progress/              # ProgressStatCard, WorkoutVolumeChart, ConsistencyStrip, TopExercisesList
│   ├── profile/               # IdentityCard, StatsGrid, MacrosCard, UpdateGoalsForm, etc.
│   ├── onboarding/            # Step1Personal…Step4Diet, StepIndicator
│   ├── admin/                 # AdminSubNav, UserRow, FoodRow, FoodForm, etc.
│   └── AuthProvider.tsx       # Wires Clerk token into Axios interceptor
├── hooks/                     # SWR data hooks (one per domain)
├── lib/                       # Pure utilities and constants
├── types/                     # TypeScript interfaces
└── store/                     # Zustand stores
    └── useTrackerStore.ts     # selectedDate — shared between Tracker and Workout pages
```

---

## Design System

### Colour Palette (dark-only)

| Token | Value | Usage |
|---|---|---|
| Background (deepest) | `#0A0A0A` | Page background, TopNav bg |
| Surface L1 | `#111111` | Cards |
| Surface L2 | `#1A1A1A` | Inputs, hover states |
| Surface L3 | `#222222` | Active/selected states |
| Border | `#2A2A2A` | All card + input borders |
| Primary | `#22c55e` (green-500) | CTAs, active states, charts |
| Muted text | `text-muted-foreground` | Secondary labels (≥`/80` on `text-[10px]` for WCAG AA) |

### Responsive Strategy (AG-1)

Two tiers only. No intermediate tablet breakpoint.

- **Mobile** (< 1024px): `w-full px-4 pb-24` — full width, BottomNav clears
- **Desktop** (≥ 1024px): `max-w-6xl mx-auto px-8 pb-8` — centred 1152px column

`PageShell` wraps every page and applies this automatically. The TopNav inner container uses the exact same `max-w-6xl mx-auto px-8` so nav links align with page content.

### Typography

- Font: Inter (variable) via `next/font/google`
- Small labels: `text-[10px]` — minimum opacity `/80` for WCAG AA contrast
- Section labels: `text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground`
- Primary values: `text-2xl font-black tabular-nums` (stat tiles) or `text-lg` (compact tiles)

---

## Layout Components

### `PageShell`

Applies the two-tier responsive width. Renders a mobile-only header (`h-14`) with optional back arrow and title. Desktop header is handled by `TopNav`. The outer wrapper uses `<main>` for landmark accessibility.

### `TopNav` (desktop, ≥ 1024px)

Sticky `h-14` with `backdrop-blur-md`. Contains:
- Left: FitCoach logo + wordmark
- Centre: text-only nav links (Home, Tracker, Workout, Dishes, Progress) + conditional Admin link (orange, `ShieldAlert` icon) shown only when `isAdmin`
- Right: avatar circle → `/profile`

### `BottomNav` (mobile, < 1024px)

Fixed bottom bar, 6 tabs: Home, Tracker, Workout, Dishes, Progress, Profile. Each tab: icon + label, green active state. Hidden on `/onboarding`, `/sign-in`, `/sign-up`.

---

## Authentication

Controlled by `NEXT_PUBLIC_DEV_MODE` in `frontend/.env.local`.

- **Dev mode** (`true`): Clerk skipped. `AuthProvider` sends `Authorization: Bearer dev-token`. Backend accepts any token.
- **Production** (`false`): `ClerkProvider` wraps the app. `AuthProvider` calls `useAuth().getToken()` and injects the real JWT via Axios interceptor.

`middleware.ts` protects all routes except `/sign-in` and `/sign-up`.

---

## State Management

| State | Where | Why |
|---|---|---|
| Server data (food log, workout, profile, etc.) | SWR hooks | Remote data, needs cache invalidation |
| `selectedDate` (Tracker + Workout date nav) | Zustand `useTrackerStore` | Shared between two pages |
| UI state (modal open, form values, search query) | `useState` in component | Local, no sharing needed |

**Cross-hook invalidation:** Any hook that mutates data the Dashboard reads (food, water, workout, weight) must call `globalMutate("/api/v1/dashboard")` after the API call to keep the calorie ring and streak current.

---

## Animation

`MotionConfig reducedMotion="user"` wraps the entire app in `layout.tsx` — respects `prefers-reduced-motion: reduce` OS setting with zero per-component work.

Shared variants in `src/lib/motionVariants.ts`:

```ts
STAGGER_CONTAINER: { hidden: {}, show: { transition: { staggerChildren: 0.03 } } }
STAGGER_ITEM:      { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }
```

Used on: Dashboard, Tracker meal entries, Workout log cards, Profile sections, Dishes list, Progress stat cards.

---

## Hooks Reference

| Hook | Endpoint | Returns |
|---|---|---|
| `useDashboard` | `GET /dashboard` | Full snapshot, auto-refreshes every 30s |
| `useFoodLog(date)` | `GET /food/log?log_date=` | Daily food log + `addEntry`, `deleteEntry` |
| `useFoodSearch` | `GET /food/search?q=` | Search function |
| `useProfile` | `GET /profile` | User profile + `mutate` |
| `useWaterLog(date)` | `GET /water/log?log_date=` | Daily water + `addWater`, `removeWater` |
| `useWeightLog(days)` | `GET /weight/log?days=` | Weight history + `logWeight` |
| `useWorkoutLog(date)` | `GET /workout/log?date=` | Daily workout + `addEntry`, `updateEntry`, `deleteEntry` |
| `useCustomDishes` | `GET /dishes` | Dish list + `createDish`, `updateDish`, `deleteDish` |
| `useWeightHistory(days)` | `GET /weight/log?days=` | Full `WeightHistoryRead` for `/progress` |
| `useWorkoutHistory(days)` | `GET /workout/history?days=` | Flat workout log for `/progress` |
| `useAdminCheck` | `GET /admin/stats` | `{isAdmin, stats}` — redirects to `/dashboard` on 403 |
| `useAdminUsers` | `GET /admin/users` | User list + detail |
| `useAdminFood(search)` | `GET /admin/food?search=` | Food list + `createFood`, `updateFood`, `deleteFood` |

---

## Utilities (`src/lib/`)

| File | Purpose |
|---|---|
| `api.ts` | Axios instance with Clerk token interceptor |
| `constants.ts` | `API_BASE`, `DEV_USER_ID` |
| `utils.ts` | `cn()` (clsx + tailwind-merge) |
| `dashboardUtils.ts` | `computeWeeklyTrend`, `computePaceVsGoal`, `getBmiCategory`, calorie scoring |
| `workoutUtils.ts` | `getCategoryStyle`, `groupEntriesByExercise`, `calcVolume`, `stripIntensityPrefix` |
| `dishUtils.ts` | `getUnitOptions`, `defaultOption`, `computeDishNutrition` — unit system for dish builder |
| `profileUtils.ts` | `previewTargetCalories`, `getBmiCategory`, label maps (`ACTIVITY_LABELS`, `DIET_LABELS`, etc.) |
| `progressUtils.ts` | `weightEntriesToPoints`, `aggregateByDay`, `normalisedCategory`, `topExercises`, `buildWeekGrid`, etc. |
| `trackerUtils.ts` | Date formatting helpers for the tracker |
| `motionVariants.ts` | `STAGGER_CONTAINER`, `STAGGER_ITEM` shared Motion variants |

---

## Accessibility

Lighthouse accessibility score: **100/100 on all 5 main pages** (run 2026-07-07).

Key decisions:
- `PageShell` outer wrapper is `<main>` (landmark)
- All icon-only buttons have `aria-label`; icons inside buttons have `aria-hidden="true"`
- `MotionConfig reducedMotion="user"` at root
- `text-[10px]` elements use minimum `/80` opacity for WCAG 4.5:1 contrast
- BottomNav inactive labels use `#9CA3AF` (gray-400) — passes 4.5:1 on dark background

---

## shadcn / Base UI Notes

This project uses shadcn v4.13.0 which uses `@base-ui/react` as the primitive layer, **not Radix UI**.

Critical differences from Radix-based shadcn:
- `asChild` prop does **not** exist — use inline Tailwind classes on anchor/Link elements instead
- `Select.onValueChange` returns `string | null`, not `string` — always null-guard: `v => v && set(v)`
- `SelectValue` renders the raw stored value, not the option label — use `OPTION_ARRAY.find(o => o.value === form.field)?.label` inside `SelectTrigger` instead
- `Tabs.Tab` (Base UI) needs explicit `aria-label` when text is conditionally hidden (e.g. `hidden lg:block`)

---

## Dev Setup

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # starts on http://localhost:3001
```

Dev mode (no Clerk): set `NEXT_PUBLIC_DEV_MODE=true` in `.env.local` (and `DEV_MODE=true` on backend).
