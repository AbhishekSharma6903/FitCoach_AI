from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.food_item import FoodItem


def fuzzy_search_foods(
    query: str,
    db: Session,
    limit: int = 10,
    diet_filter: Optional[str] = None,
) -> List[dict]:
    """
    Hybrid search: trigram similarity + LIKE prefix/substring.

    Short words (< 5 chars) get poor trigram coverage, so we combine:
      - pg_trgm similarity > 0.1 (catches typos, partial matches)
      - ILIKE '%query%' (exact substring — catches "dal" inside "dal makhani")
    Results are ranked by similarity score DESC, with LIKE-only matches at the end.
    """
    q = query.lower().strip()

    stmt = db.query(FoodItem).filter(
        or_(
            func.similarity(FoodItem.name_normalized, q) > 0.1,
            FoodItem.name_normalized.ilike(f"%{q}%"),
        )
    )

    if diet_filter == "veg":
        stmt = stmt.filter(FoodItem.is_veg == True, FoodItem.is_egg == False)  # noqa: E712
    elif diet_filter == "egg":
        stmt = stmt.filter(FoodItem.is_veg == True)  # noqa: E712

    results = (
        stmt
        .order_by(func.similarity(FoodItem.name_normalized, q).desc())
        .limit(limit)
        .all()
    )

    return [_food_to_dict(f) for f in results]


def _food_to_dict(food: FoodItem) -> dict:
    return {
        "id":            food.id,
        "name":          food.name,
        "category":      food.category,
        "region":        getattr(food, "cuisine", food.region),  # use cuisine if available
        "serving_size_g": float(food.serving_size_g),
        "calories_kcal": float(food.calories_kcal),
        "protein_g":     float(food.protein_g),
        "carbs_g":       float(food.carbs_g),
        "fat_g":         float(food.fat_g),
        "fiber_g":       float(food.fiber_g),
        "sugar_g":       float(food.sugar_g),
        "is_veg":        food.is_veg,
        "is_egg":        food.is_egg,
        "is_custom":     False,
    }
