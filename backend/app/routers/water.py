from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db

from app.auth import get_current_user_id
from app.models.water_log import WaterLog
from app.models.user_profile import UserProfile
from app.schemas.water import WaterLogCreate, WaterLogEntryRead, WaterDailyRead

router = APIRouter()


def _water_goal_ml(db: Session, user_id: str) -> int:
    profile = db.query(UserProfile).filter_by(user_id=user_id).first()
    if not profile or not profile.current_weight_kg:
        return 2500
    goal = int(float(profile.current_weight_kg) * 35)
    return max(2000, min(4000, goal))


@router.post("/log", response_model=WaterLogEntryRead, status_code=201)
def log_water(
    body: WaterLogCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    entry = WaterLog(user_id=user_id, log_date=body.log_date, amount_ml=body.amount_ml)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/log/{entry_id}", status_code=200)
def delete_water_entry(
    entry_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    entry = db.query(WaterLog).filter_by(id=entry_id, user_id=user_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"deleted": True, "entry_id": entry_id}


@router.get("/log", response_model=WaterDailyRead)
def get_water_log(
    log_date: date = Query(default_factory=date.today),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(WaterLog)
        .filter_by(user_id=user_id, log_date=log_date)
        .order_by(WaterLog.created_at)
        .all()
    )
    total_ml = sum(e.amount_ml for e in entries)
    goal_ml = _water_goal_ml(db, user_id)
    pct = min(total_ml / goal_ml, 1.0) if goal_ml > 0 else 0.0

    return WaterDailyRead(
        log_date=log_date,
        total_ml=total_ml,
        goal_ml=goal_ml,
        entries=[WaterLogEntryRead.model_validate(e) for e in entries],
        pct_complete=round(pct, 3),
        remaining_ml=max(0, goal_ml - total_ml),
    )
