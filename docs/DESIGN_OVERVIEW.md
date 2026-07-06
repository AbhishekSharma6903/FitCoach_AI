# FitCoach AI — Design Overview

> Written: 2026-07-05. Updated: 2026-07-05 (post architecture review).
> This document defines the visual and interaction design for each page **before any code is written**.
> It is the single source of truth for component choices, layout decisions, and animation behaviour.
> **Read `docs/ARCHITECTURE_REVIEW.md` before editing this file.**

---

## Global Design Decisions

### Navigation

| Viewport | Pattern |
|---|---|
| Mobile (< 1024px) | Fixed bottom tab bar — 5 tabs: Home / Tracker / Workout / Dishes / Profile |
| Desktop (≥ 1024px) | Sticky top navbar — logo left, nav links centre, avatar right |

**Top navbar spec (desktop) — UPDATED 2026-07-05:**
```
h-14 sticky top-0 z-50
bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#2A2A2A]

Inner: max-w-6xl mx-auto px-8 flex items-center justify-between h-full

Left:   App logo mark (28px rounded-lg) + "FitCoach" wordmark
Centre: Nav links — Home · Tracker · Workout · Dishes
        Active:   text-white font-medium + 2px green dot below link
        Inactive: text-muted-foreground hover:text-white
Right:  Avatar circle (32px, initials, links to /profile)
```

> **⚠️ "Log Food" button REMOVED from TopNav — 2026-07-05**
> See "Log Food CTA — Decision & Responsive Plan" section below.

---

### Log Food CTA — Decision & Responsive Plan

#### Problem

The original spec placed a green "+ Log Food" button in the top navbar. This caused three issues:

1. **Redundant on every page** — the "Tracker" nav link already navigates to the food logging page. Having both is clutter.
2. **Dead click when already on `/tracker`** — clicking it did nothing (just reloads the current page). Felt broken.
3. **Wrong context on non-tracking pages** — on `/workout`, `/dishes`, `/profile`, a user is there for a different purpose. Offering "Log Food" there is noise, not help.

#### Decision

**Remove the "+ Log Food" button from TopNav entirely.**

The nav becomes: `[F] FitCoach · Home · Tracker · Workout · Dishes · [Avatar]` — clean, symmetric, Bevel-style.

**Exception — Dashboard page only:**
The dashboard IS the landing page. A user arriving there may want to immediately log food without clicking the Tracker nav link. Here, a contextual CTA on the dashboard page itself (not in the global nav) makes sense.

#### Responsive Plan

| Viewport | Where the "Log Food" action lives |
|---|---|
| **Mobile** | Inside `/tracker` page: the prominent `+ Add food` green button per meal tab + Quick Add grid. BottomNav "Tracker" tab navigates there. |
| **Desktop — on `/dashboard`** | A ghost/secondary button in the **page header row** (greeting row), right side: `+ Log Food →` that links to `/tracker`. Not in the nav, in the page content. |
| **Desktop — on `/tracker`** | The `+ Add food` / `+ Add more` buttons within each meal tab. No global nav CTA needed — user is already here. |
| **Desktop — all other pages** | No food logging CTA. User is on a different task. The "Tracker" nav link is always available if needed. |

#### Dashboard page header CTA (desktop only)

```
Good morning, Dev 👋              Saturday, 5 July    [72% ◉]  [+ Log Food →]
```

```tsx
// Only on /dashboard, desktop only (lg:+), right side of greeting row
<Link
  href="/tracker"
  className="hidden lg:flex items-center gap-1.5 h-8 px-3 rounded-lg
             border border-[#2A2A2A] text-muted-foreground text-xs font-medium
             hover:border-[#3A3A3A] hover:text-foreground transition-colors"
>
  <Plus size={12} />
  Log Food
</Link>
```

**Why ghost/secondary style (not green pill):**
- The green primary CTA on this page is already the Calorie Ring + water preset buttons
- Having two green primary buttons on the same page violates the "one CTA per screen" rule (§2.3)
- A subtle ghost button communicates "shortcut" not "primary action"

#### QA impact

- `qa/playwright/tracker-states.js` and `page_audit.py` — no change needed
- TopNav screenshots will show cleaner nav without the button — this is correct

---

### Content Column — Responsive Width Strategy

This is the single most important layout rule. **Apply consistently on every page. Two tiers only — no intermediate tablet tier.**

```
Mobile  (< lg, < 1024px):   w-full px-4 pb-24
                             ↑ full width including tablets, px-4 padding, pb-24 clears bottom nav

Desktop (lg+, ≥ 1024px):    max-w-6xl mx-auto px-8 pb-8
                             ↑ 1152px centred column, tasteful breathing room on both sides
```

**Why only two tiers (not three):** A `max-w-3xl` intermediate tier at `md:` (768px) gives zero breathing room at that breakpoint (768px container = 768px viewport). It adds complexity with no benefit. Mobile full-width → desktop centred is the correct model (same as Bevel, Notion, Vercel).

**`max-w-6xl` = 1152px:**
- 1280px screen → 64px breathing room each side ✅
- 1440px screen → 144px each side ✅
- 1920px screen → 384px each side — background fills gracefully ✅

**Critical rule: navbar inner div and page content MUST use the same `max-w-6xl mx-auto px-8`** so nav links align with content edges exactly. Any mismatch makes the layout look broken.

**Do NOT use `max-w-2xl`, `max-w-3xl`, or `max-w-5xl` on desktop** — all recreate the "content too narrow" problem in different ways.

---

### Theme

Dark. `#0A0A0A` base. 4-level surface hierarchy. Full spec in `docs/UI_REFACTOR_PLAN_V2.md § Part 2`.

---

### Animation Library

**Chosen: Motion for React** (`motion` package — formerly Framer Motion)

```bash
cd frontend && npm install motion
```

**Use cases and correct patterns:**

```tsx
// ─── Number count-up (calorie total, water ml) ───────────────────────────────
import { useEffect, useRef } from "react"
import { animate } from "motion/react"

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctrl = animate(0, to, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => { el.textContent = Math.round(v).toString() },
    })
    return () => ctrl.stop()
  }, [to])
  return <span ref={ref}>0</span>
}

// ─── SVG donut ring draw-in ───────────────────────────────────────────────────
// Use strokeDashoffset directly — NOT pathLength (different SVG mechanism)
const circumference = 2 * Math.PI * radius  // radius=52 → circumference=326.7
<motion.circle
  initial={{ strokeDashoffset: circumference }}
  animate={{ strokeDashoffset: circumference * (1 - pct) }}
  transition={{ duration: 1.0, ease: "easeOut" }}
  strokeDasharray={circumference}
  strokeLinecap="round"
/>

// ─── Progress bar fill (macros, water) ───────────────────────────────────────
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${pct}%` }}
  transition={{ duration: 0.6, ease: "easeOut" }}
  className="h-2 rounded-full bg-blue-500"
/>

// ─── List item enter/exit (food log entries) ─────────────────────────────────
import { AnimatePresence, motion } from "motion/react"
<AnimatePresence>
  {items.map(item => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    />
  ))}
</AnimatePresence>

// ─── Card page-load stagger ───────────────────────────────────────────────────
// 30ms stagger (NOT 50ms — 7 cards × 50ms = 350ms feels sluggish)
const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } }
<motion.div variants={container} initial="hidden" animate="show">
  {cards.map(c => <motion.div key={c} variants={item} />)}
</motion.div>

// ─── Interactive press feedback ───────────────────────────────────────────────
<motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
```

---

### shadcn Components Available (Already Installed)

`button` · `input` · `textarea` · `select` · `badge` · `progress` · `tabs` · `dialog` · `drawer` · `sheet` · `alert-dialog` · `popover` · `command` · `scroll-area` · `separator` · `tooltip` · `Card.tsx` (custom) · `Modal.tsx` (custom responsive) · `SearchCommand.tsx` (custom) · `Spinner.tsx`

**Still needed — install before building:**
```bash
npx shadcn@latest add sonner skeleton avatar navigation-menu
```
- `sonner` — replaces custom useUIStore toasts
- `skeleton` — loading state placeholders
- `avatar` — user avatar primitive
- `navigation-menu` — top navbar nav links

---

---

## Page 1: Dashboard (`/dashboard`)

> Goal: communicate "how am I doing today" in under 3 seconds.
> Inspiration: Bevel Biological Age screen (large centred metric, flanking stats), Whoop Recovery screen (ring + contextual cards below).

---

### Layout — Mobile (< 1024px)

Single scrollable column. Bottom nav fixed at bottom. Applies to all phones AND tablets.

```
┌─────────────────────────────┐
│  Good morning, Dev 👋  [72%]│  ← greeting + Day Score badge right
│  Saturday, 5 July      [👤] │  ← avatar right on mobile, hidden on desktop
├─────────────────────────────┤
│   [  CALORIE HERO CARD  ]   │  ← ring centred, stats below in 2-col row
├─────────────────────────────┤
│ TODAY'S MACROS              │
│ [  Macro bars + % split ]   │
│ [  Protein per kg row   ]   │  ← new: g/kg density insight
├─────────────────────────────┤
│ TODAY'S STATS               │
│ [  Streak | BMI card    ]   │  ← motivational, drives return visits
├─────────────────────────────┤
│ NEXT MILESTONE              │
│ [  Milestone + bar      ]   │
├─────────────────────────────┤
│ HYDRATION                   │
│ [  Water intake card    ]   │
├─────────────────────────────┤
│ WEIGHT TREND                │
│ [  Chart + pace insight ]   │  ← reference data, least time-sensitive
└─────────────────────────────┘
```

---

### Layout — Desktop (≥ 1024px, 2-column at ≥ 1280px)

Top navbar sticky at top. Content in `max-w-6xl mx-auto px-8` column. Single column at 1024–1279px, 2-column at 1280px+.

```
┌─────────────────────────────────────────────────────────────────┐
│  [F] FitCoach    Home · Tracker · Workout · Dishes          [👤]│  ← sticky top nav (no Log Food button)
├─────────────────────────────────────────────────────────────────┤
│                     max-w-6xl mx-auto px-8                      │
│  Good morning, Dev 👋       Saturday, 5 July  [72% ◉] [Log→]  │  ← Day Score + ghost Log Food (desktop only)
├──────────────────────────────────┬──────────────────────────────┤
│                                  │  sticky top-20               │
│   Calorie Hero Card              │   Streak | BMI (border-r)    │
│   (flanking stats on desktop)    │   ─────────────────────────  │
│                                  │   Milestone + progress bar   │
├──────────────────────────────────┤   ─────────────────────────  │
│   Macro bars + % split           │   TDEE Deficit + fat change  │
│   + Protein per kg               │   ─────────────────────────  │
├──────────────────────────────────┤   Quick weight log           │
│   Water intake card              │                              │
├──────────────────────────────────┤                              │
│   Weight chart + pace insight    │                              │
└──────────────────────────────────┴──────────────────────────────┘
     ~724px left col (grows)              ~340px right col (sticky)
```

**Grid:** `grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6`
— Single column below `xl:` (1280px). 2-column at `xl:` and above.
— At 1280px: left col = 1152 - 340 - 24 (gap) = **788px** — genuinely spacious.
— At 1024px: full-width single column — calorie ring fills beautifully.

**Right column:** `sticky top-20 max-h-[calc(100vh-80px)] overflow-y-auto space-y-4`
- `top-20` = 80px (56px navbar + 24px gap)
- `max-h + overflow-y-auto` prevents sticky breaking when content overflows viewport

---

### Component Breakdown

---

#### 1. Greeting Row + Day Score Badge (F-4)

```tsx
// Mobile: greeting left, [Day Score badge + avatar] right
// Desktop: greeting left, [Day Score badge + date] right (avatar is in top navbar)
<div className="flex items-start justify-between pt-2 pb-4">
  <div>
    <h1 className="text-2xl font-bold text-white">{greeting}, {firstName} 👋</h1>
    <p className="text-sm text-muted-foreground mt-0.5">{formattedDate}</p>
  </div>
  <div className="flex items-center gap-3">
    {/* Day Score composite badge — shown once food is logged */}
    {dayScore !== null && (
      <DayScoreBadge score={dayScore} />
    )}
    <Avatar className="lg:hidden" />  {/* hidden on desktop — in navbar */}
  </div>
</div>
```

**Day Score formula** (F-4 — computed entirely from existing API data):
```ts
// Only render when calories_consumed > 0 (user has logged food today)
function computeDayScore(d: DashboardData): number | null {
  if (d.calories_consumed === 0) return null
  const calScore     = Math.min(d.calories_net / d.calories_target, 1)
  const waterScore   = d.water.pct_complete                              // 0-1
  const proteinScore = Math.min(
    d.macros_consumed.protein_g / d.macros_target.protein_g, 1
  )
  return Math.round(((calScore + waterScore + proteinScore) / 3) * 100)
}
```

**DayScoreBadge spec:**
```
24px mini ring (SVG) + score number inside
Colours: ≥70% green, 40-69% amber, <40% muted
Ring animates from 0 to score on load (strokeDashoffset)
Tooltip on hover: "Calories + Hydration + Protein"
```

---

#### 2. Calorie Hero Card

**The most premium element. Two responsive layouts — never let a small ring float in a wide empty card.**

**Mobile layout (< lg):**
Ring centred alone. Stats in a 2-column row below. Numbers use `text-3xl` to fit 375px.
```
┌────────────────────────────┐
│                            │
│      [SVG Ring 160px]      │  ← centred
│       1,847  kcal          │
│    🔥 -120 burned          │
│                            │
│   CONSUMED  │  REMAINING   │  ← 2-col row below ring
│    1,847    │    505        │
│    kcal     │    kcal       │
│                            │
│  [▓▓▓▓▓▓▓▓░░]  78%        │  ← progress bar full width
│  of 2,352 kcal goal        │
└────────────────────────────┘
```

**Desktop layout (≥ lg), using `grid-cols-[1fr_auto_1fr]`:**
Stats flank the ring. Numbers use `text-4xl`.
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  CONSUMED    [  SVG Ring 200px  ]     REMAINING     │
│  1,847            1,847               505            │
│  kcal             kcal                kcal           │
│              🔥 -120 burned                         │
│                                                      │
│  ────────────────────────────────────────────────   │
│  [▓▓▓▓▓▓▓▓▓▓▓▓░░░░]  78%                           │
│  of 2,352 kcal goal  ·  Net: 1,727 kcal             │
└──────────────────────────────────────────────────────┘
```

**JSX structure (responsive):**
```tsx
{/* Mobile: stacked */}
<div className="lg:hidden flex flex-col items-center gap-4">
  <CalorieRingSVG size={160} pct={pct} />
  <div className="grid grid-cols-2 w-full gap-2">
    <StatBlock label="Consumed" value={consumed} unit="kcal" size="3xl" />
    <StatBlock label={isOver ? "Over by" : "Remaining"}
               value={isOver ? over : remaining}
               unit="kcal" size="3xl"
               valueColor={isOver ? "text-red-400" : "text-primary"} />
  </div>
</div>

{/* Desktop: flanking */}
<div className="hidden lg:grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
  <StatBlock label="Consumed" value={consumed} unit="kcal" size="4xl" align="center" />
  <CalorieRingSVG size={200} pct={pct} />
  <StatBlock label={isOver ? "Over by" : "Remaining"}
             value={isOver ? over : remaining}
             unit="kcal" size="4xl" align="center"
             valueColor={isOver ? "text-red-400" : "text-primary"} />
</div>

{/* Progress bar — always full width below */}
<div className="mt-4 space-y-1">
  <Progress value={pct * 100} className="h-2" indicatorClassName={isOver ? "bg-red-500" : "bg-primary"} />
  <p className="text-xs text-muted-foreground text-center">
    of {target} kcal goal · Net: {net} kcal
  </p>
</div>
```

**Ring spec:**
- Mobile: 160px diameter. Desktop: 200px.
- SVG donut, `r=52`, track `stroke="#2A2A2A"` `strokeWidth=12`
- Glow layer: same colour arc, `strokeWidth=18`, opacity 20%
- Fill: `#22c55e` under goal / `#ef4444` over goal
- Centre: `text-5xl font-black` + `text-[10px] uppercase tracking-widest` unit
- If `calories_burned > 0`: `🔥 −{burned}` in orange below centre number
- **Animation:** `strokeDashoffset` circumference → target, `duration: 1.0, ease: "easeOut"`
- **Centre number:** `<CountUp to={consumed} />` — count up from 0

**Progress bar:** `h-2` (8px) — consistent with all other bars. ~~`h-1.5`~~ removed.

---

#### 3. Macro Bars Card

```
TODAY'S MACROS

Protein ●  ──────────░░░    127g / 176g  72%
Carbs   ●  ────────░░░░░    168g / 235g  71%
Fat     ●  ────────────░     64g / 78g   82%

─────────────────────────────────────────────
MACRO SPLIT (calorie %)
[═══Blue 32%═══|════Amber 50%════|═Orange 28%═]

─────────────────────────────────────────────
PROTEIN DENSITY                               ← F-1: new row, same card
  1.2 g/kg  [────────░░░░]  Target: ≥1.6 g/kg
```

**Each bar row:**
- `label + colour dot` left: `text-sm font-medium`
- `Xg / Yg` right: consumed = `font-semibold text-white`, target = `text-muted-foreground`
- `N%` far right: `text-xs text-muted-foreground` — completion rate at a glance
- Bar: shadcn `Progress`, height `h-2`, custom `indicatorClassName`
- **Animation:** width from 0 to % on mount, `duration: 0.6, ease: "easeOut"`

**Macro % split bar:**
```tsx
// protein_kcal = protein_g * 4, carbs_kcal = carbs_g * 4, fat_kcal = fat_g * 9
// totalMacroKcal = sum. Each % = macro_kcal / totalMacroKcal * 100
<div className="flex h-2 rounded-full overflow-hidden">
  <div style={{ width: `${proteinPct}%` }} className="bg-blue-500" />
  <div style={{ width: `${carbsPct}%` }} className="bg-amber-400" />
  <div style={{ width: `${fatPct}%` }} className="bg-orange-500" />
</div>
<div className="flex justify-between text-[10px] mt-1">
  <span className="text-blue-400">{proteinPct}% P</span>
  <span className="text-amber-400">{carbsPct}% C</span>
  <span className="text-orange-400">{fatPct}% F</span>
</div>
```

**Protein per kg (F-1) — zero backend change:**
```tsx
// Uses weight_entries[last].weight_kg or profile.current_weight_kg as fallback
const proteinPerKg = (macros_consumed.protein_g / currentWeightKg).toFixed(1)
const TARGET_PROTEIN_PER_KG = 1.6  // standard for active adults
const pct = Math.min(Number(proteinPerKg) / TARGET_PROTEIN_PER_KG, 1)

// Only show when calories_consumed > 0
<Separator className="my-3" />
<div className="space-y-1.5">
  <div className="flex items-center justify-between">
    <span className="text-xs text-muted-foreground uppercase tracking-widest">Protein Density</span>
    <span className="text-xs text-muted-foreground">Target: ≥{TARGET_PROTEIN_PER_KG} g/kg</span>
  </div>
  <div className="flex items-center gap-3">
    <span className="text-sm font-bold text-white tabular-nums">{proteinPerKg} g/kg</span>
    <Progress value={pct * 100} className="flex-1 h-2" indicatorClassName="bg-blue-500" />
  </div>
</div>
```
This transforms an abstract "127g protein" into "1.2g/kg — are you hitting the fitness-optimal range?"

---

#### 4. Streak + BMI Card (right column on desktop, below macros on mobile)

**Side-by-side layout — border-r divider (NOT `<Separator>` in grid — that creates a broken 3rd cell).**

```
┌─────────────────────────────────────┐
│  🔥          │           25.5       │
│   7          │           BMI        │
│  day streak  │    [Overweight]      │
│  "On fire!"  │                      │
└─────────────────────────────────────┘
```

```tsx
<Card padding="md">
  <div className="grid grid-cols-2">
    {/* Streak — border-r acts as the visual divider */}
    <div className="flex flex-col items-center gap-1 pr-4 border-r border-[#2A2A2A]">
      <Flame size={20} className="text-orange-400" />
      <span className="text-5xl font-black text-white tabular-nums">{streakDays}</span>
      <span className="text-xs text-muted-foreground">day streak</span>
      <span className="text-[10px] text-muted-foreground/60">{motivation}</span>
    </div>
    {/* BMI */}
    <div className="flex flex-col items-center gap-1 pl-4">
      <span className="text-4xl font-black text-white tabular-nums">{bmi.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">BMI</span>
      <Badge variant="outline" className={bmiColor}>{bmiLabel}</Badge>
    </div>
  </div>
</Card>
```

Badge colours: Underweight=`text-blue-400 border-blue-500/30`, Healthy=`text-green-400 border-green-500/30`, Overweight=`text-amber-400 border-amber-500/30`, Obese=`text-red-400 border-red-500/30`.

**Empty state:** `streakDays = 0` → show `"0"` with sub-label `"Log today to start 🔥"` in `text-muted-foreground`.

---

#### 5. Milestone Card (right column on desktop / below streak on mobile)

```
┌─ 3px green left border ──────────────────┐
│  🎯  Next milestone: 5% to goal          │
│      77.7 kg — est. 9 Jul 2026           │
│      0.8 weeks away                      │
│                                          │
│  [▓▓▓▓▓▓▓░░░░░░░░░░░░░] 42% to milestone│
└──────────────────────────────────────────┘
```

The progress bar shows `(current_weight - starting_weight) / (milestone_weight - starting_weight)`. Requires knowing starting weight — use `weight_entries[0]` from the 30-day window, or fall back to `profile.current_weight_kg`.

---

#### 6. TDEE vs Deficit Widget + Daily Fat Change (right column desktop, F-2)

Uses `tdee_kcal`, `calories_target`, `calories_net` — **zero backend change**.
Hide entirely when `tdee_kcal` is null.

```
DAILY SETUP              ← caption

  −352 kcal              ← green if deficit, amber if surplus
  deficit per day
  ≈ −46g fat change today  ← F-2: concrete, motivating

  Target: 2,000 kcal  ·  Maintenance: 2,352 kcal
```

```tsx
const delta    = d.calories_target - d.tdee_kcal   // negative = deficit
const isDeficit = delta < 0
// F-2: daily fat tissue change in grams (7700 kcal ≈ 1kg fat)
// Only show when food has been logged (calories_net > 0)
const fatChangeG = d.calories_net > 0
  ? Math.round((d.calories_net - d.tdee_kcal) / 7700 * 1000)
  : null
```

**Fat change display:**
- `fatChangeG < 0`: `"≈ −{abs}g fat change today"` in `text-green-400`
- `fatChangeG > 0`: `"≈ +{abs}g today"` in `text-amber-400`
- `fatChangeG = null`: hide the line (no food logged yet)

---

#### 7. Quick Weight Log (right column desktop only)

```
LOG WEIGHT    ← caption

[ 78.5 kg ]  [ Log ✓ ]
```

- shadcn `Input` (type=number, step=0.1) + `Button` inline
- On save: button turns green with checkmark for 2.5s, then resets
- Mobile: NOT shown on dashboard — users log weight from Profile page

---

#### 8. Water Intake Card

```
HYDRATION

[SVG ring 88px]   1,800 ml consumed
                  Daily goal: 2,700 ml
                  [──────────░░ progress bar: 67%]

[+150ml] [+250ml] [+500ml] [+750ml]  ← shadcn Button outline, small
[Custom ml input                ] [Add]
```

- Ring: 72px mobile / 88px desktop, blue fill (`#3b82f6`), animates on add
- `Progress` bar: h-2, blue fill
- Preset buttons: `variant="outline"` `size="sm"` `rounded-xl`, `whileTap={{ scale: 0.95 }}`
- Number count-up animation when total changes

---

#### 9. Weight Trend Chart + Trend Insight + Pace vs Goal (F-3)

```
WEIGHT TREND

▼ Trending: −0.4 kg/week · On track ✅     ← trend line text
AT CURRENT PACE: Goal in ~11 weeks          ← F-3: pace vs stated goal
Stated: 16 weeks · 5 weeks ahead 🎉        ← delta from stated goal

[  Recharts LineChart, height 180px  ]
   White data line + green data point dots
   Dashed green goal reference line
   shadcn ChartTooltip on hover
```

Hide trend text and pace insight when `weight_entries.length < 3`.

**Trend + pace computation (frontend only — zero backend change):**
```ts
function computeWeeklyTrend(entries: WeightPoint[]): number | null {
  if (entries.length < 3) return null
  const first = entries[0], last = entries[entries.length - 1]
  const weeks = (new Date(last.log_date).getTime() - new Date(first.log_date).getTime())
    / (7 * 24 * 60 * 60 * 1000)
  return weeks > 0 ? (last.weight_kg - first.weight_kg) / weeks : null
}

// F-3: pace vs goal
function computePaceVsGoal(entries: WeightPoint[], goalKg: number, statedWeeks: number) {
  const trend = computeWeeklyTrend(entries)
  if (!trend || trend >= 0) return null   // not losing weight — hide
  const currentKg = entries[entries.length - 1].weight_kg
  const kgToGoal = currentKg - goalKg
  const weeksAtPace = Math.abs(kgToGoal / trend)
  const deltaWeeks = Math.round(statedWeeks - weeksAtPace)
  return { weeksAtPace: Math.round(weeksAtPace), deltaWeeks }
  // deltaWeeks > 0 → ahead of schedule, < 0 → behind
}
```

**Trend text colours:**
- `< -0.1 kg/week`: `"▼ Trending: −X.X kg/week · On track ✅"` — `text-primary`
- `> +0.1 kg/week`: `"▲ Gaining: +X.X kg/week · Adjust intake ⚠️"` — `text-amber-400`
- `between`: `"→ Stable this week"` — `text-muted-foreground`

**Pace line** (shown below trend text, same muted size):
- Ahead: `"At current pace: goal in ~N weeks · {delta} weeks ahead 🎉"` — `text-primary/70`
- Behind: `"At current pace: goal in ~N weeks · {delta} weeks behind ⚠️"` — `text-amber-400/70`

**Empty state:** When `weight_entries.length === 0`: hide card entirely — don't render a blank chart.

---

### Loading States

Use shadcn `Skeleton` simultaneously across all cards (not individual spinners):

```tsx
{isLoading ? (
  <div className="space-y-6">
    <Skeleton className="h-48 w-full rounded-2xl" />   {/* calorie hero */}
    <Skeleton className="h-36 w-full rounded-2xl" />   {/* macros */}
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-24 rounded-2xl" />        {/* streak */}
      <Skeleton className="h-24 rounded-2xl" />        {/* water */}
    </div>
    <Skeleton className="h-44 w-full rounded-2xl" />   {/* chart */}
  </div>
) : (
  <motion.div variants={container} initial="hidden" animate="show">
    {/* actual cards */}
  </motion.div>
)}
```

---

### Animation Summary

| Element | Animation | Spec |
|---|---|---|
| Calorie ring arc | Draw from 0 | `strokeDashoffset`, `duration: 1.0, ease: "easeOut"` |
| Calorie number | Count up from 0 | `animate(0, to)` on ref, `duration: 1.2, ease: "easeOut"` |
| Macro bars | Fill from 0% | `motion.div width`, `duration: 0.6, ease: "easeOut"` |
| Water ring | Fill on add | `strokeDashoffset`, `duration: 0.5` |
| Water number | Count up on add | `animate(prev, next)`, `duration: 0.4` |
| Preset buttons | Press feedback | `whileTap={{ scale: 0.95 }}` |
| Card page-load | Stagger fade+up | `staggerChildren: 0.03`, `duration: 0.25` |
| Skeleton → content | Fade in | `initial opacity-0 → 1`, `duration: 0.3` |
| List items (add/remove) | Slide in/out | `AnimatePresence`, `y: 8`, `duration: 0.2` |

---

### What We Are NOT Doing on Dashboard

- No inline weight logging on mobile — weight log is desktop right column only
- No action bar with multiple CTA buttons — top navbar handles Log Food
- No animated background gradients
- No exact-shape skeleton matching — standard rectangle skeletons are sufficient
- No page-level loading spinner — skeleton cards only

---

### Backend Changes Needed for Future Widgets

| Widget | Change needed | Priority |
|---|---|---|
| Journey progress arc | Add `weeks_elapsed` to dashboard API response | Low |
| Today's food preview | Add `recent_food_entries` (last 3 today) to API | Medium |

All other new widgets (macro % split, TDEE deficit, trend insight) use **existing API data** — no backend changes needed.

---

## Page 2: Tracker (`/tracker`)

> Goal: log what you ate today in under 10 seconds. Date navigation for past logs.
> Inspiration: Bevel Nutrition screen (big goal number, compact macro row), MFP meal tabs — but cleaner, darker, less cluttered.
> UI must NOT copy the legacy tracker. Use shadcn Tabs for meal slots. Use Modal.tsx (updated to lg: breakpoint) for add-food.

> **Architecture review applied 2026-07-05 — see `docs/ARCHITECTURE_REVIEW_TRACKER.md` for full findings.**

---

### Data Available (from existing hooks — no backend changes needed)

| Source | Data |
|---|---|
| `useFoodLog(selectedDate)` | `DailyNutrition { entries[], totals, targets }` — entries include `fiber_g`, `meal_type` |
| `useFoodSearch(query, dietFilter)` | Food search results (debounced 300ms) |
| `useTrackerStore` | `selectedDate`, `goToPrevDay`, `goToNextDay`, `resetToToday`, `isToday()` |
| `useMealStore` | `pendingMealSlot` — pre-selects meal tab when Quick Add is tapped |
| `useProfile()` | `profile.diet_type` — used as `dietFilter` in food search |

**Computed frontend-only (zero backend change):**
- Calorie pace projection: `(totals.calories_kcal / hoursElapsed) × 24` → projected daily total
- Meal distribution %: calories per `meal_type` from `entries[]`
- Multi-meal badge: count distinct `meal_type` values in `entries[]`

---

### Pre-implementation Fix Required: Modal.tsx Breakpoint

> ⚠️ **Do this BEFORE building tracker components.**

`Modal.tsx` currently switches at `md:` (768px). Our nav switches at `lg:` (1024px). At 768–1023px (iPad portrait), the user is on BottomNav (mobile) but would get a desktop Dialog — inconsistent.

**Fix in `Modal.tsx`:**
```tsx
// Change:
const isDesktop = useMediaQuery("(min-width: 768px)")
// To:
const isDesktop = useMediaQuery("(min-width: 1024px)")
```

This aligns modal behaviour with nav breakpoints across the entire app. The add-food flow then uses `Modal.tsx` directly — no new `AddFoodSheet.tsx` needed.

---

### AG Checklist

- [x] AG-1: Two-tier width — `w-full px-4 pb-24` mobile, `lg:max-w-6xl lg:mx-auto lg:px-8` desktop
- [x] **AG-2 updated**: Tracker uses `xl:grid-cols-[1fr_300px]` on desktop — right panel holds Quick Add + utilities. AG-2 now permits right panels on Tracker/Workout at `xl:` where content naturally splits into "primary action | utility context". See AG-2 note below.
- [x] AG-3: Mobile card order — Date nav → Nutrition summary → Meal Tabs → Quick Add (below fold, accessed via scroll)
- [x] AG-4: Cards fill column width — Nutrition Summary spans full width with compact layout
- [x] AG-7: shadcn `Tabs` for meals, `Modal.tsx` (updated) for add-food, `Button`/`Input`/`Progress`/`Badge`/`Skeleton` throughout

> **AG-2 note — Tracker 2-column update:**
> The original AG-2 said "right panel is dashboard-only." After review, the Tracker at desktop has a natural split: left = logging workflow (needs focus), right = quick add shortcuts + utilities. Adding a right panel at `xl:` (1280px+) improves desktop UX without affecting mobile. **AG-2 in `UI_REFACTOR_PLAN_V2.md` is updated to reflect this.**

---

### Layout — Mobile (< 1024px)

Single column, full width. Quick Add below the meal tabs (scroll to it).

```
┌─────────────────────────────┐
│  [←]   Sunday, 5 July  [→] │  ← DateNavigator
│              [Today]        │
├─────────────────────────────┤
│  NUTRITION SUMMARY          │  ← compact: big number + macro dots + bars
│  2,352  kcal remaining      │
│  [──────────────────] 0%    │  ← calorie progress bar
│  P: 0g  C: 0g  F: 0g  Fi:0g│  ← compact dots+values (no bars on mobile)
│  On pace for ~0 kcal today  │  ← F-1: calorie pace (hidden before noon)
├─────────────────────────────┤
│  [☕][☀️][🌙][🍪]            │  ← icon tabs — short labels, NO overflow
│  Break  Lunch Dinner Snack  │
│  ─────────────────────────  │
│  (entry list or empty state)│
│  [+ Add food]               │
├─────────────────────────────┤
│  QUICK ADD                  │  ← below fold, 3×2 grid
│  [🫕 Dal] [🫓 Roti] [🥘 Pan] │
│  [🍚 Rice] [🫔 Idli] [🍛 Curd]│
└─────────────────────────────┘
```

---

### Layout — Desktop (≥ 1024px, 2-column at ≥ 1280px)

```
┌────────────────────────────────────────────────────────────────────────┐
│  [F] FitCoach   Home · Tracker · Workout · Dishes               [D]   │  ← TopNav (no Log Food)
├────────────────────────────────────────────────────────────────────────┤
│                     max-w-6xl mx-auto px-8                             │
│  [←]  Sunday, 5 July  [→]  [Today]    [📋 3 meals logged today]       │
│                                                                        │
│  ┌──── left column (≥ xl: ~800px) ────┐  ┌── right col 300px ─────┐  │
│  │  NUTRITION SUMMARY                 │  │  QUICK ADD             │  │
│  │  2,352 kcal remaining              │  │  [🫕][🫓][🥘]           │  │
│  │  [P ████░░ 0/176g] 0%              │  │  [🍚][🫔][🍛]           │  │
│  │  [C ████░░ 0/235g] 0%              │  │  ──────────────────    │  │
│  │  [F ████░░  0/78g] 0%              │  │  TODAY'S SUMMARY       │  │
│  │  [Fi ───░ 0/30g]  0%              │  │  0 kcal logged         │  │
│  │  [─────────────] 0%               │  │  0 entries total       │  │
│  │  On pace for ~0 kcal today        │  │  [meal dist. bar]      │  │
│  │  [■ Break 0%][■ Lunch 0%]...      │  └────────────────────────┘  │
│  ├────────────────────────────────────┤                               │
│  │  [Breakfast][Lunch][Dinner][Snack] │  ← full labels + kcal here   │
│  │  (entries / empty state)           │                               │
│  │  [+ Add food to Breakfast]         │                               │
│  └────────────────────────────────────┘                               │
└────────────────────────────────────────────────────────────────────────┘
```

**Grid:** `grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6`
Right column: `sticky top-20 space-y-4` (shorter than dashboard — no max-h needed for 2–3 cards)

---

### Component Breakdown

---

#### 1. DateNavigator

Shared with Workout page — reads/writes `useTrackerStore`. Same component used on both pages.

```
[←]       📅  Sunday, 5 July       [Today]  [→]
```

- Left `←`: `goToPrevDay()` — always enabled
- Right `→`: `goToNextDay()` — **disabled + opacity-40 when `isToday()`**
- Centre: "Today" when on today, else formatted date
- "Today" badge: `shadcn Badge`, only visible when not on today, taps `resetToToday()`
- shadcn `Button` ghost for arrows (44px min touch target)

---

#### 2. Nutrition Summary Card

**Two responsive layouts — compact on mobile, full bars on desktop (same principle as CalorieHeroCard).**

**Mobile layout (< lg): no bars — compact dots + values**
```
NUTRITION SUMMARY

  2,352          ← text-4xl font-black, green (under goal) / red (over)
  kcal remaining

  [████████░░░░░░░░░░░] 0%    ← single calorie bar h-2, full width
  of 2,352 kcal goal

  ● P: 0g  ● C: 0g  ● F: 0g  ● Fi: 0g    ← compact dots + values, no bars
  On pace for ~2,352 kcal today           ← F-1 pace (hidden if 0 logged or < noon)
```

**Desktop layout (≥ lg): full labelled bars**
```
  2,352  kcal remaining  ·  of 2,352 goal

  Protein  [████░░░] 0 / 176g   0%
  Carbs    [████░░░] 0 / 235g   0%
  Fat      [████░░░]  0 / 78g   0%
  Fiber    [████░░░]  0 / 30g   0%      ← Q-3: fiber added (violet-400)

  [─────────────────────] calorie progress bar
  On pace for ~0 kcal today             ← F-1
  [■ Break 0%][■ Lunch 0%][■ Din 0%]   ← F-2 meal distribution
```

**Calorie pace (F-1):**
```ts
const hoursElapsed = new Date().getHours() + new Date().getMinutes() / 60
// Only show when: food has been logged AND it's past noon (≥12hrs elapsed)
const showPace = totals.calories_kcal > 0 && hoursElapsed >= 12
const projectedKcal = showPace ? Math.round((totals.calories_kcal / hoursElapsed) * 24) : null
const paceColor = projectedKcal
  ? Math.abs(projectedKcal - targets.calories_kcal) <= 200 ? "text-primary" : "text-amber-400"
  : ""
```

**Meal distribution bar (F-2):**
```ts
// Only show when 2+ different meal types have entries
const mealKcal = {
  breakfast: entries.filter(e => e.meal_type === "breakfast").reduce((s,e) => s + e.calories_kcal, 0),
  // ... lunch, dinner, snack
}
const totalMealKcal = Object.values(mealKcal).reduce((s, v) => s + v, 0)
// Stacked bar: [■ amber][■ yellow][■ blue][■ orange]
// Only render if totalMealKcal > 0 AND 2+ meal types non-zero
```

**Progress bars:** `shadcn Progress`, `h-2` mobile, `h-2 lg:h-2.5` desktop — same as dashboard macros.
**Motion:** bars fill from 0 on mount, `duration: 0.5`

---

#### 3. Meal Tabs (shadcn Tabs — NOT custom accordion)

**State management — fixes B-4:**
`activeTab` is lifted to page state and passed down to both `MealTabs` and `QuickAddGrid`:
```tsx
// page.tsx
const [activeTab, setActiveTab] = useState<MealSlot>("breakfast")
```

**Tab triggers — fixes B-3 (overflow at 375px):**
```tsx
<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MealSlot)}>
  <TabsList className="w-full grid grid-cols-4">
    {MEAL_SLOTS.map(slot => {
      const slotKcal = entriesBySlot[slot.id].reduce((s,e) => s + e.calories_kcal, 0)
      return (
        <TabsTrigger key={slot.id} value={slot.id} className="flex flex-col gap-0.5 py-2 h-auto">
          {/* Icon always visible */}
          <slot.Icon size={16} aria-hidden="true" />
          {/* Short label — no overflow at 375px */}
          <span className="text-[10px]">{slot.shortLabel}</span>
          {/* Kcal badge — only on active tab or when non-zero */}
          {slotKcal > 0 && (
            <span className="text-[9px] text-primary tabular-nums">{Math.round(slotKcal)}</span>
          )}
        </TabsTrigger>
      )
    })}
  </TabsList>
  ...
</Tabs>
```

Tab slot config:
```ts
const MEAL_SLOTS = [
  { id: "breakfast", label: "Breakfast", shortLabel: "Break", Icon: Coffee,  iconColor: "text-amber-400"  },
  { id: "lunch",     label: "Lunch",     shortLabel: "Lunch", Icon: Sun,     iconColor: "text-yellow-400" },
  { id: "dinner",    label: "Dinner",    shortLabel: "Dinner",Icon: Moon,    iconColor: "text-blue-400"   },
  { id: "snack",     label: "Snack",     shortLabel: "Snack", Icon: Cookie,  iconColor: "text-orange-400" },
] as const
```

On **desktop** (≥ lg), full `label` is shown instead of `shortLabel`.

**MealTabContent — per tab:**
- Empty state: `🍽️` emoji in 48px `bg-[#1A1A1A]` circle + `"Nothing logged"` muted text + primary Add button
- Entry rows: food name | kcal | delete X

**Entry delete — fixes B-5 (no confirm-on-second-tap):**
```tsx
async function handleDelete(entryId: number, foodName: string) {
  await deleteEntry(entryId)  // immediate
  toast(`${foodName} removed`, {
    action: { label: "Undo", onClick: () => { /* re-add via addEntry */ } }
  })
}
```
Requires `sonner` installed: `npx shadcn@latest add sonner`

---

#### 4. Add Food Modal (uses existing Modal.tsx — no new AddFoodSheet component)

> ⚠️ `Modal.tsx` must be updated to `lg:` breakpoint BEFORE using here (see Pre-implementation Fix above).

```
ADD FOOD TO {MEAL}

[🔍 Search food items...    ]   ← SearchCommand (already built)
  ↳ dropdown: name, veg dot, kcal, category

── Once food selected ──────────

[Paneer Sabzi]  [×]             ← selected food pill

Meal      [Breakfast ▼]         ← pre-filled from activeTab / pendingMealSlot
Quantity  [100      ] g         ← defaults to item.serving_size_g

PREVIEW
  350 kcal  ·  22g P  ·  12g C  ·  24g F

[Add to Breakfast]              ← primary, disabled while saving
```

- Mobile (< 1024px): Drawer bottom sheet (built into Modal.tsx)
- Desktop (≥ 1024px): Dialog centred (built into Modal.tsx)
- Meal selector: pre-filled from `activeTab` (passed as prop), user can change
- Live preview: `(quantity / item.serving_size_g) × nutrients`
- On submit: `addEntry()` → close → `clearPendingMealSlot()`

---

#### 5. Quick Add Grid

6 tiles. On tap: sets `pendingMealSlot` to `activeTab` (page state), opens Modal.

```
QUICK ADD   Popular Indian meals

[🫕 Dal Tadka  ] [🫓 Roti      ] [🥘 Paneer Sabzi]   ← 3×2 on mobile
[180 kcal      ] [70 kcal      ] [220 kcal       ]

[🍚 Steamed Rice] [🫔 Idli (2) ] [🍛 Curd Rice   ]
```

- Mobile: `grid-cols-3`
- Desktop right column: `grid-cols-3` still (300px right col, 3-col fits well)
- If desktop single column (1024–1279px): `grid-cols-6` (all 6 in one row)
- Each tile: `bg-[#111111] border-[#2A2A2A] rounded-xl` — emoji + name + kcal
- Motion: `whileTap={{ scale: 0.95 }}`

---

#### 6. Today's Summary Widget (right column desktop only — new)

Small utility card showing today's totals at a glance without looking at macro bars.

```
TODAY
  0 kcal  logged
  0 items  across 0 meals

MEAL DISTRIBUTION
  [─────────────────────]    ← greyed out until food logged
```

- When food logged: stacked coloured bar + meal labels
- Breakfast: amber | Lunch: yellow | Dinner: blue | Snack: orange
- Only renders in right column at `xl:` — hidden on mobile (covered by Nutrition Summary)

---

### Empty States

| State | Visual |
|---|---|
| No entries in a meal tab | 48px emoji circle (`🍽️`) + `"Nothing here yet"` + primary Add button |
| All tabs empty (new day) | Nutrition Summary shows full remaining goal, bars at 0 — correct |
| Past date with no logs | Same as above — no special handling needed |
| Search with no results | SearchCommand shows `"No foods found"` in dropdown (built in) |

---

### Loading State

```tsx
// Skeleton layout mirrors actual content shape
{isLoading ? (
  <div className="space-y-5">
    <Skeleton className="h-10 w-full rounded-xl" />     {/* DateNavigator */}
    <Skeleton className="h-32 w-full rounded-2xl" />    {/* Nutrition Summary */}
    <Skeleton className="h-48 w-full rounded-2xl" />    {/* Meal Tabs area */}
  </div>
) : <content />}
```

---

### Animation Summary

| Element | Animation | Spec |
|---|---|---|
| Nutrition macro bars | Fill from 0 on data load | `motion.div width`, `duration: 0.5` |
| Meal distribution bar | Fill segments on data load | CSS width, `duration: 0.4`, delayed |
| Tab switch | Instant (shadcn default) | — |
| Entry added | Slide in from bottom | `AnimatePresence y: 8`, `duration: 0.2` |
| Entry deleted | Fade out left | `AnimatePresence exit: { opacity: 0, x: -20 }` |
| Quick Add tile press | Scale down | `whileTap={{ scale: 0.95 }}` |
| Modal open/close | Drawer slide (mobile) / fade (desktop) | built into Modal.tsx |

---

### What We Are NOT Doing on Tracker

- No custom accordion — `shadcn Tabs` only (CRITICAL RULE)
- No per-meal calorie bars in the tab header — kcal subtotal as small text under icon is enough
- No confirm-on-second-tap delete — immediate delete + sonner undo toast
- No calendar date picker — date nav arrows only (calendar is Phase 7)
- No diet filter toggle UI — filter applied silently from `profile.diet_type`
- No duplicate AddFoodSheet component — `Modal.tsx` (after breakpoint fix) handles both

---

### Files to Create / Modify

```
── Modify ────────────────────────────────────────────────────────────────
src/components/ui/Modal.tsx          ← update breakpoint: md:→ lg: (1024px)

── Install ───────────────────────────────────────────────────────────────
npx shadcn@latest add sonner         ← for undo toast on entry delete

── Create ────────────────────────────────────────────────────────────────
src/lib/trackerUtils.ts              ← pure functions: calorie pace, meal distribution, badge
src/components/tracker/
  DateNavigator.tsx                  ← arrows + today badge (reads useTrackerStore)
  NutritionSummaryCard.tsx           ← responsive: compact mobile / full desktop
  MealTabs.tsx                       ← shadcn Tabs, activeTab state, all 4 slots
  MealTabContent.tsx                 ← entry list + empty state per tab
  FoodLogEntry.tsx                   ← single entry row (name, qty, kcal, delete + undo)
  AddFoodModal.tsx                   ← wraps Modal.tsx with SearchCommand + form
  QuickAddGrid.tsx                   ← 6-tile grid (3×2 mobile, 3×2 right-col desktop)
  TodaySummaryWidget.tsx             ← desktop right col only: totals + distribution bar

src/app/tracker/page.tsx             ← page: activeTab state, useFoodLog, xl: 2-col grid
```

---

### Open Questions Before Building

None. All data, hooks, and components are available. Modal.tsx breakpoint fix is the only prerequisite.

---

## Page 3: Workout (`/workout`)

> Goal: log exercises with minimal friction, see calories burned at a glance, track volume over time.
> Inspiration: **Hevy** (grouped exercise cards, volume tracking), **Strong** (clean set rows), **Bevel** (big numbers, dark breathing room).
> UI must NOT copy the legacy workout layout.
>
> **Phase 5C builds the core UI. Phase 6 adds wger images + proper intensity column.**

---

### Phase 6 Pre-decisions (affects Phase 5C layout)

**1. Exercise images (wger, Phase 6)**
Phase 5C reserves a 36×36 rounded square slot per exercise card. Uses a coloured category initial as fallback (`S`, `C`, `Y`…) in the matching semantic colour — not emoji. This looks more premium than emoji on a dark card.

```tsx
// Phase 5C: coloured initial in rounded square
<div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                bg-blue-500/10 text-blue-400 text-sm font-black">
  {exercise.name[0]}
</div>
// Phase 6: replace with <img src={exercise.image_url} className="w-9 h-9 rounded-xl object-cover" />
```

**2. Intensity toggle (Phase 5C)**
Built as a proper 3-segment control (not text buttons). Stores as `[intensity]` notes prefix until Phase 6 adds a column.

**3. "Session time" rename + notes field (Phase 5C)**
Both included in the modal. Confirmed in backend schema.

**4. Volume separate from calories (Phase 5C)**
Volume displayed as its own metric, not mixed with kcal.

---

### Data Available

| Source | Data |
|---|---|
| `useWorkoutLog(selectedDate)` | `DailyWorkout { entries[], total_calories_burned }` |
| `/api/v1/workout/search?q=` | `Exercise { id, name, category, muscle_group, equipment, level, met_value }` |
| `useTrackerStore` | Shared date store with Tracker — stays in sync |
| `useProfile()` | `profile.current_weight_kg` — for calorie preview |

**`WorkoutLogEntry`:** `exercise_name`, `category`, `sets`, `reps`, `weight_kg`, `duration_min`, `calories_burned`, `notes`

**Computed frontend-only:**
- Volume per exercise: `sets × reps × weight_kg` (only meaningful for strength)
- Total session volume: sum of all strength volumes

---

### AG Checklist

- [x] AG-1: `w-full px-4 pb-24` mobile / `lg:max-w-6xl lg:mx-auto lg:px-8` desktop
- [x] AG-2: Right panel at `xl:` — left=workout log, right=exercise search + session summary
- [x] **AG-3 (corrected)**: Mobile order — Date nav → Calories banner (when >0) → **[+ Log Exercise] CTA** → Exercise log entries. CTA comes BEFORE the log so it's always visible without scrolling.
- [x] AG-4: Cards use full column width — exercise name + stats fill the card, not a narrow table
- [x] AG-7: `Modal.tsx`, `SearchCommand`, `sonner`, `Badge`, `Skeleton` throughout

> **AG-3 correction:** The original spec buried the "Log Exercise" CTA below all entries. On a day with 6 exercises logged, the user scrolls 400px to find the add button. Fixed: float a sticky "+ Log Exercise" button OR put the CTA prominently at the top on mobile.

---

### Layout — Mobile (< 1024px)

```
┌─────────────────────────────┐
│  [←]  Sunday, 5 July  [→]  │  ← DateNavigator
│              [Today]        │
├─────────────────────────────┤
│  [🔥 312 kcal burned today] │  ← orange banner — only when total > 0
├─────────────────────────────┤
│  [+ Log Exercise]           │  ← PRIMARY CTA — always visible, above the log
├─────────────────────────────┤
│  WORKOUT LOG                │
│                             │
│  ┌─ Push Up ──────────────┐ │
│  │  [S] · Strength        │ │  ← coloured initial + category (one line header)
│  │  3 sets · 30 reps      │ │  ← volume summary
│  │  39 kcal               │ │  ← calories
│  │  📝 felt strong today  │ │  ← note (italic, muted, only if set)
│  └────────────────────────┘ │
│                             │
│  ┌─ Running ──────────────┐ │
│  │  [C] · Cardio          │ │
│  │  15 min · 142 kcal     │ │
│  └────────────────────────┘ │
└─────────────────────────────┘
```

---

### Layout — Desktop (≥ 1024px, 2-column at ≥ 1280px)

```
┌────────────────────────────────────────────────────────────────────┐
│  [F] FitCoach   Home · Tracker · Workout (active) · Dishes   [D]  │
├────────────────────────────────────────────────────────────────────┤
│                   max-w-6xl mx-auto px-8                           │
│  [←]  Sunday, 5 July  [→]  [Today]                               │
│                                                                    │
│  ┌──── left column (~800px) ───────┐  ┌── right col 300px ──────┐ │
│  │  [🔥 312 kcal burned today]    │  │  SEARCH EXERCISES       │ │
│  │                                │  │  [🔍 Search...]          │ │
│  │  [+ Log Exercise]              │  │   ↳ dropdown (contained) │ │
│  │                                │  │  ─────────────────────  │ │
│  │  WORKOUT LOG                   │  │  SESSION SUMMARY        │ │
│  │  ┌─ Push Up ────────────────┐  │  │  312 kcal  ·  4 moves   │ │
│  │  │  [S]  Push Up  [Strength]│  │  │  8 sets · 2,400 kg vol  │ │
│  │  │  3 sets · 30 reps · 39  │  │  │  [Strength 80%][Cardio] │ │
│  │  │  ── sets table ──────── │  │  └─────────────────────────┘ │
│  │  │  📝 felt strong today   │  │                               │
│  │  └──────────────────────────┘  │                               │
│  └────────────────────────────────┘                               │
└────────────────────────────────────────────────────────────────────┘
```

**Grid:** `grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6`
Right column: `sticky top-20 space-y-4`

> **Right column SearchCommand containment:** The SearchCommand dropdown must be `position: absolute` within a `relative` container in the right column — it cannot overflow into the left column. Cap the dropdown `max-h-60 overflow-y-auto` so it scrolls within its 300px column.

---

### Component Breakdown

---

#### 1. DateNavigator
**Reuse `src/components/tracker/DateNavigator.tsx`** — no new file. Same Zustand store, date syncs between Tracker and Workout when user switches tabs.

---

#### 2. Calories Burned Banner

Conditional — only when `total_calories_burned > 0`. Full width, orange.

```
┌────────────────────────────────────────────────┐
│  🔥  312 kcal burned today                     │
└────────────────────────────────────────────────┘
```

```tsx
{workout.total_calories_burned > 0 && (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-2.5 px-4 py-3 rounded-xl
               bg-orange-500/10 border border-orange-500/20"
  >
    <Flame size={16} className="text-orange-400 shrink-0" />
    <span className="text-sm font-semibold text-orange-400">
      {Math.round(workout.total_calories_burned).toLocaleString()} kcal burned today
    </span>
  </motion.div>
)}
```

---

#### 3. Log Exercise CTA

**Positioned above the exercise log** (AG-3 fix) — always visible, never buried below entries.

```tsx
{/* Full width on mobile, left-aligned on desktop */}
<button
  onClick={openModal}
  className="flex items-center justify-center gap-2 w-full lg:w-auto lg:px-6
             h-11 rounded-xl bg-primary text-black font-semibold text-sm
             hover:bg-green-400 active:scale-[0.98] transition-all"
>
  <Plus size={15} />
  Log Exercise
</button>
```

---

#### 4. WorkoutLogCard (per exercise, grouped)

**Mobile-optimised header — two rows, not one crowded row:**

```
┌────────────────────────────────────────────────┐
│  [S]  Push Up                          [×]     │  ← row 1: icon + name + delete
│       Strength · Chest                         │  ← row 2: category + muscle (muted)
│  ─────────────────────────────────────────     │
│  VOLUME            CALORIES                    │  ← stats row (2-col)
│  3 sets · 30 reps  39 kcal                     │
│  2,400 kg total    (MET calc)                  │
│  ─────────────────────────────────────────     │
│  Set  Reps  Weight                             │  ← sets table (strength only)
│   1    10   body                               │
│   2    10   body                               │
│   3     8   body                   [delete]    │
│  ─────────────────────────────────────────     │
│  felt strong today, good form                  │  ← note: no emoji, just italic text
└────────────────────────────────────────────────┘
```

```tsx
<Card padding="md" className="space-y-3">
  {/* Header — two rows, no overflow at 375px */}
  <div className="flex items-start justify-between gap-3">
    <div className="flex items-start gap-3 min-w-0">
      {/* Category initial square — Phase 6: replace with img */}
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm",
        CATEGORY_STYLE[category].bg, CATEGORY_STYLE[category].text
      )}>
        {exercise_name[0].toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{exercise_name}</p>
        <p className="text-xs text-muted-foreground">
          {category}{muscle_group ? ` · ${muscle_group}` : ""}
        </p>
      </div>
    </div>
    {/* Category badge + delete */}
    <div className="flex items-center gap-2 shrink-0">
      <Badge variant="outline" className={CATEGORY_STYLE[category].badge}>
        {category}
      </Badge>
      <button onClick={onDeleteAll} className="text-muted-foreground/30 hover:text-red-400 transition-colors">
        <X size={14} />
      </button>
    </div>
  </div>

  {/* Stats row — Volume | Calories */}
  <div className="grid grid-cols-2 gap-3 py-2 border-t border-[#2A2A2A]">
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Volume</p>
      <p className="text-sm font-bold text-white">{volumeLabel}</p>
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Calories</p>
      <p className="text-sm font-bold text-white">{caloriesLabel}</p>
    </div>
  </div>

  {/* Sets table (strength only) */}
  {isStrength && sets.length > 0 && (
    <div className="border-t border-[#2A2A2A] pt-2 space-y-1">
      {sets.map((set, i) => <WorkoutLogRow key={set.id} set={set} index={i+1} onDelete={onDeleteSet} />)}
    </div>
  )}

  {/* Note — only if non-empty after stripping intensity prefix */}
  {strippedNote && (
    <p className="text-xs text-muted-foreground/70 italic border-t border-[#2A2A2A] pt-2">
      {strippedNote}
    </p>
  )}
</Card>
```

**Category styles:**
```ts
const CATEGORY_STYLE = {
  Strength:   { bg: "bg-blue-500/10",   text: "text-blue-400",   badge: "text-blue-400 border-blue-500/30"   },
  Cardio:     { bg: "bg-red-500/10",    text: "text-red-400",    badge: "text-red-400 border-red-500/30"     },
  Yoga:       { bg: "bg-purple-500/10", text: "text-purple-400", badge: "text-purple-400 border-purple-500/30"},
  Stretching: { bg: "bg-green-500/10",  text: "text-green-400",  badge: "text-green-400 border-green-500/30" },
  default:    { bg: "bg-[#1A1A1A]",     text: "text-muted-foreground", badge: "text-muted-foreground border-[#2A2A2A]" },
}
```

---

#### 5. Add Workout Modal

**Sleek, not cluttered.** Key changes from previous spec:
- Intensity: **segmented control** with icons, not plain text buttons
- Notes: **below the CTA** — optional, collapsed with "Add note" ghost link (expands on tap)
- Session time helper: single small line, not a separate label

```
LOG EXERCISE                              ← Modal title

[🔍 Search push up, running...]           ← SearchCommand

── Once selected ─────────────────────────

  [S]  Bench Press                        ← selected pill (category initial + name)
       Chest · Strength              [×]

── Strength ──────────────────────────────

INTENSITY
  ┌──────────────────────────────────┐
  │  Light  │  Moderate ✓  │  Vigorous│  ← 3-segment control, full width
  └──────────────────────────────────┘

  Sets  [3]    Reps  [10]   Weight  [60 kg]

── OR Cardio/Yoga ────────────────────────

  Session time  [15]  min
  ↳ Total time including rest

── Shared ────────────────────────────────

CALORIE PREVIEW
  ≈ 47 kcal

  [+ Add note]                           ← ghost link — expands to textarea on tap

[Log Exercise]                           ← primary green button
```

**Intensity segmented control:**
```tsx
const INTENSITIES = [
  { value: "light",    label: "Light",    met: 3.0 },
  { value: "moderate", label: "Moderate", met: 3.5 },
  { value: "vigorous", label: "Vigorous", met: 6.0 },
]

<div className="flex rounded-xl bg-[#222222] border border-[#2A2A2A] p-1 gap-1">
  {INTENSITIES.map(({ value, label }) => (
    <button
      key={value}
      onClick={() => setIntensity(value)}
      className={cn(
        "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
        intensity === value
          ? "bg-[#1A1A1A] text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  ))}
</div>
```

**Notes — collapsed by default, expands on tap:**
```tsx
const [showNote, setShowNote] = useState(false)

{!showNote ? (
  <button
    onClick={() => setShowNote(true)}
    className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
  >
    + Add a note (optional)
  </button>
) : (
  <textarea
    rows={2}
    placeholder="e.g. felt strong today, good form…"
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    className="w-full rounded-xl bg-[#222222] border border-[#2A2A2A] text-foreground
               text-sm px-3 py-2 resize-none outline-none
               focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
  />
)}
```

---

#### 6. Exercise Search (right column, desktop)

Always-visible `SearchCommand` with contained dropdown.

```
SEARCH EXERCISES

[🔍 Push up, running...]
  ↳ contained dropdown (max-h-60, overflow-y-auto, z-50)
     [S] Push Up    · Chest    [Strength]
     [C] Running    · Cardio   [Cardio]
     [Y] Yoga Sun   · Full     [Yoga]
```

> The dropdown must be `max-h-60 overflow-y-auto` and contained within the right column's `relative` wrapper — never overflows into the left column.

---

#### 7. Session Summary Widget (right column desktop only)

```
SESSION SUMMARY

  ┌──────────────┬──────────────┐
  │   312        │      4       │
  │  kcal        │  exercises   │
  └──────────────┴──────────────┘

  8 sets  ·  2,400 kg volume

  BREAKDOWN
  [████████████░] Strength  80%
  [████░░░░░░░░░] Cardio    20%
```

- Stats grid: `grid grid-cols-2` — consistent with Streak/BMI card pattern (AG-4)
- Volume only shown when strength entries exist
- Category breakdown: one bar per category, sorted by kcal %
- Hidden when no entries logged

---

### Empty States

| State | Visual |
|---|---|
| No exercises logged | 36px category-coloured rounded square + "Start logging to track your workout" + CTA |
| Search returns nothing | "No exercises found. Try a different name." |

**Empty state:**
```tsx
<div className="flex flex-col items-center py-12 gap-4">
  <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] flex items-center justify-center">
    <Dumbbell size={24} className="text-muted-foreground/40" />
  </div>
  <p className="text-sm text-muted-foreground text-center">
    No exercises logged yet
  </p>
  <button onClick={openModal} className="flex items-center gap-1.5 h-9 px-4 rounded-xl
    bg-primary text-black text-sm font-semibold hover:bg-green-400 active:scale-95 transition-all">
    <Plus size={14} />
    Log Exercise
  </button>
</div>
```

---

### Loading State

```tsx
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full rounded-xl" />          {/* DateNavigator */}
    <Skeleton className="h-11 w-full rounded-xl" />          {/* Log Exercise CTA */}
    <Skeleton className="h-28 w-full rounded-2xl" />         {/* First exercise card */}
    <Skeleton className="h-20 w-full rounded-2xl" />         {/* Second card */}
  </div>
) : <content />}
```

---

### Animation Summary

| Element | Animation | Spec |
|---|---|---|
| Calories banner appear | Fade + slide down | `motion.div opacity + y: -8`, `duration: 0.3` |
| Exercise card added | Slide in from bottom | `AnimatePresence y: 8`, `duration: 0.2` |
| Exercise card deleted | Fade out left | `AnimatePresence exit: { opacity: 0, x: -20 }` |
| Set row deleted | Fade out | `AnimatePresence exit: { opacity: 0 }`, `duration: 0.15` |
| Calorie preview | Count up | `CountUp` (reuse from dashboard) |
| Note expand | Height transition | CSS `max-h` transition, `duration: 200ms` |

---

### What We Are NOT Doing (Phase 5C)

- No rest timer
- No sets logged as separate entries — one modal per set, reopen for next set (Hevy pattern)
- No custom exercise creation — Phase 6
- No muscle diagram — Phase 6
- No wger images — Phase 6 (coloured initial fallback used instead)
- No intensity for Yoga/Stretching — session time only

---

### Phase 6 Upgrade Path

| Item | What to change in 5C code |
|---|---|
| `image_url` available | Swap `div` initial in `WorkoutLogCard` and search results for `<img src={image_url} className="w-9 h-9 rounded-xl object-cover" />` |
| `intensity` column | Remove `[intensity]` notes prefix; read/write dedicated field |
| Muscle diagram | New `MuscleDiagram.tsx` — wger SVG overlays on body outline (exercise detail only) |

---

### Files to Create

```
src/lib/workoutUtils.ts          ← groupByExercise, volumeCalc, caloriePreview,
                                    intensityToMet, stripIntensityPrefix, categoryStyle
src/components/workout/
  CaloriesBurnedBanner.tsx       ← orange conditional banner
  WorkoutLogCard.tsx             ← full card: header + stats + sets table + note
  WorkoutLogRow.tsx              ← single set row (Set | Reps | Weight | delete)
  AddWorkoutModal.tsx            ← intensity segmented control, sets/cardio fields,
                                    collapsible notes, calorie preview
  SessionSummaryWidget.tsx       ← desktop right col: stats grid + volume + category bars

src/app/workout/page.tsx         ← page: xl: 2-col, DateNavigator (reused), CTA above log
```

Reuse: `DateNavigator` from tracker, `CountUp` from dashboard, `Modal.tsx`, `SearchCommand`.

---

### Open Questions Before Building

None.

---

## Page 4: Dishes (`/dishes`)

> Design spec to be written before implementation begins.

---

## Page 5: Profile (`/profile`)

> Design spec to be written before implementation begins.
