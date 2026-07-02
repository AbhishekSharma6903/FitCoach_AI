from datetime import date
from typing import List, Optional
from pydantic import BaseModel


class MacroSnapshot(BaseModel):
    protein_g: float
    carbs_g: float
    fat_g: float


class WeightPoint(BaseModel):
    log_date: date
    weight_kg: float


class MilestoneRead(BaseModel):
    label: str
    target_weight_kg: float
    estimated_date: str
    weeks_away: float


class WaterSnapshot(BaseModel):
    total_ml: int
    goal_ml: int
    pct_complete: float
    remaining_ml: int


class DashboardRead(BaseModel):
    user_name: str
    today_date: date
    calories_consumed: float
    calories_target: float
    calories_remaining: float
    calories_burned_today: float = 0.0
    calories_net: float = 0.0
    macros_consumed: MacroSnapshot
    macros_target: MacroSnapshot
    streak_days: int
    weight_entries: List[WeightPoint]
    next_milestone: Optional[MilestoneRead] = None
    bmi: Optional[float] = None
    tdee_kcal: Optional[float] = None
    goal_weight_kg: float
    time_to_goal_weeks: int
    water: WaterSnapshot
