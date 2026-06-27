from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class FoodItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: Optional[str] = None
    region: Optional[str] = None
    serving_size_g: float
    calories_kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    sugar_g: float
    is_veg: bool
    is_egg: bool


class FoodItemSearchResult(FoodItemRead):
    is_custom: bool = False


class FoodLogCreate(BaseModel):
    food_item_id: int
    log_date: date
    meal_type: str
    quantity_g: float


class FoodLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    food_item_id: int
    food_name: str
    log_date: date
    meal_type: str
    quantity_g: float
    calories_kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    created_at: datetime


class MacroTotals(BaseModel):
    calories_kcal: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float


class DailyNutritionRead(BaseModel):
    log_date: date
    entries: List[FoodLogRead]
    totals: MacroTotals
    targets: MacroTotals
