from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.database import get_db
from app.auth import get_current_user_id
from app.models.workout_log import ExerciseLibrary, WorkoutLog
from app.models.user_profile import UserProfile
from app.schemas.workout import (
    ExerciseSearchResult, WorkoutLogCreate, WorkoutLogUpdate, WorkoutLogRead, DailyWorkoutRead
)
from app.services.workout_service import calculate_calories_burned

router = APIRouter()


@router.get("/search", response_model=List[ExerciseSearchResult])
def search_exercises(
    q: str = Query(min_length=2),
    limit: int = Query(default=10, le=30),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    q_lower = q.lower().strip()
    results = (
        db.query(ExerciseLibrary)
        .filter(
            or_(
                func.similarity(ExerciseLibrary.name_normalized, q_lower) > 0.1,
                ExerciseLibrary.name_normalized.ilike(f"%{q_lower}%"),
            )
        )
        .order_by(func.similarity(ExerciseLibrary.name_normalized, q_lower).desc())
        .limit(limit)
        .all()
    )
    return [
        ExerciseSearchResult(
            id=e.id, name=e.name, category=e.category,
            muscle_group=e.muscle_group, equipment=e.equipment,
            level=e.level, met_value=float(e.met_value),
        )
        for e in results
    ]


@router.post("/log", response_model=WorkoutLogRead, status_code=201)
def log_workout(
    body: WorkoutLogCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    exercise = db.get(ExerciseLibrary, body.exercise_id) if body.exercise_id else None
    if body.exercise_id and not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    # Get user weight for calorie calculation
    profile = db.query(UserProfile).filter_by(user_id=user_id).first()
    weight_kg = float(profile.current_weight_kg) if profile else 70.0

    calories = None
    if exercise and body.duration_min and body.duration_min > 0:
        calories = calculate_calories_burned(
            float(exercise.met_value), weight_kg, float(body.duration_min)
        )

    entry = WorkoutLog(
        user_id=user_id,
        log_date=body.log_date,
        exercise_id=body.exercise_id,
        exercise_name=exercise.name if exercise else "Custom exercise",
        category=exercise.category if exercise else "strength",
        sets=body.sets,
        reps=body.reps,
        weight_kg=body.weight_kg,
        duration_min=body.duration_min,
        calories_burned=calories,
        notes=body.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _to_read(entry)


@router.get("/log", response_model=DailyWorkoutRead)
def get_workout_log(
    log_date: date = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if log_date is None:
        log_date = date.today()
    entries = (
        db.query(WorkoutLog)
        .filter_by(user_id=user_id, log_date=log_date)
        .order_by(WorkoutLog.created_at)
        .all()
    )
    total_cal = sum(float(e.calories_burned) for e in entries if e.calories_burned)
    return DailyWorkoutRead(
        log_date=log_date,
        entries=[_to_read(e) for e in entries],
        total_calories_burned=round(total_cal, 2),
    )


@router.patch("/log/{entry_id}", response_model=WorkoutLogRead)
def update_workout_log(
    entry_id: int,
    body: WorkoutLogUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    entry = db.query(WorkoutLog).filter_by(id=entry_id, user_id=user_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Workout log entry not found")

    if body.sets is not None:
        entry.sets = body.sets
    if body.reps is not None:
        entry.reps = body.reps
    if body.weight_kg is not None:
        entry.weight_kg = body.weight_kg
    if body.duration_min is not None:
        entry.duration_min = body.duration_min
    if body.notes is not None:
        entry.notes = body.notes

    # Recompute calories if duration changed
    if body.duration_min is not None and entry.exercise_id:
        exercise = db.get(ExerciseLibrary, entry.exercise_id)
        profile = db.query(UserProfile).filter_by(user_id=user_id).first()
        weight_kg = float(profile.current_weight_kg) if profile else 70.0
        if exercise and entry.duration_min and entry.duration_min > 0:
            entry.calories_burned = calculate_calories_burned(
                float(exercise.met_value), weight_kg, float(entry.duration_min)
            )

    db.commit()
    db.refresh(entry)
    return _to_read(entry)


@router.delete("/log/{entry_id}", status_code=200)
def delete_workout_log(
    entry_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    entry = db.query(WorkoutLog).filter_by(id=entry_id, user_id=user_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Workout log entry not found")
    db.delete(entry)
    db.commit()
    return {"deleted": True, "entry_id": entry_id}


@router.get("/history")
def get_workout_history(
    days: int = Query(default=30, le=365),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    from datetime import timedelta
    since = date.today() - timedelta(days=days)
    entries = (
        db.query(WorkoutLog)
        .filter(WorkoutLog.user_id == user_id, WorkoutLog.log_date >= since)
        .order_by(WorkoutLog.log_date.desc())
        .all()
    )
    return [_to_read(e) for e in entries]


def _to_read(e: WorkoutLog) -> WorkoutLogRead:
    return WorkoutLogRead(
        id=e.id, user_id=e.user_id, log_date=e.log_date,
        exercise_id=e.exercise_id, exercise_name=e.exercise_name,
        category=e.category, sets=e.sets, reps=e.reps,
        weight_kg=float(e.weight_kg) if e.weight_kg else None,
        duration_min=float(e.duration_min) if e.duration_min else None,
        calories_burned=float(e.calories_burned) if e.calories_burned else None,
        notes=e.notes, created_at=e.created_at,
    )
