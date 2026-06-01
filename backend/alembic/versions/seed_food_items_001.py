"""Seed 50 Indian food items"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

revision = "seed_food_items_001"
down_revision = "b2407a8a1a76"
branch_labels = None
depends_on = None

FOOD_ITEMS = [
    # Dal / Lentils
    ("Dal Tadka", "dal tadka", "dal", "North Indian", 250, 79.2, 4.5, 11.4, 1.9, 2.4, 0.8, True, False),
    ("Dal Makhani", "dal makhani", "dal", "North Indian", 250, 132.0, 6.8, 14.2, 5.4, 3.8, 1.2, True, False),
    ("Rajma Masala", "rajma masala", "dal", "North Indian", 250, 94.0, 5.6, 14.8, 2.0, 4.2, 1.0, True, False),
    ("Chana Masala", "chana masala", "dal", "North Indian", 250, 105.0, 6.2, 16.4, 2.2, 5.1, 1.4, True, False),
    ("Moong Dal", "moong dal", "dal", "Pan-Indian", 200, 70.0, 4.8, 10.2, 0.8, 2.6, 0.6, True, False),
    ("Sambar", "sambar", "dal", "South Indian", 200, 55.0, 2.8, 8.2, 1.2, 2.2, 1.8, True, False),
    ("Rasam", "rasam", "dal", "South Indian", 200, 32.0, 1.2, 5.4, 0.6, 0.8, 1.2, True, False),
    # Curries / Sabzi
    ("Palak Paneer", "palak paneer", "curry", "North Indian", 200, 149.0, 7.8, 6.2, 10.6, 2.1, 1.2, True, False),
    ("Paneer Butter Masala", "paneer butter masala", "curry", "North Indian", 200, 198.0, 8.4, 8.8, 15.2, 1.4, 2.6, True, False),
    ("Bhindi Masala", "bhindi masala", "curry", "North Indian", 150, 82.0, 2.4, 8.6, 4.2, 3.4, 1.8, True, False),
    ("Aloo Gobi", "aloo gobi", "curry", "North Indian", 200, 76.0, 2.8, 12.4, 2.0, 2.8, 1.4, True, False),
    ("Mixed Veg Sabzi", "mixed veg sabzi", "curry", "Pan-Indian", 150, 68.0, 2.2, 9.4, 2.4, 2.6, 1.6, True, False),
    ("Saag Aloo", "saag aloo", "curry", "North Indian", 200, 88.0, 3.2, 12.8, 2.8, 3.2, 1.4, True, False),
    ("Kadhi Pakora", "kadhi pakora", "curry", "North Indian", 250, 112.0, 4.8, 14.6, 4.2, 1.2, 2.4, True, False),
    # Non-Veg
    ("Chicken Biryani", "chicken biryani", "rice", "Mughal/Pan-Indian", 350, 168.0, 10.2, 22.4, 4.1, 0.8, 0.4, False, False),
    ("Mutton Rogan Josh", "mutton rogan josh", "curry", "Kashmiri", 250, 218.0, 18.4, 6.2, 13.8, 0.6, 1.2, False, False),
    ("Tandoori Chicken", "tandoori chicken", "grilled", "North Indian", 200, 165.0, 24.8, 2.2, 6.4, 0.2, 0.8, False, False),
    ("Chicken Tikka", "chicken tikka", "grilled", "North Indian", 150, 174.0, 22.6, 4.8, 7.2, 0.4, 0.6, False, False),
    ("Fish Curry", "fish curry", "curry", "Goan/South Indian", 250, 128.0, 16.4, 4.8, 5.2, 0.4, 1.8, False, False),
    ("Prawn Masala", "prawn masala", "curry", "Coastal Indian", 200, 142.0, 18.2, 5.6, 5.4, 0.6, 1.4, False, False),
    # Egg
    ("Egg Bhurji", "egg bhurji", "egg dish", "Pan-Indian", 150, 195.0, 12.4, 4.2, 14.1, 0.6, 1.1, False, True),
    ("Egg Omelette", "egg omelette", "egg dish", "Pan-Indian", 100, 154.0, 10.2, 1.8, 11.8, 0.0, 0.8, False, True),
    # Bread / Rice
    ("Chapati/Roti", "chapati roti", "bread", "Pan-Indian", 40, 104.0, 3.2, 18.4, 2.0, 2.2, 0.4, True, False),
    ("Aloo Paratha", "aloo paratha", "bread", "North Indian", 120, 252.0, 5.8, 38.2, 8.4, 2.8, 0.6, True, False),
    ("Methi Thepla", "methi thepla", "bread", "Gujarati", 60, 148.0, 4.4, 22.6, 4.2, 2.8, 0.8, True, False),
    ("Puri", "puri", "bread", "North Indian", 40, 164.0, 3.4, 22.8, 6.4, 0.8, 0.4, True, False),
    ("Idli", "idli", "bread", "South Indian", 150, 58.0, 2.0, 11.4, 0.4, 0.5, 0.3, True, False),
    ("Masala Dosa", "masala dosa", "bread", "South Indian", 180, 133.0, 3.2, 22.6, 3.4, 1.6, 0.8, True, False),
    ("Uttapam", "uttapam", "bread", "South Indian", 150, 118.0, 4.2, 20.4, 2.2, 1.8, 1.4, True, False),
    ("Basmati Rice (cooked)", "basmati rice cooked", "rice", "Pan-Indian", 200, 130.0, 2.8, 28.4, 0.2, 0.4, 0.2, True, False),
    ("Jeera Rice", "jeera rice", "rice", "North Indian", 200, 148.0, 3.2, 30.2, 2.4, 0.4, 0.2, True, False),
    ("Khichdi", "khichdi", "rice", "Pan-Indian", 250, 118.0, 5.4, 20.8, 1.8, 2.4, 0.6, True, False),
    # Breakfast
    ("Poha", "poha", "breakfast", "Central Indian", 200, 128.0, 2.8, 24.6, 2.4, 1.6, 0.8, True, False),
    ("Upma", "upma", "breakfast", "South Indian", 200, 138.0, 3.8, 24.8, 3.2, 2.2, 0.8, True, False),
    ("Oats Upma", "oats upma", "breakfast", "Pan-Indian", 200, 148.0, 6.2, 24.4, 3.4, 3.8, 1.2, True, False),
    ("Dhokla", "dhokla", "snack", "Gujarati", 100, 112.0, 5.2, 18.4, 1.8, 1.4, 2.8, True, False),
    ("Moong Dal Chilla", "moong dal chilla", "breakfast", "North Indian", 150, 124.0, 8.4, 16.2, 2.8, 2.6, 0.8, True, False),
    # Street Food / Snacks
    ("Pav Bhaji", "pav bhaji", "street food", "Mumbai", 300, 182.0, 5.8, 28.6, 5.4, 3.8, 4.2, True, False),
    ("Vada Pav", "vada pav", "street food", "Mumbai", 150, 286.0, 6.4, 42.8, 10.2, 2.4, 2.8, True, False),
    ("Misal Pav", "misal pav", "street food", "Maharashtra", 300, 198.0, 8.4, 32.4, 4.8, 6.2, 2.8, True, False),
    ("Paneer Tikka", "paneer tikka", "snack", "North Indian", 150, 218.0, 12.4, 6.2, 16.4, 0.8, 1.4, True, False),
    ("Seekh Kebab", "seekh kebab", "snack", "North Indian", 100, 228.0, 18.6, 4.2, 14.8, 0.4, 0.8, False, False),
    ("Roasted Chana", "roasted chana", "snack", "Pan-Indian", 30, 348.0, 22.0, 50.4, 6.2, 14.8, 4.6, True, False),
    ("Puffed Rice (Murmura)", "puffed rice murmura", "snack", "Pan-Indian", 30, 354.0, 6.4, 78.2, 0.4, 1.0, 0.4, True, False),
    # Dairy / Beverages
    ("Curd/Yoghurt", "curd yoghurt", "dairy", "Pan-Indian", 200, 61.0, 3.4, 4.8, 3.2, 0.0, 4.6, True, False),
    ("Lassi (Plain)", "lassi plain", "beverage", "North Indian", 300, 98.0, 3.8, 12.4, 3.6, 0.0, 12.2, True, False),
    ("Chaas (Buttermilk)", "chaas buttermilk", "beverage", "Pan-Indian", 250, 32.0, 1.4, 4.2, 0.8, 0.0, 3.8, True, False),
    # Sweets / Desserts
    ("Gajar Halwa", "gajar halwa", "sweet", "North Indian", 100, 284.0, 4.2, 42.4, 11.2, 1.8, 28.6, True, False),
    ("Besan Ladoo", "besan ladoo", "sweet", "Pan-Indian", 50, 412.0, 8.4, 54.2, 18.6, 2.4, 28.8, True, False),
    ("Boondi Raita", "boondi raita", "dairy", "North Indian", 150, 92.0, 3.8, 10.4, 3.8, 0.4, 6.8, True, False),
]


def upgrade() -> None:
    now = datetime.utcnow()
    op.bulk_insert(
        sa.table(
            "food_items",
            sa.column("name", sa.String),
            sa.column("name_normalized", sa.String),
            sa.column("category", sa.String),
            sa.column("region", sa.String),
            sa.column("serving_size_g", sa.Numeric),
            sa.column("calories_kcal", sa.Numeric),
            sa.column("protein_g", sa.Numeric),
            sa.column("carbs_g", sa.Numeric),
            sa.column("fat_g", sa.Numeric),
            sa.column("fiber_g", sa.Numeric),
            sa.column("sugar_g", sa.Numeric),
            sa.column("is_veg", sa.Boolean),
            sa.column("is_egg", sa.Boolean),
            sa.column("created_at", sa.DateTime(timezone=True)),
        ),
        [
            {
                "name": row[0],
                "name_normalized": row[1],
                "category": row[2],
                "region": row[3],
                "serving_size_g": row[4],
                "calories_kcal": row[5],
                "protein_g": row[6],
                "carbs_g": row[7],
                "fat_g": row[8],
                "fiber_g": row[9],
                "sugar_g": row[10],
                "is_veg": row[11],
                "is_egg": row[12],
                "created_at": now,
            }
            for row in FOOD_ITEMS
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM food_items")
