# FitCoach AI — UI Audit Report

> Generated: 2026-06-29 22:33
> Rounds completed: 3 | Score: 6.9 → 7.2 (+0.3)

---

## Score Summary

| Page | Round 1 | Final | Δ |
|---|---|---|---|
| `01-dashboard` | 7.2 | 7.2 | +0.0 |
| `02-tracker-today` | 6.8 | 7.6 | +0.8 |
| `05-profile` | 7.0 | 7.0 | +0.0 |
| `08-dishes-empty` | 6.5 | 7.4 | +0.9 |
| `09-dishes-create` | 6.9 | 6.8 | +-0.1 |


**Overall trajectory: 6.9/10 → 7.2/10**

---

## Improvements Applied

### Round 1
Round 1: improved 11 files targeting top issues

- `frontend/src/app/dashboard/page.tsx`: UI improvements applied
- `frontend/src/components/dashboard/CalorieRing.tsx`: UI improvements applied
- `frontend/src/components/dashboard/MacroBar.tsx`: UI improvements applied
- `frontend/src/components/dashboard/MacroBarsGroup.tsx`: UI improvements applied
- `frontend/src/app/tracker/page.tsx`: UI improvements applied
- `frontend/src/components/tracker/NutritionTotals.tsx`: UI improvements applied
- `frontend/src/components/tracker/FoodLog.tsx`: UI improvements applied
- `frontend/src/app/profile/page.tsx`: UI improvements applied
- `frontend/src/app/dishes/page.tsx`: UI improvements applied
- `frontend/src/components/dishes/DishBuilder.tsx`: UI improvements applied
- `frontend/src/components/dishes/DishNutritionPreview.tsx`: UI improvements applied
### Round 2
Round 2: improved 11 files targeting top issues

- `frontend/src/app/dashboard/page.tsx`: UI improvements applied
- `frontend/src/components/dashboard/CalorieRing.tsx`: UI improvements applied
- `frontend/src/components/dashboard/MacroBar.tsx`: UI improvements applied
- `frontend/src/components/dashboard/MacroBarsGroup.tsx`: UI improvements applied
- `frontend/src/app/tracker/page.tsx`: UI improvements applied
- `frontend/src/components/tracker/NutritionTotals.tsx`: UI improvements applied
- `frontend/src/components/tracker/FoodLog.tsx`: UI improvements applied
- `frontend/src/app/profile/page.tsx`: UI improvements applied
- `frontend/src/app/dishes/page.tsx`: UI improvements applied
- `frontend/src/components/dishes/DishBuilder.tsx`: UI improvements applied
- `frontend/src/components/dishes/DishNutritionPreview.tsx`: UI improvements applied

---

## Still Needed (to reach 9+/10)

- Add meal-time segmentation (Breakfast/Lunch/Dinner/Snacks) to the food tracker — this is the single biggest functional UX gap and is expected by users of any serious calorie tracker
- Color-code macro progress bars consistently across dashboard and tracker (blue/Protein, amber/Carbs, orange/Fat) — currently the dashboard bars are uniform gray making them meaningless at a glance
- Add Veg/Non-Veg/Egg diet type indicator to the dish create form and use colored left-border convention on dish cards — a critical Indian food app localization that builds trust with target users
- Fix the 'Add another dish' dashed button and all near-invisible UI elements on dark backgrounds — increase border opacity to gray-600 minimum and ensure all interactive elements meet 3:1 contrast ratio against bg-gray-900
- Add a real-time nutrition summary panel in the dish create form that updates as ingredients are added — transforms the create flow from data-entry task into an engaging nutrition-building experience

---

## Per-Page Details by Round


### Round 1 — Overall 6.9/10

**`01-dashboard`** `▓▓▓▓▓▓▓░░░` 7.2/10
- ✅ Calorie ring with remaining/goal text creates a clear focal point
- ✅ Green brand color used purposefully for positive metrics (remaining calories, streak)
- ❌ BMI value (19.8) and 0-day streak are crammed into a small card with poor visual balance — streak '0' feels like an error state not a feature
- ❌ Macro progress bars are nearly invisible at zero state — thin gray lines with no empty-bar contrast make the section feel broken
- ❌ Next milestone card uses a dark green bg that is too close in value to the card bg, reducing legibility of '18 weeks away' tag

**`02-tracker-today`** `▓▓▓▓▓▓░░░░` 6.8/10
- ✅ Date navigator with TODAY badge is clean and immediately scannable
- ✅ Nutrition totals grid (Calories, Protein, Carbs, Fat, Fiber) is well-structured with goal denominators
- ❌ Empty state below totals card is just plain text with no illustration or CTA button — 'No food logged today' feels abandoned
- ❌ The totals card shows all zeros with no visual differentiation between values and goal denominators — they blend together
- ❌ No meal grouping UI visible (Breakfast/Lunch/Dinner/Snacks) — flat food log architecture reduces usability for Indian multi-meal eating patterns

**`05-profile`** `▓▓▓▓▓▓▓░░░` 7.0/10
- ✅ Stats badges row (BMI, TDEE, Target, Protein, Carbs, Fat) provides a compact data-rich summary
- ✅ BMI healthy weight indicator in green is a great positive reinforcement pattern
- ❌ Identity card shows only initial avatar 'J' with no option to add a photo — feels placeholder-level for a fitness app
- ❌ Stats badges have inconsistent unit formatting — '2393 kcal' and '2454 kcal' look nearly identical in size, making TDEE vs Target distinction confusing
- ❌ The profile header (name, age, height) uses a single muted gray color for all metadata — no visual hierarchy between name and stats

**`08-dishes-empty`** `▓▓▓▓▓▓░░░░` 6.5/10
- ✅ Dish card design is clean with good information density — kcal/100g, macro color coding (P/C/F) works well
- ✅ Veg badge with green color coding aligns with Indian dietary context perfectly
- ❌ Despite being named '08-dishes-empty', the screenshot actually shows one dish — the empty state with just the subtitle text is underselling the feature's discoverability
- ❌ The single dish card has no visual state for 'last used' or 'times logged' — lacks engagement hooks
- ❌ No search or filter functionality visible for when dishes list grows — scalability concern

**`09-dishes-create`** `▓▓▓▓▓▓░░░░` 6.9/10
- ✅ Green focus ring on the dish name input clearly signals active state
- ✅ Two-phase UX (name first, then search ingredients) is logically structured
- ❌ The ingredient search area has a large empty void with just an icon and text — no visual indication of what an added ingredient will look like
- ❌ No diet type selector (Veg/Non-Veg/Vegan) on the create form — but the list view shows a 'veg' badge, creating a data input gap
- ❌ Save Dish button is active even when no ingredients are added — should be disabled with a tooltip explaining why


### Round 2 — Overall 7.0/10

**`01-dashboard`** `▓▓▓▓▓▓▓░░░` 7.2/10
- ✅ Calorie ring with centered KCAL value creates strong focal point and clear hierarchy
- ✅ Green brand color used purposefully for remaining calories and streak elements
- ❌ BMI (19.8) and day streak (0) are displayed at same visual weight as primary calorie data — no hierarchy differentiation
- ❌ Right panel with BMI and streak feels cramped and under-spaced compared to the dominant calorie card
- ❌ Water intake quick-add buttons (150ml, 250ml, 500ml, 750ml) have identical styling with no visual differentiation for most common action

**`02-tracker-today`** `▓▓▓▓▓▓▓░░░` 7.8/10
- ✅ Quick Add section with Indian meal presets (Dal Tadka, Roti, Idli) is an excellent localization touch and solves the blank-state problem proactively
- ✅ Date navigator with back/forward arrows and TODAY badge is clean and highly usable
- ❌ Quick Add cards have inconsistent emoji sizes relative to card size — some emojis appear small and misaligned vertically
- ❌ Calorie count under Quick Add items (180 kcal, 70 kcal) uses same text-gray-400 as labels — calorie number should be more prominent
- ❌ The nutrition totals bar at bottom shows 0g / 150g but the progress bars are all flat gray — no visual differentiation between protein/carbs/fat bar colors

**`05-profile`** `▓▓▓▓▓▓▓░░░` 7.0/10
- ✅ Stats badge row (BMI, Maintenance, Your Goal, Protein, Carbs, Fat) provides an at-a-glance summary — the green highlight on Your Goal badge is effective
- ✅ Identity card with avatar initial, age, gender, height is clean and well-structured
- ❌ Avatar is just a letter 'J' in a circle — no option to add photo creates a generic feel that reduces personal connection
- ❌ Stats badges have no units on some values (184g Protein reads oddly — should clarify it is a daily target)
- ❌ The goals form (Current Weight, Goal Weight, Timeline, Activity Level, Diet Type) is vertically long with no visual grouping or section labels between fields

**`08-dishes-empty`** `▓▓▓▓▓▓░░░░` 6.0/10
- ✅ Logged 5 times counter on the dish card provides useful engagement data
- ✅ Veg/non-veg tag badge in green is a culturally relevant and visually clear affordance for Indian users
- ❌ The page title says 'empty state (no dishes created yet)' but the screenshot actually shows one dish (meal 1) — the empty state design itself is not visible, making evaluation harder; the 'empty' concept is not communicated with an illustration or zero-state message
- ❌ Edit and delete icons on the dish card are very small (approximately 16px) and closely spaced — touch targets too small for mobile, high misclick risk
- ❌ The helper text 'Custom dishes appear in food search when you log meals' is low contrast and positioned below the fold — most users will miss this key piece of information

**`09-dishes-create`** `▓▓▓▓▓▓░░░░` 6.8/10
- ✅ Green border focus state on the dish name input is clear and on-brand
- ✅ Two-step mental model (name first, then search ingredients) is logical and reduces cognitive load
- ❌ Form is a floating card but has no visible modal overlay/backdrop — feels disconnected from the page context without a dimmed background
- ❌ Ingredients section label 'INGREDIENTS — search and add' uses a long inline label that would be better as a label + subtitle separated
- ❌ No diet type selector (Veg/Non-Veg) in the create form — but the dish list shows a veg badge, meaning this data is required but not collected here


### Round 3 — Overall 7.2/10

**`01-dashboard`** `▓▓▓▓▓▓▓░░░` 7.2/10
- ✅ Calorie ring with centered KCAL label creates clear focal hierarchy
- ✅ BMI badge with 'Healthy' green pill is immediately scannable and reassuring
- ❌ Macro bars in 'Today's Macros' are all at 0% and look identical — no visual differentiation between Protein/Carbs/Fat bars, making the section feel inert and broken
- ❌ The calorie ring at 0/2454 shows a completely empty gray ring with no baseline arc, which looks unfinished rather than 'ready to fill'
- ❌ Water quick-add buttons (+150ml, +250ml etc.) are too uniformly styled — no visual weight difference between them, making the section feel flat

**`02-tracker-today`** `▓▓▓▓▓▓▓░░░` 7.6/10
- ✅ Date navigator with TODAY badge is clean and immediately scannable
- ✅ Quick Add grid of popular Indian meals (Dal Tadka, Roti, Idli etc.) is a killer localization feature — highly relevant
- ❌ Quick Add meal cards have no calorie-to-visual ratio — all 6 cards look identical in weight regardless of calorie count, missing an opportunity for scannable density cues
- ❌ The macro targets (150g protein, 250g carbs, 65g fat) shown as small gray text are too subtle — users won't notice their daily targets at a glance
- ❌ No meal-time segmentation (Breakfast/Lunch/Dinner/Snacks) — all foods will log into one undifferentiated list, which is a significant UX gap for meal planning

**`05-profile`** `▓▓▓▓▓▓▓░░░` 7.0/10
- ✅ Stats badges row (BMI, TDEE, Goal kcal, Protein, Carbs, Fat) gives a dense but scannable stats overview
- ✅ Goal kcal badge highlighted with green border creates clear visual emphasis on the user's active target
- ❌ The profile avatar is just a letter 'J' in a green circle — no option to upload a photo or choose an avatar style, which feels incomplete for a profile page
- ❌ Stats badges use three different text colors (white, blue/cyan, amber, orange) with no legend explaining what the colors mean — creates confusion
- ❌ Dev Mode Active banner at the bottom is bright red/orange and visually dominates the page — should be hidden or extremely subtle in screenshots/demos

**`08-dishes-empty`** `▓▓▓▓▓▓▓░░░` 7.4/10
- ✅ Info banner explaining 'Custom dishes appear in food search' is excellent onboarding copy — solves the 'why should I do this' question proactively
- ✅ Green info icon on the banner creates visual association with the brand without being aggressive
- ❌ The filename says 'dishes-empty' but the screenshot actually shows one dish — this creates confusion; the true empty state with zero dishes is not shown
- ❌ The 'Add another dish' dashed border button at bottom is extremely low contrast — the dashed border on dark background is almost invisible
- ❌ Macro labels (P, C, F) are single-letter abbreviations without a legend — new users won't know what they mean without prior context

**`09-dishes-create`** `▓▓▓▓▓▓░░░░` 6.8/10
- ✅ Two-step form structure (name → ingredients) is logical and minimal — no cognitive overload
- ✅ Green focus ring on the DISH NAME input clearly shows active state and is on-brand
- ❌ The form has no serving size field — users can't define what '1 serving' means for their dish, making the per-serving nutrition calculation opaque
- ❌ No diet type toggle (Veg/Non-Veg) on the create form — it should be set here, not inferred, especially since the dish list shows veg badges
- ❌ The ingredient search returns no visual preview of what will be added — there's no quantity input shown, so users don't know they'll need to specify grams


