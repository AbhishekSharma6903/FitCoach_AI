"""add_exercise_image_columns

Adds image and muscle data columns to exercise_library:
  - image_url: full-resolution exercise image from wger CDN
  - image_url_thumb: 200×200 thumbnail (faster loading in UI)
  - wger_id: wger exercise integer ID (enables future re-sync)
  - primary_muscle_ids: semicolon-separated wger muscle IDs (primary muscles worked)
  - secondary_muscle_ids: semicolon-separated wger muscle IDs (secondary muscles)

All columns are nullable — existing rows get NULLs, enriched by the
scripts/enrich_exercise_images.py script after migration.

Revision ID: g4h5i6j7k8l9
Revises: d2e3f4a5b6c7
Create Date: 2026-07-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'g4h5i6j7k8l9'
down_revision: Union[str, Sequence[str], None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('exercise_library', sa.Column('image_url',            sa.String(512), nullable=True))
    op.add_column('exercise_library', sa.Column('image_url_thumb',      sa.String(512), nullable=True))
    op.add_column('exercise_library', sa.Column('wger_id',              sa.Integer(),   nullable=True))
    op.add_column('exercise_library', sa.Column('primary_muscle_ids',   sa.Text(),      nullable=True))
    op.add_column('exercise_library', sa.Column('secondary_muscle_ids', sa.Text(),      nullable=True))


def downgrade() -> None:
    op.drop_column('exercise_library', 'secondary_muscle_ids')
    op.drop_column('exercise_library', 'primary_muscle_ids')
    op.drop_column('exercise_library', 'wger_id')
    op.drop_column('exercise_library', 'image_url_thumb')
    op.drop_column('exercise_library', 'image_url')
