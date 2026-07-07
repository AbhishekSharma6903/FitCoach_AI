# Workout (`/workout`)

## Purpose
Log exercise sessions for any date. Shows calories burned, volume, and muscle diagrams per exercise.

## Layout
Two-column at `xl:`: log left, exercise search + session summary right (sticky).
Single column on mobile.

## Data
- `useWorkoutLog(selectedDate)` — `GET /workout/log?date=`
- `useTrackerStore` — same Zustand store as Tracker (shared `selectedDate`)
- After any mutation: `globalMutate("/api/v1/dashboard")` to update calories burned today.

## Data model
Each set is a separate `workout_logs` row. Logging "3 sets × 10 reps" creates 3 rows, each with `sets=1`. `WorkoutLogCard` receives all entries for an exercise and groups them.

## Sections

1. **DateNavigator** — shared with Tracker via Zustand.
2. **CaloriesBurnedBanner** — total kcal burned today.
3. **Log Exercise button** — opens `AddWorkoutModal`.
4. **WorkoutLogCard list** — one card per exercise, staggered animation. Each card shows:
   - `ExerciseImage` thumbnail (wger CDN) or coloured-initial fallback
   - Volume summary: uniform sets get `3 sets × 10 reps @ 20 kg`; mixed sets show averages
   - Calories for that exercise
   - `MuscleMap` — silhouettes + muscle name pills (primary: green, secondary: grey)
   - `WorkoutLogRow` list — per-set rows with inline edit

**Right column (desktop):**
- Add Exercise search input (opens AddWorkoutModal)
- Popular exercises quick-start (when no entries)
- `SessionSummaryWidget` — total sets, reps, volume, kcal

## Components

```
src/components/workout/
  WorkoutLogCard.tsx       ← groups sets for one exercise
  WorkoutLogRow.tsx        ← single set row with inline edit/delete
  AddWorkoutModal.tsx      ← exercise search + sets/reps/weight/duration input
  ExerciseImage.tsx        ← smart thumbnail/fallback (both in DOM, onError hides img)
  MuscleMap.tsx            ← wger SVG silhouettes + muscle name pills
  CaloriesBurnedBanner.tsx
  SessionSummaryWidget.tsx
```

## Exercise images (wger)
- 264 of 825 exercises have thumbnail images (stored in `exercise_library.image_url_thumb`)
- SVG muscle overlays hosted at `https://wger.de/static/images/muscles/`
- CSS filter `hue-rotate(120deg) saturate(1.5)` converts wger's red (#fc0000) SVGs to brand green
- Primary/secondary muscle IDs stored as semicolon-separated text (e.g. `"4;2"`)
- Attribution: "Exercise images © wger.de (CC-BY-SA 4.0)" in desktop right column footer

## Calorie calculation
`MET × user_weight_kg × (duration_min / 60)`. Computed at insert on the backend. MET values seeded from the 2024 Compendium of Physical Activities (strength: 3.5, cardio: 7.0–11.0, yoga: 3.0, etc.).
