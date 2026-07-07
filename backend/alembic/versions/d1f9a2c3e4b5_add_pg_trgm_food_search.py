"""add_pg_trgm_food_search

Enables the pg_trgm extension and creates a GIN trigram index on
food_items.name_normalized. This replaces the RapidFuzz in-memory
search with a DB-side similarity query that scales to 8k+ items and
handles transliterated Indian food names (tsvector/English stemming
does not work for names like "poha", "dal", "upma").

Revision ID: d1f9a2c3e4b5
Revises: bc8e87178e50
Create Date: 2026-06-27
"""
from typing import Sequence, Union
from alembic import op

revision: str = 'd1f9a2c3e4b5'
down_revision: Union[str, Sequence[str], None] = 'bc8e87178e50'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_food_items_trgm "
        "ON food_items USING GIN (name_normalized gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_food_items_trgm")
    # Note: we do NOT drop the pg_trgm extension on downgrade because
    # other indexes (custom_dishes, exercise_library) may depend on it.
