# Progress (`/progress`)

## Purpose
Shows historical trends: weight over time, workout volume by category, weekly workout consistency, and top exercises. Answers "am I making progress?"

## Layout
Single column. Desktop: `ConsistencyStrip` and `TopExercisesList` placed side-by-side in `grid-cols-1 lg:grid-cols-2` to reduce scroll depth.

## Data
- `useWeightHistory(days)` — `GET /weight/log?days=N` → `WeightHistoryRead`
- `useWorkoutHistory(days)` — `GET /workout/history?days=N` → `WorkoutLogEntry[]`
- `useProfile()` — for `goalWeightKg` and `timeToGoalWeeks` passed to WeightChart
- Range toggle (30d / 90d) is local `useState` — not Zustand, not URL

All aggregation is client-side in `progressUtils.ts`.

## Sections

1. **Range toggle** — 30d / 90d pill buttons, controls both hooks
2. **Overview stat cards** (3 × `ProgressStatCard`):
   - Weight change: `change_kg` from WeightHistoryRead; green for loss, amber for gain
   - Workout days: count of unique `log_date` values in workout history
   - kcal burned: sum of all `calories_burned`
3. **WeightChart** with `variant="full"` — `h-56`, pace text suppressed, prompt empty state when < 2 entries
4. **WorkoutVolumeChart** — Recharts stacked BarChart, one bar per day, categories stacked: strength=green, cardio=blue, other=purple. Breakdown pills below chart.
5. **ConsistencyStrip** — 4-week Mon–Sun dot grid. Green dot = workout logged, empty circle = rest day. Today has a ring.
6. **TopExercisesList** — top 5 exercises by entry count in the selected period. Reuses `ExerciseImage` thumbnail.

## `progressUtils.ts` functions

| Function | Purpose |
|---|---|
| `weightEntriesToPoints` | Maps `WeightLogRead[]` → `WeightPoint[]` for WeightChart |
| `normalisedCategory` | Maps 60+ DB category strings → `strength / cardio / other` |
| `aggregateByDay` | Rolls up `WorkoutLogEntry[]` into `DayVolume[]` (one per day) |
| `categoryBreakdown` | Returns % of total kcal per bucket |
| `uniqueWorkoutDays` | Count of distinct `log_date` values |
| `topExercises` | Top N exercises by entry count |
| `buildWeekGrid` | Last 4 ISO weeks (Mon–Sun), with `hasWorkout` and `isToday` flags |

## Category normalisation
DB has 60+ free-string category values. `normalisedCategory` maps them case-insensitively:
- Contains "strength": → `strength`
- Contains "cardio", "running", "cycling", "swimming", "hiit", etc.: → `cardio`
- Everything else: → `other`

## Components

```
src/components/progress/
  ProgressStatCard.tsx       ← icon + string value + label (string, not number)
  WorkoutVolumeChart.tsx     ← stacked Recharts BarChart + category pills
  ConsistencyStrip.tsx       ← 4-week Mon–Sun dot grid
  TopExercisesList.tsx       ← top 5 with ExerciseImage thumbnail
src/lib/progressUtils.ts
```
