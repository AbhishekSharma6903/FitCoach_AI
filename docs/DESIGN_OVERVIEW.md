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
| Mobile (< 768px) | Fixed bottom tab bar — 5 tabs: Home / Tracker / Workout / Dishes / Profile |
| Desktop (≥ 768px) | Sticky top navbar — logo left, nav links centre, avatar + actions right |

**Top navbar spec (desktop):**
```
h-14 sticky top-0 z-50
bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#2A2A2A]

Inner: max-w-6xl mx-auto px-8 flex items-center justify-between h-full

Left:   App logo mark (28px rounded-lg, green bg) + "FitCoach" wordmark text-white font-semibold
Centre: Nav links — Home · Tracker · Workout · Dishes
        Active:   text-white font-medium + 2px green dot below link text
        Inactive: text-muted-foreground hover:text-white transition-colors
Right:  "+ Log Food" primary pill button (h-9 px-4 bg-primary rounded-lg)
        + Avatar circle (32px, initials, links to /profile)
```

**shadcn:** `NavigationMenu` for nav links. `Button` (primary) for Log Food CTA.

**Why top nav:** Bevel, Whoop web, and most health web apps use top nav. It gives full viewport width to content. Centred `max-w-6xl` column provides tasteful breathing room on both sides without wasting it.

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
│  [F] FitCoach    Home · Tracker · Workout · Dishes   [+Log] [👤]│  ← sticky top nav
├─────────────────────────────────────────────────────────────────┤
│                     max-w-6xl mx-auto px-8                      │
│  Good morning, Dev 👋              Saturday, 5 July    [72% ◉] │  ← Day Score badge
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

> Design spec to be written before implementation begins.

---

## Page 3: Workout (`/workout`)

> Design spec to be written before implementation begins.

---

## Page 4: Dishes (`/dishes`)

> Design spec to be written before implementation begins.

---

## Page 5: Profile (`/profile`)

> Design spec to be written before implementation begins.
