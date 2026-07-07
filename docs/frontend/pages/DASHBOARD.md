# Dashboard (`/dashboard`)

## Purpose
Landing page after login. Shows today's calorie and macro status, weight trend, water intake, streak, BMI, and milestone progress.

## Layout
Two-column at `xl:` (1280px+): main content left, sticky right panel.
Single column on mobile and tablet.

## Data
`useDashboard()` — single `GET /dashboard` call, auto-refreshes every 30s. Returns the full `DashboardData` object.

## Sections (mobile order)

1. **Greeting row** — user name, today's date, `DayScoreBadge` (composite score ring)
2. **CalorieHeroCard** — SVG donut ring showing consumed vs target. Flanked by "Consumed" and "Remaining" stats. Inner ring segment for calories burned. Desktop: `max-w-2xl mx-auto` inner layout fills card width.
3. **MacroBarsCard** — Protein/Carbs/Fat bars, filled relative to highest macro (not calorie %). Calorie % shown as text label. `h-2` mobile, `h-2.5` desktop.
4. **StreakBMICard** (mobile) / right column (desktop) — streak count + BMI badge side by side with `border-r` divider.
5. **MilestoneCard** — next weight milestone: target, estimated date, progress bar.
6. **WaterIntakeCard** — circular ring + preset buttons (150/250/500/750 ml) + custom input + entry list with delete per row.
7. **WeightChart** — Recharts `LineChart`, last 30 days of weight entries from dashboard response. Goal reference line. Trend and pace text above chart. Hidden entirely when < 2 entries.

**Right column (desktop sticky):**
- StreakBMICard
- TDEEWidget (deficit/surplus + daily fat change)
- WeightLogWidget (quick weight log)

## Components

```
src/components/dashboard/
  CalorieHeroCard.tsx
  MacroBarsCard.tsx
  StreakBMICard.tsx
  MilestoneCard.tsx
  WaterIntakeCard.tsx
  WeightChart.tsx        ← also used on /progress with variant="full"
  TDEEWidget.tsx
  WeightLogWidget.tsx
  DayScoreBadge.tsx
  CountUp.tsx            ← animated number
  DashboardSkeletons.tsx
```

## Key decisions
- All dashboard data in one API call — no per-widget fetches.
- Nutrition is denormalized at food-log insert time. Editing a food item does not retroactively change historical logs.
- BMR/TDEE/macros are cached on `user_profiles` and recalculated only on profile update.
- `WeightChart` returns `null` when entries < 2 (dashboard variant). Returns a prompt card when entries < 2 and `variant="full"` (progress variant).
