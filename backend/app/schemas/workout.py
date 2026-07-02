from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ExerciseSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    category: str
    muscle_group: Optional[str] = None
    equipment: Optional[str] = None
    level: Optional[str] = None
    met_value: float


class WorkoutLogCreate(BaseModel):
    exercise_id:  Optional[int]   = None
    log_date:     date
    sets:         Optional[int]   = None
    reps:         Optional[int]   = None
    weight_kg:    Optional[float] = None
    duration_min: Optional[float] = None
    notes:        Optional[str]   = None


class WorkoutLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: str
    log_date: date
    exercise_id: Optional[int] = None
    exercise_name: str
    category: str
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight_kg: Optional[float] = None
    duration_min: Optional[float] = None
    calories_burned: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime


class DailyWorkoutRead(BaseModel):
    log_date: date
    entries: List[WorkoutLogRead]
    total_calories_burned: float
