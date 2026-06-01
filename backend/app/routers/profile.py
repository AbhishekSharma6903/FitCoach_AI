from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user_id
from app.models.user_profile import UserProfile
from app.schemas.profile import OnboardingInput, ProfileUpdate, ProfileRead
from app.services.calculation_engine import (
    calculate_bmr, calculate_tdee, calculate_target_calories,
    calculate_bmi, calculate_macros
)

router = APIRouter()


def _compute_and_save_profile(db: Session, data: dict, profile: UserProfile) -> UserProfile:
    bmr = calculate_bmr(
        float(data["current_weight_kg"]),
        float(data["height_cm"]),
        int(data["age"]),
        data["gender"],
    )
    tdee = calculate_tdee(bmr, data["activity_level"])
    target_cal = calculate_target_calories(
        tdee,
        float(data["current_weight_kg"]),
        float(data["goal_weight_kg"]),
        int(data["time_to_reach_goal_weeks"]),
        data["gender"],
    )
    bmi = calculate_bmi(float(data["current_weight_kg"]), float(data["height_cm"]))
    macros = calculate_macros(target_cal, data["diet_type"], float(data["goal_weight_kg"]))

    for key, val in data.items():
        setattr(profile, key, val)

    profile.bmr_kcal = round(bmr, 2)
    profile.tdee_kcal = round(tdee, 2)
    profile.target_calories_kcal = round(target_cal, 2)
    profile.bmi = round(bmi, 2)
    profile.protein_g = macros["protein_g"]
    profile.carbs_g = macros["carbs_g"]
    profile.fat_g = macros["fat_g"]
    return profile


@router.post("/onboarding", response_model=ProfileRead)
def onboarding(
    body: OnboardingInput,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.query(UserProfile).filter_by(user_id=user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    _compute_and_save_profile(db, body.model_dump(), profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("", response_model=ProfileRead)
def get_profile(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.query(UserProfile).filter_by(user_id=user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("", response_model=ProfileRead)
def update_profile(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.query(UserProfile).filter_by(user_id=user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Complete onboarding first.")

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    merged = {
        "name": profile.name, "age": profile.age, "gender": profile.gender,
        "height_cm": profile.height_cm, "current_weight_kg": profile.current_weight_kg,
        "goal_weight_kg": profile.goal_weight_kg,
        "time_to_reach_goal_weeks": profile.time_to_reach_goal_weeks,
        "experience_level": profile.experience_level, "activity_level": profile.activity_level,
        "diet_type": profile.diet_type,
        "wants_workout_split": profile.wants_workout_split,
        "wants_diet_plan": profile.wants_diet_plan,
    }
    merged.update(update_data)
    _compute_and_save_profile(db, merged, profile)
    db.commit()
    db.refresh(profile)
    return profile
