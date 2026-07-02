"""seed_exercise_library

Bulk inserts exercises from datasets/exercise_library.json (fetched from wger API).
825 exercises with name, category, muscle_group, equipment, MET value, instructions.

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-07-02
"""
import json
from datetime import datetime
from pathlib import Path
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'd2e3f4a5b6c7'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

JSON_PATH = Path(__file__).resolve().parents[3] / "datasets" / "exercise_library.json"
BATCH_SIZE = 200


def upgrade() -> None:
    if not JSON_PATH.exists():
        print(f"  WARNING: {JSON_PATH} not found — skipping exercise seed")
        print("  Run: cd backend && python3 -c 'from scripts.fetch_exercises import main; main()'")
        return

    conn = op.get_bind()
    exercises = json.loads(JSON_PATH.read_text())

    tbl = sa.table(
        "exercise_library",
        sa.column("name"), sa.column("name_normalized"), sa.column("category"),
        sa.column("muscle_group"), sa.column("equipment"), sa.column("level"),
        sa.column("met_value"), sa.column("instructions"), sa.column("aliases"),
        sa.column("is_custom"),
    )

    batch = []
    total = 0
    seen_names: set = set()

    for ex in exercises:
        name_norm = ex.get("name_normalized", "").strip()
        if not name_norm or name_norm in seen_names:
            continue
        seen_names.add(name_norm)

        batch.append({
            "name":            ex.get("name", "").strip(),
            "name_normalized": name_norm,
            "category":        ex.get("category", "strength"),
            "muscle_group":    (ex.get("muscle_group") or "")[:128] or None,
            "equipment":       (ex.get("equipment") or "bodyweight")[:64],
            "level":           (ex.get("level") or "")[:16] or None,
            "met_value":       float(ex.get("met_value", 3.5)),
            "instructions":    (ex.get("instructions") or "")[:500] or None,
            "aliases":         (ex.get("aliases") or "")[:256] or None,
            "is_custom":       False,
        })

        if len(batch) >= BATCH_SIZE:
            conn.execute(tbl.insert(), batch)
            total += len(batch)
            batch = []

    if batch:
        conn.execute(tbl.insert(), batch)
        total += len(batch)

    print(f"  Seeded {total} exercises from {JSON_PATH.name}")


def downgrade() -> None:
    op.execute("DELETE FROM exercise_library WHERE is_custom = false")
