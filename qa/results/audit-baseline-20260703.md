# FitCoach AI — Responsive Audit Report

> Run: `baseline-20260703`
> Generated: 2026-07-03 22:27
> Screenshots evaluated: 34

---

## Summary

| Metric | Value |
|---|---|
| **P0 Score** (iPhone SE, iPhone 14, MacBook 13") | **7.3/10** |
| **P0 Gate** | **❌ FAIL** (need ≥ 8.0 to close a phase) |
| **Overall Score** (all 9 viewports) | 7.37/10 |
| Overflow detections | 2 |
| Touch target failures (P0 mobile) | 1 |

---

## Per-Page Scores

| Page | Avg Score | Worst Viewport | Overflow? |
|---|---|---|---|
| `dashboard` | 6.9 | macbook-13 (6.0) | ⚠️ Yes |
| `dishes` | 7.6 | macbook-13 (6.5) | ⚠️ Yes |
| `onboarding` | 8.2 | macbook-13 (7.5) | No |
| `profile` | 6.5 | iphone-se (6.0) | No |
| `tracker` | 7.6 | macbook-13 (6.0) | No |
| `workout` | 7.1 | macbook-13 (5.5) | No |


---

## Top Issues (cross-viewport)

1. **[iphone-se]** Top bar with weight input, Log button, and avatar is cramped at 375px — input field gets compressed
2. **[iphone-se]** Two-column card layout (calorie ring + streak card) may feel tight; streak card content is narrow
3. **[iphone-se]** Macro progress bars section has truncated 'Fat' label cut off on left edge
4. **[iphone-se]** Weight progress chart dots appear very small and y-axis labels may overlap at this width
5. **[iphone-se]** Water intake quick-add buttons (4 across) are borderline on touch target width at 375px
6. **[iphone-se]** Bottom action buttons (Cancel + Save Dish) are partially cut off — Save Dish appears clipped at right edge
7. **[iphone-se]** Diet type toggle buttons (Veg/Non-Veg/Vegan) are slightly cramped but functional
8. **[iphone-se]** Loading skeleton in ingredients area takes up significant space leaving little room for content above fold

---

## Full Scores by Viewport


### `iphone-14` — avg 8.0/10

- `dashboard/default` `███████░░░` 7.5/10 ⚠️ overflow
- `dishes/create-form-open` `████████░░` 8.0/10
- `dishes/empty-list` `████████░░` 8.5/10
- `onboarding/step-1` `████████░░` 8.5/10
- `profile/default` `███████░░░` 7.0/10
- `tracker/date-nav-open` `████████░░` 8.0/10
- `tracker/empty` `████████░░` 8.5/10
- `tracker/search-typing` `████████░░` 8.5/10
- `workout/empty` `███████░░░` 7.5/10
- `workout/search-typing` `████████░░` 8.0/10

### `iphone-14-pro-max` — avg 7.9/10

- `dashboard/default` `███████░░░` 7.5/10
- `tracker/date-nav-open` `███████░░░` 7.5/10
- `tracker/empty` `████████░░` 8.5/10
- `tracker/search-typing` `████████░░` 8.0/10

### `iphone-se` — avg 7.5/10

- `dashboard/default` `██████░░░░` 6.5/10 ☝️ touch
- `dishes/create-form-open` `███████░░░` 7.5/10 ⚠️ overflow
- `dishes/empty-list` `████████░░` 8.0/10
- `onboarding/step-1` `████████░░` 8.5/10
- `profile/default` `██████░░░░` 6.0/10
- `tracker/date-nav-open` `███████░░░` 7.5/10
- `tracker/empty` `███████░░░` 7.5/10
- `tracker/search-typing` `███████░░░` 7.8/10
- `workout/empty` `████████░░` 8.2/10
- `workout/search-typing` `███████░░░` 7.5/10

### `macbook-13` — avg 6.4/10

- `dashboard/default` `██████░░░░` 6.0/10
- `dishes/create-form-open` `███████░░░` 7.0/10
- `dishes/empty-list` `██████░░░░` 6.5/10
- `onboarding/step-1` `███████░░░` 7.5/10
- `profile/default` `██████░░░░` 6.5/10
- `tracker/date-nav-open` `██████░░░░` 6.5/10
- `tracker/empty` `██████░░░░` 6.0/10
- `tracker/search-typing` `██████░░░░` 6.5/10
- `workout/empty` `█████░░░░░` 5.5/10
- `workout/search-typing` `██████░░░░` 6.0/10
