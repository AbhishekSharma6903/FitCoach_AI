from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user_id
from app.models.food_log_entry import FoodLogEntry
from app.models.weight_log import WeightLog
from app.models.water_log import WaterLog
from app.models.workout_log import WorkoutLog
from app.models.user_profile import UserProfile
from app.schemas.dashboard import DashboardRead, MacroSnapshot, WeightPoint, MilestoneRead, WaterSnapshot
from app.services.calculation_engine import compute_milestones, get_next_milestone

router = APIRouter()


def _calculate_streak(user_id: str, db: Session) -> int:
    logs = (
        db.query(FoodLogEntry.log_date)
        .filter_by(user_id=user_id)
        .distinct()
        .order_by(FoodLogEntry.log_date.desc())
        .all()
    )
    streak = 0
    expected = date.today()
    for (log_date,) in logs:
        if log_date == expected:
            streak += 1
            expected -= timedelta(days=1)
        elif log_date == date.today() - timedelta(days=1) and streak == 0:
            streak += 1
            expected = log_date - timedelta(days=1)
        else:
            break
    return streak


@router.get("", response_model=DashboardRead)
def get_dashboard(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.query(UserProfile).filter_by(user_id=user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    today = date.today()

    entries = db.query(FoodLogEntry).filter_by(user_id=user_id, log_date=today).all()
    calories_consumed = sum(float(e.calories_kcal) for e in entries)
    protein_consumed = sum(float(e.protein_g) for e in entries)
    carbs_consumed = sum(float(e.carbs_g) for e in entries)
    fat_consumed = sum(float(e.fat_g) for e in entries)

    target_cal = float(profile.target_calories_kcal) if profile.target_calories_kcal else 2000.0
    target_protein = float(profile.protein_g) if profile.protein_g else 150.0
    target_carbs = float(profile.carbs_g) if profile.carbs_g else 200.0
    target_fat = float(profile.fat_g) if profile.fat_g else 55.0

    streak = _calculate_streak(user_id, db)

    cutoff = today - timedelta(days=30)
    weight_entries = (
        db.query(WeightLog)
        .filter(WeightLog.user_id == user_id, WeightLog.log_date >= cutoff)
        .order_by(WeightLog.log_date)
        .all()
    )

    latest_weight = (
        float(weight_entries[-1].weight_kg) if weight_entries
        else float(profile.current_weight_kg)
    )

    # Water
    water_entries = db.query(WaterLog).filter_by(user_id=user_id, log_date=today).all()
    water_total_ml = sum(e.amount_ml for e in water_entries)
    raw_goal = int(float(profile.current_weight_kg) * 35) if profile.current_weight_kg else 2500
    water_goal_ml = max(2000, min(4000, raw_goal))
    water_pct = min(water_total_ml / water_goal_ml, 1.0) if water_goal_ml > 0 else 0.0

    # Milestones
    next_milestone = None
    if profile:
        milestones = compute_milestones(
            float(profile.current_weight_kg),
            float(profile.goal_weight_kg),
            profile.time_to_reach_goal_weeks,
        )
        raw = get_next_milestone(latest_weight, float(profile.goal_weight_kg), milestones)
        if raw:
            next_milestone = MilestoneRead(**raw)

    # Workout — calories burned today
    workout_entries = db.query(WorkoutLog).filter_by(user_id=user_id, log_date=today).all()
    calories_burned_today = round(sum(float(w.calories_burned) for w in workout_entries if w.calories_burned), 2)
    calories_net = round(calories_consumed - calories_burned_today, 2)

    return DashboardRead(
        user_name=profile.name,
        today_date=today,
        calories_consumed=round(calories_consumed, 2),
        calories_target=round(target_cal, 2),
        calories_remaining=round(max(0, target_cal - calories_consumed), 2),
        calories_burned_today=calories_burned_today,
        calories_net=calories_net,
        macros_consumed=MacroSnapshot(
            protein_g=round(protein_consumed, 2),
            carbs_g=round(carbs_consumed, 2),
            fat_g=round(fat_consumed, 2),
        ),
        macros_target=MacroSnapshot(
            protein_g=round(target_protein, 2),
            carbs_g=round(target_carbs, 2),
            fat_g=round(target_fat, 2),
        ),
        streak_days=streak,
        weight_entries=[WeightPoint(log_date=w.log_date, weight_kg=float(w.weight_kg)) for w in weight_entries],
        next_milestone=next_milestone,
        bmi=float(profile.bmi) if profile.bmi else None,
        tdee_kcal=float(profile.tdee_kcal) if profile.tdee_kcal else None,
        goal_weight_kg=float(profile.goal_weight_kg),
        time_to_goal_weeks=profile.time_to_reach_goal_weeks,
        water=WaterSnapshot(
            total_ml=water_total_ml,
            goal_ml=water_goal_ml,
            pct_complete=round(water_pct, 3),
            remaining_ml=max(0, water_goal_ml - water_total_ml),
        ),
    )
