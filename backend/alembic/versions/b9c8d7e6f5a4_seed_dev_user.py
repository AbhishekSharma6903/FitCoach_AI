"""seed_dev_user

Upserts a complete dev user + profile for local development.
Only runs if DEV_USER_ID exists in the environment (set via backend/.env).
On a fresh clone, `./dev.sh start` runs `alembic upgrade head` which
triggers this migration — no manual onboarding needed.

The dev user uses the same ID as the backend's DEV_USER_ID env var
(default: dev-user-001), so all requests in DEV_MODE are pre-authenticated.

Revision ID: b9c8d7e6f5a4
Revises: a1b2c3d4e5f6
Create Date: 2026-07-02
"""
import os
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'b9c8d7e6f5a4'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEV_USER_ID = os.environ.get("DEV_USER_ID", "dev-user-001")

# A realistic dev profile — Indian male, beginner, moderate cut goal
DEV_PROFILE = {
    "user_id":                   DEV_USER_ID,
    "name":                      "Dev User",
    "age":                       28,
    "gender":                    "male",
    "height_cm":                 175.0,
    "current_weight_kg":         78.0,
    "goal_weight_kg":            72.0,
    "time_to_reach_goal_weeks":  16,
    "experience_level":          "beginner",
    "activity_level":            "moderate",
    "diet_type":                 "veg",
    "wants_workout_split":       True,
    "wants_diet_plan":           True,
    # Pre-computed so onboarding is never needed:
    #   BMR  = (10×78) + (6.25×175) − (5×28) + 5 = 1783.75
    #   TDEE = 1783.75 × 1.55                    = 2764.81
    #   daily_delta = (72−78)/16 × 7700/7        = −412.5
    #   target = max(2764.81 − 412.5, 1400)      = 2352.31
    "bmr_kcal":                  1783.75,
    "tdee_kcal":                 2764.81,
    "target_calories_kcal":      2352.31,
    "bmi":                       25.47,           # 78 / (1.75²)
    "protein_g":                 176.4,           # 30% of 2352 / 4
    "carbs_g":                   235.2,           # 40% / 4
    "fat_g":                     78.4,            # 30% / 9
    "created_at":                datetime.now(timezone.utc),
    "updated_at":                datetime.now(timezone.utc),
}


def upgrade() -> None:
    conn = op.get_bind()
    now = datetime.now(timezone.utc)

    # 1. Upsert the user row
    conn.execute(sa.text("""
        INSERT INTO users (id, created_at)
        VALUES (:id, :created_at)
        ON CONFLICT (id) DO NOTHING
    """), {"id": DEV_USER_ID, "created_at": now})

    # 2. Upsert the profile — update if already exists so fresh clones
    #    always get the canonical dev profile even after partial onboarding
    existing = conn.execute(
        sa.text("SELECT id FROM user_profiles WHERE user_id = :uid"),
        {"uid": DEV_USER_ID}
    ).fetchone()

    if existing:
        conn.execute(sa.text("""
            UPDATE user_profiles SET
                name                      = :name,
                age                       = :age,
                gender                    = :gender,
                height_cm                 = :height_cm,
                current_weight_kg         = :current_weight_kg,
                goal_weight_kg            = :goal_weight_kg,
                time_to_reach_goal_weeks  = :time_to_reach_goal_weeks,
                experience_level          = :experience_level,
                activity_level            = :activity_level,
                diet_type                 = :diet_type,
                wants_workout_split       = :wants_workout_split,
                wants_diet_plan           = :wants_diet_plan,
                bmr_kcal                  = :bmr_kcal,
                tdee_kcal                 = :tdee_kcal,
                target_calories_kcal      = :target_calories_kcal,
                bmi                       = :bmi,
                protein_g                 = :protein_g,
                carbs_g                   = :carbs_g,
                fat_g                     = :fat_g,
                updated_at                = :updated_at
            WHERE user_id = :user_id
        """), DEV_PROFILE)
        print(f"  Dev profile updated for {DEV_USER_ID}")
    else:
        conn.execute(sa.text("""
            INSERT INTO user_profiles (
                user_id, name, age, gender, height_cm,
                current_weight_kg, goal_weight_kg, time_to_reach_goal_weeks,
                experience_level, activity_level, diet_type,
                wants_workout_split, wants_diet_plan,
                bmr_kcal, tdee_kcal, target_calories_kcal, bmi,
                protein_g, carbs_g, fat_g,
                created_at, updated_at
            ) VALUES (
                :user_id, :name, :age, :gender, :height_cm,
                :current_weight_kg, :goal_weight_kg, :time_to_reach_goal_weeks,
                :experience_level, :activity_level, :diet_type,
                :wants_workout_split, :wants_diet_plan,
                :bmr_kcal, :tdee_kcal, :target_calories_kcal, :bmi,
                :protein_g, :carbs_g, :fat_g,
                :created_at, :updated_at
            )
        """), DEV_PROFILE)
        print(f"  Dev profile created for {DEV_USER_ID}")


def downgrade() -> None:
    # Don't delete — dev user data is intentional and useful to keep
    pass
