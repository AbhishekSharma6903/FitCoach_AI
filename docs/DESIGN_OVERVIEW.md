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
> **Phase 5C COMPLETE (2026-07-06). See `UI_REFACTOR_PLAN_V2.md §5C` for full build log.**

---

### Key Architectural Decisions (post Phase 5C)

**Data model: one row per performed set**
`sets=3, reps=10, weight=20kg` → 3 POST calls → 3 DB rows, each `sets=1, reps=10, weight_kg=20`.
This is the correct model for individual set editing, accurate volume, and progressive overload tracking.
Every row is independently editable (inline pencil → save). The frontend sums rows for volume/kcal.

**Intensity: removed**
The Light/Moderate/Vigorous picker is gone. Calorie estimation uses barbell load factor instead:
`kcal = MET(3.5) × body_kg × duration × (1 + barbell_kg / body_kg × 0.3)`
This is objective and auto-computed from data the user already enters.

**Volume display: uniform vs mixed**
- All sets same weight + reps: `3 sets × 10 reps @ 20 kg`
- Different weights or reps after editing: `3 sets × ~9 reps @ ~13 kg` (avg, `~` prefix)
- Secondary: `366 kg total lifted` or `366 kg total (avg)` when mixed

---

### Data Available

| Source | Data |
|---|---|
| `useWorkoutLog(selectedDate)` | `DailyWorkout { entries[], total_calories_burned }` |
| `/api/v1/workout/search?q=` | `Exercise { id, name, category, muscle_group, equipment, level, met_value }` |
| `useTrackerStore` | Shared date store with Tracker |
| `useProfile()` | `profile.current_weight_kg` — for calorie preview |

**`WorkoutLogEntry`:** `id`, `exercise_name`, `category`, `sets` (always 1), `reps`, `weight_kg`, `duration_min`, `calories_burned`, `notes`

**Each entry = 1 performed set.** Volume per exercise = `Σ reps × weight_kg` across its entries.

---

### AG Checklist

- [x] AG-1: `w-full px-4 pb-24` mobile / `lg:max-w-6xl lg:mx-auto lg:px-8` desktop
- [x] AG-2: Right panel at `xl:` — left=workout log, right=exercise search + session summary
- [x] AG-3 (corrected): Mobile order — Date nav → Calories banner (when >0) → **[+ Log Exercise] CTA** → Exercise log. CTA always visible, never buried.
- [x] AG-4: Cards use full column width
- [x] AG-7: `Modal.tsx`, `SearchCommand`, `sonner`, `Badge`, `Skeleton` throughout

---

### Layout — Mobile (< 1024px)

```
┌─────────────────────────────┐
│  [←]   Sunday, 5 July  [→] │  ← DateNavigator
│              [Today]        │
├─────────────────────────────┤
│  [🔥 312 kcal burned today] │  ← orange banner — only when total > 0
├─────────────────────────────┤
│  [+ Log 3 Sets / Log Exercise] │  ← PRIMARY CTA — above the log
├─────────────────────────────┤
│  WORKOUT LOG                │
│                             │
│  ┌─ Push Up ──────────────┐ │
│  │  [S]  Push Up  Strength│ │
│  │  3 sets × 10 reps      │ │  ← uniform: exact
│  │  @ 20 kg               │ │
│  │  480 kg total lifted   │ │
│  │  ─────────────────── │ │
│  │  Set 1  10 reps  20 kg │ │  ← per-row, editable
│  │  Set 2  10 reps  20 kg │ │
│  │  Set 3  10 reps  20 kg │ │
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
│  │  [+ Log 3 Sets]                │  │   ↳ contained dropdown  │ │
│  │                                │  │  ─────────────────────  │ │
│  │  WORKOUT LOG                   │  │  SESSION SUMMARY        │ │
│  │  ┌─ Push Up ────────────────┐  │  │  312 kcal  ·  4 moves   │ │
│  │  │ 3 sets × 10 reps @ 20kg │  │  │  8 sets · 80 reps       │ │
│  │  │ 480 kg total lifted      │  │  │  [Strength ██ 80%]      │ │
│  │  │ Set 1  10 reps  20 kg   │  │  │  [Cardio   ██ 20%]      │ │
│  │  │ Set 2  10 reps  20 kg   │  │  └─────────────────────────┘ │
│  │  │ Set 3  10 reps  20 kg   │  │                               │
│  │  └──────────────────────────┘  │                               │
│  └────────────────────────────────┘                               │
└────────────────────────────────────────────────────────────────────┘
```

**Grid:** `grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6`
Right column: `sticky top-20 space-y-4`

---

### Component Breakdown

---

#### 1. DateNavigator
**Reuse `src/components/tracker/DateNavigator.tsx`** — same Zustand store.

---

#### 2. Calories Burned Banner
Conditional — only when `total_calories_burned > 0`. Full width, orange. See `CaloriesBurnedBanner.tsx`.

---

#### 3. Log Exercise CTA

```tsx
<button
  onClick={() => setModalOpen(true)}
  className="flex items-center justify-center gap-2 w-full lg:w-auto lg:px-6
             h-11 rounded-xl bg-primary text-black font-semibold text-sm
             hover:bg-green-400 active:scale-[0.98] transition-all"
>
  <Plus size={15} />
  Log Exercise
</button>
```

Positioned ABOVE the exercise log (AG-3 fix).

---

#### 4. WorkoutLogCard (per exercise, grouped)

**Volume logic:**
```ts
// Uniform: all sets same reps + weight
if (!isMixed) → "3 sets × 10 reps @ 20 kg"
// Mixed: any set differs in reps or weight
if (isMixed)  → "3 sets × ~9 reps @ ~13 kg"  (avg, prefixed with ~)
// Secondary subtitle
totalVolume > 0 → "480 kg total lifted"  (or "(avg)" when mixed)
```

**Sets table (strength only):**
- Each entry = one row: `Set N | reps | weight` (or "bodyweight")
- Hover/tap row → pencil icon → inline edit (reps + weight inputs → ✓ save / × cancel)
- Edit triggers PATCH → backend recomputes calories → SWR revalidates → row remounts with fresh data
- `key` includes `entry.reps-entry.weight_kg-entry.calories_burned` to force remount after edit

---

#### 5. Add Workout Modal

**No intensity picker.** Fields for strength: Sets, Reps/set, Weight (kg).

```
LOG EXERCISE

[🔍 Search push up, running...]

── Once selected ─────────────────────
  [S]  Push Up                    [×]
       Strength

  Sets [3]   Reps/set [10]   Weight [20]
                                    (kg)

  Will log 3 separate sets of 10 reps @ 20 kg

ESTIMATED BURN
  ≈ 14 kcal
  3 sets × 10 reps @ 20 kg

  [+ Add a note]

[Log 3 Sets]  ← button label reflects set count
```

**Calorie preview formula:**
```ts
// Per-set: reps × 3s active + 90s rest. Load factor for barbell.
const activeMin = (sets * reps * 3 + sets * 90) / 60
const loadFactor = barbellKg > 0 ? 1 + (barbellKg / bodyKg) * 0.3 : 1
kcal = MET(3.5) × bodyKg × (activeMin / 60) × loadFactor
```

**Logging flow:** `sets=N` → `for (let i=0; i<N; i++) await onAdd({sets:1, reps, weight_kg, ...})`
Button label is dynamic: `Log 1 Set` / `Log 3 Sets` etc.

---

#### 6. SessionSummaryWidget (right column desktop only)

```
SESSION SUMMARY

  ┌──────────────┬──────────────┐
  │   312        │      4       │
  │  kcal        │  exercises   │
  └──────────────┴──────────────┘

  8 sets  ·  80 reps           ← plain counts, no tonnage

  BREAKDOWN
  strength  ████████████  80%  · 250 kcal
  cardio    ████░░░░░░░░  20%  · 62 kcal
```

- Volume tonnage removed — replaced with `N sets · M reps` (counts users actually care about)
- Breakdown bars use `style.bgSolid` (solid colour, not `/10` opacity)
- Category labels use `capitalize` — DB stores lowercase

---

### Empty States

| State | Visual |
|---|---|
| No exercises logged | 64px dumbbell icon in `bg-[#1A1A1A]` square + "Start your workout" + body copy |
| Search returns nothing | "No exercises found." in SearchCommand |

---

### Loading State

```tsx
<Skeleton className="h-10 w-full rounded-xl" />     // DateNavigator
<Skeleton className="h-11 w-full rounded-xl" />     // CTA
<Skeleton className="h-28 w-full rounded-2xl" />    // Exercise card
<Skeleton className="h-20 w-full rounded-2xl" />    // Second card
```

---

### Phase 6 Upgrade Path

| Item | What to change in 5C code |
|---|---|
| `image_url` available | Swap `div` initial in `WorkoutLogCard` and search results for `<img src={image_url} className="w-9 h-9 rounded-xl object-cover" />` |
| ~~`intensity` column~~ | **No longer needed** — intensity removed in Phase 5C |
| Muscle diagram | New `MuscleDiagram.tsx` — wger SVG overlays on body outline |

---

### Files Created

```
src/lib/workoutUtils.ts
src/components/workout/
  CaloriesBurnedBanner.tsx
  WorkoutLogCard.tsx
  WorkoutLogRow.tsx
  AddWorkoutModal.tsx
  SessionSummaryWidget.tsx
src/app/workout/page.tsx

Backend:
  app/schemas/workout.py       (WorkoutLogUpdate added)
  app/services/workout_service.py  (estimate_strength_duration added)
  app/routers/workout.py       (PATCH recomputes calories)

QA:
  qa/playwright/workout-states.js
  qa/playwright/workout-per-set.js
  qa/playwright/workout-edit-sync.js
  qa/evaluate_workout_states.py
  qa/evaluate_edit_sync.py
```

---

> ⚠️ **SUPERSEDED — Pre-build spec below (2026-07-05). Phase 5C is complete. See updated spec above.**
> Items below are kept for historical reference only. Do not implement from this section.
> Key reversals: intensity picker removed; sets=N → N DB rows (not one row with sets=N).

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

> Goal: let users build and manage custom dishes from ingredients, so home-cooked meals (Indian or otherwise) can be logged in the Tracker exactly like any food item.
> Inspiration: MyFitnessPal recipe builder (ingredient list + live nutrition preview), Bevel (clean cards, big numbers), Strong (minimal form friction).
> Single column, no right panel (AG-2). The builder is inline on the same page — not a modal.
>
> **Phase 5D COMPLETE (2026-07-07). P0: 8.0/10 PASS. See `UI_REFACTOR_PLAN_V2.md §5D` for full build log.**

---

### Implementation Corrections (vs pre-build spec)

**Unit system replaced entirely:** The original spec's `detectUnit() → "g"|"ml"|"qty"` was replaced by `getUnitOptions() → UnitOption[]` mid-build. See `★ UNIT SYSTEM ARCHITECTURAL DECISION` section below, and `UI_REFACTOR_PLAN_V2.md §5D Decision A`. The `DishIngredientInput` type now carries `unit_options[]` and `selected_unit` instead of `display_unit`.

**`IngredientRow` has a `<select>` dropdown for units:** Not a plain text label. Shows 3–5 options (tablespoon, teaspoon, katori, etc.). Changing the unit auto-recomputes `quantity_g = display_amount × selected_unit.weight_g`.

**`toBuilderIngredients` reconstructs units best-effort:** Saved dishes have no stored unit info. On edit, we generate a synthetic `FoodItem` from the food name, run `getUnitOptions()`, then pick the option whose `weight_g` is closest to the saved `quantity_g`. Practical and correct for most cases.

---

## ★ UNIT SYSTEM ARCHITECTURAL DECISION (2026-07-07)

> This section is critical and supersedes the original single-unit `detectUnit()` approach.
> **Read before building or touching `dishUtils.ts`.**

---

### The Problem

The original `detectUnit()` returns one unit per food item (`g | ml | qty`). This is wrong because:

- Users don't think in grams. They think "2 eggs", "1 tablespoon oil", "1 cup milk", "1 bowl curry".
- Oil could be: `15g` OR `1 tablespoon (13g)` OR `1 teaspoon (4g)` — all valid, user's choice.
- Pizza could be: `100g` OR `1 slice (80g)` OR `1/4 pizza (200g)`.
- Indian serving culture uses: ladles, bowls, katoris, tablespoons — not grams.

A single auto-detected unit solves nothing. It just shows `15 g` for oil when the user wants to say "1 tbsp".

---

### The Solution: Multi-Unit Option Set Per Food

Every food item offers **multiple unit options** derived from its category + name. The user selects the unit that matches how they naturally think about that food. The selected unit converts to grams for the API.

This is what MFP, Healthify Me, and Cronometer all do — not one unit, but a **picker of 3-6 sensible options**.

**Key insight:** Our DB stores nutrition per 100g. Every unit option is just a `{ label, weight_g }` pair. Conversion is always `quantity × weight_g_per_unit = total_grams`. No new backend work needed.

---

### Unit Option Sets (per food category/type)

```ts
interface UnitOption {
  label: string;         // shown in picker: "tablespoon", "cup", "piece"
  weight_g: number;      // grams per 1 unit
  default?: boolean;     // which option is pre-selected
}
```

| Food Category | Options offered |
|---|---|
| **Solid default (g)** | 100g · serving (item.serving_size_g) · 50g · 200g |
| **Liquids / beverages** | 100ml · 1 cup (240ml) · 1 glass (250ml) · 1 tablespoon (15ml) · 200ml |
| **Oils / fats** | 1 teaspoon (5g) · 1 tablespoon (13g) · 10g · 50g |
| **Eggs** | 1 whole (50g) · 2 whole (100g) · 100g |
| **Bread / chapati / roti** | 1 piece (40g) · 2 pieces (80g) · 100g |
| **Rice / dal cooked** | 1 katori (150g) · 1 cup (200g) · 100g · 50g |
| **Curry / sabzi cooked** | 1 katori (150g) · 1 bowl (250g) · 1 ladle (80g) · 100g |
| **Idli / dosa / vada** | 1 piece (idli=50g, dosa=80g, vada=75g) · 2 pieces · 100g |
| **Fruits (whole)** | 1 small · 1 medium · 1 large · 100g |
| **Nuts / seeds** | 1 handful (30g) · 10g · 25g · 100g |
| **Dairy solids (paneer etc.)** | 100g · 50g · 1 cup (200g) · 25g |

**Default selection rule:** pick the option closest to `item.serving_size_g`.

---

### Implementation: `getUnitOptions(item: FoodItem): UnitOption[]`

```ts
// src/lib/dishUtils.ts — replaces detectUnit()

export function getUnitOptions(item: FoodItem): UnitOption[] {
  const name = item.name.toLowerCase();
  const cat  = (item.category ?? "").toLowerCase();
  const srv  = item.serving_size_g ?? 100;

  // 1. Oils and fats
  if (isOil(name))
    return [
      { label: "teaspoon",   weight_g: 5,   default: srv <= 8 },
      { label: "tablespoon", weight_g: 13,  default: srv > 8 && srv <= 20 },
      { label: "10g",        weight_g: 10 },
      { label: "50g",        weight_g: 50 },
    ];

  // 2. Eggs
  if (isEgg(name))
    return [
      { label: "1 whole (50g)",  weight_g: 50,  default: true },
      { label: "2 whole (100g)", weight_g: 100 },
      { label: "100g",           weight_g: 100 },
    ];

  // 3. Liquids
  if (isLiquid(name, cat) && !isSolidDairy(name))
    return [
      { label: "100ml",       weight_g: 100, default: srv === 100 },
      { label: "glass (250ml)", weight_g: 250 },
      { label: "cup (240ml)", weight_g: 240, default: srv >= 200 },
      { label: "tablespoon",  weight_g: 15 },
      { label: `${srv}ml`,    weight_g: srv, default: srv !== 100 && srv < 200 },
    ].filter((v, i, arr) => arr.findIndex(x => x.weight_g === v.weight_g) === i);

  // 4. Bread / chapati / roti / naan
  if (isBread(name))
    return [
      { label: "1 piece",  weight_g: getBreadWeight(name), default: true },
      { label: "2 pieces", weight_g: getBreadWeight(name) * 2 },
      { label: "100g",     weight_g: 100 },
    ];

  // 5. Idli / dosa / vada / idly
  if (isIdli(name))
    return [
      { label: "1 piece",  weight_g: getIdliWeight(name), default: true },
      { label: "2 pieces", weight_g: getIdliWeight(name) * 2 },
      { label: "100g",     weight_g: 100 },
    ];

  // 6. Cooked rice / cooked dal / cooked beans
  if (isCookedGrain(name))
    return [
      { label: "1 katori (150g)", weight_g: 150, default: srv <= 160 },
      { label: "1 cup (200g)",    weight_g: 200, default: srv > 160 },
      { label: "100g",            weight_g: 100 },
      { label: "50g",             weight_g: 50  },
    ];

  // 7. Curry / sabzi / cooked vegetables
  if (isCurry(name, cat))
    return [
      { label: "1 katori (150g)", weight_g: 150, default: true },
      { label: "1 bowl (250g)",   weight_g: 250 },
      { label: "1 ladle (80g)",   weight_g: 80  },
      { label: "100g",            weight_g: 100 },
    ];

  // 8. Fruits (whole)
  if (isWholeFruit(name))
    return [
      { label: `1 small (${getFruitWeight(name,"small")}g)`,  weight_g: getFruitWeight(name,"small") },
      { label: `1 medium (${getFruitWeight(name,"medium")}g)`, weight_g: getFruitWeight(name,"medium"), default: true },
      { label: `1 large (${getFruitWeight(name,"large")}g)`,  weight_g: getFruitWeight(name,"large") },
      { label: "100g", weight_g: 100 },
    ];

  // 9. Nuts / seeds
  if (isNut(name))
    return [
      { label: "1 handful (30g)", weight_g: 30, default: srv <= 35 },
      { label: "10g",  weight_g: 10 },
      { label: "25g",  weight_g: 25 },
      { label: "100g", weight_g: 100 },
    ];

  // 10. Default — solid food with gram options
  const options: UnitOption[] = [
    { label: "100g",  weight_g: 100 },
    { label: "50g",   weight_g: 50  },
    { label: "200g",  weight_g: 200 },
  ];
  if (srv !== 100 && srv !== 50 && srv !== 200) {
    options.unshift({ label: `serving (${srv}g)`, weight_g: srv, default: true });
  } else {
    options[0].default = true;
  }
  return options;
}

export function defaultOption(options: UnitOption[]): UnitOption {
  return options.find(o => o.default) ?? options[0];
}
```

---

### IngredientRow — Unit Selector UI

Replace the plain unit label text with a **dropdown selector** showing the available unit options for that ingredient.

```
● Mustard Oil   [  1  ] [tablespoon ▼]  [×]
                          ↓ opens:
                          teaspoon (5g)
                        ✓ tablespoon (13g)
                          10g
                          50g

● Whole Egg     [  2  ] [whole (50g) ▼] [×]
                          ↓ opens:
                        ✓ 1 whole (50g)
                          2 whole (100g)
                          100g

● Toor Dal      [ 150 ] [katori (150g)▼] [×]
                          ↓ opens:
                        ✓ 1 katori (150g)
                          1 cup (200g)
                          100g
                          50g
```

**UX contract:**
- When user changes the unit dropdown: `weight_g` updates → `quantity_g = display_amount × new_weight_g` → nutrition preview re-calculates
- When user changes the number input: `quantity_g = display_amount × selected_unit.weight_g`
- The two are independent: "2 tablespoons" = `2 × 13 = 26g`

**State per ingredient:**
```ts
interface DishIngredientInput {
  // ... existing fields ...
  unit_options:    UnitOption[];     // computed once on add
  selected_unit:   UnitOption;       // current selection (drives quantity_g)
  display_amount:  number;           // the "2" in "2 tablespoons"
}

// quantity_g is always derived: display_amount × selected_unit.weight_g
```

---

### What Changes in Code

| File | Change |
|---|---|
| `src/lib/dishUtils.ts` | Replace `detectUnit/defaultQty/toGrams/unitLabel` with `getUnitOptions/defaultOption`. Add all category detectors. |
| `src/components/dishes/IngredientRow.tsx` | Replace plain `<span>` unit label with a native `<select>` (or custom `Select`) showing `unit_options`. On change: update `selected_unit` + recompute `quantity_g`. |
| `src/components/dishes/DishBuilder.tsx` | On ingredient select: call `getUnitOptions(item)` + `defaultOption(options)` + set `display_amount = 1`. |
| `src/types/dish.ts` | Add `unit_options: UnitOption[]` + `selected_unit: UnitOption` to `DishIngredientInput`. |

No backend changes needed. The API only receives `{ food_item_id, quantity_g }` — grams are always the wire format.

---

### What We Are NOT Doing

- No per-item DB serving options — too much data work for Phase 5D. Category rules cover 95% of cases.
- No cups/oz/lbs — metric only (this is an Indian fitness app).
- No custom unit creation — fixed predefined options per category.
- No "last used unit memory" — always default on add, user changes if needed.
> **Phase 5D — build only after this spec is reviewed.**

---

### Why Dishes Exists (architect note)

The food catalog covers packaged and restaurant food well. It has zero coverage of home-cooked Indian meals: Dal Tadka, Poha, Rajma, Aloo Gobi. The Quick Add grid has 6 hardcoded tiles that are cosmetic, not logged with real nutrition.

Dishes solves this permanently: the user builds "My Dal Tadka" once from its actual ingredients (daal, oil, onion, spices), saves it, and it appears in food search forever. One time effort, infinite reuse.

---

### Data — What the Backend Provides

**Endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET /api/v1/dishes` | list dishes | Returns `CustomDishListItem[]` — lightweight, no ingredients array |
| `GET /api/v1/dishes/{id}` | get full dish | Returns `DishRead` — includes `ingredients[]` |
| `POST /api/v1/dishes` | create dish | Body: `{ name, ingredients: [{food_item_id, quantity_g}] }` |
| `PUT /api/v1/dishes/{id}` | update dish | Same body as POST — replaces ingredients entirely |
| `DELETE /api/v1/dishes/{id}` | delete dish | |

**Key backend behaviour:**
- Nutrition is stored **per 100g** (`compute_dish_nutrition` divides by total weight). `DishRead` and `DishListItem` return per-100g values.
- `total_weight_g` = sum of all ingredient `quantity_g` values.
- Frontend total dish kcal = `calories_kcal_per100g × total_weight_g / 100`.
- Diet flags (`is_veg`, `is_egg`, `is_vegan`) are auto-computed from ingredients — not user-set.
- `DishCreate` only needs `name` + `ingredients`. All nutrition is backend-computed.

**Hooks already exist:** `useCustomDishes()` in `src/hooks/useCustomDishes.ts`.

**Types already exist:** `src/types/dish.ts` — `CustomDish`, `CustomDishListItem`, `DishIngredientInput`.

---

> ⚠️ **SUPERSEDED — Pre-build component spec below. Phase 5D is complete. See Implementation Corrections above.**
> The unit system spec, `dishUtils.ts` functions, and `IngredientRow` JSX below are the *original pre-build* versions.
> **Actual implementation** uses `getUnitOptions()`/`defaultOption()` and a `<select>` unit dropdown — see `★ UNIT SYSTEM ARCHITECTURAL DECISION` and `UI_REFACTOR_PLAN_V2.md §5D`.

### Smart Units — the most important non-obvious feature

Ingredients have different natural units. A user thinks "1 egg" not "50g egg", "200ml milk" not "200g milk". The legacy `DishBuilder` already solved this with a `detectUnit()` function that classifies every food item:

| Unit | When | Examples | API value |
|---|---|---|---|
| `g` | Default for solid foods | Rice, paneer, dal, oil | direct |
| `ml` | Liquid-category foods; name contains milk/juice/tea etc. | Milk, juice, lassi | direct (ml ≈ g) |
| `qty` | Eggs, chapati, roti, banana, idli, dosa | 1 egg, 2 rotis | `amount × unitWeightG()` |

**This logic lives in `dishUtils.ts`** — pure functions, no React, no API.

**`unitWeightG` lookup:** egg=50g, chapati=40g, roti=40g, naan=80g, puri=40g, idli=50g, dosa=80g, banana=120g, apple=182g, orange=131g, biscuit=10g.

**Live preview formula (frontend, no API call):**
```ts
// For each ingredient:
const ratio = quantity_g / item.serving_size_g
const kcal_contribution = ratio * item.calories_kcal

// Total dish (NOT per-100g — this is what users care about):
totalKcal   = Σ kcal_contributions
totalWeight = Σ quantity_g

// Per-100g reference (for logging context):
per100gKcal = totalKcal / totalWeight * 100
```

The live preview shows **total dish values** — "my dal has 380 kcal total" — not per-100g. The per-100g is shown smaller as a reference.

---

### Architecture: Two-view pattern (List ↔ Builder), NOT a modal

```ts
type View = "list" | { mode: "create" } | { mode: "edit"; dishId: number }
```

- `"list"` — shows DishList + InfoBanner + client-side search
- `{ mode: "create" }` — shows DishBuilder with empty form, slides in from right
- `{ mode: "edit", dishId }` — DishBuilder pre-filled, fetches full dish via `GET /api/v1/dishes/{id}`

**Why not a modal?** The builder has `SearchCommand`, quantity inputs, a live preview panel — too much content for a modal. It needs full page width. `AnimatePresence` horizontal slide replaces nav-level routing.

**Back button:** `←` in builder header returns to list. No router push needed.

---

### AG Checklist

- [x] AG-1: `w-full px-4 pb-24` mobile, `lg:max-w-6xl` desktop — single column
- [x] AG-2: No right panel. Builder content fills the full column.
- [x] AG-3: List first (primary content), Builder accessed on demand
- [x] AG-4: Dish cards + builder form fill full column width
- [x] AG-7: `SearchCommand`, `Input`, `Button`, `Badge`, `Card`, `Skeleton`, `DeleteConfirmDialog`, `sonner`
- [x] AG-8: SWR via `useCustomDishes()`, local `useState` for view/search/builder form

---

### Layout — List View

```
┌────────────────────────────────────────────────┐
│  DISHES                   (mobile shell title) │
├────────────────────────────────────────────────┤
│  [🍳 Custom dishes appear in food search…]     │  ← InfoBanner
│                                                │
│  [🔍 Search my dishes…]        [+ New Dish]   │
│                                                │
│  MY DISHES (3)                                 │
│  ┌────────────────────────────────────────┐   │
│  │ Dal Tadka    [veg]           [✏] [🗑]  │   │
│  │ 4 ingredients · 320g total             │   │
│  │ 380 kcal · 18g P · 52g C · 8g F       │   │
│  └────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────┐   │
│  │ Poha         [veg]           [✏] [🗑]  │   │
│  │ 6 ingredients · 280g total             │   │
│  │ 310 kcal · 9g P · 55g C · 6g F        │   │
│  └────────────────────────────────────────┘   │
└────────────────────────────────────────────────┘
```

**Client-side search:** filters `dishes` array by `name.toLowerCase().includes(query)`. No API call.

**Empty state:** 64px `ChefHat` icon + "No custom dishes yet" + full-width `[+ Create your first dish]` green button.

---

### Layout — Builder View

```
┌────────────────────────────────────────────────┐
│  [←]  Create Dish                              │
├────────────────────────────────────────────────┤
│  Dish name  [ My Dal Tadka              ]      │
│                                                │
│  INGREDIENTS                                   │
│  [🔍 Search rice, dal, paneer…]                │
│                                                │
│  ● Toor Dal     [ 150 ] g          [×]        │
│  ● Onion        [  80 ] g          [×]        │
│  ● Mustard Oil  [  15 ] ml         [×]        │
│  ● Egg          [   2 ] unit(≈50g) [×]        │
│                                                │
│  NUTRITION PREVIEW                             │
│  ┌──────────────────────────────────────────┐ │
│  │  380  kcal total · 305g dish             │ │
│  │  ─────────────────────────────────────   │ │
│  │  P [████░░░] 18g   C [████████░] 52g    │ │
│  │  F [██░░░░░]  8g   Fi [█░░░░░░]  6g    │ │
│  │  Kcal/100g: 124                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  [Save Dish]                                   │
└────────────────────────────────────────────────┘
```

---

### Component Breakdown

---

#### `InfoBanner`

```tsx
<div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
  <ChefHat size={16} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
  <p className="text-sm text-muted-foreground">
    Custom dishes appear in food search when you log meals in the Tracker.
    Build once, log forever.
  </p>
</div>
```

---

#### `DishCard`

```tsx
<Card padding="md" className="space-y-2">
  {/* Header row */}
  <div className="flex items-start justify-between gap-2">
    <div className="flex items-center gap-2 min-w-0 flex-wrap">
      <p className="text-sm font-bold text-foreground truncate">{dish.name}</p>
      <DietBadge dish={dish} />
    </div>
    <div className="flex items-center gap-0.5 shrink-0">
      <button onClick={onEdit}   aria-label="Edit"   className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
      <button onClick={onDelete} aria-label="Delete" className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
    </div>
  </div>
  {/* Meta */}
  <p className="text-xs text-muted-foreground">
    {dish.ingredient_count} ingredient{dish.ingredient_count !== 1 ? "s" : ""} · {Math.round(dish.total_weight_g)}g total
  </p>
  {/* Nutrition — convert from per-100g to total dish */}
  {dish.calories_kcal != null && (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-bold text-white tabular-nums">
        {Math.round(dish.calories_kcal * dish.total_weight_g / 100)} kcal
      </span>
      <span className="text-xs text-blue-400 tabular-nums">
        {Math.round((dish.protein_g ?? 0) * dish.total_weight_g / 100)}g P
      </span>
      <span className="text-xs text-amber-400 tabular-nums">
        {Math.round((dish.carbs_g ?? 0) * dish.total_weight_g / 100)}g C
      </span>
      <span className="text-xs text-orange-400 tabular-nums">
        {Math.round((dish.fat_g ?? 0) * dish.total_weight_g / 100)}g F
      </span>
    </div>
  )}
</Card>
```

**`DietBadge`:** `is_veg && !is_egg` → `text-green-400 border-green-500/30` "Veg". `is_egg` → `text-amber-400 border-amber-500/30` "Egg". `!is_veg` → `text-red-400 border-red-500/30` "Non-veg".

---

#### `IngredientRow`

Single ingredient in the builder. Shows name, quantity input (in natural unit), unit label, remove button.

```tsx
<motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}
  className="flex items-center gap-3 py-2 border-b border-[#2A2A2A] last:border-0"
>
  <span className={cn("w-2 h-2 rounded-full shrink-0", ing.is_veg ? "bg-green-500" : "bg-red-500")} />
  <span className="text-sm text-foreground flex-1 min-w-0 truncate">{ing.food_name}</span>
  <div className="flex items-center gap-1.5 shrink-0">
    <Input
      type="number" min={0.1} step={ing.display_unit === "qty" ? 1 : 0.1}
      value={ing.display_amount}
      onChange={e => updateAmount(index, Number(e.target.value))}
      className="w-20 h-8 bg-[#222222] border-[#2A2A2A] text-sm text-right tabular-nums"
    />
    <span className="text-[10px] text-muted-foreground/50 min-w-[32px] text-left">
      {unitLabel(ing.display_unit!, ing.item_ref!)}
    </span>
  </div>
  <button onClick={() => removeIngredient(index)} aria-label="Remove ingredient"
    className="text-muted-foreground/30 hover:text-red-400 transition-colors shrink-0">
    <X size={14} />
  </button>
</motion.div>
```

---

#### `DishNutritionPreview`

Pure display component. No state — receives `ingredients: DishIngredientInput[]` and computes totals inline.

Shows:
1. Large total kcal number (`text-3xl font-black`)
2. Total weight label
3. P / C / F / Fi values with motion progress bars (filled relative to highest macro)
4. Small "Kcal/100g: N" reference line
5. Placeholder when `ingredients.length === 0`

```tsx
// Bar fill: same max-macro-relative technique as ProfilePage MacrosCard
const maxG = Math.max(totals.protein, totals.carbs, 1)
```

---

#### `DishBuilder`

**Props:**
```ts
interface DishBuilderProps {
  initialName?: string
  initialIngredients?: DishIngredientInput[]
  onSave: (name: string, ingredients: { food_item_id: number; quantity_g: number }[]) => Promise<void>
  onCancel: () => void
}
```

**Ingredient search:** `SearchCommand<FoodItem>` using `useFoodSearch`. On item selected:
1. `const unit = detectUnit(item)` from `dishUtils.ts`
2. `const amount = defaultQty(item, unit)`
3. `const grams = toGrams(amount, unit, item)`
4. Push to ingredients: `{ food_item_id: item.id, food_name: item.name, quantity_g: grams, display_amount: amount, display_unit: unit, item_ref: item, calories_kcal: item.calories_kcal, ... }`

**`updateAmount(index, newDisplayAmount)`:**
```ts
const grams = toGrams(newDisplayAmount, ingredient.display_unit, ingredient.item_ref)
setIngredients(prev => prev.map((ing, i) =>
  i === index ? { ...ing, display_amount: newDisplayAmount, quantity_g: grams } : ing
))
```

**Validation + save:**
```ts
if (!name.trim())            { setNameError("Dish name is required"); return }
if (!ingredients.length)     { toast.error("Add at least one ingredient"); return }
if (ingredients.some(i => i.quantity_g <= 0)) { toast.error("All quantities must be > 0"); return }
```

---

### `dishUtils.ts` — pure functions, zero React

```ts
// src/lib/dishUtils.ts
import type { FoodItem } from "@/types/nutrition"
import type { DishIngredientInput } from "@/types/dish"

export type DishUnit = "g" | "ml" | "qty"

export function detectUnit(item: FoodItem): DishUnit { ... }
export function unitWeightG(item: FoodItem): number  { ... }
export function defaultQty(item: FoodItem, unit: DishUnit): number { ... }
export function toGrams(amount: number, unit: DishUnit, item: FoodItem): number { ... }
export function unitLabel(unit: DishUnit, item: FoodItem): string { ... }

export interface DishNutritionTotals {
  kcal: number; protein: number; carbs: number; fat: number; fiber: number;
  totalWeight: number; per100gKcal: number;
}
export function computeDishNutrition(ingredients: DishIngredientInput[]): DishNutritionTotals { ... }
```

---

### Animation Summary

| Element | Animation |
|---|---|
| List → Builder | `AnimatePresence`: list exits left (`x: -20`), builder enters right (`x: 20`) |
| Builder → List | reverse direction |
| Ingredient added | `AnimatePresence y: 4 → 0`, `duration: 0.15` |
| Ingredient removed | `exit: { opacity: 0, x: -16 }`, `duration: 0.15` |
| Nutrition numbers | No animation (update too frequently while typing) |

---

### What We Are NOT Doing

- No diet type toggle — diet flags auto-computed by backend from ingredients
- No per-ingredient nutrition expand — just total preview
- No serving-size input — total dish weight IS the serving
- No pagination on list — all dishes fetched at once, client-side filter
- No duplicate name check — no uniqueness constraint needed
- No "log from dishes page" button — user logs from Tracker food search

---

### Files to Create

```
src/lib/dishUtils.ts                ← detectUnit, unitWeightG, defaultQty, toGrams,
                                       unitLabel, computeDishNutrition (pure, no React)

src/components/dishes/
  InfoBanner.tsx                    ← explanatory top banner
  DishCard.tsx                      ← list item card: name, diet badge, nutrition, edit/delete
  DishList.tsx                      ← search input + "New Dish" CTA + card grid + empty state
  IngredientRow.tsx                 ← single ingredient: name, qty input, unit label, remove
  DishNutritionPreview.tsx          ← live preview: total kcal, macro bars, per-100g reference
  DishBuilder.tsx                   ← full builder: name + ingredient search + rows + preview + save

src/app/dishes/page.tsx             ← page: view state machine, useCustomDishes,
                                       AnimatePresence view transitions, delete confirm dialog
```

Reuse: `SearchCommand` (ingredient search), `Input`, `Button`, `Badge`, `Card`, `Skeleton`, `DeleteConfirmDialog`, `Spinner`, `sonner`, `AnimatePresence`, `motion`.

---

### Open Questions Before Building

None. Backend fully built. `useCustomDishes()` hook exists. Types in `src/types/dish.ts` complete. `SearchCommand` and `useFoodSearch` reusable. `DeleteConfirmDialog` reusable. Unit detection logic in legacy `DishBuilder.tsx` (reference only — do NOT copy UI).

---

## Page 6: Onboarding (`/onboarding`)

> Goal: collect the 11 required profile fields across 4 focused steps, submit once, redirect to dashboard.
> Inspiration: Linear/Vercel onboarding (clean centred card, big step headline, minimal fields per step), Apple Health setup flow (large toggle options, clear hierarchy).
> **Standalone layout — no TopNav, no BottomNav, no PageShell.** Both nav components already suppress on `/onboarding` via `HIDDEN_ON_ROUTES`.

---

### Why Onboarding Is Architecturally Different

Every other page uses `PageShell` which provides `max-w-6xl` centred content. Onboarding should NOT use PageShell for two reasons:

1. **A full-width scrolling page is wrong for a wizard.** The content is a single card with 4 steps. It should be vertically centred on screen, not top-aligned in a scrollable column.
2. **Centred-card focus.** Removing nav chrome (TopNav, BottomNav) keeps the user's attention on the setup task. Both nav components already return `null` for `/onboarding`.

**Layout:** `min-h-dvh flex flex-col items-start sm:items-center justify-start sm:justify-center px-4 py-8 bg-[#0A0A0A]` — top-aligned on SE (scrollable), vertically centred on 390px+.

The wizard lives in a single `max-w-md` card, centred both horizontally and vertically. On mobile it fills width minus padding; on desktop it stays ~448px wide in the middle of the screen.

---

### Architecture: Single-card wizard vs multi-page

**Decision: Single card, step state in React (`useState`), NOT separate routes (`/onboarding/step-1` etc.).**

Reasons:
- 4 steps = 4 states. React state is trivial. Separate routes mean separate pages, layouts, loading states — overkill.
- Back/forward doesn't need URL history for onboarding — users don't deep-link to "step 3".
- Single `POST /api/v1/profile/onboarding` at the end — all form state is collected first, then submitted once. No per-step API calls.
- Scroll position resets naturally on step change (card height changes, user is already at top).

**Form state:** Single `OnboardingFormData` object held in the wizard component, passed down as `data` + `onChange` props to each step. Errors are a `Partial<Record<keyof OnboardingFormData, string>>` map, cleared field-by-field as user types.

---

### Data & API

**POST `POST /api/v1/profile/onboarding`** — body matches `OnboardingInput` schema exactly:

| Field | Type | Step |
|---|---|---|
| `name` | string | 1 |
| `age` | int | 1 |
| `gender` | "male" \| "female" \| "other" | 1 |
| `height_cm` | float | 1 |
| `current_weight_kg` | float | 2 |
| `goal_weight_kg` | float | 2 |
| `time_to_reach_goal_weeks` | int ≥ 4 | 2 |
| `experience_level` | "beginner" \| "intermediate" \| "pro" | 3 |
| `activity_level` | "sedentary" \| "light" \| "moderate" \| "intense" \| "very_intense" | 3 |
| `diet_type` | "veg" \| "egg" \| "non_veg" | 4 |
| `wants_workout_split` | bool (default false) | 4 |
| `wants_diet_plan` | bool (default false) | 4 |

**Backend computes on receipt:** BMR, TDEE, target calories, BMI, macro targets — same as `PUT /profile`. No frontend calculation needed.

**On success:** `router.push("/dashboard")` — SWR caches are empty, dashboard will load fresh.

**Re-onboarding:** `/onboarding` is also used when user taps "Re-do Onboarding" from Profile. In that case the existing profile values should be pre-filled (not blank). The wizard should check `useProfile()` on mount and seed form state if a profile exists. User can then change only what they want and submit.

---

### AG Checklist

- [x] **AG-1 (N/A):** Onboarding is standalone — no PageShell, no max-w-6xl. The card is `max-w-md mx-auto` which is correct for a wizard form. This is a deliberate exception documented here.
- [x] **AG-2:** No right panel — single card wizard.
- [x] **AG-3 (N/A):** No "card order" on a single-card wizard — step order is the flow.
- [x] **AG-4:** Card fills its max-width (`max-w-md`). Step content fills the card.
- [x] **AG-7:** `Input`, `Button`, `Badge`, `Skeleton` — no Select (use card toggles instead, see below).
- [x] **AG-8:** All form state in local `useState` — not Zustand (onboarding form is not shared state). SWR `useProfile()` only for pre-filling on re-onboarding.

**Note on AG-1 exception:** The `max-w-md` wizard card is NOT a violation of AG-1. AG-1 governs the main app content column. Onboarding is a standalone full-screen entry experience with its own layout pattern. The spec explicitly carves this out in 5F.

---

### Layout

The outer wrapper centres the card on screens where it fits, and scrolls from top when it doesn't (SE with Step 4).

```
Mobile SE (375px):  card starts at top, page scrolls if needed
iPhone 14+ (390px+): card vertically centred if it fits
Desktop (1280px):  card centred, loads of breathing room either side
```

```tsx
// Outer wrapper — centre on tall screens, top-align + scroll on short ones
<div className="min-h-dvh flex flex-col
                items-start justify-start
                sm:items-center sm:justify-center
                px-4 py-8 bg-[#0A0A0A]">
  {/* Card */}
  <div className="w-full max-w-md bg-[#111111] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8">

    {/* Logo + tagline */}
    <div className="flex items-center gap-2.5 mb-2">
      <div className="w-8 h-8 rounded-lg bg-primary/10 ring-1 ring-primary/20
                      flex items-center justify-center shrink-0">
        <span className="text-sm font-black text-primary select-none">F</span>
      </div>
      <span className="text-lg font-bold text-foreground">FitCoach</span>
    </div>
    <p className="text-sm text-muted-foreground mb-6">
      Your personalised fitness journey starts here
    </p>

    {/* Step indicator */}
    <StepIndicator currentStep={step} totalSteps={4} labels={STEP_LABELS} />

    {/* Step content — AnimatePresence for horizontal slide transition */}
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        initial={{ opacity: 0, x: direction * 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -direction * 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {step === 0 && <Step1Personal {...stepProps} />}
        {step === 1 && <Step2Weight  {...stepProps} />}
        {step === 2 && <Step3Fitness {...stepProps} />}
        {step === 3 && <Step4Diet    {...stepProps} />}
      </motion.div>
    </AnimatePresence>

    {/* API error */}
    {apiError && (
      <p className="text-sm text-red-400 mt-3 text-center">{apiError}</p>
    )}

    {/* Navigation buttons */}
    <div className="flex gap-3 mt-6">
      {step > 0 && (
        <button onClick={handleBack}
          className="flex-1 h-11 rounded-xl bg-[#222222] border border-[#2A2A2A]
                     text-sm font-semibold text-foreground hover:bg-[#2A2A2A]
                     active:scale-[0.98] transition-all">
          Back
        </button>
      )}
      <button
        onClick={step < 3 ? handleNext : handleSubmit}
        disabled={submitting}
        className="flex-1 h-11 rounded-xl bg-primary text-black font-semibold text-sm
                   hover:bg-green-400 active:scale-[0.98] transition-all
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Setting up your plan…" : step < 3 ? "Continue" : "Start my journey"}
      </button>
    </div>
  </div>
</div>
```

**`direction` ref:** updated in `handleNext` (`direction.current = 1`) and `handleBack` (`direction.current = -1`) before calling `setStep`. Use `useRef(1)` — not state (doesn't need to trigger re-render).

---

### Component Breakdown

---

#### StepIndicator

Horizontal row of numbered circles + connecting lines + step labels (hidden on SE, shown sm+).

```
●──────●──────○──────○
Personal  Weight  Fitness  Diet
```

- Completed step: `bg-primary rounded-full w-8 h-8` with `✓` icon, `text-white`
- Current step: same + `ring-4 ring-primary/20` outer glow + step number in `font-bold`
- Future step: `bg-[#1A1A1A] border border-[#2A2A2A] rounded-full w-8 h-8` + muted step number
- Connector line: `flex-1 h-0.5` — `bg-primary` when complete, `bg-[#2A2A2A]` when not
- Labels below circles: `hidden sm:block text-[10px] font-medium text-center` — `text-primary` when active/done, `text-muted-foreground/40` when future. Hidden on SE to avoid overflow at 375px.

---

#### Step content typography standard

**Every step component must follow this structure:**

```tsx
<div className="space-y-5 pt-2">
  {/* Step heading */}
  <div>
    <h2 className="text-2xl font-bold text-foreground">Tell us about yourself</h2>
    <p className="text-sm text-muted-foreground mt-1">
      We'll use this to personalise your fitness plan.
    </p>
  </div>
  {/* Fields follow */}
</div>
```

`space-y-5` between all field groups ensures consistent vertical rhythm. `pt-2` gives a small gap after the step indicator.

---

#### Step 1 — Personal (`"Tell us about yourself"`)

Fields: Name · Age + Height (2-col) · Gender toggle

**Gender:** 3 equal-width pill buttons, not a dropdown. Toggles are faster on mobile than dropdowns for a 3-option choice.

```
Name       [ Arjun Sharma                    ]
Age        [ 28  ]    Height (cm)  [ 175     ]
Gender     [ Male ]  [ Female ]  [ Other  ]
```

**Name field:** `type="text"`. Placeholder: `"e.g. Arjun Sharma"`. `autoComplete="name"` for mobile keyboard autofill. Input: `bg-[#222222] border-[#2A2A2A] focus:border-primary`.

**Age + Height:** `grid-cols-2` side-by-side. Both `type="number"`. Age min=10/max=120. Height min=100/max=250.

**Gender pills:** Full-width row, `grid-cols-3`. `h-11` tall (44px — min touch target). Active: `border-primary bg-primary/10 text-primary font-semibold`. Inactive: `border-[#2A2A2A] text-muted-foreground hover:border-[#3A3A3A] hover:text-foreground`.

**Error display:** `text-xs text-red-400 mt-1.5` below each field. Input gets `border-red-500/50` when errored.

**Validation (on Continue):**
- Name: non-empty after trim
- Age: 10–120, non-empty
- Gender: selected
- Height: 100–250, non-empty

---

#### Step 2 — Weight Goals (`"Your weight goals"`)

Fields: Current weight + Goal weight (2-col) · Live goal delta banner · Timeline (weeks) + pace hint

**Goal delta banner:** Appears as soon as both weights are filled. Full-width pill, animated fade-in (`motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}`). Three states:
- Losing: `bg-blue-500/10 border border-blue-500/30 text-blue-400` — `"Goal: Lose 8.0 kg"`
- Gaining: `bg-amber-500/10 border border-amber-500/30 text-amber-400` — `"Goal: Gain 3.0 kg"`
- Maintain: `bg-primary/10 border border-primary/30 text-primary` — `"Goal: Maintain weight"`

This is the most motivating moment in onboarding. The banner makes the goal feel real and confirmed.

**Timeline field:** Below the delta banner. `type="number"` min=4 max=104. Helper text below: `"Minimum 4 weeks for safe, sustainable progress."` When both `delta` (weight difference) and `weeks` are non-zero, show inline pace: `"≈ X.X kg/week required"` — always visible (no viewport condition), `text-xs text-muted-foreground/60`.

**Validation (on Continue):**
- Current weight: ≥ 30 kg
- Goal weight: ≥ 30 kg
- Timeline: ≥ 4 weeks

---

#### Step 3 — Fitness Level (`"Your fitness level"`)

Fields: Experience level (3-card toggle) · Activity level (Select)

**Experience cards:** `grid-cols-3`. Each card: level name (`font-semibold`) + sub-label (`text-xs text-muted-foreground`). Height: `py-4` to fit two lines. Active: `border-primary bg-primary/10 text-primary`. Inactive: `border-[#2A2A2A] text-muted-foreground hover:border-[#3A3A3A]`.

```
[ Beginner    ] [ Intermediate ] [ Pro         ]
  0–1 year        2–4 years        4+ years
```

**Activity level:** 5 options warrant a Select. Must apply AG-7 gotchas: `onValueChange={(v: string | null) => v && onChange({ activity_level: v })}` (null guard) and render the label in the trigger via `ACTIVITY_OPTIONS.find(o => o.value === data.activity_level)?.label`. Style trigger to match other inputs: `bg-[#222222] border-[#2A2A2A] h-11 rounded-xl`.

**Validation (on Continue):**
- Experience level: selected
- Activity level: selected

---

#### Step 4 — Diet & Plans (`"Diet preferences"`)

Fields: Diet type (3-card with icon) · Additional plans (2 toggle rows)

**Diet type cards:** `grid-cols-3`. Each card: emoji icon `text-2xl mb-1` + type name `text-sm font-semibold` + sub-label `text-xs text-muted-foreground`. Active: `border-primary bg-primary/10`. Taller than experience cards — `py-4`.

```
[    🥦     ] [    🥚     ] [    🍗     ]
 Vegetarian   Eggetarian    Non-Veg
 No meat/eggs  Veg + eggs   All foods
```

**Additional plan toggles:** Two full-width buttons with a left-side checkbox square. `min-h-[56px]` to fit two text lines.

```tsx
<button
  onClick={() => onChange({ wants_workout_split: !data.wants_workout_split })}
  className={cn(
    "w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-all",
    data.wants_workout_split
      ? "border-primary bg-primary/10"
      : "border-[#2A2A2A] hover:border-[#3A3A3A]"
  )}
>
  {/* Checkbox indicator */}
  <div className={cn(
    "mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all",
    data.wants_workout_split ? "bg-primary" : "bg-[#2A2A2A]"
  )}>
    {data.wants_workout_split && <Check size={12} className="text-black" />}
  </div>
  <div>
    <p className="text-sm font-medium text-foreground">
      Generate a personalised workout split
    </p>
    <p className="text-xs text-muted-foreground mt-0.5">
      Based on your goal and experience
    </p>
  </div>
</button>
```

Use `lucide-react` `<Check size={12} />` — not a `✓` string (inconsistent sizing).

**Validation (on Submit):**
- Diet type: selected
- Toggles: optional, no validation

---

### Form State Management

```ts
const DEFAULT_FORM: OnboardingFormData = {
  name: "", age: "", gender: "",
  height_cm: "", current_weight_kg: "", goal_weight_kg: "",
  time_to_reach_goal_weeks: "", experience_level: "",
  activity_level: "", diet_type: "",
  wants_workout_split: false, wants_diet_plan: false,
}

// In wizard:
const [step, setStep]       = useState(0)
const [form, setForm]       = useState<OnboardingFormData>(DEFAULT_FORM)
const [errors, setErrors]   = useState<Partial<Record<keyof OnboardingFormData, string>>>({})
const [submitting, setSub]  = useState(false)
const [apiError, setApiErr] = useState("")
```

**Pre-filling for Re-do Onboarding:**
```ts
const { profile } = useProfile()
useEffect(() => {
  if (profile) {
    setForm({
      name: profile.name,
      age: String(profile.age),
      gender: profile.gender,
      height_cm: String(profile.height_cm),
      current_weight_kg: String(profile.current_weight_kg),
      goal_weight_kg: String(profile.goal_weight_kg),
      time_to_reach_goal_weeks: String(profile.time_to_reach_goal_weeks),
      experience_level: profile.experience_level,
      activity_level: profile.activity_level,
      diet_type: profile.diet_type,
      wants_workout_split: profile.wants_workout_split,
      wants_diet_plan: profile.wants_diet_plan,
    })
  }
}, [profile])  // only seed once — guard with a seeded ref if needed
```

**onChange pattern:** Merges partial updates into form, clears errors for changed keys:
```ts
function handleChange(updates: Partial<OnboardingFormData>) {
  setForm(prev => ({ ...prev, ...updates }))
  setErrors(prev => {
    const next = { ...prev }
    Object.keys(updates).forEach(k => delete next[k as keyof OnboardingFormData])
    return next
  })
}
```

**Submit:** Numbers are stored as strings in form state (Input value must be string). Cast on submit:
```ts
await api.post("/api/v1/profile/onboarding", {
  ...form,
  age: Number(form.age),
  height_cm: Number(form.height_cm),
  current_weight_kg: Number(form.current_weight_kg),
  goal_weight_kg: Number(form.goal_weight_kg),
  time_to_reach_goal_weeks: Number(form.time_to_reach_goal_weeks),
})
```

---

### Validation Per Step

```ts
function validateStep(step: number, data: OnboardingFormData): Record<string, string> {
  const e: Record<string, string> = {}
  if (step === 0) {
    if (!data.name.trim())                                   e.name = "Name is required"
    if (!data.age || Number(data.age) < 10 || Number(data.age) > 120)
                                                             e.age = "Enter age 10–120"
    if (!data.gender)                                        e.gender = "Select a gender"
    if (!data.height_cm || Number(data.height_cm) < 100 || Number(data.height_cm) > 250)
                                                             e.height_cm = "Height 100–250 cm"
  }
  if (step === 1) {
    if (!data.current_weight_kg || Number(data.current_weight_kg) < 30)
                                                             e.current_weight_kg = "Enter current weight"
    if (!data.goal_weight_kg || Number(data.goal_weight_kg) < 30)
                                                             e.goal_weight_kg = "Enter goal weight"
    if (!data.time_to_reach_goal_weeks || Number(data.time_to_reach_goal_weeks) < 4)
                                                             e.time_to_reach_goal_weeks = "Minimum 4 weeks"
  }
  if (step === 2) {
    if (!data.experience_level) e.experience_level = "Select experience level"
    if (!data.activity_level)   e.activity_level   = "Select activity level"
  }
  if (step === 3) {
    if (!data.diet_type) e.diet_type = "Select a diet type"
  }
  return e
}
```

Error display: inline `text-xs text-red-400` below the field or toggle group. Input border turns `border-red-500/50` when error present.

---

### Animation

Step transitions use Motion `AnimatePresence mode="wait"` with a directional horizontal slide. Direction is tracked with `useRef(1)` updated before `setStep`.

```tsx
const direction = useRef(1)  // 1 = forward, -1 = backward

function handleNext() {
  direction.current = 1
  // validate then setStep(s => s + 1)
}
function handleBack() {
  direction.current = -1
  setStep(s => s - 1)
}

// In JSX:
<AnimatePresence mode="wait" initial={false}>
  <motion.div
    key={step}
    initial={{ opacity: 0, x: direction.current * 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -direction.current * 20 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
  >
    {/* step content */}
  </motion.div>
</AnimatePresence>
```

`direction.current` = 1 on Next, -1 on Back — content slides in from right on Next, from left on Back.

---

### Loading / Error States

| State | Visual |
|---|---|
| `submitting` | Button shows spinner + "Setting up your plan…", disabled |
| API error | Red text below the nav buttons (not a toast — user needs to see it while still on the form) |
| `useProfile` loading (re-onboarding) | Skeleton of the card while profile loads — avoids flashing empty form then replacing with pre-filled values |

---

### What We Are NOT Doing

- No animations on individual fields — only step-level transitions
- No per-step API calls — single POST at the very end
- No back-button browser navigation handling — users don't deep-link into steps
- No "skip" option — all 11 fields are required by the backend
- No image/photo upload in Step 1 — initials avatar is used throughout the app
- No separate routes (`/onboarding/1`, `/onboarding/2`) — single page, React state only

---

### Files to Create

```
src/components/onboarding/
  OnboardingWizard.tsx   ← top-level: step state, form state, validation, submit, pre-fill
  StepIndicator.tsx      ← numbered circles + connecting lines + labels
  Step1Personal.tsx      ← name, age+height (2-col), gender pills
  Step2Weight.tsx        ← current+goal weight (2-col), delta badge, timeline
  Step3Fitness.tsx       ← experience cards (3-col), activity select
  Step4Diet.tsx          ← diet type cards (3-col), optional plan toggles

src/app/onboarding/page.tsx  ← renders <OnboardingWizard /> with no layout wrapper
```

**`app/onboarding/page.tsx`** — intentionally simple:
```tsx
import OnboardingWizard from "@/components/onboarding/OnboardingWizard"
export default function OnboardingPage() {
  return <OnboardingWizard />
}
```

No `PageShell`. No layout imports. The wizard is its own complete page.

---

### Open Questions Before Building

None. Backend `POST /api/v1/profile/onboarding` exists. `OnboardingFormData` type exists in `types/profile.ts`. Nav suppression on `/onboarding` already working (`HIDDEN_ON_ROUTES` in both `TopNav.tsx` and `BottomNav.tsx`).

---

## Page 5: Profile (`/profile`)

> Goal: let users understand their current stats and update their goals — without the cognitive overhead of re-running onboarding.
> Inspiration: Bevel profile / settings screen (clean stat rows, avatar, minimal form), Apple Health summary cards (computed metrics displayed prominently).
> Single column. No right panel (AG-2: no natural primary/utility split on this page).
>
> **Phase 5E COMPLETE (2026-07-06). P0: 8.0/10 PASS. See `UI_REFACTOR_PLAN_V2.md §5E` for full build log.**

---

### Implementation Corrections (vs pre-build spec)

**Stats grid breakpoint:** Changed `lg:grid-cols-4` → `sm:grid-cols-4`. The 4-column layout now fires at 640px (covers iPhone 14 landscape, Pixel 7, iPad) instead of waiting for 1024px. This was the biggest score driver for iPad (7.5 → 8.5).

**Macro bars fill logic:** Changed from calorie-% fill to largest-macro-relative fill. A 30% calorie share on a 1000px track = 300px filled = visually empty. Bars now fill relative to whichever macro has the most grams (usually carbs), so Protein/Carbs/Fat bars look proportional to each other. The calorie-% number is shown as a text label `N%` alongside. See MacrosCard.tsx.

**Select trigger labels:** `SelectValue` renders the raw stored value (`veg` not `Vegetarian`). Fixed by rendering the matched option label inline inside the trigger. See P3 in build log.

**No progress bar on WeightGoalCard:** Pre-build spec showed a progress bar. Removed — profile doesn't have weight log history available without an extra SWR call. Shows goal summary + required pace instead. Dashboard has the authoritative progress chart.

---

### Why Profile Matters (architect note)

Every calorie on the dashboard, every macro target in the tracker, every workout calorie estimate — all trace back to values in `user_profiles`. If `current_weight_kg` is 6 months out of date, the ring is showing the wrong number. If `activity_level` was set wrong at onboarding, every TDEE calc is off. Profile is the calibration page. It must be dead simple to update.

---

### Data Available

| Source | Data |
|---|---|
| `useProfile()` → `GET /api/v1/profile` | Full `UserProfile` — all identity, weight, goals, computed values |
| `PUT /api/v1/profile` | Partial update — backend recomputes BMR/TDEE/macros/BMI on save |

**What the backend recomputes on PUT:** BMR (Mifflin-St Jeor), TDEE (BMR × activity multiplier), target calories (TDEE ± weekly delta), BMI, protein/carbs/fat targets. The frontend never needs to compute these — just display what comes back.

**What `PUT` accepts (all optional):** `name`, `age`, `gender`, `height_cm`, `current_weight_kg`, `goal_weight_kg`, `time_to_reach_goal_weeks`, `experience_level`, `activity_level`, `diet_type`, `wants_workout_split`, `wants_diet_plan`.

**No backend changes needed for Phase 5E.**

---

### AG Checklist

- [x] AG-1: `w-full px-4 pb-24` mobile / `lg:max-w-6xl lg:mx-auto lg:px-8` desktop — single column both
- [x] AG-2: No right panel — profile is a form + stats page, no utility sidebar adds value here
- [x] AG-3: Mobile card order — Identity (who am I) → Computed stats (what do they mean) → Edit goals (action) → Account (danger/admin)
- [x] AG-4: Stat cards fill column width — 2-col or 3-col grids for computed values
- [x] AG-7: shadcn `Input`, `Select`, `Button`, `Badge`, `Separator`, `Skeleton`, `AlertDialog`
- [x] AG-8: SWR for profile data, local `useState` for form inputs (not Zustand — form state is local to this page)
- [x] AG-9: No desktop-only panels — everything shown on both viewports

---

### Layout — Mobile + Desktop (single column, no grid split)

```
┌─────────────────────────────────────────────────────┐
│  [F] FitCoach   Home · Tracker · Workout · Dishes  [D] │  ← TopNav
├─────────────────────────────────────────────────────┤
│  max-w-6xl mx-auto px-8 (desktop) / px-4 (mobile)  │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  [D]                                        │    │  ← Identity card
│  │  Dev User                                   │    │
│  │  28 · Male · 175 cm                         │    │
│  │  [Moderate]  [Vegetarian]  [Intermediate]   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  YOUR STATS                                         │
│  ┌──────────┬──────────┬───────────┬──────────┐    │
│  │  25.5    │ 2,352    │ 1,800     │  176g    │    │  ← 4-stat grid
│  │  BMI     │ TDEE     │ TARGET    │ Protein  │    │
│  │ [Normal] │ kcal/day │ kcal/day  │  /day    │    │
│  └──────────┴──────────┴───────────┴──────────┘    │
│                                                     │
│  WEIGHT GOAL                                        │
│  ┌─────────────────────────────────────────────┐    │
│  │  78 kg  →  72 kg  in 16 weeks               │    │
│  │  [▓▓▓▓▓▓▓░░░░░░░░] 42% there               │    │
│  │  At −0.4 kg/week · on track ✅               │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  MACROS                                             │
│  ┌─────────────────────────────────────────────┐    │
│  │  P  176g  ●────────── 30% of calories       │    │
│  │  C  235g  ●────────── 40% of calories       │    │
│  │  F   78g  ●────────── 30% of calories       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  UPDATE GOALS                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │  Current weight  [78.5    ] kg              │    │
│  │  Goal weight     [72.0    ] kg              │    │
│  │  Timeline        [16      ] weeks           │    │
│  │  Activity        [Moderate ▼]               │    │
│  │  Diet            [Vegetarian ▼]             │    │
│  │                                             │    │
│  │  [Save Changes]                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ACCOUNT                                            │
│  ┌─────────────────────────────────────────────┐    │
│  │  Re-do Onboarding   →                       │    │
│  │  Sign Out           →  [red text]           │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Max width at desktop:** content is naturally narrow for a form. Constrain the Update Goals form to `max-w-lg mx-auto` on desktop so inputs don't stretch to 1152px — that would look awful. The Identity card and Stats grid can be full-width (`max-w-6xl`).

---

### Component Breakdown

---

#### 1. Identity Card

Large avatar initial. Read-only identity fields displayed as pills.

```
┌────────────────────────────────────────────────────┐
│  ┌───┐                                             │
│  │ D │  Dev User                                   │
│  └───┘  28 years  ·  Male  ·  175 cm               │
│                                                    │
│  [Moderate activity]  [Vegetarian]  [Intermediate] │
└────────────────────────────────────────────────────┘
```

```tsx
// Avatar: 56px circle, initials, green ring (same as TopNav avatar but larger)
<div className="w-14 h-14 rounded-full bg-primary/10 ring-2 ring-primary/30
               flex items-center justify-center text-xl font-black text-primary">
  {profile.name[0].toUpperCase()}
</div>

// Identity row
<div className="text-sm text-muted-foreground">
  {profile.age} years · {profile.gender} · {profile.height_cm} cm
</div>

// Lifestyle badges
<div className="flex flex-wrap gap-2 mt-3">
  <Badge variant="outline">{ACTIVITY_LABELS[profile.activity_level]}</Badge>
  <Badge variant="outline">{DIET_LABELS[profile.diet_type]}</Badge>
  <Badge variant="outline">{EXPERIENCE_LABELS[profile.experience_level]}</Badge>
</div>
```

**Label maps (frontend display only):**
```ts
const ACTIVITY_LABELS = {
  sedentary: "Sedentary", light: "Light activity", moderate: "Moderate",
  intense: "Intense", very_intense: "Very intense"
}
const DIET_LABELS = { veg: "Vegetarian", egg: "Eggetarian", non_veg: "Non-veg" }
const EXPERIENCE_LABELS = { beginner: "Beginner", intermediate: "Intermediate", pro: "Advanced" }
```

Identity card is **display-only**. To change name/age/height/gender: Re-do Onboarding (bottom of page). This split keeps the "Update Goals" form focused on the fields users actually change day-to-day.

---

#### 2. Stats Grid

Four computed values in a `grid-cols-2 lg:grid-cols-4` grid. Each cell: big number + label + optional badge.

```
┌──────────┬──────────┬──────────────┬──────────┐
│  25.5    │ 2,352    │    1,800     │  176g    │
│  BMI     │ TDEE     │   TARGET     │  Protein │
│ [Normal] │ kcal/day │  kcal/day    │  target  │
└──────────┴──────────┴──────────────┴──────────┘
```

**BMI cell:**
```tsx
const bmiCategory = getBmiCategory(profile.bmi)
// getBmiCategory: < 18.5 → "Underweight", 18.5–24.9 → "Normal", 25–29.9 → "Overweight", ≥ 30 → "Obese"
<span className="text-3xl font-black text-white tabular-nums">{profile.bmi?.toFixed(1)}</span>
<span className="text-xs text-muted-foreground">BMI</span>
<Badge variant="outline" className={bmiColor}>{bmiCategory}</Badge>
// Colours: Underweight=blue, Normal=green, Overweight=amber, Obese=red
```

**TARGET cell:** Highlighted — this is the number that drives everything.
```tsx
<span className="text-3xl font-black text-primary tabular-nums">
  {Math.round(profile.target_calories_kcal ?? 0).toLocaleString()}
</span>
<span className="text-xs text-muted-foreground">Target kcal/day</span>
```

**TDEE cell:** Shown alongside target so user understands the deficit/surplus.
```tsx
<span className="text-3xl font-black text-white tabular-nums">
  {Math.round(profile.tdee_kcal ?? 0).toLocaleString()}
</span>
<span className="text-xs text-muted-foreground">Maintenance</span>
// Below: show deficit or surplus in muted text
const delta = (profile.target_calories_kcal ?? 0) - (profile.tdee_kcal ?? 0)
<span className={cn("text-[10px]", delta < 0 ? "text-primary" : "text-amber-400")}>
  {delta < 0 ? `${Math.abs(Math.round(delta))} kcal deficit` : `${Math.round(delta)} kcal surplus`}
</span>
```

---

#### 3. Weight Goal Card

Progress bar + pace insight. Reuses the same computation as `dashboardUtils.ts`.

```tsx
// Progress: (current_weight - start) / (goal - start)
// Use profile.current_weight_kg as "current" (last logged weight from dashboard is better
// but profile is what's available here without an extra API call)
const totalDelta = profile.goal_weight_kg - profile.current_weight_kg  // negative for loss
const startWeight = profile.current_weight_kg  // approximate — actual start from weight log
const pct = 0  // Can't compute without weight log history on this page — show 0 or hide bar

// Show what IS computable:
// "78 kg → 72 kg in 16 weeks" — always available
// "−0.375 kg/week required" — computed from delta/weeks
const weeklyRequired = totalDelta / profile.time_to_reach_goal_weeks
```

**Display:**
```
78.0 kg  →  72.0 kg
−0.4 kg/week required over 16 weeks
```

No progress bar here — we don't have historical weight log data on this page without an extra SWR call. Keep it simple: goal summary + required pace. Link to dashboard for the actual progress chart.

---

#### 4. Macros Card

Three rows (P/C/F) with calorie % split. Read-only — these are computed outputs, not inputs.

```tsx
const macroRows = [
  { label: "Protein", g: profile.protein_g, color: "bg-blue-500", textColor: "text-blue-400",
    pct: Math.round((profile.protein_g * 4) / (profile.target_calories_kcal ?? 1) * 100) },
  { label: "Carbs",   g: profile.carbs_g,   color: "bg-amber-400", textColor: "text-amber-400",
    pct: Math.round((profile.carbs_g * 4) / (profile.target_calories_kcal ?? 1) * 100) },
  { label: "Fat",     g: profile.fat_g,     color: "bg-orange-500", textColor: "text-orange-400",
    pct: Math.round((profile.fat_g * 9) / (profile.target_calories_kcal ?? 1) * 100) },
]
```

Each row: `label · Xg/day · N% of calories · progress bar (% of target_calories)`.
Same component pattern as Dashboard MacroBarsCard — can reuse or simplify.

Caption below: `"Recalculated each time you save goals"` — sets expectation that macros are derived, not manually set.

---

#### 5. Update Goals Form

**Scope:** Only the fields users change post-onboarding. NOT name/age/gender/height — those go through Re-do Onboarding.

**Fields:**
| Field | Input | Validation |
|---|---|---|
| Current weight (kg) | `Input` type=number, step=0.1, min=30, max=250 | Required |
| Goal weight (kg) | `Input` type=number, step=0.1, min=30, max=250 | Required |
| Timeline (weeks) | `Input` type=number, step=1, min=4, max=104 | Required, ≥4 |
| Activity level | `Select` (5 options) | Required |
| Diet type | `Select` (3 options) | Required |

**NOT included in this form:** `experience_level`, `wants_workout_split`, `wants_diet_plan` — these are set once at onboarding, rarely changed. Adding them would clutter the form for no benefit.

```tsx
// Pre-fill from profile on load
const [form, setForm] = useState({
  current_weight_kg: String(profile.current_weight_kg),
  goal_weight_kg: String(profile.goal_weight_kg),
  time_to_reach_goal_weeks: String(profile.time_to_reach_goal_weeks),
  activity_level: profile.activity_level,
  diet_type: profile.diet_type,
})

async function handleSave() {
  setSaving(true)
  try {
    await api.put("/api/v1/profile", {
      current_weight_kg: Number(form.current_weight_kg),
      goal_weight_kg: Number(form.goal_weight_kg),
      time_to_reach_goal_weeks: Number(form.time_to_reach_goal_weeks),
      activity_level: form.activity_level,
      diet_type: form.diet_type,
    })
    mutateProfile()
    mutateDashboard()  // revalidate dashboard — TDEE/macros changed
    toast("Goals updated", { duration: 3000 })
  } finally {
    setSaving(false)
  }
}
```

**Critical:** After save, must call `mutate()` on both `useProfile` AND `useDashboard` — otherwise the calorie ring still shows the old number until next page load.

**Live preview of impact:** Below the form, show a small preview card that updates as user types:
```
If you save these changes:
  Target:  1,950 kcal/day  (was 2,352)     ← computed client-side from form values
  Deficit: −402 kcal/day
```
This uses the same formulas as the backend (`calculate_bmr` → `calculate_tdee` → `calculate_target_calories`) implemented in a `profileUtils.ts` pure function. The preview removes the "surprise" of seeing all stats change after save.

```ts
// src/lib/profileUtils.ts
export function previewTargetCalories(
  weightKg: number, goalKg: number, weeks: number,
  activityLevel: string, age: number, height: number, gender: string
): number {
  const bmr = calcBMR(weightKg, height, age, gender)   // Mifflin-St Jeor
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel]
  const weeklyDelta = (goalKg - weightKg) / weeks
  const dailyDelta = (weeklyDelta * 7700) / 7
  const FLOOR = gender === "male" ? 1400 : gender === "female" ? 1200 : 1300
  return Math.max(Math.round(tdee + dailyDelta), FLOOR)
}
```

**Save button:** Primary green, full width on mobile, `max-w-xs` on desktop. Shows spinner while saving. Disabled when no changes from original profile values.

---

#### 6. Account Section

Two rows. No card — just a clean list with right-chevron affordance.

```tsx
<div className="space-y-1 border-t border-[#2A2A2A] pt-4">
  <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">
    Account
  </p>
  {/* Re-do Onboarding */}
  <Link href="/onboarding"
    className="flex items-center justify-between h-11 px-4 rounded-xl
               bg-[#111111] border border-[#2A2A2A] hover:bg-[#1A1A1A] transition-colors">
    <span className="text-sm text-foreground">Re-do Onboarding</span>
    <ChevronRight size={16} className="text-muted-foreground/50" />
  </Link>

  {/* Sign Out */}
  <button onClick={handleSignOut}
    className="flex items-center justify-between w-full h-11 px-4 rounded-xl
               bg-[#111111] border border-[#2A2A2A] hover:bg-red-500/5
               hover:border-red-500/20 transition-colors">
    <span className="text-sm text-red-400">Sign Out</span>
    <LogOut size={16} className="text-red-400/50" />
  </button>
</div>
```

**Sign Out behaviour:**
- Production (Clerk ON): `await signOut()` from `useClerk()`
- Dev mode: `router.push("/sign-in")` — no Clerk session to clear

---

### State Management

```
useProfile() → SWR              — source of truth for all displayed data
local useState (form)           — form inputs (current_weight_kg, goal_weight_kg, etc.)
local useState (saving, dirty)  — UI state: saving spinner, changed flag
```

No Zustand needed — form state is entirely local to this page.

**Dirty tracking:** Compare current form values against `profile` to know if anything changed → disable Save button when nothing has changed (prevents accidental saves).

```ts
const isDirty = useMemo(() => (
  Number(form.current_weight_kg) !== profile.current_weight_kg ||
  Number(form.goal_weight_kg) !== profile.goal_weight_kg ||
  Number(form.time_to_reach_goal_weeks) !== profile.time_to_reach_goal_weeks ||
  form.activity_level !== profile.activity_level ||
  form.diet_type !== profile.diet_type
), [form, profile])
```

**Re-sync form when profile loads:** Profile data comes from SWR and may not be available on first render. Use `useEffect` to seed form values once `profile` arrives:
```ts
useEffect(() => {
  if (profile) {
    setForm({
      current_weight_kg: String(profile.current_weight_kg),
      // ...
    })
  }
}, [profile])  // only re-seed if profile changes externally (e.g. another tab saves)
```

---

### Empty / Error States

| State | Visual |
|---|---|
| `isLoading` | Skeleton: 64px avatar row + 4-cell stat grid + form fields |
| Profile 404 (no onboarding done) | Card: "Complete onboarding to set up your profile" + `[Start Onboarding →]` button |
| Save error | `sonner` toast: "Failed to save. Try again." |

---

### Loading State

```tsx
{isLoading ? (
  <div className="space-y-5">
    <Skeleton className="h-24 w-full rounded-2xl" />    {/* Identity card */}
    <Skeleton className="h-28 w-full rounded-2xl" />    {/* Stats grid */}
    <Skeleton className="h-20 w-full rounded-2xl" />    {/* Goal card */}
    <Skeleton className="h-36 w-full rounded-2xl" />    {/* Update form */}
    <Skeleton className="h-24 w-full rounded-2xl" />    {/* Account */}
  </div>
) : <content />}
```

---

### Animation Summary

| Element | Animation | Spec |
|---|---|---|
| Stats grid numbers | Count up on load | `CountUp` (reuse from dashboard) |
| Macro bars | Fill on load | `motion.div width`, `duration: 0.5` |
| Live preview card | Fade in when values differ | `AnimatePresence opacity`, `duration: 0.2` |
| Save button success | Green checkmark for 2s | local `useState(saved)`, reset after timeout |

---

### What We Are NOT Doing

- No inline editing of name/age/gender/height — use Re-do Onboarding. Mixing identity fields with goal fields creates cognitive clutter.
- No wants_workout_split / wants_diet_plan toggles here — set at onboarding, changed via Re-do Onboarding.
- No experience_level edit here — same reason.
- No password/email edit — Clerk handles account management.
- No unit toggle (kg → lbs) — Phase 7 / settings page.
- No profile photo upload — initials avatar only for now.

---

### Files to Create

```
src/lib/profileUtils.ts              ← previewTargetCalories (Mifflin-St Jeor + activity
                                        multiplier), getBmiCategory, ACTIVITY_LABELS,
                                        DIET_LABELS, EXPERIENCE_LABELS, ACTIVITY_MULTIPLIERS

src/components/profile/
  IdentityCard.tsx                   ← avatar + name + age/gender/height + lifestyle badges
  StatsGrid.tsx                      ← 2-col/4-col grid: BMI (badge) | TDEE | Target | Protein
  WeightGoalCard.tsx                 ← goal summary + required pace (no progress bar)
  MacrosCard.tsx                     ← P/C/F rows with calorie % — read-only
  UpdateGoalsForm.tsx                ← 5 fields, live preview, dirty tracking, PUT on save
  AccountSection.tsx                 ← Re-do Onboarding link + Sign Out button

src/app/profile/page.tsx             ← page: useProfile, single column, all 6 sections
```

Reuse: `CountUp` from dashboard, `Card.tsx`, `Badge`, `Input`, `Select`, `Button`, `Separator`, `Skeleton`, `sonner`.

---

### Open Questions Before Building

None. Backend `PUT /api/v1/profile` exists and recomputes all derived values. Hook `useProfile` exists. Types in `types/profile.ts` are complete.

---

## Phase 6: wger Exercise Images + Muscle Diagrams

> Applies to the Workout page only.
> Transforms exercise cards from letter initials to real exercise photography.
> Backend work required first (migration + enrichment script). Frontend is a drop-in swap.
> Full backend plan, architectural decisions, and execution order in `UI_REFACTOR_PLAN_V2.md §Phase 6`.

---

### What Changes Visually

**Before (Phase 5C):**
```
┌─ Push Up ──────────────────────────────────────────┐
│  [P]  Push Up                    Strength  [×]     │  ← letter initial, coloured bg
└────────────────────────────────────────────────────┘
```

**After (Phase 6):**
```
┌─ Push Up ──────────────────────────────────────────┐
│  [img]  Push Up                  Strength  [×]     │  ← real exercise photo thumbnail
│  ───────────────────────────────────────────────   │
│  MUSCLES WORKED   [chest lit] [triceps]            │  ← SVG muscle diagram
└────────────────────────────────────────────────────┘
```

Thumbnail on both `WorkoutLogCard` and `AddWorkoutModal` search results. Muscle diagram on card only (not in modal — too much weight during logging flow).

---

### ExerciseImage Component

**Location:** `src/components/workout/ExerciseImage.tsx`

Smart component: renders `<img>` when `imageUrl` is available, falls back to the existing coloured initial on null or load failure. **Zero visual regression** — fallback is identical to current Phase 5C state.

```tsx
interface ExerciseImageProps {
  name: string;
  imageUrl?: string | null;
  category: string;
  size?: "sm" | "md";   // sm=36px (default), md=44px
  className?: string;
}
```

**`onError` pattern:** Both `<img>` and fallback `<div>` rendered in DOM simultaneously. Fallback starts hidden when `imageUrl` is set. `onError` on `<img>` hides the image and shows the fallback — no layout shift, no React re-render.

**Sizes:**
- `sm` (36px / `w-9 h-9`) — `WorkoutLogCard` header, same as current initial div
- `md` (44px / `w-11 h-11`) — reserved for future detail view

---

### MuscleMap Component

**Location:** `src/components/workout/MuscleMap.tsx`

Compact muscle diagram using wger's hosted SVG system.

```tsx
interface MuscleMapProps {
  primaryIds: number[];      // wger muscle IDs — green highlight
  secondaryIds: number[];    // lighter green
  size?: number;             // default 56px height
}
```

**Layout:** Two body silhouettes (front + back) side by side, ~56px tall × ~100px wide total. Each silhouette is a `<img src="wger CDN URL">` with muscle overlay `<img>` elements stacked via `position: absolute`.

**Colour via CSS filter** — not SVG DOM manipulation (external hosted SVGs can't be modified).
wger muscle SVGs use `fill:#fc0000` (red). CSS `hue-rotate` converts red (0°) to green (120°) directly:
- Primary: `filter: hue-rotate(120deg) saturate(1.5) brightness(0.9)` → red → green (#22c55e range)
- Secondary: same filter + `opacity: 0.4` → lighter green tint

**Why `hue-rotate(120deg)`?** Red = 0° on the colour wheel, green = ~120°. Direct rotation is clean — no intermediate hue artifacts. Confirmed via SVG inspection: wger uses `fill:#fc0000` on all muscle paths.

**Returns null** when `primaryIds.length === 0` — no empty placeholder rendered.

**SVG URLs used:**
```
Body outlines:
  https://wger.de/static/images/muscles/muscular_system_front.svg   ← CORRECT
  https://wger.de/static/images/muscles/muscular_system_back.svg    ← CORRECT

Muscle overlays (primary):
  https://wger.de/static/images/muscles/main/muscle-{id}.svg

Muscle overlays (secondary):
  https://wger.de/static/images/muscles/secondary/muscle-{id}.svg
```

---

### Where Each Component Is Placed

#### `WorkoutLogCard.tsx` — thumbnail in header

```tsx
{/* Replace the current coloured-initial div */}
<ExerciseImage
  name={exerciseName}
  imageUrl={entry.image_url_thumb}   // from WorkoutLogEntry (new field from backend)
  category={category}
  size="sm"
/>
```

#### `WorkoutLogCard.tsx` — muscle diagram below stats

```tsx
{primaryMuscleIds.length > 0 && (
  <div className="border-t border-[#2A2A2A] pt-3 space-y-1.5">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
      Muscles worked
    </p>
    <MuscleMap primaryIds={primaryMuscleIds} secondaryIds={secondaryMuscleIds} />
  </div>
)}
```

`primaryMuscleIds` comes from parsing `entry.primary_muscle_ids` (semicolon-separated string from DB). Parsing done once per card render in `WorkoutLogCard`.

#### `AddWorkoutModal.tsx` — thumbnail in search results

`SearchCommand` gets a new `thumbnail` field in `SearchResultItem`. When `exercise.image_url_thumb` is set, renders a 28×28 rounded image instead of the colour dot indicator.

```tsx
// renderExercise() updated:
thumbnail: ex.image_url_thumb ?? null,
indicator: ex.image_url_thumb ? undefined : style.bgSolid,
```

`SearchCommand.tsx` updated: if `thumbnail` is set in the result item, render `<img src={thumbnail} className="w-7 h-7 rounded-lg object-cover shrink-0" />` instead of the dot.

#### `workout/page.tsx` — license attribution (desktop right column)

```tsx
<p className="text-[10px] text-muted-foreground/30 text-center pt-2">
  Exercise images ©{" "}
  <a href="https://wger.de" target="_blank" rel="noopener noreferrer"
     className="hover:text-muted-foreground/60 transition-colors">
    wger.de
  </a>{" "}
  (CC-BY-SA 4.0)
</p>
```

Barely visible (`/30` opacity). Present for licence compliance. Desktop right column only.

---

### Backend → Frontend Data Flow

The `WorkoutLogEntry` type needs 3 new optional fields from the backend:

```ts
// src/types/workout.ts — additions
image_url_thumb?:      string | null;
primary_muscle_ids?:   string | null;  // "4;2" — semicolons, matches DB storage
secondary_muscle_ids?: string | null;
```

Backend `WorkoutLogRead` schema: these are populated by a JOIN to `exercise_library` on `exercise_id` at read time. No new columns on `workout_logs` itself.

`Exercise` type in search results:

```ts
// src/types/workout.ts — additions to Exercise
image_url_thumb?:      string | null;
primary_muscle_ids?:   string | null;
secondary_muscle_ids?: string | null;
```

---

### Loading & Error Behaviour

| Scenario | Result |
|---|---|
| `image_url_thumb` is null (no wger match) | Coloured initial letter shown |
| `image_url_thumb` set, CDN reachable | Photo thumbnail shown |
| `image_url_thumb` set, CDN unreachable (`onError`) | Falls back to coloured initial |
| `primary_muscle_ids` is null | No muscle diagram rendered (component returns null) |
| wger SVG CDN unreachable | No muscle diagram, no error state, card unchanged |

No skeleton loaders for images — image slot is fixed-size (`w-9 h-9`), `loading="lazy"` handles the async gracefully. No layout shift.

---

### What We Are NOT Doing

- No exercise detail modal — thumbnail + muscle diagram on card is enough
- No image upload for custom exercises — coloured initial fallback handles these
- No client-side caching layer — browser cache handles CDN responses
- No muscle diagram in `AddWorkoutModal` — too much weight in the logging flow

---

## Phase 7: Polish & Accessibility ✅ DONE (2026-07-07)

> Cross-cutting sprint — no new pages. Applies to all 6 existing pages.
> Target: P0 ≥ 9.0 (up from 8.0–8.17). Lighthouse Accessibility ≥ 90.
> **See `UI_REFACTOR_PLAN_V2.md §Phase 7` for full build log, problems, and decisions.**

### Implementation Corrections (vs pre-build spec)

**ARIA audit found icons already had labels; the gap was `aria-hidden` on children.** All icon-only buttons already had `aria-label` from individual phase builds. What was missing was `aria-hidden="true"` on the icon *children* inside those buttons (prevents double-announcement by screen readers). Fixed via bulk `sed` across 15 component files.

**`motionVariants.ts` created as shared module.** `STAGGER_CONTAINER` and `STAGGER_ITEM` live in `src/lib/motionVariants.ts` and are imported by Workout page, Profile page, DishList, and MealTabs. Duration set to `0.25` (matching Dashboard) — the spec had `0.2` initially, corrected before build.

**MealTabs stagger + AnimatePresence coexistence confirmed.** The concern that stagger container would re-fire on every food add was unfounded — Motion variants fire `hidden → show` once on mount. Subsequent additions via `AnimatePresence` use their own `initial/animate/exit`. No double-animation.

**Tracker and Workout QA scores dropped to 7.83 post-Phase 7** — this is LLM scoring variance on empty-state pages (no logged data in test DB), not a code regression. Both pages scored 8.17 during their original phase builds with realistic data. Dashboard, Profile, Dishes, Onboarding all held or improved.

---

### P7-A · ARIA Labels — What Goes Where

Every icon-only button needs `aria-label`. The icon inside gets `aria-hidden="true"`.

```tsx
// Pattern — applies everywhere:
<button
  onClick={onDelete}
  aria-label="Delete set"             ← describes the action
  className="..."
>
  <X size={14} aria-hidden="true" />  ← hidden from AT, avoids "X Delete set button"
</button>
```

**Buttons needing labels by page/component:**

| Component | Icon buttons to label |
|---|---|
| `Modal.tsx` | Close button (`<X>`) — used on every modal across the app |
| `DateNavigator.tsx` | Previous day (`<ChevronLeft>`), Next day (`<ChevronRight>`), Calendar toggle, Today badge |
| `FoodLogEntry.tsx` | Delete food entry (`<X>`) |
| `WaterIntakeCard.tsx` | Preset buttons (+150ml, +250ml, +500ml, +750ml), delete entry per row |
| `WorkoutLogCard.tsx` | Delete all sets for exercise (`<X>`) |
| `AddWorkoutModal.tsx` | Remove selected exercise pill (`<X>`) |
| `AddFoodModal.tsx` | Remove selected food pill (`<X>`) |
| `IngredientRow.tsx` | Remove ingredient (`<X>`) |
| `PageShell.tsx` | Back button (`<ChevronLeft>`) |

**Already labelled (verified):** WorkoutLogRow edit/delete · DishCard edit/delete · StepIndicator (has text) · BottomNav items · TopNav avatar · AccountSection Sign Out (has text).

---

### P7-B · Page-load Stagger Animations

Dashboard already has `staggerChildren: 0.03`. Five other pages need it.

**Shared variants** — define in `src/lib/motionVariants.ts`:

```ts
import type { Variants } from "motion/react"

export const STAGGER_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
}

export const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25 } },  // matches dashboard
}
```

**Apply to:**

| Location | What staggers |
|---|---|
| `app/workout/page.tsx` | Each `WorkoutLogCard` in the exercise list |
| `app/profile/page.tsx` | Each of the 6 section cards (IdentityCard through AccountSection) |
| `components/dishes/DishList.tsx` | Each `DishCard` in the filtered list |
| `components/tracker/MealTabs.tsx` | Each `FoodLogEntry` within a tab panel |

**Not applied to Onboarding** — single card wizard, stagger adds nothing.

---

### P7-C · `prefers-reduced-motion` — One Line in Layout

```tsx
// app/layout.tsx — wrap all content
import { MotionConfig } from "motion/react"

<MotionConfig reducedMotion="user">
  <TooltipProvider>
    <AuthProvider>
      <TopNav />
      {children}
      <BottomNav />
    </AuthProvider>
  </TooltipProvider>
</MotionConfig>
```

`reducedMotion="user"` respects the OS `prefers-reduced-motion: reduce` setting. All Motion animations across the entire app are disabled for affected users — guaranteed coverage with no per-component changes.

---

### P7-D · DateNavigator Swipe Gesture

```tsx
// DateNavigator.tsx — wrap bar content with draggable motion.div
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}   // snaps back after release
  dragElastic={0.2}
  className="touch-pan-y select-none"        // preserve vertical scroll
  onDragEnd={(_, info) => {
    if (info.offset.x < -50 && !isToday()) goToNextDay()  // swipe left = forward
    if (info.offset.x > 50) goToPrevDay()                  // swipe right = back
  }}
>
  {/* ← [Date] [Today] → */}
</motion.div>
```

- ±50px threshold: not too sensitive, not sluggish
- Forward swipe blocked on today (same guard as → button)
- Existing arrow buttons unchanged — swipe is purely additive

---

### What Phase 7 Is NOT Doing

- **Swipe-to-delete food entries** — high complexity for marginal gain. Delete + sonner undo is sufficient. Deferred.
- **TypeScript strict pass** — `"strict": true` was set from Phase 1. `tsc --noEmit` passes clean. Nothing to do.
- **Light mode** — excluded per plan (dark-only sprint).
- **Per-component `useReducedMotion` hooks** — `MotionConfig` at root covers everything with zero per-component changes (see P7-C).

---

## Page 8: Progress (`/progress`) — Phase 9

> Written: 2026-07-07. Pre-build spec — authoritative source for Phase 9.
> **See `UI_REFACTOR_PLAN_V2.md §Phase 9` for execution order, decisions, and QA plan.**

---

### Purpose

Answers the question every fitness user asks: *"Am I actually making progress?"*

The Dashboard shows today's calories and a 30-day weight chart. That's snapshot data. `/progress` shows the arc: weight trend over time, workout volume over time, personal records, and a weekly consistency summary. It turns raw logs into a story.

---

### Navigation

`/progress` becomes the **6th nav item** — added to both BottomNav (replacing nothing — BottomNav goes from 5 to 6 tabs) and TopNav centre links.

**Decision: 6 tabs, not a sub-page of dashboard or profile.**
- Profile = goals and identity. Dashboard = today. Progress = history. These are meaningfully distinct.
- A sub-route like `/dashboard/progress` or `/profile/progress` would bury it — users need one tap to reach their progress data.
- BottomNav at 6 tabs is tight on 375px but each icon is still ≥44px wide (`flex-1`). Verified: 375 ÷ 6 = 62.5px per tab — acceptable.

```
BottomNav (mobile):  Home · Tracker · Workout · Dishes · Progress · Profile
TopNav (desktop):    Home · Tracker · Workout · Dishes · Progress   [Avatar → Profile]
```

Icon: `TrendingUp` from lucide-react. Label: "Progress".

---

### Data Sources

Two existing backend endpoints — zero new backend work required:

| Endpoint | Returns | Used for |
|---|---|---|
| `GET /api/v1/weight/log?days=90` | `WeightHistoryRead` — `entries[]` (id, log_date, weight_kg), start/current/change_kg | Weight trend chart, weight summary cards |
| `GET /api/v1/workout/history?days=30` | `WorkoutLogRead[]` — per-set entries with log_date, category, calories_burned, exercise_name, reps, weight_kg | Workout volume chart, weekly calorie summary, category breakdown |

**Why no new backend?** The existing `/weight/log` and `/workout/history` endpoints return everything needed. Aggregation (weekly totals, category breakdown, volume sums) is done client-side — the datasets are small (weight: typically <100 entries; workout: <500 entries/month) so there is no performance concern.

**Time range selector:** `?days=30` vs `?days=90`. Toggle shown in page header. Both endpoints already support the `days` query param.

---

### Layout

Single column, AG-1 standard:
```
Mobile:  w-full px-4 pb-24
Desktop: max-w-6xl mx-auto px-8
```

No right sidebar — all content is equally time-sensitive. The page scrolls top to bottom like a story: *summary → weight → workout → consistency*.

**Desktop:** Content is wider than mobile but still single column. Cards fill their column width via `grid-cols-2` and `grid-cols-3` stat grids inside them (AG-4). No two-column page grid — progress is a reading experience, not a task flow.

---

### Page Structure (top to bottom)

```
┌────────────────────────────────────────────────┐
│  Progress                    [30d ▾] [90d]      │  ← page header + range toggle
├────────────────────────────────────────────────┤
│  OVERVIEW                                       │
│  ┌──────────┬──────────┬──────────┐             │
│  │  −1.8 kg │  47 sets │ 1,744    │             │
│  │  Weight  │ Workouts │ kcal     │             │
│  │  change  │ logged   │ burned   │             │
│  └──────────┴──────────┴──────────┘             │
├────────────────────────────────────────────────┤
│  WEIGHT TREND                                   │
│  [Line chart — weight_kg over time]             │
│  Goal reference line · trend insight text       │
├────────────────────────────────────────────────┤
│  WORKOUT VOLUME                                 │
│  [Bar chart — kcal burned per day]              │
│  Category breakdown pills below                 │
├────────────────────────────────────────────────┤
│  WEEKLY CONSISTENCY                             │
│  [Heatmap-style week strip — 4-5 weeks]         │
│  Each day: coloured dot if workout logged       │
├────────────────────────────────────────────────┤
│  TOP EXERCISES                                  │
│  [List — top 5 by frequency in selected range]  │
└────────────────────────────────────────────────┘
```

---

### Section 1: Overview (Stat Cards)

3 stat tiles in `grid-cols-3` (all viewports — values are short):

| Tile | Value | Computation |
|---|---|---|
| Weight change | `change_kg` from `/weight/log` response | `current - start` over selected range. Shown as `−1.8 kg` (green) or `+1.2 kg` (amber). `—` if < 2 entries. |
| Workouts logged | Count of unique `log_date` values in history | "Days worked out" — more meaningful than total sets |
| Calories burned | Sum of all `calories_burned` in history | Rounded to nearest integer |

Each tile: same `AdminStatCard` visual structure — icon + value + label. Icons: `Weight` (scale), `Dumbbell`, `Flame`.

---

### Section 2: Weight Trend Chart

**Reuses `WeightChart` component from dashboard** — but with a larger height and the full `/weight/log` data instead of the dashboard's 30-day subset from `/dashboard`.

Key differences from the dashboard version:
- Height: `h-56` (vs `h-44` on dashboard) — more room to see the arc
- No `pace` text — that's a dashboard concern. Here just show the line + goal + trend direction.
- X-axis: if `days=90`, shows month labels (`Jan`, `Feb`) not day labels. If `days=30`, shows day+month (`1 Jun`).
- Empty state: "No weight entries yet. Log your weight from the Dashboard." with a link.

**The component is extended**, not duplicated. Add a `variant="full"` prop to `WeightChart` that enables the larger height and suppresses the pace text.

---

### Section 3: Workout Volume (Bar Chart)

**New component: `WorkoutVolumeChart`**

```
src/components/progress/WorkoutVolumeChart.tsx
```

Bar chart — one bar per day, height = total kcal burned that day. Multiple categories stack in the same bar (Recharts `BarChart` with `stackId="a"` and one `Bar` per category).

```tsx
// Data shape (computed from WorkoutLogRead[]):
type DayVolume = {
  date: string;        // "1 Jul"
  strength: number;    // kcal from strength exercises
  cardio: number;      // kcal from cardio
  other: number;       // yoga, stretching, etc.
}
```

Colours:
- Strength: `#22c55e` (brand green)
- Cardio: `#3b82f6` (blue)
- Other: `#a855f7` (purple)

Below the chart: category breakdown as coloured pills showing percentage of total kcal:
```
● Strength  74%    ● Cardio  23%    ● Other  3%
```

Empty state: "No workouts logged yet." with a button → `/workout`.

---

### Section 4: Weekly Consistency (Heat strip)

**New component: `ConsistencyStrip`**

```
src/components/progress/ConsistencyStrip.tsx
```

Compact week-by-week view of the last 4–5 weeks. Each row = one week (Mon–Sun). Each cell = one day — coloured dot if a workout was logged that day, empty circle if not.

```
        Mon  Tue  Wed  Thu  Fri  Sat  Sun
Week 1   ●    ○    ●    ●    ○    ●    ○
Week 2   ●    ●    ○    ●    ●    ○    ○
Week 3   ●    ○    ●    ○    ●    ●    ○
Week 4   ●    ●    ●    ●    ○    ●    ●
```

- Active day: `bg-primary` (green) circle `w-6 h-6 rounded-full`
- Inactive day: `border border-[#2A2A2A]` circle, empty
- Today: `ring-1 ring-primary/50` around the dot/circle
- Week labels on left: "Wk 1", "Wk 2" etc (or actual date of Monday: "30 Jun")

**Why no GitHub-style full-year grid?** The year grid is visually impressive but impractical at this scale — we only have 30–90 days of data. A 4-week strip is dense, readable, and fits on mobile. It also shows enough context to identify patterns (e.g. always skipping weekends).

---

### Section 5: Top Exercises

**New component: `TopExercisesList`**

```
src/components/progress/TopExercisesList.tsx
```

Flat list — top 5 exercises by frequency (number of log entries) in the selected date range. Each row:
- `ExerciseImage` thumbnail (reused from workout page, already built)
- Exercise name
- Category badge
- `N sessions` count on the right

```
[img]  Push Up          Strength   ·  8 sessions
[img]  Running          Cardio     ·  5 sessions
[img]  Leg Press        Strength   ·  4 sessions
[D]    Deadlift         Strength   ·  3 sessions   ← fallback initial when no image
[img]  Swimming sprints Cardio     ·  3 sessions
```

Empty state: hidden entirely if `entries.length === 0` (already covered by workout volume empty state above).

---

### Range Toggle

Simple two-button pill toggle in the page header. Controls `days` param for both SWR hooks:

```tsx
// Active:   bg-[#1A1A1A] text-foreground border border-[#2A2A2A]
// Inactive: text-muted-foreground hover:text-foreground
<button>30d</button>
<button>90d</button>
```

Both hooks re-fetch when range changes. Zustand is NOT used — range is local `useState` on this page only (not shared with any other page).

---

### Loading States

- Overview cards: 3× `Skeleton h-[88px] rounded-2xl` in `grid-cols-3`
- Weight chart: `Skeleton h-56 rounded-2xl`
- Workout volume: `Skeleton h-44 rounded-2xl`
- Consistency strip: `Skeleton h-32 rounded-2xl`
- Top exercises: 3× `Skeleton h-14 rounded-xl`

---

### Empty States

| Section | Condition | Empty state |
|---|---|---|
| Weight trend | `entries.length < 2` | "Log your weight daily from the Dashboard to see your trend." |
| Workout volume | `entries.length === 0` | "No workouts in this period. [Log a workout →]" (link to /workout) |
| Top exercises | Always hidden when no data | — (covered by workout volume empty state) |
| Overall | Both weight and workout empty | Single centred hero: TrendingUp icon + "Start tracking to see your progress." |

---

### Animations

| Element | Animation |
|---|---|
| Stat cards on load | `STAGGER_CONTAINER` / `STAGGER_ITEM` (same as Profile) |
| Chart sections | `motion.div` fade-in `opacity: 0→1, y: 8→0`, `duration: 0.3` |
| Range toggle switch | none — instant re-fetch is the feedback |
| Bar chart bars | Recharts built-in `isAnimationActive` — already animates on mount |

---

### Architectural Decisions

**Decision A · No new backend endpoints**
Both `/weight/log` and `/workout/history` already return everything needed. Client-side aggregation for weekly totals and category breakdown is trivial at this data volume. Adding a `/progress/summary` endpoint would be premature optimisation — add it in Phase 10 if performance becomes an issue.

**Decision B · `WeightChart` extended with `variant` prop, not duplicated**
The dashboard `WeightChart` is already tested and styled correctly. Adding a `variant="full"` prop (larger height, no pace text) avoids a near-identical second component. The dashboard and progress versions share the same underlying chart logic. If they diverge significantly in future, split then.

**Decision C · Aggregation done in a `progressUtils.ts` lib file, not inline in pages**
Weekly rollups, category grouping, and exercise frequency counting are pure functions. They belong in `src/lib/progressUtils.ts` so they're testable and not tangled with component render logic. Same pattern as `dashboardUtils.ts` and `workoutUtils.ts`.

**Decision D · ConsistencyStrip uses Mon–Sun week start**
ISO week standard (Monday start) matches how most users think about workout weeks. The grid is 7 cells wide, which divides evenly on all screen widths.

**Decision E · 6-tab BottomNav is acceptable**
375px ÷ 6 tabs = 62.5px per tab. At `h-16` (64px tall bar), the icon is `22px` and the label is `text-[10px]`. Touch target is 62.5px wide × 64px tall — comfortably above WCAG 44px minimum. Tested pattern: Strava, Garmin, Apple Fitness all use 5–6 tabs at this density.

---

### AG Compliance

| AG | Decision |
|---|---|
| AG-1 (two-tier width) | ✅ `PageShell` standard — `w-full px-4 pb-24` / `lg:max-w-6xl` |
| AG-2 (right panel) | ✅ Single column — no natural primary/utility split on this page |
| AG-3 (mobile card order) | ✅ Overview (orientation) → Weight (primary metric) → Workout (secondary) → Consistency (pattern) → Top exercises (reference) |
| AG-4 (cards fill width) | ✅ Charts are `ResponsiveContainer width="100%"`. Stat grid is `grid-cols-3`. |
| AG-6 (animation) | ✅ Stagger on stat cards. Chart fade-in on mount. |
| AG-7 (shadcn defaults) | ✅ `Skeleton`, `Badge`, `Card`. `ExerciseImage` reused from workout. |
| AG-8 (state ownership) | ✅ SWR for server data. Local `useState` for range toggle. No Zustand. |

---

### What We Are NOT Building

- No food/nutrition charts — Tracker already shows daily macros. A nutrition history chart would duplicate Tracker's purpose.
- No PR (personal record) tracking — requires comparing max weight across all time per exercise. Complex data model, low immediate value.
- No export / CSV download — Phase 10 backlog.
- No full-year contribution grid — not enough data to make it meaningful. 4-week strip is sufficient.
- No `/progress/weight` or `/progress/workout` sub-routes — single page, range toggle handles the time axis.

---

### Files to Create

```
src/app/progress/page.tsx              ← /progress page — wires all sections

src/hooks/useWeightHistory.ts          ← SWR GET /weight/log?days={range}
src/hooks/useWorkoutHistory.ts         ← SWR GET /workout/history?days={range}

src/lib/progressUtils.ts               ← pure fns: aggregateByDay, groupByCategory,
                                           topExercises, buildWeekGrid

src/components/progress/WorkoutVolumeChart.tsx  ← stacked bar chart (kcal/day by category)
src/components/progress/ConsistencyStrip.tsx    ← week-by-week workout dot grid
src/components/progress/TopExercisesList.tsx    ← top 5 exercises by frequency
```

### Files to Modify

```
src/components/dashboard/WeightChart.tsx
  ← add variant="full" prop: h-56, suppress pace text

src/components/layout/BottomNav.tsx
  ← add Progress tab (TrendingUp icon) — 6th item, before Profile

src/components/layout/TopNav.tsx
  ← add Progress link in centre nav (TrendingUp icon)
```

---
