from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Numeric, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class CustomDish(Base):
    __tablename__ = "custom_dishes"

    id:              Mapped[int]              = mapped_column(primary_key=True, autoincrement=True)
    user_id:         Mapped[str]              = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name:            Mapped[str]              = mapped_column(String(256), nullable=False)
    name_normalized: Mapped[str]              = mapped_column(String(256), nullable=False)
    total_weight_g:  Mapped[Decimal]          = mapped_column(Numeric(7, 2), nullable=False)
    # per-100g nutrition
    calories_kcal:   Mapped[Optional[Decimal]] = mapped_column(Numeric(7, 2), nullable=True)
    protein_g:       Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    carbs_g:         Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    fat_g:           Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    fiber_g:         Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    sugar_g:         Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 2), nullable=True)
    sodium_mg:       Mapped[Optional[Decimal]] = mapped_column(Numeric(7, 2), nullable=True)
    is_veg:          Mapped[bool]             = mapped_column(Boolean, default=True)
    is_egg:          Mapped[bool]             = mapped_column(Boolean, default=False)
    is_vegan:        Mapped[bool]             = mapped_column(Boolean, default=False)
    created_at:      Mapped[datetime]         = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at:      Mapped[datetime]         = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_custom_dishes_user", "user_id"),
    )


class CustomDishIngredient(Base):
    __tablename__ = "custom_dish_ingredients"

    id:           Mapped[int]     = mapped_column(primary_key=True, autoincrement=True)
    dish_id:      Mapped[int]     = mapped_column(ForeignKey("custom_dishes.id", ondelete="CASCADE"), nullable=False)
    food_item_id: Mapped[int]     = mapped_column(ForeignKey("food_items.id"), nullable=False)
    quantity_g:   Mapped[Decimal] = mapped_column(Numeric(7, 2), nullable=False)
