"""add_custom_dishes

Creates custom_dishes and custom_dish_ingredients tables.
Custom dishes are per-user composite recipes. Nutrition is computed
from ingredients and stored per-100g so logging uses the same code
path as food_items.

Revision ID: a1b2c3d4e5f6
Revises: f3b4c5d6e7f8
Create Date: 2026-06-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f3b4c5d6e7f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "custom_dishes",
        sa.Column("id",             sa.Integer(),      primary_key=True, autoincrement=True),
        sa.Column("user_id",        sa.String(64),     sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name",           sa.String(256),    nullable=False),
        sa.Column("name_normalized",sa.String(256),    nullable=False),
        sa.Column("total_weight_g", sa.Numeric(7, 2),  nullable=False),
        # per-100g nutrition (computed at save, recomputed on edit)
        sa.Column("calories_kcal",  sa.Numeric(7, 2),  nullable=True),
        sa.Column("protein_g",      sa.Numeric(6, 2),  nullable=True),
        sa.Column("carbs_g",        sa.Numeric(6, 2),  nullable=True),
        sa.Column("fat_g",          sa.Numeric(6, 2),  nullable=True),
        sa.Column("fiber_g",        sa.Numeric(6, 2),  nullable=True),
        sa.Column("sugar_g",        sa.Numeric(6, 2),  nullable=True),
        sa.Column("sodium_mg",      sa.Numeric(7, 2),  nullable=True),
        # diet flags — AND-logic across all ingredients
        sa.Column("is_veg",         sa.Boolean(),      nullable=False, server_default=sa.true()),
        sa.Column("is_egg",         sa.Boolean(),      nullable=False, server_default=sa.false()),
        sa.Column("is_vegan",       sa.Boolean(),      nullable=False, server_default=sa.false()),
        sa.Column("created_at",     sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",     sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_table(
        "custom_dish_ingredients",
        sa.Column("id",           sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("dish_id",      sa.Integer(), sa.ForeignKey("custom_dishes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("food_item_id", sa.Integer(), sa.ForeignKey("food_items.id"),  nullable=False),
        sa.Column("quantity_g",   sa.Numeric(7, 2), nullable=False),
    )

    op.create_index("idx_custom_dishes_user", "custom_dishes", ["user_id"])
    # Trigram index for dish name search (pg_trgm already enabled)
    op.execute("CREATE INDEX idx_custom_dishes_trgm ON custom_dishes USING GIN (name_normalized gin_trgm_ops)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_custom_dishes_trgm")
    op.drop_index("idx_custom_dishes_user", table_name="custom_dishes")
    op.drop_table("custom_dish_ingredients")
    op.drop_table("custom_dishes")
