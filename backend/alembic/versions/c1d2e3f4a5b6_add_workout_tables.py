"""add_workout_tables

Creates exercise_library and workout_logs tables.
exercise_library: seeded from datasets/exercise_library.json (wger API data)
workout_logs: per-user per-day exercise session logs with calories_burned

Revision ID: c1d2e3f4a5b6
Revises: b9c8d7e6f5a4
Create Date: 2026-07-02
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'b9c8d7e6f5a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exercise_library",
        sa.Column("id",              sa.Integer(),    primary_key=True, autoincrement=True),
        sa.Column("name",            sa.String(256),  nullable=False),
        sa.Column("name_normalized", sa.String(256),  nullable=False),
        sa.Column("category",        sa.String(32),   nullable=False),  # cardio|strength|yoga|stretching|plyometrics
        sa.Column("muscle_group",    sa.String(128),  nullable=True),
        sa.Column("equipment",       sa.String(64),   nullable=True),
        sa.Column("level",           sa.String(16),   nullable=True),
        sa.Column("met_value",       sa.Numeric(4, 1), nullable=False),
        sa.Column("instructions",    sa.Text(),       nullable=True),
        sa.Column("aliases",         sa.Text(),       nullable=True),   # semicolon-separated
        sa.Column("is_custom",       sa.Boolean(),    nullable=False, server_default=sa.false()),
    )
    op.create_table(
        "workout_logs",
        sa.Column("id",             sa.Integer(),    primary_key=True, autoincrement=True),
        sa.Column("user_id",        sa.String(64),   sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("log_date",       sa.Date(),       nullable=False),
        sa.Column("exercise_id",    sa.Integer(),    sa.ForeignKey("exercise_library.id"), nullable=True),
        sa.Column("exercise_name",  sa.String(256),  nullable=False),   # denormalized snapshot
        sa.Column("category",       sa.String(32),   nullable=False),
        sa.Column("sets",           sa.Integer(),    nullable=True),
        sa.Column("reps",           sa.Integer(),    nullable=True),
        sa.Column("weight_kg",      sa.Numeric(6, 2), nullable=True),
        sa.Column("duration_min",   sa.Numeric(5, 1), nullable=True),
        sa.Column("calories_burned",sa.Numeric(7, 2), nullable=True),  # MET × user_weight_kg × duration_h
        sa.Column("notes",          sa.Text(),       nullable=True),
        sa.Column("created_at",     sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_exercise_library_trgm", "exercise_library",
                    ["name_normalized"], postgresql_using="gin",
                    postgresql_ops={"name_normalized": "gin_trgm_ops"})
    op.create_index("idx_workout_logs_user_date", "workout_logs", ["user_id", "log_date"])


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_workout_logs_user_date")
    op.execute("DROP INDEX IF EXISTS idx_exercise_library_trgm")
    op.drop_table("workout_logs")
    op.drop_table("exercise_library")
