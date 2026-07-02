from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class DishIngredientCreate(BaseModel):
    food_item_id: int
    quantity_g: float


class DishCreate(BaseModel):
    name: str
    ingredients: List[DishIngredientCreate]


class DishIngredientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    food_item_id: int
    food_name: str
    quantity_g: float


class DishRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: str
    name: str
    name_normalized: str
    total_weight_g: float
    calories_kcal: Optional[float] = None
    protein_g:     Optional[float] = None
    carbs_g:       Optional[float] = None
    fat_g:         Optional[float] = None
    fiber_g:       Optional[float] = None
    sugar_g:       Optional[float] = None
    sodium_mg:     Optional[float] = None
    is_veg:   bool
    is_egg:   bool
    is_vegan: bool
    ingredients: List[DishIngredientRead] = []
    created_at: datetime
    updated_at: datetime


class DishListItem(BaseModel):
    """Lightweight version for list views — no ingredients array."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    total_weight_g: float
    calories_kcal: Optional[float] = None
    protein_g:     Optional[float] = None
    carbs_g:       Optional[float] = None
    fat_g:         Optional[float] = None
    is_veg:   bool
    is_egg:   bool
    ingredient_count: int = 0
