from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user_id
from app.models.custom_dish import CustomDish, CustomDishIngredient
from app.models.food_item import FoodItem
from app.schemas.dish import DishCreate, DishRead, DishListItem, DishIngredientRead
from app.services.dish_service import build_dish_from_create, compute_dish_nutrition, compute_dish_flags

router = APIRouter()


def _load_ingredients(dish: CustomDish, db: Session) -> List[DishIngredientRead]:
    rows = db.query(CustomDishIngredient).filter_by(dish_id=dish.id).all()
    result = []
    for r in rows:
        item = db.get(FoodItem, r.food_item_id)
        result.append(DishIngredientRead(
            id=r.id,
            food_item_id=r.food_item_id,
            food_name=item.name if item else "Unknown",
            quantity_g=float(r.quantity_g),
        ))
    return result


def _dish_to_read(dish: CustomDish, db: Session) -> DishRead:
    return DishRead(
        id=dish.id,
        user_id=dish.user_id,
        name=dish.name,
        name_normalized=dish.name_normalized,
        total_weight_g=float(dish.total_weight_g),
        calories_kcal=float(dish.calories_kcal) if dish.calories_kcal is not None else None,
        protein_g=float(dish.protein_g)     if dish.protein_g is not None else None,
        carbs_g=float(dish.carbs_g)         if dish.carbs_g is not None else None,
        fat_g=float(dish.fat_g)             if dish.fat_g is not None else None,
        fiber_g=float(dish.fiber_g)         if dish.fiber_g is not None else None,
        sugar_g=float(dish.sugar_g)         if dish.sugar_g is not None else None,
        sodium_mg=float(dish.sodium_mg)     if dish.sodium_mg is not None else None,
        is_veg=dish.is_veg,
        is_egg=dish.is_egg,
        is_vegan=dish.is_vegan,
        ingredients=_load_ingredients(dish, db),
        created_at=dish.created_at,
        updated_at=dish.updated_at,
    )


@router.post("", response_model=DishRead, status_code=201)
def create_dish(
    body: DishCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if not body.ingredients:
        raise HTTPException(status_code=422, detail="A dish must have at least one ingredient.")

    # Validate all food_item_ids exist
    for ing in body.ingredients:
        if not db.get(FoodItem, ing.food_item_id):
            raise HTTPException(status_code=404, detail=f"Food item {ing.food_item_id} not found.")

    dish = build_dish_from_create(body.name, body.ingredients, db, user_id)
    db.add(dish)
    db.flush()  # get dish.id before inserting ingredients

    for ing in body.ingredients:
        db.add(CustomDishIngredient(
            dish_id=dish.id,
            food_item_id=ing.food_item_id,
            quantity_g=ing.quantity_g,
        ))

    db.commit()
    db.refresh(dish)
    return _dish_to_read(dish, db)


@router.get("", response_model=List[DishListItem])
def list_dishes(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    dishes = db.query(CustomDish).filter_by(user_id=user_id).order_by(CustomDish.name).all()
    result = []
    for d in dishes:
        count = db.query(CustomDishIngredient).filter_by(dish_id=d.id).count()
        result.append(DishListItem(
            id=d.id,
            name=d.name,
            total_weight_g=float(d.total_weight_g),
            calories_kcal=float(d.calories_kcal) if d.calories_kcal is not None else None,
            protein_g=float(d.protein_g)         if d.protein_g is not None else None,
            carbs_g=float(d.carbs_g)             if d.carbs_g is not None else None,
            fat_g=float(d.fat_g)                 if d.fat_g is not None else None,
            is_veg=d.is_veg,
            is_egg=d.is_egg,
            ingredient_count=count,
        ))
    return result


@router.get("/{dish_id}", response_model=DishRead)
def get_dish(
    dish_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    dish = db.query(CustomDish).filter_by(id=dish_id, user_id=user_id).first()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found.")
    return _dish_to_read(dish, db)


@router.put("/{dish_id}", response_model=DishRead)
def update_dish(
    dish_id: int,
    body: DishCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    dish = db.query(CustomDish).filter_by(id=dish_id, user_id=user_id).first()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found.")
    if not body.ingredients:
        raise HTTPException(status_code=422, detail="A dish must have at least one ingredient.")

    for ing in body.ingredients:
        if not db.get(FoodItem, ing.food_item_id):
            raise HTTPException(status_code=404, detail=f"Food item {ing.food_item_id} not found.")

    # Delete old ingredients and recompute
    db.query(CustomDishIngredient).filter_by(dish_id=dish.id).delete()

    nutrition = compute_dish_nutrition(body.ingredients, db)
    flags = compute_dish_flags(body.ingredients, db)
    total_weight = sum(float(i.quantity_g) for i in body.ingredients)

    dish.name = body.name
    dish.name_normalized = body.name.lower().strip()
    dish.total_weight_g = total_weight
    dish.is_veg = flags["is_veg"]
    dish.is_egg = flags["is_egg"]
    dish.is_vegan = flags["is_vegan"]
    for k, v in nutrition.items():
        setattr(dish, k, v)

    for ing in body.ingredients:
        db.add(CustomDishIngredient(
            dish_id=dish.id,
            food_item_id=ing.food_item_id,
            quantity_g=ing.quantity_g,
        ))

    db.commit()
    db.refresh(dish)
    return _dish_to_read(dish, db)


@router.delete("/{dish_id}", status_code=200)
def delete_dish(
    dish_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    dish = db.query(CustomDish).filter_by(id=dish_id, user_id=user_id).first()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found.")
    db.delete(dish)
    db.commit()
    return {"deleted": True, "dish_id": dish_id}
