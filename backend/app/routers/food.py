from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user_id

from app.models.food_item import FoodItem
from app.models.food_log_entry import FoodLogEntry
from app.models.user_profile import UserProfile
from app.schemas.food import (
    FoodItemRead, FoodItemSearchResult, FoodLogCreate,
    FoodLogRead, DailyNutritionRead, MacroTotals
)
from app.services.food_service import fuzzy_search_foods

router = APIRouter()


@router.get("/search", response_model=List[FoodItemSearchResult])
def search_food(
    q: str = Query(min_length=2),
    limit: int = Query(default=10, le=30),
    diet_filter: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return fuzzy_search_foods(q, db, limit=limit, diet_filter=diet_filter)


@router.get("/items/{food_item_id}", response_model=FoodItemRead)
def get_food_item(
    food_item_id: int,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    item = db.get(FoodItem, food_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")
    return item


@router.post("/log", response_model=FoodLogRead)
def log_food(
    body: FoodLogCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    item = db.get(FoodItem, body.food_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found")

    ratio = float(body.quantity_g) / float(item.serving_size_g)
    entry = FoodLogEntry(
        user_id=user_id,
        food_item_id=item.id,
        log_date=body.log_date,
        meal_type=body.meal_type,
        quantity_g=body.quantity_g,
        calories_kcal=round(float(item.calories_kcal) * ratio, 2),
        protein_g=round(float(item.protein_g) * ratio, 2),
        carbs_g=round(float(item.carbs_g) * ratio, 2),
        fat_g=round(float(item.fat_g) * ratio, 2),
        fiber_g=round(float(item.fiber_g) * ratio, 2),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return FoodLogRead(
        id=entry.id,
        user_id=entry.user_id,
        food_item_id=entry.food_item_id,
        food_name=item.name,
        log_date=entry.log_date,
        meal_type=entry.meal_type,
        quantity_g=float(entry.quantity_g),
        calories_kcal=float(entry.calories_kcal),
        protein_g=float(entry.protein_g),
        carbs_g=float(entry.carbs_g),
        fat_g=float(entry.fat_g),
        fiber_g=float(entry.fiber_g),
        created_at=entry.created_at,
    )


@router.get("/log", response_model=DailyNutritionRead)
def get_food_log(
    log_date: date = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if log_date is None:
        log_date = date.today()

    entries = (
        db.query(FoodLogEntry)
        .filter_by(user_id=user_id, log_date=log_date)
        .order_by(FoodLogEntry.created_at)
        .all()
    )

    food_names = {e.food_item_id: db.get(FoodItem, e.food_item_id).name for e in entries}

    entry_reads = [
        FoodLogRead(
            id=e.id,
            user_id=e.user_id,
            food_item_id=e.food_item_id,
            food_name=food_names[e.food_item_id],
            log_date=e.log_date,
            meal_type=e.meal_type,
            quantity_g=float(e.quantity_g),
            calories_kcal=float(e.calories_kcal),
            protein_g=float(e.protein_g),
            carbs_g=float(e.carbs_g),
            fat_g=float(e.fat_g),
            fiber_g=float(e.fiber_g),
            created_at=e.created_at,
        )
        for e in entries
    ]

    totals = MacroTotals(
        calories_kcal=round(sum(e.calories_kcal for e in entry_reads), 2),
        protein_g=round(sum(e.protein_g for e in entry_reads), 2),
        carbs_g=round(sum(e.carbs_g for e in entry_reads), 2),
        fat_g=round(sum(e.fat_g for e in entry_reads), 2),
        fiber_g=round(sum(e.fiber_g for e in entry_reads), 2),
    )

    profile = db.query(UserProfile).filter_by(user_id=user_id).first()
    targets = MacroTotals(
        calories_kcal=float(profile.target_calories_kcal) if profile and profile.target_calories_kcal else 2000.0,
        protein_g=float(profile.protein_g) if profile and profile.protein_g else 150.0,
        carbs_g=float(profile.carbs_g) if profile and profile.carbs_g else 200.0,
        fat_g=float(profile.fat_g) if profile and profile.fat_g else 55.0,
        fiber_g=30.0,
    )

    return DailyNutritionRead(log_date=log_date, entries=entry_reads, totals=totals, targets=targets)


@router.delete("/log/{entry_id}")
def delete_food_log(
    entry_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    entry = db.query(FoodLogEntry).filter_by(id=entry_id, user_id=user_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(entry)
    db.commit()
    return {"deleted": True, "entry_id": entry_id}
