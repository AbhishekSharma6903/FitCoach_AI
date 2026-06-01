from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from app.database import get_db
from app.auth import get_current_user_id
from app.models.weight_log import WeightLog
from app.schemas.weight import WeightLogCreate, WeightLogRead, WeightHistoryRead

router = APIRouter()


@router.post("/log", response_model=WeightLogRead)
def log_weight(
    body: WeightLogCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    stmt = (
        insert(WeightLog)
        .values(user_id=user_id, log_date=body.log_date, weight_kg=body.weight_kg, note=body.note)
        .on_conflict_do_update(
            constraint="uq_weight_log_user_date",
            set_={"weight_kg": body.weight_kg, "note": body.note},
        )
        .returning(WeightLog)
    )
    db.execute(stmt)
    db.commit()
    return db.query(WeightLog).filter_by(user_id=user_id, log_date=body.log_date).first()


@router.get("/log", response_model=WeightHistoryRead)
def get_weight_log(
    days: int = Query(default=30, le=365),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    cutoff = date.today() - timedelta(days=days)
    entries = (
        db.query(WeightLog)
        .filter(WeightLog.user_id == user_id, WeightLog.log_date >= cutoff)
        .order_by(WeightLog.log_date)
        .all()
    )
    if not entries:
        return WeightHistoryRead(entries=[], start_weight_kg=None, current_weight_kg=None, change_kg=None)

    start = float(entries[0].weight_kg)
    current = float(entries[-1].weight_kg)
    return WeightHistoryRead(
        entries=entries,
        start_weight_kg=start,
        current_weight_kg=current,
        change_kg=round(current - start, 2),
    )


@router.get("/log/latest", response_model=Optional[WeightLogRead])
def get_latest_weight(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    return (
        db.query(WeightLog)
        .filter_by(user_id=user_id)
        .order_by(WeightLog.log_date.desc())
        .first()
    )
