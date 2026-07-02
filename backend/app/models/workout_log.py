from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Numeric, Boolean, DateTime, Date, ForeignKey, Index, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ExerciseLibrary(Base):
    __tablename__ = "exercise_library"

    id:              Mapped[int]              = mapped_column(primary_key=True, autoincrement=True)
    name:            Mapped[str]              = mapped_column(String(256), nullable=False)
    name_normalized: Mapped[str]              = mapped_column(String(256), nullable=False)
    category:        Mapped[str]              = mapped_column(String(32),  nullable=False)
    muscle_group:    Mapped[Optional[str]]    = mapped_column(String(128), nullable=True)
    equipment:       Mapped[Optional[str]]    = mapped_column(String(64),  nullable=True)
    level:           Mapped[Optional[str]]    = mapped_column(String(16),  nullable=True)
    met_value:       Mapped[Decimal]          = mapped_column(Numeric(4, 1), nullable=False)
    instructions:    Mapped[Optional[str]]    = mapped_column(Text, nullable=True)
    aliases:         Mapped[Optional[str]]    = mapped_column(Text, nullable=True)
    is_custom:       Mapped[bool]             = mapped_column(Boolean, default=False)


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id:             Mapped[int]              = mapped_column(primary_key=True, autoincrement=True)
    user_id:        Mapped[str]              = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date:       Mapped[date]             = mapped_column(Date, nullable=False)
    exercise_id:    Mapped[Optional[int]]    = mapped_column(ForeignKey("exercise_library.id"), nullable=True)
    exercise_name:  Mapped[str]              = mapped_column(String(256), nullable=False)
    category:       Mapped[str]              = mapped_column(String(32),  nullable=False)
    sets:           Mapped[Optional[int]]    = mapped_column(Integer, nullable=True)
    reps:           Mapped[Optional[int]]    = mapped_column(Integer, nullable=True)
    weight_kg:      Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    duration_min:   Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 1), nullable=True)
    calories_burned:Mapped[Optional[Decimal]] = mapped_column(Numeric(7, 2), nullable=True)
    notes:          Mapped[Optional[str]]    = mapped_column(Text, nullable=True)
    created_at:     Mapped[datetime]         = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("idx_workout_logs_user_date", "user_id", "log_date"),
    )
