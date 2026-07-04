# FitCoach AI — Technical Research & Decision Log

> Written: 2026-07-02. Reference document for future development sessions.
> Covers: UI library decision, workout calorie formulas, wger image data, and the macro bug.

---

## Issue 1 — UI Refactor: Library Selection

### What was asked
Refactor the whole UI to be:
- Responsive for both web and mobile
- Modern, sleek, aesthetic — inspired by apps like Bevel, Hevy, Whoop
- Built with a UI component library for consistency and long-term maintenance

### Research findings

#### Libraries evaluated

| Library | Stars | Bundle | Dark mode | Tailwind | Mobile | Maintenance |
|---|---|---|---|---|---|---|
| **shadcn/ui** | 117k | ~0 (copy-paste, no runtime) | ✅ built-in | ✅ native | ✅ | ⚠️ Slowing (no major releases, owned by Vercel) |
| **DaisyUI** | 41k | ~6kb CSS only | ✅ 30+ themes | ✅ native | ✅ | ✅ Very active (updated daily) |
| **Radix UI** | 19k | Medium (headless) | Manual | Manual | ✅ | ✅ Active |
| **MUI** | 91k | Large (~300kb) | ✅ | ❌ (custom) | ✅ | ✅ |
| **Chakra UI** | 37k | Medium | ✅ | ❌ | ✅ | ⚠️ v3 broke compat |
| **Mantine** | 27k | Medium | ✅ | Partial | ✅ | ✅ Active |

#### Decision: **shadcn/ui**

**Why shadcn/ui over DaisyUI:**

1. **Already using Tailwind CSS** — shadcn/ui is pure Tailwind, zero runtime CSS overhead. DaisyUI adds a CSS layer on top which creates specificity conflicts with our existing classes.
2. **Copy-paste architecture** — components live in our repo, we own them completely. No version conflicts, no breaking upgrades. This is critical for long-term fitness app UI.
3. **Radix UI primitives underneath** — accessibility (ARIA), keyboard navigation, focus management all handled correctly. DaisyUI components are just CSS classes with no JS behavior guarantees.
4. **We already have a dark theme** — shadcn/ui's CSS variable system (`--background`, `--foreground`) is designed for dark/light switching. DaisyUI themes work but require more restructuring of our existing palette.
5. **Mobile-first by default** — all shadcn/ui components use responsive Tailwind classes. Our current custom components don't — this is the root cause of mobile issues.

**What shadcn/ui adds vs our current approach:**
- `Sheet` component → replaces our custom slide-in drawer (needed for AI chat, mobile nav)
- `Dialog` → replaces our custom `Modal` component with proper ARIA
- `Command` → replaces our food/exercise search dropdowns with proper keyboard support
- `Drawer` (mobile) vs `Dialog` (desktop) — the `vaul` drawer that slides up from bottom on mobile
- `Progress` → proper accessible progress bars (macro bars)
- `Tabs` → for meal breakdown (Breakfast/Lunch/Dinner/Snacks)

**UI reference apps to draw from (for style only, not features):**
- **Bevel** — dark background, metric rings, streak displays, minimal chrome
- **Hevy** — exercise cards, set/rep logging with inline input, muscle diagrams
- **Whoop** — recovery score rings, strain/recovery balance, clean typography
- **Apple Fitness** — ring metaphor, colored activity types, weekly view

**Key UI principles to implement:**
1. Bottom navigation bar on mobile (tracker, workout, dashboard, profile) — replaces current top-left back arrows
2. Card-based sections with consistent 16px padding and 12px gap
3. Large metric displays (48px+) for primary numbers (calories, streak)
4. Colored icon pills for meal types and exercise categories
5. Swipe gestures on mobile (swipe date to navigate, swipe entry to delete)

**Migration approach:** Don't replace everything at once. Add `shadcn/ui` components incrementally — start with the most-used primitives (Button, Input, Sheet, Command) and replace our custom equivalents. Target: 2–3 sessions.

---

## Issue 2 — Workout Calorie Formula: Is MET x Duration Valid?

### What was asked
Is `MET × weight_kg × duration_hours` valid for strength training? Does "duration" make sense when logging sets/reps?

### Research findings

#### The MET formula
```
calories = MET × weight_kg × duration_hours
```
**This is scientifically valid** — it is the standard formula from the Compendium of Physical Activities (2024 edition), published by researchers at Arizona State University. It has been used in epidemiological research for 30+ years.

**However, it has important limitations for strength training specifically:**

1. **Duration is still needed** — even for strength training. Duration here means total time of the exercise session (including rest periods between sets), not just active lifting time. This is how all fitness apps (MyFitnessPal, Garmin, Apple Watch) use MET for resistance training.

2. **MET overestimates for light individuals** — the standard 1 MET baseline (3.5 ml O2/kg/min) was measured on average adults. Actual RMR varies ±20–30%. This is a known limitation.

3. **Weight training MET values from 2024 Compendium:**
   - Light effort (machines): 3.0 MET
   - Moderate effort: 3.5 MET
   - Vigorous (free weights, Olympic lifts): 6.0 MET
   - Circuit training: 8.0 MET
   - Cardio (running 8km/h): 8.0 MET

4. **For strength training, sets×reps×weight adds precision** but no universal formula exists that converts these to calories without additional variables (velocity, range of motion, muscle mass). The only scientifically validated way to measure this is with indirect calorimetry (a metabolic cart) — not available in apps.

#### What professional apps actually do
- **MyFitnessPal, Strava, Apple Watch** — all use MET × body weight × duration for manual exercise logging
- **Whoop, Garmin** — use heart rate data + HRV for real-time calculation; MET is only for manual entry
- **Hevy** — does NOT calculate calories at all for strength training (only shows volume: sets × reps × weight)

#### Decision
**Keep MET × weight × duration as the formula.** It is valid and industry-standard for manual exercise logging. The inputs (duration + exercise type) are the minimum viable inputs for a calorie estimate.

**What to change:**
1. For **strength exercises** — duration is "total session time" not per-set time. Rename the field label from "Duration (min)" to "Session time (min)" and add helper text: "Total time including rest between sets"
2. For **cardio** — duration is literal active time; field is fine as-is
3. Add **intensity selector** (Light / Moderate / Vigorous) for strength exercises which maps to different MET values (3.0 / 3.5 / 6.0) — this improves accuracy meaningfully without requiring sets/reps
4. **Volume tracking** (sets × reps × weight) serves a DIFFERENT purpose from calorie calculation — it tracks progressive overload. We should store and display it separately from calories, not use it to calculate calories.

**Updated MET values for our exercise_library:**

| Our category | Sub-type | MET |
|---|---|---|
| strength | light (machines, cables) | 3.0 |
| strength | moderate (default) | 3.5 |
| strength | vigorous (olympic, circuits) | 6.0 |
| cardio | moderate (jogging) | 7.0 |
| cardio | vigorous (running fast) | 11.0 |
| yoga | hatha/general | 3.0 |
| stretching | general | 2.3 |
| plyometrics | general | 8.0 |

---

## Issue 3 — wger Exercise Images & Muscle Diagrams

### What was asked
wger API has images and muscle diagrams — how can we use them to improve UI?

### Research findings

#### What wger provides (confirmed from API)

**Exercise images:**
- URL format: `https://wger.de/media/exercise-images/{exercise_id}/{uuid}.png`
- Thumbnails: `{url}.200x200_q85.png` and `{url}.400x400_q85.png`
- Fields: `image`, `thumbnails.small`, `thumbnails.medium`, `is_main`, `is_ai_generated`
- License: **CC-BY-SA 4.0** — free to use with attribution
- Note: Many newer images are AI-generated (flag: `is_ai_generated: true`)

**Muscle diagrams (SVGs — confirmed from API):**
- Primary muscle highlight: `https://wger.de/static/images/muscles/main/muscle-{id}.svg`
- Secondary muscle highlight: `https://wger.de/static/images/muscles/secondary/muscle-{id}.svg`
- These are SVG overlays on a body diagram — each file highlights a specific muscle group
- Full body diagram: `https://wger.de/static/images/muscles/muscular_system_front.svg` (front)
- Muscle IDs: 1=Biceps, 2=Ant.Deltoid, 3=Chest, 4=Triceps, 5=Calves, 6=Abs, 7=Gluteus, 8=Quads, 9=Hamstrings, 10=Quads, etc.

#### How to use these in FitCoach AI

**1. Exercise images in search results and log entries**
- Show exercise thumbnail (200×200) next to exercise name in search dropdown
- Show it in the "Add Workout" modal
- License requirement: add "Images © wger.de (CC-BY-SA 4.0)" in footer

**2. Muscle diagram overlay in exercise detail**
- When user selects an exercise, show a small body diagram with the primary muscle highlighted in green
- This is extremely common in Hevy, Fitbod — users respond well to it
- Implementation: overlay the muscle SVGs on a base body SVG using CSS

**3. What to do now vs later**
- **Now:** Store `image_url` in `exercise_library` table when fetching from wger. Re-fetch the exercise data to include image URLs.
- **Later (Phase 6):** Show muscle diagrams in the workout detail view. This is a UI enhancement, not core to MVP.

#### Data update needed
Our current `exercise_library` seed does NOT include image URLs. Need to re-fetch with:
```
GET https://wger.de/api/v2/exerciseinfo/?format=json&language=2&limit=100
```
Each exercise in `images[]` array has: `image`, `thumbnails`, `is_main`
Store the first `is_main=true` image URL in an `image_url` column.

---

## Issue 4 — Macro Bug: Today's Macros Don't Update After Logging Food

### Root cause (confirmed)
`useFoodLog.addEntry()` and `deleteEntry()` only call `mutate()` on the food log SWR key (`/api/v1/food/log?log_date=...`). They do NOT invalidate the dashboard SWR key (`/api/v1/dashboard`).

The dashboard calorie ring + macro bars are powered by `useDashboard` which reads from `/api/v1/dashboard`. This key only auto-refreshes every 30 seconds. So when food is logged, the dashboard stays stale for up to 30 seconds.

`useWaterLog` was correctly implemented — it calls `globalMutate("/api/v1/dashboard")` after every water add/remove. The food log was simply missing this.

### Fix applied (2026-07-02)
`frontend/src/hooks/useFoodLog.ts` — added `globalMutate("/api/v1/dashboard")` after both `addEntry()` and `deleteEntry()`.

```typescript
import useSWR, { mutate as globalMutate } from "swr";
// In addEntry:
await api.post("/api/v1/food/log", payload);
mutate();
globalMutate("/api/v1/dashboard");  // ← this was missing
// In deleteEntry:
await api.delete(`/api/v1/food/log/${entryId}`);
mutate();
globalMutate("/api/v1/dashboard");  // ← this was missing
```

### Pattern to follow for all future actions
Any hook that modifies data that the dashboard reads (food, water, workout, weight) MUST call `globalMutate("/api/v1/dashboard")` after the API call. This ensures the calorie ring, macro bars, and streak counter update immediately.

Check: `useWorkoutLog` also needs this fix — logging a workout changes `calories_burned_today` on the dashboard but currently doesn't invalidate it.

---

## Action Items (Next Session)

### Immediate (bugs)
- [x] **Fixed:** `useFoodLog` — macro bars now update on food log
- [ ] **Apply same fix to `useWorkoutLog`** — `calories_burned_today` doesn't update after workout log

### Short term
- [ ] **Add image_url column to exercise_library** — re-fetch wger data with image URLs
- [ ] **Rename "Duration (min)" to "Session time (min)"** in AddWorkoutModal — add helper text
- [ ] **Add intensity selector** (Light/Moderate/Vigorous) to AddWorkoutModal for strength exercises

### Medium term (UI refactor)
- [ ] **Install shadcn/ui** — `npx shadcn@latest init` (select dark theme, Tailwind, no CSS reset)
- [ ] **Replace Modal component** with shadcn/ui `Dialog` + `Drawer` (sheet for mobile)
- [ ] **Replace FoodSearchBar / ExerciseSearchBar** with shadcn/ui `Command` (proper keyboard navigation)
- [ ] **Add bottom navigation bar** for mobile — Tracker | Workout | Dashboard | Profile
- [ ] **Add intensity select** to workout logging
- [ ] **Show exercise thumbnail** in search results (after image_url is seeded)

---

## References

- wger API docs: https://wger.readthedocs.io/en/latest/api.html
- wger muscle SVGs: `https://wger.de/static/images/muscles/main/muscle-{id}.svg`
- 2024 Compendium of Physical Activities: https://pacompendium.com/adult-compendium/
- MET formula: `calories = MET × weight_kg × (duration_min / 60)`
- shadcn/ui: https://ui.shadcn.com
- License for wger images: CC-BY-SA 4.0 (free to use with attribution)
