"""import_full_food_dataset

Replaces the 50 hand-seeded food items with the full 8,644-item
dataset built from USDA SR Legacy + IFCT 2017 + Kaggle sources.

Strategy (safe — preserves user data):
  1. Delete the 50 seed rows (identified by source IS NULL).
  2. Delete any food_log_entries that reference removed food_item IDs.
  3. Bulk-insert all rows from datasets/output/food_items.csv in batches.

Re-run strategy (when dataset is refreshed):
  Create a new migration that does:
    DELETE FROM food_items WHERE source IN ('USDA_SR','IFCT2017','KAGGLE')
  followed by a fresh bulk insert. This preserves source='user' items.

CSV columns mapped (35 total in CSV → only table columns imported):
  name, name_normalized, aliases, category, cuisine, serving_size_g,
  calories_kcal, protein_g, carbs_g, fat_g, fiber_g, sugar_g,
  saturated_fat_g, sodium_mg, calcium_mg, iron_mg, vitamin_c_mg,
  is_veg, is_egg, is_vegan, source, source_id

Skipped CSV columns (not in food_items schema):
  serving_description, monounsaturated_fat_g, polyunsaturated_fat_g,
  trans_fat_g, cholesterol_mg, potassium_mg, magnesium_mg, phosphorus_mg,
  zinc_mg, vitamin_a_mcg, vitamin_d_mcg, vitamin_b12_mcg, folate_mcg

Revision ID: e2a3b4c5d6e7
Revises: d1f9a2c3e4b5
Create Date: 2026-06-27
"""
import csv
import os
from pathlib import Path
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

from datetime import datetime, timezone

revision: str = 'e2a3b4c5d6e7'
down_revision: Union[str, Sequence[str], None] = 'd1f9a2c3e4b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Path to CSV relative to this migration file:
# alembic/versions/ → alembic/ → backend/ → project root/ → datasets/output/
CSV_PATH = Path(__file__).resolve().parents[3] / "datasets" / "output" / "food_items.csv"

BATCH_SIZE = 500


def _to_float_or_none(val: str):
    """Return float or None for empty/NaN CSV values."""
    v = val.strip()
    if not v or v.lower() in ("", "nan", "none", "null"):
        return None
    try:
        return float(v)
    except ValueError:
        return None


def _to_bool(val: str, default: bool = False) -> bool:
    v = val.strip().lower()
    if v in ("true", "1", "yes", "t"):
        return True
    if v in ("false", "0", "no", "f"):
        return False
    return default


def upgrade() -> None:
    conn = op.get_bind()

    # 1. Find IDs of seed rows (source IS NULL) before deleting them
    seed_ids = [
        row[0]
        for row in conn.execute(
            sa.text("SELECT id FROM food_items WHERE source IS NULL")
        ).fetchall()
    ]

    if seed_ids:
        # 2. Delete food_log_entries that reference seed food_item IDs
        conn.execute(
            sa.text("DELETE FROM food_log_entries WHERE food_item_id = ANY(:ids)"),
            {"ids": seed_ids},
        )
        # 3. Delete the seed food_items rows
        conn.execute(
            sa.text("DELETE FROM food_items WHERE source IS NULL"),
        )

    # 4. Bulk insert from CSV
    if not CSV_PATH.exists():
        raise FileNotFoundError(
            f"Dataset CSV not found at {CSV_PATH}. "
            "Run the dataset pipeline notebook first: datasets/food_dataset_pipeline.ipynb"
        )

    food_items_table = sa.table(
        "food_items",
        sa.column("name"),
        sa.column("name_normalized"),
        sa.column("aliases"),
        sa.column("category"),
        sa.column("cuisine"),
        sa.column("serving_size_g"),
        sa.column("calories_kcal"),
        sa.column("protein_g"),
        sa.column("carbs_g"),
        sa.column("fat_g"),
        sa.column("fiber_g"),
        sa.column("sugar_g"),
        sa.column("saturated_fat_g"),
        sa.column("sodium_mg"),
        sa.column("calcium_mg"),
        sa.column("iron_mg"),
        sa.column("vitamin_c_mg"),
        sa.column("is_veg"),
        sa.column("is_egg"),
        sa.column("is_vegan"),
        sa.column("source"),
        sa.column("source_id"),
        sa.column("created_at"),
    )

    now = datetime.now(timezone.utc)

    batch = []
    total_inserted = 0

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip rows missing required fields
            if not row.get("name") or not row.get("calories_kcal"):
                continue

            batch.append({
                "name":             row["name"].strip(),
                "name_normalized":  row["name_normalized"].strip(),
                "aliases":          row["aliases"].strip() or None,
                "category":         row["category"].strip() or None,
                "cuisine":          row["cuisine"].strip() or None,
                "serving_size_g":   _to_float_or_none(row["serving_size_g"]) or 100.0,
                "calories_kcal":    _to_float_or_none(row["calories_kcal"]),
                "protein_g":        _to_float_or_none(row["protein_g"]) or 0.0,
                "carbs_g":          _to_float_or_none(row["carbs_g"]) or 0.0,
                "fat_g":            _to_float_or_none(row["fat_g"]) or 0.0,
                "fiber_g":          _to_float_or_none(row["fiber_g"]) or 0.0,
                "sugar_g":          _to_float_or_none(row["sugar_g"]) or 0.0,
                "saturated_fat_g":  _to_float_or_none(row["saturated_fat_g"]),
                "sodium_mg":        _to_float_or_none(row["sodium_mg"]),
                "calcium_mg":       _to_float_or_none(row["calcium_mg"]),
                "iron_mg":          _to_float_or_none(row["iron_mg"]),
                "vitamin_c_mg":     _to_float_or_none(row["vitamin_c_mg"]),
                "is_veg":           _to_bool(row["is_veg"], default=True),
                "is_egg":           _to_bool(row["is_egg"], default=False),
                "is_vegan":         _to_bool(row["is_vegan"], default=False),
                "source":           row["source"].strip() or None,
                "source_id":        row["source_id"].strip() or None,
                "created_at":       now,
            })

            if len(batch) >= BATCH_SIZE:
                conn.execute(food_items_table.insert(), batch)
                total_inserted += len(batch)
                batch = []

    if batch:
        conn.execute(food_items_table.insert(), batch)
        total_inserted += len(batch)

    print(f"  Imported {total_inserted} food items from {CSV_PATH.name}")


def downgrade() -> None:
    # Remove the imported dataset rows — keeps source='user' items intact
    op.execute("DELETE FROM food_items WHERE source IN ('USDA_SR', 'IFCT2017', 'KAGGLE')")
