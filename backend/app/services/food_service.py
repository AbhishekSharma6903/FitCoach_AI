from typing import List, Optional
from sqlalchemy.orm import Session
from rapidfuzz import process, fuzz

from app.models.food_item import FoodItem


def fuzzy_search_foods(
    query: str,
    db: Session,
    limit: int = 10,
    diet_filter: Optional[str] = None,
) -> List[dict]:
    all_foods = db.query(FoodItem).all()

    if diet_filter == "veg":
        all_foods = [f for f in all_foods if f.is_veg and not f.is_egg]
    elif diet_filter == "egg":
        all_foods = [f for f in all_foods if f.is_veg or f.is_egg]

    if not all_foods:
        return []

    name_map = {f.name_normalized: f for f in all_foods}
    matches = process.extract(
        query.lower().strip(),
        list(name_map.keys()),
        scorer=fuzz.WRatio,
        limit=limit,
        score_cutoff=35,
    )

    results = []
    for match_name, score, _ in matches:
        food = name_map[match_name]
        results.append(
            {
                "id": food.id,
                "name": food.name,
                "category": food.category,
                "region": food.region,
                "serving_size_g": float(food.serving_size_g),
                "calories_kcal": float(food.calories_kcal),
                "protein_g": float(food.protein_g),
                "carbs_g": float(food.carbs_g),
                "fat_g": float(food.fat_g),
                "fiber_g": float(food.fiber_g),
                "sugar_g": float(food.sugar_g),
                "is_veg": food.is_veg,
                "is_egg": food.is_egg,
                "score": round(score, 1),
            }
        )

    return sorted(results, key=lambda x: x["score"], reverse=True)
