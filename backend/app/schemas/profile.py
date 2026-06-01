from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class OnboardingInput(BaseModel):
    name: str
    age: int
    gender: str
    height_cm: float
    current_weight_kg: float
    goal_weight_kg: float
    time_to_reach_goal_weeks: int
    experience_level: str
    activity_level: str
    diet_type: str
    wants_workout_split: bool = False
    wants_diet_plan: bool = False


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    goal_weight_kg: Optional[float] = None
    time_to_reach_goal_weeks: Optional[int] = None
    experience_level: Optional[str] = None
    activity_level: Optional[str] = None
    diet_type: Optional[str] = None
    wants_workout_split: Optional[bool] = None
    wants_diet_plan: Optional[bool] = None


class ProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    name: str
    age: int
    gender: str
    height_cm: float
    current_weight_kg: float
    goal_weight_kg: float
    time_to_reach_goal_weeks: int
    experience_level: str
    activity_level: str
    diet_type: str
    wants_workout_split: bool
    wants_diet_plan: bool
    bmr_kcal: Optional[float] = None
    tdee_kcal: Optional[float] = None
    target_calories_kcal: Optional[float] = None
    bmi: Optional[float] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    created_at: datetime
    updated_at: datetime
