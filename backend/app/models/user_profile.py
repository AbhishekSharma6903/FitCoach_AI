from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, SmallInteger, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    # Personal
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    age: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    gender: Mapped[str] = mapped_column(String(16), nullable=False)
    height_cm: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)

    # Weight goals
    current_weight_kg: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    goal_weight_kg: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    time_to_reach_goal_weeks: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    # Fitness profile
    experience_level: Mapped[str] = mapped_column(String(16), nullable=False)
    activity_level: Mapped[str] = mapped_column(String(16), nullable=False)

    # Diet preferences
    diet_type: Mapped[str] = mapped_column(String(16), nullable=False)
    wants_workout_split: Mapped[bool] = mapped_column(Boolean, default=False)
    wants_diet_plan: Mapped[bool] = mapped_column(Boolean, default=False)

    # Computed + cached
    bmr_kcal: Mapped[Decimal] = mapped_column(Numeric(7, 2), nullable=True)
    tdee_kcal: Mapped[Decimal] = mapped_column(Numeric(7, 2), nullable=True)
    target_calories_kcal: Mapped[Decimal] = mapped_column(Numeric(7, 2), nullable=True)
    bmi: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)
    protein_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=True)
    carbs_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=True)
    fat_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
