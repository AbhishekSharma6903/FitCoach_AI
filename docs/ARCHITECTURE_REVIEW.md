# Architect Review — Round 2
## FitCoach AI · All Three Design Documents

> Reviewed: 2026-07-05
> Documents reviewed: DESIGN_OVERVIEW.md, UI_REFACTOR_PLAN_V2.md, ARCHITECTURE_REVIEW.md
> Verdict: **6 blocking issues, 4 quality issues, 4 new analytics features found**

---

## Status Update on Round 1 Review

All Round 1 findings were correctly applied. The three documents are now internally consistent on:
- `max-w-6xl` everywhere ✅
- Sticky right column with `max-h` ✅
- `strokeDashoffset` not `pathLength` ✅
- Stagger timing 30ms ✅
- Calorie hero flanking layout ✅
- Streak/BMI side-by-side card ✅
- TDEE deficit widget added ✅
- Milestone progress bar added ✅

**Status change:** `ARCHITECTURE_REVIEW.md` status line still says "REQUIRES UPDATES before implementation." Update it to "APPLIED — see Round 2 review for new findings."

---

## 🔴 Blocking Issues (UI will break without these)

---

### B-1 · Calorie hero flanking layout breaks on mobile

**Document:** DESIGN_OVERVIEW.md §2 "Calorie Hero Card"
**Problem:** The spec says use `grid grid-cols-[1fr_auto_1fr]` — left stat | ring | right stat — at ALL viewport sizes including mobile.

On iPhone SE (375px wide), with `px-4` padding:
- Available width = 375 - 16 = **359px**
- Ring = 160px
- 2 × gap (say 16px each) = 32px
- Each stat column = (359 - 160 - 32) / 2 = **83px**

In 83px you need to fit: "CONSUMED" (9 chars, 11px) + "1,847" in `text-4xl font-black` (36px font, number width ~80px) + "kcal". The number alone is nearly full column width. "REMAINING" is even longer at 9 chars. On iPhones below 390px this **overflows or wraps badly**.

**Fix:** Split into two responsive layouts:
```
Mobile  (< md): Ring centred alone, stats below in a 2-col row
Desktop (md+):  3-col grid: [left-stat | ring | right-stat]
```

```tsx
{/* Mobile layout */}
<div className="md:hidden flex flex-col items-center gap-4">
  <CalorieRingSVG size={160} />
  <div className="grid grid-cols-2 gap-8 w-full">
    <div className="text-center">
      <span className="caption">Consumed</span>
      <span className="text-3xl font-black"><CountUp to={consumed} /></span>
      <span className="caption">kcal</span>
    </div>
    <div className="text-center">
      <span className="caption">{isOver ? "Over by" : "Remaining"}</span>
      <span className={cn("text-3xl font-black", isOver ? "text-red-400" : "text-primary")}>
        <CountUp to={isOver ? over : remaining} />
      </span>
      <span className="caption">kcal</span>
    </div>
  </div>
</div>

{/* Desktop layout */}
<div className="hidden md:grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
  {/* left stat | ring | right stat */}
</div>
```

The mobile stat numbers should use `text-3xl` not `text-4xl` to fit comfortably.

---

### B-2 · 2-column grid fires at wrong breakpoint

**Documents:** DESIGN_OVERVIEW.md, AG-2
**Problem:** Both say `lg:grid-cols-[1fr_340px]`. The `lg:` breakpoint = 1024px.

At 1024px viewport with `px-8` padding (32px each side):
- Available = 1024 - 64 = **960px**
- Right col = 340px, gap = 24px
- Left col = 960 - 340 - 24 = **596px**

That's 596px for the left column — barely wider than the old `max-w-2xl` (672px). The calorie ring card at 596px with flanking stats gives each stat only ~160px. Fine, but the macro bars card at 596px is OK but not spacious.

More importantly: at 1024px (iPad landscape or small laptop), having a right sidebar with 4 stacked cards makes the left column feel cramped.

**Fix:** Change 2-column to `xl:` (1280px):
- At 1280px: available = 1152px (max-w-6xl). Left = 1152 - 64 - 340 - 24 = **724px** → spacious.
- At 1024px: single full-width column → calorie ring fills the full width beautifully.

```
Dashboard desktop grid: grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6
```

Also update AG-2 to say `xl:` not `lg:`.

---

### B-3 · `Separator` component misused in CSS Grid

**Document:** DESIGN_OVERVIEW.md §4 "Streak + BMI Card"
**Problem:** The JSX shows:
```tsx
<div className="grid grid-cols-2 gap-4">
  {/* Streak col */}
  <Separator orientation="vertical" />  {/* ← THIS IS WRONG */}
  {/* BMI col */}
</div>
```

A CSS Grid with `grid-cols-2` only has 2 cells. Adding a 3rd child (`<Separator />`) creates a 3rd grid cell — it doesn't render as a dividing line between the two data columns. It would appear as a **3rd column, shrunk to near-0 width**, or flow to row 2 depending on browser behavior.

**Fix:** Use a border on the first column instead:
```tsx
<div className="grid grid-cols-2">
  {/* Streak */}
  <div className="flex flex-col items-center gap-1 pr-4 border-r border-[#2A2A2A]">
    ...
  </div>
  {/* BMI */}
  <div className="flex flex-col items-center gap-1 pl-4">
    ...
  </div>
</div>
```

---

### B-4 · Raw Tailwind `gray-*` colours break the warm-neutral palette

**Document:** UI_REFACTOR_PLAN_V2.md §2.9 "Component Patterns"
**Problem:** The patterns section uses `text-gray-400`, `text-gray-600`, `text-gray-300`, `text-gray-500`, `bg-gray-800`. These are Tailwind's built-in gray scale which has **blue undertones** (e.g. `gray-900` = `#111827`). The entire reason for the custom palette is to avoid these blue-tinted grays.

Using raw `gray-*` in the pattern spec means developers copy-pasting from docs will introduce the exact colour problem the design system was created to fix.

**Fix:** Replace every `gray-*` in §2.9 with semantic tokens:
```
text-gray-400 → text-muted-foreground  (#9CA3AF)
text-gray-500 → text-muted-foreground
text-gray-300 → text-foreground/70
text-gray-600 → text-muted-foreground/60
text-gray-800 → bg-[#1A1A1A] or bg-elevated
```

---

### B-5 · Tablet width `max-w-3xl` is misleadingly small

**Document:** AG-1, DESIGN_OVERVIEW.md "Content Column"
**Problem:** `max-w-3xl` = 768px = exactly the `md:` breakpoint. At 768px viewport with `max-w-3xl mx-auto`, the container width equals the viewport — no breathing room at all. On 900px (many Android tablets and iPad mini): content = 768px, breathing room = 66px each side. That's fine.

But the naming is confusing: "Tablet" starts at `md:` (768px) and ends at `lg:` (1024px). At the low end of this range, `max-w-3xl` = full viewport width, which isn't actually "centred." It only becomes meaningfully centred above ~870px.

**Fix:** Change tablet tier to `max-w-xl` (576px) for portrait phones above 640px, or just **remove the tablet tier entirely** — jump straight from mobile full-width to `max-w-6xl` at desktop (`lg:+`). Most real-world apps (Bevel, Notion, Vercel) only have 2 effective tiers: mobile full-width, desktop centred. The intermediate tablet tier adds complexity for minimal benefit.

**Recommended simplification:**
```
Mobile  (< lg, 1024px): w-full px-4 pb-24        ← full width, includes tablets
Desktop (lg+, 1024px+): max-w-6xl mx-auto px-8 pb-8  ← centred column
```
This is cleaner. On a 768px iPad: full-width single column with px-4 feels natural. At 1024px (iPad landscape/small laptop): the 2-column grid fires if present, or single col at max-w-6xl.

**Impact:** AG-1, DESIGN_OVERVIEW content column spec, Phase 2.5 PageShell spec all need updating.

---

### B-6 · Desktop layout label says "≥ 768px" but 2-column grid is `lg:` (1024px)

**Document:** DESIGN_OVERVIEW.md "Layout — Desktop (≥ 768px)"
**Problem:** The section heading says "Desktop (≥ 768px)" but if we implement B-2's fix (2-column at `xl:`), the actual desktop breakpoint for the 2-column layout is 1280px. The label is wrong and will confuse developers.

**Fix:** Rename sections to match actual breakpoints:
```
"Layout — Mobile (< 1024px)" — single column
"Layout — Desktop (≥ 1024px / 1280px for 2-col)" — centred max-w-6xl, with 2-col at xl:
```

---

## 🟡 Quality Issues (noticeable degradation if not fixed)

---

### Q-1 · Progress bar heights are inconsistent across the spec

**Documents:** Multiple locations
- Calorie hero card: `h-1.5` (6px)
- Macro bars: `h-2` (8px)
- Plan doc §2.9: `h-2`
- Water ring: not specified

**Standard:** `h-2` (8px) everywhere. It's visible enough on dark backgrounds, consistent across components, and matches the plan doc's own spec. `h-1.5` for the calorie hero is too thin — it'll look like a hairline on mobile OLED screens.

**Fix:** Use `h-2` for ALL progress bars. Only make exceptions explicit with a reason.

---

### Q-2 · Bottom nav inactive label visibility — doc vs code mismatch

**Document:** UI_REFACTOR_PLAN_V2.md §2.9 says `label: hidden` for inactive nav items.
**Reality:** The running code was updated to `text-[#4B5563]` (dimmed but visible) based on QA audit feedback that icons-only navigation failed usability at 375px.

**Fix:** Update the plan doc §2.9 to match the implementation:
```
Inactive:
  icon: text-[#6B7280]
  label: text-[10px] font-medium text-[#4B5563]  ← visible but dimmed (NOT hidden)
```
Reason: icon-only navigation fails accessibility at small sizes. Labels help users build muscle memory for tap targets.

---

### Q-3 · Empty states not defined anywhere

**Document:** Both documents
**Problem:** Neither document specifies what each card looks like when the user has zero data. This is the **most common view new users see**, and it's completely undefined:

- `streak_days = 0` → what does the streak card show? "Start today!" is mentioned but not designed.
- `weight_entries = []` → weight chart shows nothing. Spec doesn't say whether to hide the card or show an empty state.
- `next_milestone = null` → milestone card is hidden per spec. Correct — add this explicitly.
- `calories_consumed = 0` → ring is empty. Ring looks like an empty circle. Is that intentional?
- `tdee_kcal = null` → TDEE widget can't render. Spec doesn't say to hide it.

**Fix:** Add an "Empty States" section to DESIGN_OVERVIEW.md for the dashboard. Rules:
- Streak = 0: show "0 day streak" with "Log today to start your streak 🔥" in muted text
- No weight entries: hide weight chart card entirely (show nothing), don't show the trend insight
- Milestone = null: hide card entirely ✅ (already specified)
- Calorie ring with 0 consumed: ring shows empty track (normal), centre shows "0" (normal). Fine.
- TDEE = null: hide TDEE widget entirely

---

### Q-4 · Card hover state on desktop not specified

**Document:** DESIGN_OVERVIEW.md, AG-6
**Problem:** The animation spec covers buttons (`whileHover scale: 1.01`) but says nothing about card hover on desktop. Without hover feedback, the UI feels static on mouse-driven viewports.

**Fix:** Add to AG-6:
```
Card hover (desktop only): subtle border brightening
<motion.div
  className="border border-[#2A2A2A]"
  whileHover={{ borderColor: "#3A3A3A" }}
  transition={{ duration: 0.12 }}
/>
// Do NOT use scale on cards — only on buttons/interactive elements
// Scale on cards causes layout shift (content inside bounces)
```

---

## 🟢 New Analytics Features (zero backend changes)

All four use data already in the API response.

---

### F-1 · Protein per kg Body Weight

**Data:** `macros_consumed.protein_g` + `weight_entries[last].weight_kg` (or profile's `current_weight_kg`)
**What to show:**
```
PROTEIN DENSITY
  1.2 g/kg        ← consumed.protein_g / current_weight_kg
  Target: ≥1.6   ← standard for active adults (hard-coded, not user-configurable)
  [──────░░░░░]   ← progress bar, target = 1.6 g/kg (100%)
```
**Why it's valuable:** The gram target alone (176g) means nothing to most users. "1.2g/kg" is actionable — it tells them whether their protein density is in the fitness-optimal range. This is information that requires a nutrition calculator elsewhere; we have it for free.

**Where to place:** Inside the Macro Bars card as a 4th row below the fat bar, above the split bar. Small, contextual.

---

### F-2 · Today's Estimated Body Change

**Data:** `calories_net`, `tdee_kcal`
**Formula:** `(calories_net - tdee_kcal) / 7700 * 1000` → in grams (positive = gaining, negative = losing)
**What to show** (inside the TDEE/Deficit widget, below the deficit number):
```
DAILY SETUP
  −352 kcal deficit
  ≈ −46g fat change today   ← tiny, factual, fascinating
```
**Why it's valuable:** Abstract "352 kcal deficit" becomes concrete "you're burning ~46g of fat today." This kind of tangible feedback is exactly what premium health apps show. It's also motivating — users see immediate impact of their choices.

**Caveat to display:** Only show when `calories_net > 0` (they've logged some food) and `tdee_kcal != null`. With 0 food logged it would falsely show "-300g" change.

---

### F-3 · Pace vs Goal (am I on track?)

**Data:** `time_to_goal_weeks` (stated goal), weight trend computation (slope from `weight_entries`), `goal_weight_kg`, `weight_entries[last].weight_kg`
**What to show** (below the weight trend chart):
```
AT CURRENT PACE
  Goal in ~11 weeks   ← computed from current trend
  Stated goal: 16 weeks
  2 weeks ahead ✅    ← or "3 weeks behind ⚠️"
```
**Formula:**
```ts
const currentWeight = weight_entries[last].weight_kg
const weeklyTrend = computeWeeklyTrend(weight_entries)  // already planned
const kgToGoal = currentWeight - goal_weight_kg
const weeksAtCurrentPace = weeklyTrend < 0 ? Math.abs(kgToGoal / weeklyTrend) : null
const delta = weeksAtCurrentPace ? time_to_goal_weeks - weeksAtCurrentPace : null
// delta > 0 → ahead of schedule, delta < 0 → behind schedule
```
Only show when `weight_entries.length >= 5` and `weeklyTrend < 0` (losing weight). Hide when not enough data.

---

### F-4 · Day Score (Gamification)

**Data:** All dashboard fields
**What to show** (small badge near the greeting):
```
Good morning, Dev 👋
Saturday, 5 July              [Day: 72%]  ← or a ring-like small badge
```
**Formula:**
```ts
const calScore  = Math.min(calories_net / calories_target, 1)  // cap at 100%
const waterScore = water.pct_complete                           // 0-1
const proteinScore = Math.min(macros_consumed.protein_g / macros_target.protein_g, 1)
const dayScore = Math.round(((calScore + waterScore + proteinScore) / 3) * 100)
```
This is a composite of: eating to target + hydration + protein. Simple, gamified, drives engagement.

**Design:** A small circular badge (24px) next to the greeting with `dayScore%` in a tiny ring. Green when ≥70%, amber 40-69%, muted <40%. Animates from 0 to score on load.

**Where:** Right side of the greeting row (on desktop, replaces or sits beside the date).

**Note:** This only makes sense when `calories_consumed > 0` (at least some food logged). Pre-noon with no food logged, hide it or show "—".

---

## Summary Table

| # | Type | Issue | Where to fix | Priority |
|---|---|---|---|---|
| B-1 | Blocking | Calorie hero flanking layout breaks on mobile (375px) | DESIGN_OVERVIEW §2 | 🔴 Must fix |
| B-2 | Blocking | 2-col grid at `lg:` (1024px) → left col 596px | DESIGN_OVERVIEW, AG-2 | 🔴 Must fix |
| B-3 | Blocking | `Separator` in CSS Grid breaks layout | DESIGN_OVERVIEW §4 | 🔴 Must fix |
| B-4 | Blocking | Raw `gray-*` colours in §2.9 break warm-neutral palette | UI_REFACTOR_PLAN_V2 §2.9 | 🔴 Must fix |
| B-5 | Blocking | `max-w-3xl` tablet tier is unnecessary — simplify to 2 tiers | AG-1, DESIGN_OVERVIEW | 🔴 Must fix |
| B-6 | Blocking | Desktop layout section header says "≥768px", wrong | DESIGN_OVERVIEW layout labels | 🔴 Must fix |
| Q-1 | Quality | Progress bar heights inconsistent (h-1.5 vs h-2) | DESIGN_OVERVIEW §2, §8 | 🟡 Fix |
| Q-2 | Quality | Bottom nav label spec contradicts running code | UI_REFACTOR_PLAN §2.9 | 🟡 Fix |
| Q-3 | Quality | Empty states not defined for any dashboard card | DESIGN_OVERVIEW — new section | 🟡 Fix |
| Q-4 | Quality | Card hover state on desktop unspecified | AG-6 | 🟡 Fix |
| F-1 | Feature | Protein per kg body weight widget | DESIGN_OVERVIEW §3 | 🟢 Add |
| F-2 | Feature | Estimated daily fat change (from deficit) | DESIGN_OVERVIEW §6 | 🟢 Add |
| F-3 | Feature | Pace vs goal (am I on track?) | DESIGN_OVERVIEW §9 | 🟢 Add |
| F-4 | Feature | Day Score composite badge in greeting | DESIGN_OVERVIEW §1 | 🟢 Add |

**B-1 and B-2 are the most important.** They directly affect how the dashboard looks on every device. Fix these before touching any other document.

