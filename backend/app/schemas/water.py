from datetime import date
from typing import List
from pydantic import BaseModel, Field


class WaterLogCreate(BaseModel):
    amount_ml: int = Field(..., gt=0, le=2000, description="Amount in ml, max 2000ml per entry")
    log_date: date = Field(default_factory=date.today)


class WaterLogEntryRead(BaseModel):
    id: int
    amount_ml: int
    log_date: date

    model_config = {"from_attributes": True}


class WaterDailyRead(BaseModel):
    log_date: date
    total_ml: int
    goal_ml: int
    entries: List[WaterLogEntryRead]
    pct_complete: float          # 0.0 – 1.0
    remaining_ml: int
