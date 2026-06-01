from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Numeric, Boolean, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class FoodItem(Base):
    __tablename__ = "food_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    name_normalized: Mapped[str] = mapped_column(String(256), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=True)
    region: Mapped[str] = mapped_column(String(64), nullable=True)
    serving_size_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    calories_kcal: Mapped[Decimal] = mapped_column(Numeric(7, 2), nullable=False)
    protein_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    carbs_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    fat_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    fiber_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=0)
    sugar_g: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=0)
    is_veg: Mapped[bool] = mapped_column(Boolean, default=True)
    is_egg: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("idx_food_items_name_normalized", "name_normalized"),
    )
