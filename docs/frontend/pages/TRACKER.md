# Tracker (`/tracker`)

## Purpose
Log and review food intake for any date. Shows macros consumed vs targets per meal.

## Layout
Two-column at `xl:`: log left, quick-add panel right (sticky).
Single column on mobile.

## Data
- `useFoodLog(selectedDate)` — `GET /food/log?log_date=`
- `useFoodSearch` — `GET /food/search?q=` (debounced, inside AddFoodModal)
- `useTrackerStore` — Zustand store for `selectedDate` (shared with Workout page)

After adding or deleting food: `mutate()` on food log key **and** `globalMutate("/api/v1/dashboard")` so the Dashboard calorie ring updates immediately.

## Sections

1. **DateNavigator** — prev/next arrows, calendar popover (month grid, future dates disabled, "Jump to Today" footer). Swipe gesture on mobile: `drag="x"` with ±50px threshold. Active date stored in Zustand `useTrackerStore`.
2. **NutritionSummaryCard** — calories consumed vs target + macro bars. Per-meal breakdown below.
3. **MealTabs** — Base UI `Tabs` with 4 tabs: Breakfast, Lunch, Dinner, Snack. Each tab shows a `FoodLogEntry` list. Tab buttons have `aria-label={label}` because text is `hidden lg:block` on mobile.
4. **AddFoodModal** — opens when "Add Food" is tapped. Uses `SearchCommand` (debounced input + dropdown). Quantity input with `getUnitOptions()` multi-unit system.

**Right column (desktop):**
- Quick add search (same SearchCommand, triggers modal)
- TodaySummaryWidget

## Components

```
src/components/tracker/
  DateNavigator.tsx
  MealTabs.tsx
  FoodLogEntry.tsx      ← individual food row with edit/delete
  FoodLogEntryRow.tsx
  NutritionSummaryCard.tsx
  TodaySummaryWidget.tsx
  AddFoodModal.tsx
```

## Unit system (`dishUtils.ts` → `getUnitOptions`)
Food items use a multi-option unit system — not a single `detectUnit()`. Each food gets 3–6 unit options (e.g. oil: teaspoon/tablespoon/10g/50g; chapati: 1 piece/2 pieces/100g). The API only ever receives `quantity_g`. The unit choice is purely frontend state.

## Key decisions
- `selectedDate` in Zustand, not URL params — Tracker and Workout share the same date picker without URL coupling.
- No future date logging — DateNavigator disables forward navigation past today.
- Each food log entry is a separate DB row. Editing quantity updates the row in-place.
