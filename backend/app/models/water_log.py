from datetime import datetime, date
from sqlalchemy import String, Integer, DateTime, Date, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class WaterLog(Base):
    __tablename__ = "water_log"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount_ml: Mapped[int] = mapped_column(Integer, nullable=False)  # ml per entry
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("idx_water_log_user_date", "user_id", "log_date"),
    )
