# Admin Panel (`/admin`, `/admin/users`, `/admin/food`)

## Purpose
Internal tool for managing the platform. Three sub-routes: platform stats, user profiles (read-only), and food catalog CRUD.

## Access
`useAdminCheck` probes `GET /admin/stats` on mount. 200 → admin, 403 → `router.replace("/dashboard")`. No visible "access denied" page — admins know they're admins.

Admin access is defined by `ADMIN_USER_IDS` in `backend/.env` — no DB column. Adding/removing admins requires only an env var change.

Admin link in `TopNav` (orange, ShieldAlert icon) and Admin Panel link in `AccountSection` on Profile are both conditional on `isAdmin`.

## Layout
`PageShell` standard two-tier width. `AdminSubNav` pill strip (Stats / Users / Food) below the page heading. `BottomNav` remains visible with standard 5 user tabs — admin is accessed via TopNav or Profile.

---

## `/admin` — Stats

Four stat tiles (`ProgressStatCard` visual) in `grid-cols-2 sm:grid-cols-4`:
- Total users
- Total food items
- Total exercises
- Exercises with images

Below: last 5 registered users (read-only list from `GET /admin/users?limit=5`).

---

## `/admin/users` — User List + Detail

`GET /admin/users` loads all users (client-side filter — user count is small).

`AnimatePresence` state machine: `"list" | { userId: string }`. Horizontal slide (same pattern as Dishes).

**List**: filter input, user rows (colour-initial avatar, name, diet badge, chevron). User IDs truncated: `id.slice(0,12)…`.

**Detail**: full `AdminUserDetail` card — identity (avatar, name, age/gender/height, truncated ID), 4-tile stats grid (BMI, TDEE, Target, Protein), profile fields (weight, goal, activity, diet, experience, workout/meal preferences). All read-only.

User deactivation (`is_active`) not implemented — `User` model has no such column.

---

## `/admin/food` — Food Catalog CRUD

Desktop: `xl:grid-cols-[1fr_360px]` — list left, sticky form panel right.
Mobile: state machine between list and form (same `AnimatePresence` pattern).

**List**: `GET /admin/food?search=q&skip=0&limit=100`, debounced 350ms search. "Load 100 more" pagination (appends to list). Each `FoodRow`: veg dot, name + `{kcal} · {category}` subtitle, edit/delete icons.

**FoodForm**: shared create/edit form. Category and region are free-text inputs — DB has 60+ heterogeneous category strings from USDA/IFCT2017/Kaggle, a curated select would be unusable. `is_vegan` not in form — not in `FoodItemRead` backend schema.

Save: `POST /admin/food` (create) or `PUT /admin/food/{id}`. Delete: `DeleteConfirmDialog` → `DELETE /admin/food/{id}` → `AnimatePresence` height-collapse exit.

## Components

```
src/components/admin/
  AdminSubNav.tsx
  AdminStatCard.tsx
  UserRow.tsx
  UserDetailView.tsx
  FoodRow.tsx
  FoodForm.tsx
src/hooks/
  useAdminCheck.ts
  useAdminUsers.ts
  useAdminFood.ts
```
