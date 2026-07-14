"""make food_log_entries.food_item_id nullable for custom dish logging

Revision ID: h5i6j7k8l9m0
Revises: g4h5i6j7k8l9
Create Date: 2026-07-14
"""
from alembic import op
import sqlalchemy as sa

revision = 'h5i6j7k8l9m0'
down_revision = 'g4h5i6j7k8l9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Custom dishes have no food_items row — food_item_id must allow NULL
    op.alter_column(
        'food_log_entries',
        'food_item_id',
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade() -> None:
    # Set any NULLs to 0 before making NOT NULL again (prevents data loss error)
    op.execute("UPDATE food_log_entries SET food_item_id = 0 WHERE food_item_id IS NULL")
    op.alter_column(
        'food_log_entries',
        'food_item_id',
        existing_type=sa.Integer(),
        nullable=False,
    )
