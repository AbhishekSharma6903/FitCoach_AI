from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import String, Numeric, DateTime, Date, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class WeightLog(Base):
    __tablename__ = "weight_log"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    note: Mapped[str] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "log_date", name="uq_weight_log_user_date"),
        Index("idx_weight_log_user_date", "user_id", "log_date"),
    )
