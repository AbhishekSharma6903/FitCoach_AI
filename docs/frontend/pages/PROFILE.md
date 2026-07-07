# Profile (`/profile`)

## Purpose
View computed stats and update fitness goals. Identity fields (name, age, height) are read-only here — changed only via Re-do Onboarding.

## Layout
Single column, `max-w-lg mx-auto` on form inner container (not the card — cards span full column per AG-4; inputs constrained to ~512px is intentional UX).

## Data
- `useProfile()` — `GET /profile`
- `PUT /profile` on save — backend recomputes BMR/TDEE/macros/BMI
- Dual `mutate()` after save: `useProfile()` + `useDashboard()` so Dashboard calorie ring updates immediately

## Sections (top to bottom)

1. **IdentityCard** — avatar initial, name, age/gender/height, lifestyle badges (activity, diet, experience). Info note: "To change identity fields, use Re-do Onboarding below."
2. **StatsGrid** — 4-tile grid (2-col mobile, 4-col sm+): BMI, Maintenance (TDEE), Target calories, Protein target. Deficit/surplus shown in green/amber below TDEE tile.
3. **WeightGoalCard** — current → goal weight arrow, required weekly pace, "at current pace" note.
4. **MacrosCard** — Protein/Carbs/Fat bars, filled relative to highest macro (not calorie %). Calorie % shown as text.
5. **UpdateGoalsForm** — 5 fields: current weight, goal weight, timeline, activity level, diet type. Live impact preview animates in when values diverge from saved profile. `htmlFor` + `id` on all numeric inputs; `aria-label` on Select triggers.
6. **AccountSection** — Admin Panel link (admins only), Re-do Onboarding link, Sign Out.

## Components

```
src/components/profile/
  IdentityCard.tsx
  StatsGrid.tsx
  WeightGoalCard.tsx
  MacrosCard.tsx
  UpdateGoalsForm.tsx
  AccountSection.tsx
src/lib/profileUtils.ts    ← previewTargetCalories, getBmiCategory, label maps
```

## Key decisions
- Identity vs goals split: identity (name/age/height) changes rarely → Re-do Onboarding. Goals (weight/activity/diet) change weekly → inline form. Mixing them would bloat the form.
- Live preview: `previewTargetCalories()` in `profileUtils.ts` mirrors `calculation_engine.py` exactly (same Mifflin-St Jeor + activity multiplier). No API call needed for preview.
- `SelectValue` renders raw DB value, not label — workaround: display `OPTION_ARRAY.find(o => o.value === form.field)?.label` inline inside `SelectTrigger`.
