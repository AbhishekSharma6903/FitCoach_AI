# Architect Review — Tracker Page Design
## DESIGN_OVERVIEW.md §Page 2

> Reviewed: 2026-07-05
> Focus: UI aesthetics, responsiveness, web/mobile balance, new features
> Status: REQUIRES UPDATES before implementation

---

## Summary

The spec is functionally complete but has 5 issues that will directly cause bad UI, and 3 missed analytics opportunities. Fix the blocking issues before building.

---

## 🔴 Blocking Issues

---

### B-1 · Add Food flow uses wrong component — Sheet + Dialog redundancy

**Current spec says:** "Both use the same `AddFoodSheet` component — `useMediaQuery` selects which container."
The spec says use `shadcn Sheet` on mobile and `shadcn Dialog` on desktop. But we already have `Modal.tsx` — a custom responsive wrapper that does exactly this: `Dialog` on `md:+`, `Drawer` bottom sheet on mobile.

**Problem:** Creating `AddFoodSheet.tsx` with the same `useMediaQuery` + conditional logic duplicates what `Modal.tsx` already does. Two components doing the same job.

**Bigger problem:** `Modal.tsx` uses `md:` (768px) as the breakpoint. But our nav breakpoint is `lg:` (1024px). At 768–1023px (iPad portrait), `Modal.tsx` would show a Dialog (desktop style) while the user is still on BottomNav (mobile style). This is inconsistent.

**Fix:** Update `Modal.tsx` to switch at `lg:` (1024px) to match our nav breakpoint. Then use `Modal.tsx` for the add-food flow — don't build `AddFoodSheet.tsx` at all.

```tsx
// Modal.tsx — change breakpoint
const isDesktop = useMediaQuery("(min-width: 1024px)")  // was: 768px
```

This also fixes all other modal usages (dishes, workout) consistently.

---

### B-2 · Nutrition Summary Card layout will be cramped on 375px

**Current spec:**
```
2,352 kcal remaining
[P────░░] Protein  0 / 176g
[C────░░] Carbs    0 / 235g
[F────░░] Fat      0 / 78g
[─────────────] 0% of 2,352 kcal
```

**Problem:** On iPhone SE (375px), fitting the remaining number + 3 labelled progress bars + calorie bar + labels in one card creates a crowded, small-text wall. The spec says `text-4xl font-black` for the remaining number — but then immediately below are 3 rows with `text-sm` labels and `text-xs` values. The typography jump is jarring.

**Better approach:** Separate the hero number from the detail bars. Use a **compact 2-row layout**:

```
Row 1 (hero): big remaining number centred + green/red colour
Row 2 (context): thin calorie progress bar + "of 2352 kcal" caption
Row 3 (macros): 3 mini circles or 3 inline badges — NOT full-width bars
                P: 0g  C: 0g  F: 0g  (compact dots, no bars on mobile)
```

On **desktop**, show the full bars (plenty of width). On **mobile**, show just the circle dots + values without bars — saves vertical space.

This is how Bevel's Nutrition summary works: big number on top, compact macro row below, no bars crowding the summary card.

---

### B-3 · Tabs label truncation at 375px with kcal subtotals

**Current spec:** Tab labels show kcal when non-zero: `Breakfast · 320`

**Problem:** 4 tabs in `TabsList className="w-full"` = each tab gets 375/4 = ~93px. "Breakfast · 320" is ~100px at `text-sm`. It **overflows**.

**Fix options:**
- Mobile: Use icon-only tabs with just the icon + kcal badge underneath
- OR: Use shorter labels: `Break · 320` — no, that's ugly
- **Best fix:** Two-line tab trigger: meal icon on top, short name below, kcal as a badge that ONLY appears on active tab or when non-zero as a tiny pill. No long text.

```
[☕]     [☀️]     [🌙]     [🍪]
Break   Lunch   Dinner  Snack
                         42
```

On **desktop**: Full text + kcal inline `Breakfast  320 kcal` — plenty of space.

---

### B-4 · QuickAdd grid open-adds the wrong meal tab

**Current spec:** "On tap: `setPendingMealSlot(currentTabMealSlot)` then open AddFoodSheet"

**Problem:** The spec doesn't explain how the Quick Add grid knows which tab is currently active. The `currentTabMealSlot` is local state in the Tabs component. The Quick Add grid is a sibling component rendered BELOW the Tabs — it has no access to the active tab's meal slot without prop drilling.

**Fix:** Two options:
1. Lift the `activeTab` state up to the page and pass it down to both Tabs and QuickAddGrid
2. Use `useMealStore.pendingMealSlot` as the shared state — but that's already the "pending" slot, not the "active" slot

**Correct fix:** Store `activeTab` in local page state (`useState`), pass it to both `MealTabs` and `QuickAddGrid`:
```tsx
// page.tsx
const [activeTab, setActiveTab] = useState<MealSlot>("breakfast")
// Pass to Tabs: onTabChange={setActiveTab}
// Pass to QuickAdd: currentMealSlot={activeTab}
```

This is clean and doesn't require Zustand (it's ephemeral UI state, not cross-page state — AG-8).

---

### B-5 · "Confirm-on-second-tap" delete pattern is wrong for this app

**Current spec:** "Delete: X icon, on tap turns red (confirm-on-second-tap pattern)"

**Problem:** Confirm-on-second-tap is a confusing pattern on mobile. Users don't understand why the first tap didn't work. It's also non-standard — no major fitness app uses this.

**Standard pattern:** Single tap → swipe-to-delete (but that's Phase 7). For now: single tap → `shadcn alert-dialog` confirmation (DeleteConfirmDialog.tsx is already built).

Or even simpler: **no confirmation at all** — allow immediate delete with an Undo toast via `sonner`. This is what Bevel does. Fewer taps, faster UX.

**Fix:**
- Tap X → immediately call `deleteEntry(id)` 
- Show `toast("Entry removed", { action: { label: "Undo", onClick: () => addEntryBack() } })` via sonner
- This requires `sonner` to be installed (it's in the plan but not yet installed)

For Phase 5B, use immediate delete with toast. The undo action can be implemented later since `addEntry` already exists.

---

## 🟡 Quality Issues

---

### Q-1 · Desktop layout is just a wider mobile — missed opportunity

**Current spec:** Single column, desktop gets no special treatment beyond wider cards.

**Problem:** On a 1280px desktop screen, a single column of food log tabs fills ~1152px. Four tabs spanning 1152px, each with one or two food entries — it looks like a spreadsheet row that's way too wide.

**Better desktop layout for tracker:** Split into **two columns** at `xl:` (1280px+):
- Left (~680px): DateNavigator + Nutrition Summary + Meal Tabs (the primary workflow)
- Right (~340px sticky): Quick Add + daily calorie burn summary (if workout logged) + "Today's stats" mini widget linking to dashboard

This mirrors the dashboard's xl: 2-col approach. Single column at 1024–1279px (ag-2 says 2-col is dashboard only — **this needs to be revisited for tracker**).

**Architect decision:** AG-2 says "2-column is dashboard only." I'm updating that rule. For pages where content naturally separates into "primary action" and "contextual utility", a right panel at xl: is appropriate. The tracker has exactly this split:
- Left: what you're logging (primary action, needs focus)
- Right: quick add shortcuts + calorie counter (utility, contextual)

**Update AG-2** to: "Right panel at `xl:` is allowed on Tracker and Workout where primary action + utility context makes sense. Dashboard right panel contains stats; Tracker/Workout right panel contains utilities."

---

### Q-2 · Empty state illustration is undefined

**Current spec says:** "empty illustration + Nothing logged yet + Add food button"

What illustration? The spec doesn't specify. In Phase 5A, dashboard empty states had simple emoji + text. For consistency:
- No real illustration needed — emoji + big muted text is the Bevel style
- `🍽️` emoji in a 64px circle `bg-[#1A1A1A]` + "Nothing here yet" + primary Add button
- Same pattern as dashboard's empty weight chart state

---

### Q-3 · Fiber bar is missing from macros

**Data available:** `totals.fiber_g` and `targets.fiber_g` (30g target) are returned by the API. The spec only shows 3 macros (P/C/F). The Bevel screenshot clearly shows fiber as a 4th tracked item.

**Fix:** Add fiber as a 4th bar row in the Nutrition Summary card:
- `Fat ● bar` → `Fiber ● bar` is a natural 4th
- Colour: `bg-violet-400` (already in semantic colours §2.8)
- Only show when `totals.fiber_g > 0` OR always show — user should track fiber

---

## 🟢 New Analytics / Features (zero backend changes)

---

### F-1 · Today's Calorie Pace

**Data:** `totals.calories_kcal`, `targets.calories_kcal`, current time
**Insight:** "At your current pace, you'll finish at 1,850 kcal — 500 under goal"

```ts
const hoursElapsed = new Date().getHours() + new Date().getMinutes() / 60
const projectedKcal = hoursElapsed > 0 ? (totals.calories_kcal / hoursElapsed) * 24 : 0
const projectedVsTarget = Math.round(projectedKcal - targets.calories_kcal)
```

Show in Nutrition Summary card (small text below the calorie bar):
- `"On pace for ~{projected} kcal today"` — green if within ±200 of target
- Hide before noon (not enough data) or if 0 entries logged
- **Zero backend change** — pure frontend math

---

### F-2 · Meal Distribution Insight

**Data:** `entries[]` with `meal_type` and `calories_kcal`
**Insight:** Show a tiny horizontal stacked bar representing how calories are distributed across meals — same concept as the macro split bar on dashboard.

```
MEAL DISTRIBUTION  (only shown when 2+ meals have entries)
[■ Breakfast 30%][■■ Lunch 45%][■ Dinner 25%]
```

Each colour:
- Breakfast: `bg-amber-400` (coffee/morning)
- Lunch: `bg-yellow-400` (sun/midday)
- Dinner: `bg-blue-400` (moon/evening)
- Snack: `bg-orange-400` (cookie)

Show in Nutrition Summary card, below macro bars, above fiber.
**Zero backend change** — computed from `entries` array.

---

### F-3 · Fastest to Log Indicator (streak for logging behaviour)

**Data:** `entries[]` — if the user logs breakfast before 9am, or logs all 4 meals, show a badge.
This is gamification — already done for streak on dashboard.

Simple rule: if entries in 3+ different meal slots today → show `"📋 Logged 3 meals today"` badge in the page header area.

Small, motivational, zero backend change.

---

## Summary Table

| # | Type | Issue | Fix | Priority |
|---|---|---|---|---|
| B-1 | Blocking | `AddFoodSheet` duplicates `Modal.tsx`, wrong breakpoint | Update `Modal.tsx` to `lg:`, reuse it | 🔴 Must fix |
| B-2 | Blocking | Nutrition Summary card cramped on 375px with full bars | Compact macro row on mobile (dots/values, no bars) | 🔴 Must fix |
| B-3 | Blocking | Tabs overflow at 375px with kcal text | Icon + short label tabs; kcal as badge on active only | 🔴 Must fix |
| B-4 | Blocking | QuickAdd can't read active tab meal slot | Lift `activeTab` state to page, pass to both | 🔴 Must fix |
| B-5 | Blocking | Confirm-on-second-tap delete is confusing | Immediate delete + `sonner` undo toast | 🔴 Must fix |
| Q-1 | Quality | Desktop is just wider mobile — weak | 2-col at xl: left=tabs, right=quickadd+stats | 🟡 Fix + update AG-2 |
| Q-2 | Quality | Empty state illustration not defined | Emoji circle + muted text (consistent with dashboard) | 🟡 Fix |
| Q-3 | Quality | Fiber bar missing from macros | Add fiber as 4th bar (violet-400) | 🟡 Fix |
| F-1 | Feature | Calorie pace projection | Frontend math on time + consumed | 🟢 Add |
| F-2 | Feature | Meal distribution stacked bar | Computed from entries[] | 🟢 Add |
| F-3 | Feature | Multi-meal logged badge | Count distinct meal_type slots | 🟢 Add |

**B-1 through B-5 must be fixed in the spec before any code is written.**
