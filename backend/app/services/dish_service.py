from collections import defaultdict
from typing import List

from sqlalchemy.orm import Session

from app.models.custom_dish import CustomDish, CustomDishIngredient
from app.models.food_item import FoodItem
from app.schemas.dish import DishIngredientCreate


def compute_dish_nutrition(ingredients: List[DishIngredientCreate], db: Session) -> dict:
    """
    Sums weighted nutrients from all ingredients and returns per-100g values.

    Each ingredient's contribution = (quantity_g / serving_size_g) * nutrient_value.
    Final values are scaled to per-100g: total_nutrient / total_weight_g * 100.
    """
    totals: dict = defaultdict(float)
    total_weight = sum(float(i.quantity_g) for i in ingredients)

    if total_weight == 0:
        return {}

    for ing in ingredients:
        item = db.get(FoodItem, ing.food_item_id)
        if not item:
            continue
        ratio = float(ing.quantity_g) / float(item.serving_size_g)
        for field in ("calories_kcal", "protein_g", "carbs_g", "fat_g",
                      "fiber_g", "sugar_g", "sodium_mg"):
            val = getattr(item, field, None)
            if val is not None:
                totals[field] += float(val) * ratio

    return {k: round(v / total_weight * 100, 2) for k, v in totals.items()}


def compute_dish_flags(ingredients: List[DishIngredientCreate], db: Session) -> dict:
    """
    Diet flags use AND-logic:
      is_veg   = ALL ingredients are veg
      is_vegan = ALL ingredients are vegan
      is_egg   = ANY ingredient is_egg AND dish is still veg
    """
    is_veg = True
    is_vegan = True
    is_egg = False

    for ing in ingredients:
        item = db.get(FoodItem, ing.food_item_id)
        if not item:
            continue
        if not item.is_veg:
            is_veg = False
        vegan = getattr(item, "is_vegan", False)
        if not vegan:
            is_vegan = False
        if item.is_egg:
            is_egg = True

    if not is_veg:
        is_egg = False
        is_vegan = False

    return {"is_veg": is_veg, "is_egg": is_egg, "is_vegan": is_vegan}


def build_dish_from_create(name: str, ingredients: List[DishIngredientCreate], db: Session, user_id: str) -> CustomDish:
    """Creates and returns an unsaved CustomDish with computed nutrition."""
    total_weight = sum(float(i.quantity_g) for i in ingredients)
    nutrition = compute_dish_nutrition(ingredients, db)
    flags = compute_dish_flags(ingredients, db)

    dish = CustomDish(
        user_id=user_id,
        name=name,
        name_normalized=name.lower().strip(),
        total_weight_g=total_weight,
        is_veg=flags["is_veg"],
        is_egg=flags["is_egg"],
        is_vegan=flags["is_vegan"],
        **{k: v for k, v in nutrition.items()},
    )
    return dish
