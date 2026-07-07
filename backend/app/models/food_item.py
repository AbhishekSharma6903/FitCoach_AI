from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Numeric, Boolean, DateTime, Index, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class FoodItem(Base):
    __tablename__ = "food_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    name_normalized: Mapped[str] = mapped_column(String(256), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    serving_size_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    calories_kcal: Mapped[Decimal] = mapped_column(Numeric(7, 2), nullable=False)
    protein_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    carbs_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    fat_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    fiber_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=0)
    sugar_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=0)
    is_veg: Mapped[bool] = mapped_column(Boolean, default=True)
    is_egg: Mapped[bool] = mapped_column(Boolean, default=False)

    # Extended columns — added in migration add_food_items_extended_columns
    source: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    source_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    cuisine: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    aliases: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    saturated_fat_g: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    sodium_mg: Mapped[Optional[Decimal]] = mapped_column(Numeric(7, 2), nullable=True)
    calcium_mg: Mapped[Optional[Decimal]] = mapped_column(Numeric(7, 2), nullable=True)
    iron_mg: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    vitamin_c_mg: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    is_vegan: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("idx_food_items_name_normalized", "name_normalized"),
    )
