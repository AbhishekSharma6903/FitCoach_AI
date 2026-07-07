# Onboarding (`/onboarding`)

## Purpose
4-step wizard collecting user profile data on first login. Also used for "Re-do Onboarding" (updates identity fields).

## Layout
Standalone — no `PageShell`, no `TopNav`, no `BottomNav`. Full-screen centred card (`max-w-md`). `items-start sm:items-center` — SE (375px) scrolls top-to-bottom; larger screens centre vertically.

## Data
Single `POST /profile/onboarding` at the end of step 4. No per-step API calls. On success: `router.push("/dashboard")`.

Pre-fill on mount: `useProfile()` — if a profile exists (Re-do Onboarding), form is seeded with current values.

## Steps

| Step | Fields |
|---|---|
| 1 — Personal | Name, age, gender, height |
| 2 — Weight | Current weight, goal weight, timeline (weeks), pace hint |
| 3 — Fitness | Experience level, activity level |
| 4 — Diet | Diet type, wants workout split, wants meal plan |

## Animations
`AnimatePresence mode="wait"` + `motion.div key={step}`. Direction tracked with `useRef(1)` (1 = forward, -1 = back) — ref doesn't trigger re-render, available when animation evaluates.

## Components

```
src/app/onboarding/
  page.tsx              ← renders <OnboardingWizard /> directly
  OnboardingWizard.tsx
  Step1Personal.tsx
  Step2Weight.tsx
  Step3Fitness.tsx
  Step4Diet.tsx
  StepIndicator.tsx     ← step progress dots
```

## Key decisions
- `max-w-md` card is the only AG-1 exception — onboarding is a standalone entry experience, not a regular app page.
- Checkboxes use `<Check size={12} />` icon (not `✓` string) for consistent sizing.
- Pace hint shown when both delta and weeks are non-zero — not viewport-conditional (card width never changes).
