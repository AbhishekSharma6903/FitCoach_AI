from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class WeightLogCreate(BaseModel):
    log_date: date
    weight_kg: float
    note: Optional[str] = None


class WeightLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    log_date: date
    weight_kg: float
    note: Optional[str] = None
    created_at: datetime


class WeightHistoryRead(BaseModel):
    entries: List[WeightLogRead]
    start_weight_kg: Optional[float] = None
    current_weight_kg: Optional[float] = None
    change_kg: Optional[float] = None
