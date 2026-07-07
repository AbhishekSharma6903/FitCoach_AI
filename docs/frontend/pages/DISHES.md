# Dishes (`/dishes`)

## Purpose
Build and manage reusable composite recipes (custom dishes) from ingredients in the food catalog. Solves the problem of logging Indian home cooking (e.g. "My Dal Tadka") as a single item.

## Layout
Single column. State machine between list view and builder view — no URL routing, no sidebar.

## Data
- `useCustomDishes()` — `GET /dishes`, `POST /dishes`, `PUT /dishes/{id}`, `DELETE /dishes/{id}`
- Ingredient search inside builder: `GET /food/search?q=` via `SearchCommand`

## State machine
```
view: "list" | { kind: "create" } | { kind: "edit"; dishId; name; ingredients }
```
`AnimatePresence` horizontal slide between list and builder. `slideDir.current` ref (1 = enter builder, -1 = back to list) drives animation direction.

## List view
- `DishList` — staggered list of `DishCard` tiles
- Each card: dish name, calories/macros per 100g, ingredient count, edit + delete
- Delete uses `DeleteConfirmDialog`
- Empty state: illustration + "Create your first dish" CTA

## Builder view (DishBuilder)
- Dish name input
- Ingredient search (`SearchCommand` → select food → `IngredientRow` added)
- Each `IngredientRow`: food name, unit selector (`getUnitOptions`), quantity input, remove button
- Live nutrition preview (`DishNutritionPreview`): macro bars fill relative to highest macro
- Save: `POST /dishes` (create) or `PUT /dishes/{id}` (edit)

## Unit system
`getUnitOptions(foodItem)` returns 3–6 context-appropriate unit options per food. Category detection covers 9 types (oils, eggs, liquids, breads, idlis, cooked grains, curries, whole fruits, nuts). `quantity_g = display_amount × selected_unit.weight_g` — the API only ever receives `quantity_g`.

Edit flow: saved ingredients only have `quantity_g`. The edit path reconstructs units using `getUnitOptions` + finding the option whose `weight_g` is closest to the saved value.

## Nutrition computation
Backend `dish_service.py`: sums weighted nutrients from all ingredients (`ingredient.quantity_g / food.serving_size_g × food.nutrient`), then scales to per-100g values stored on the dish. Frontend shows full-dish totals (`calories_kcal_per100g × total_weight_g / 100`).

## Components

```
src/components/dishes/
  DishList.tsx
  DishCard.tsx
  DishBuilder.tsx
  IngredientRow.tsx
  DishNutritionPreview.tsx
  InfoBanner.tsx          ← explains what custom dishes are
src/lib/dishUtils.ts      ← getUnitOptions, defaultOption, computeDishNutrition
```
