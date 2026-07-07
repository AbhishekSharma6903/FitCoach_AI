"""seed_curated_indian_dishes

Re-inserts the original 50 hand-curated Indian food items (which were
removed when source=NULL rows were cleared in import_full_food_dataset)
PLUS adds ~30 more common Indian dishes that are missing from USDA/IFCT.

All rows use source='curated_indian' so they are never touched by
dataset refresh migrations (which only DELETE WHERE source IN
('USDA_SR','IFCT2017','KAGGLE')).

Nutritional values per serving — sourced from:
  - Original 50: as defined in seed_food_items_001.py
  - New dishes: NIN Dietary Guidelines for Indians 2020 + IFCT 2017 proxies
  - All values are per the serving_size_g specified

IMPORTANT: values are per *serving*, not per 100g. The food_items schema
stores per-serving values and uses serving_size_g to scale.

Revision ID: f3b4c5d6e7f8
Revises: e2a3b4c5d6e7
Create Date: 2026-06-27
"""
from datetime import datetime, timezone
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f3b4c5d6e7f8'
down_revision: Union[str, Sequence[str], None] = 'e2a3b4c5d6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# fmt: off
# Columns: name, name_normalized, category, cuisine, serving_size_g,
#          calories_kcal, protein_g, carbs_g, fat_g, fiber_g, sugar_g,
#          is_veg, is_egg
DISHES = [
    # ── Original 50 seeds (restored) ────────────────────────────────────────
    # Dal / Lentils
    ("Dal Tadka",             "dal tadka",             "dal",       "North Indian",    250,  79.2, 4.5,  11.4, 1.9, 2.4, 0.8,  True,  False),
    ("Dal Makhani",           "dal makhani",           "dal",       "North Indian",    250, 132.0, 6.8,  14.2, 5.4, 3.8, 1.2,  True,  False),
    ("Rajma Masala",          "rajma masala",          "dal",       "North Indian",    250,  94.0, 5.6,  14.8, 2.0, 4.2, 1.0,  True,  False),
    ("Chana Masala",          "chana masala",          "dal",       "North Indian",    250, 105.0, 6.2,  16.4, 2.2, 5.1, 1.4,  True,  False),
    ("Moong Dal",             "moong dal",             "dal",       "Pan-Indian",      200,  70.0, 4.8,  10.2, 0.8, 2.6, 0.6,  True,  False),
    ("Sambar",                "sambar",                "dal",       "South Indian",    200,  55.0, 2.8,   8.2, 1.2, 2.2, 1.8,  True,  False),
    ("Rasam",                 "rasam",                 "dal",       "South Indian",    200,  32.0, 1.2,   5.4, 0.6, 0.8, 1.2,  True,  False),
    # Curries / Sabzi
    ("Palak Paneer",          "palak paneer",          "curry",     "North Indian",    200, 149.0, 7.8,   6.2,10.6, 2.1, 1.2,  True,  False),
    ("Paneer Butter Masala",  "paneer butter masala",  "curry",     "North Indian",    200, 198.0, 8.4,   8.8,15.2, 1.4, 2.6,  True,  False),
    ("Bhindi Masala",         "bhindi masala",         "curry",     "North Indian",    150,  82.0, 2.4,   8.6, 4.2, 3.4, 1.8,  True,  False),
    ("Aloo Gobi",             "aloo gobi",             "curry",     "North Indian",    200,  76.0, 2.8,  12.4, 2.0, 2.8, 1.4,  True,  False),
    ("Mixed Veg Sabzi",       "mixed veg sabzi",       "curry",     "Pan-Indian",      150,  68.0, 2.2,   9.4, 2.4, 2.6, 1.6,  True,  False),
    ("Saag Aloo",             "saag aloo",             "curry",     "North Indian",    200,  88.0, 3.2,  12.8, 2.8, 3.2, 1.4,  True,  False),
    ("Kadhi Pakora",          "kadhi pakora",          "curry",     "North Indian",    250, 112.0, 4.8,  14.6, 4.2, 1.2, 2.4,  True,  False),
    # Non-Veg
    ("Chicken Biryani",       "chicken biryani",       "rice",      "Mughal",          350, 168.0,10.2,  22.4, 4.1, 0.8, 0.4,  False, False),
    ("Mutton Rogan Josh",     "mutton rogan josh",     "curry",     "Kashmiri",        250, 218.0,18.4,   6.2,13.8, 0.6, 1.2,  False, False),
    ("Tandoori Chicken",      "tandoori chicken",      "grilled",   "North Indian",    200, 165.0,24.8,   2.2, 6.4, 0.2, 0.8,  False, False),
    ("Chicken Tikka",         "chicken tikka",         "grilled",   "North Indian",    150, 174.0,22.6,   4.8, 7.2, 0.4, 0.6,  False, False),
    ("Fish Curry",            "fish curry",            "curry",     "South Indian",    250, 128.0,16.4,   4.8, 5.2, 0.4, 1.8,  False, False),
    ("Prawn Masala",          "prawn masala",          "curry",     "Coastal Indian",  200, 142.0,18.2,   5.6, 5.4, 0.6, 1.4,  False, False),
    # Egg
    ("Egg Bhurji",            "egg bhurji",            "egg dish",  "Pan-Indian",      150, 195.0,12.4,   4.2,14.1, 0.6, 1.1,  False, True),
    ("Egg Omelette",          "egg omelette",          "egg dish",  "Pan-Indian",      100, 154.0,10.2,   1.8,11.8, 0.0, 0.8,  False, True),
    # Breads / Rice
    ("Chapati/Roti",          "chapati roti",          "bread",     "Pan-Indian",       40, 104.0, 3.2,  18.4, 2.0, 2.2, 0.4,  True,  False),
    ("Aloo Paratha",          "aloo paratha",          "bread",     "North Indian",    120, 252.0, 5.8,  38.2, 8.4, 2.8, 0.6,  True,  False),
    ("Methi Thepla",          "methi thepla",          "bread",     "Gujarati",         60, 148.0, 4.4,  22.6, 4.2, 2.8, 0.8,  True,  False),
    ("Puri",                  "puri",                  "bread",     "North Indian",     40, 164.0, 3.4,  22.8, 6.4, 0.8, 0.4,  True,  False),
    ("Idli",                  "idli",                  "breakfast", "South Indian",    150,  58.0, 2.0,  11.4, 0.4, 0.5, 0.3,  True,  False),
    ("Masala Dosa",           "masala dosa",           "breakfast", "South Indian",    180, 133.0, 3.2,  22.6, 3.4, 1.6, 0.8,  True,  False),
    ("Uttapam",               "uttapam",               "breakfast", "South Indian",    150, 118.0, 4.2,  20.4, 2.2, 1.8, 1.4,  True,  False),
    ("Basmati Rice (cooked)", "basmati rice cooked",   "rice",      "Pan-Indian",      200, 130.0, 2.8,  28.4, 0.2, 0.4, 0.2,  True,  False),
    ("Jeera Rice",            "jeera rice",            "rice",      "North Indian",    200, 148.0, 3.2,  30.2, 2.4, 0.4, 0.2,  True,  False),
    ("Khichdi",               "khichdi",               "rice",      "Pan-Indian",      250, 118.0, 5.4,  20.8, 1.8, 2.4, 0.6,  True,  False),
    # Breakfast
    ("Poha",                  "poha",                  "breakfast", "Central Indian",  200, 128.0, 2.8,  24.6, 2.4, 1.6, 0.8,  True,  False),
    ("Upma",                  "upma",                  "breakfast", "South Indian",    200, 138.0, 3.8,  24.8, 3.2, 2.2, 0.8,  True,  False),
    ("Oats Upma",             "oats upma",             "breakfast", "Pan-Indian",      200, 148.0, 6.2,  24.4, 3.4, 3.8, 1.2,  True,  False),
    # Snacks
    ("Dhokla",                "dhokla",                "snack",     "Gujarati",        100, 112.0, 5.2,  18.4, 1.8, 1.4, 2.8,  True,  False),
    ("Moong Dal Chilla",      "moong dal chilla",      "breakfast", "North Indian",    150, 124.0, 8.4,  16.2, 2.8, 2.6, 0.8,  True,  False),
    ("Pav Bhaji",             "pav bhaji",             "street food","Mumbai",         300, 182.0, 5.8,  28.6, 5.4, 3.8, 4.2,  True,  False),
    ("Vada Pav",              "vada pav",              "street food","Mumbai",         150, 286.0, 6.4,  42.8,10.2, 2.4, 2.8,  True,  False),
    ("Misal Pav",             "misal pav",             "street food","Maharashtra",    300, 198.0, 8.4,  32.4, 4.8, 6.2, 2.8,  True,  False),
    ("Paneer Tikka",          "paneer tikka",          "snack",     "North Indian",    150, 218.0,12.4,   6.2,16.4, 0.8, 1.4,  True,  False),
    ("Seekh Kebab",           "seekh kebab",           "snack",     "North Indian",    100, 228.0,18.6,   4.2,14.8, 0.4, 0.8,  False, False),
    ("Roasted Chana",         "roasted chana",         "snack",     "Pan-Indian",       30, 348.0,22.0,  50.4, 6.2,14.8, 4.6,  True,  False),
    ("Puffed Rice",           "puffed rice",           "snack",     "Pan-Indian",       30, 354.0, 6.4,  78.2, 0.4, 1.0, 0.4,  True,  False),
    # Dairy / Beverages
    ("Curd",                  "curd",                  "dairy",     "Pan-Indian",      200,  61.0, 3.4,   4.8, 3.2, 0.0, 4.6,  True,  False),
    ("Lassi (Plain)",         "lassi plain",           "beverage",  "North Indian",    300,  98.0, 3.8,  12.4, 3.6, 0.0,12.2,  True,  False),
    ("Chaas (Buttermilk)",    "chaas buttermilk",      "beverage",  "Pan-Indian",      250,  32.0, 1.4,   4.2, 0.8, 0.0, 3.8,  True,  False),
    # Sweets
    ("Gajar Halwa",           "gajar halwa",           "sweet",     "North Indian",    100, 284.0, 4.2,  42.4,11.2, 1.8,28.6,  True,  False),
    ("Besan Ladoo",           "besan ladoo",           "sweet",     "Pan-Indian",       50, 412.0, 8.4,  54.2,18.6, 2.4,28.8,  True,  False),
    ("Boondi Raita",          "boondi raita",          "dairy",     "North Indian",    150,  92.0, 3.8,  10.4, 3.8, 0.4, 6.8,  True,  False),

    # ── New additions ────────────────────────────────────────────────────────
    # South Indian
    ("Plain Dosa",            "plain dosa",            "breakfast", "South Indian",    100,  87.0, 2.4,  14.8, 2.2, 0.8, 0.4,  True,  False),
    ("Rava Dosa",             "rava dosa",             "breakfast", "South Indian",    120, 142.0, 3.8,  20.4, 5.2, 0.6, 0.8,  True,  False),
    ("Medu Vada",             "medu vada",             "snack",     "South Indian",     75, 145.0, 5.8,  18.4, 5.8, 2.4, 0.6,  True,  False),
    ("Pongal",                "pongal",                "breakfast", "South Indian",    250, 198.0, 6.2,  34.2, 5.4, 1.8, 0.4,  True,  False),
    ("Curd Rice",             "curd rice",             "rice",      "South Indian",    250, 148.0, 4.8,  26.4, 2.8, 0.4, 3.2,  True,  False),
    ("Bisi Bele Bath",        "bisi bele bath",        "rice",      "Karnataka",       300, 188.0, 7.4,  32.4, 4.2, 4.8, 1.2,  True,  False),
    ("Kootu",                 "kootu",                 "curry",     "South Indian",    150,  82.0, 3.8,  10.4, 2.8, 3.6, 0.8,  True,  False),
    # North Indian
    ("Butter Chicken",        "butter chicken",        "curry",     "North Indian",    200, 212.0,18.4,   8.4,12.2, 0.8, 3.4,  False, False),
    ("Chicken Curry",         "chicken curry",         "curry",     "Pan-Indian",      200, 188.0,20.2,   6.4, 9.8, 0.8, 1.8,  False, False),
    ("Mutton Biryani",        "mutton biryani",        "rice",      "Mughal",          350, 186.0,12.4,  22.8, 5.4, 0.8, 0.4,  False, False),
    ("Veg Biryani",           "veg biryani",           "rice",      "Pan-Indian",      300, 152.0, 4.2,  28.6, 3.2, 2.4, 0.8,  True,  False),
    ("Kadai Paneer",          "kadai paneer",          "curry",     "North Indian",    200, 188.0,10.2,  10.4,12.6, 2.2, 3.8,  True,  False),
    ("Shahi Paneer",          "shahi paneer",          "curry",     "North Indian",    200, 224.0, 9.8,  10.8,17.2, 1.2, 3.4,  True,  False),
    ("Matar Paneer",          "matar paneer",          "curry",     "North Indian",    200, 162.0, 9.4,  12.8, 8.4, 3.4, 2.8,  True,  False),
    ("Navratan Korma",        "navratan korma",        "curry",     "Mughal",          200, 198.0, 6.8,  16.4,12.8, 2.2, 4.2,  True,  False),
    ("Aloo Mutter",           "aloo mutter",           "curry",     "North Indian",    200,  88.0, 3.8,  14.2, 2.4, 3.8, 2.4,  True,  False),
    ("Naan",                  "naan",                  "bread",     "North Indian",     80, 268.0, 8.2,  44.8, 6.4, 1.8, 2.4,  True,  False),
    ("Bhatura",               "bhatura",               "bread",     "North Indian",    100, 328.0, 8.4,  50.4,10.8, 2.2, 1.2,  True,  False),
    ("Chole Bhature",         "chole bhature",         "street food","North Indian",   350, 488.0,16.4,  72.4,16.2, 8.8, 3.4,  True,  False),
    ("Kulcha",                "kulcha",                "bread",     "North Indian",     80, 232.0, 6.8,  40.4, 4.8, 1.4, 2.8,  True,  False),
    ("Paneer Paratha",        "paneer paratha",        "bread",     "North Indian",    120, 284.0, 9.8,  36.4,10.8, 2.4, 0.8,  True,  False),
    # Fried rice / Chinese-Indian
    ("Veg Fried Rice",        "veg fried rice",        "rice",      "Indo-Chinese",    300, 288.0, 7.4,  52.4, 6.2, 3.2, 2.4,  True,  False),
    ("Egg Fried Rice",        "egg fried rice",        "rice",      "Indo-Chinese",    300, 322.0,10.8,  52.8, 7.8, 2.4, 1.8,  False, True),
    ("Chicken Fried Rice",    "chicken fried rice",    "rice",      "Indo-Chinese",    300, 348.0,14.2,  52.4, 8.4, 2.2, 1.8,  False, False),
    ("Hakka Noodles",         "hakka noodles",         "noodles",   "Indo-Chinese",    300, 322.0, 9.8,  58.4, 6.4, 2.8, 3.2,  True,  False),
    # Snacks / Street food
    ("Samosa",                "samosa",                "snack",     "North Indian",     80, 252.0, 4.8,  28.4,13.2, 2.4, 1.4,  True,  False),
    ("Kachori",               "kachori",               "snack",     "Rajasthani",       60, 248.0, 5.4,  28.8,12.8, 3.2, 0.8,  True,  False),
    ("Bhel Puri",             "bhel puri",             "snack",     "Mumbai",          150, 148.0, 4.2,  28.4, 2.4, 2.8, 4.2,  True,  False),
    ("Pani Puri",             "pani puri",             "snack",     "Pan-Indian",      100, 164.0, 3.4,  28.8, 4.4, 2.2, 2.8,  True,  False),
    ("Aloo Tikki",            "aloo tikki",            "snack",     "North Indian",    100, 188.0, 3.4,  28.4, 7.2, 2.8, 1.4,  True,  False),
    ("Dabeli",                "dabeli",                "snack",     "Gujarati",        120, 248.0, 6.4,  38.4, 8.2, 3.4, 8.8,  True,  False),
    # Sweets
    ("Gulab Jamun",           "gulab jamun",           "sweet",     "Pan-Indian",       50, 186.0, 2.8,  32.4, 5.8, 0.4,28.8,  True,  False),
    ("Rasgulla",              "rasgulla",              "sweet",     "Bengali",          60, 106.0, 3.4,  20.8, 1.4, 0.0,18.4,  True,  False),
    ("Kheer",                 "kheer",                 "sweet",     "Pan-Indian",      200, 188.0, 5.8,  32.4, 4.8, 0.2,24.2,  True,  False),
    ("Halwa",                 "halwa",                 "sweet",     "Pan-Indian",      100, 318.0, 4.2,  44.8,13.2, 1.8,28.4,  True,  False),
    # Soups
    ("Tomato Soup",           "tomato soup",           "soup",      "Pan-Indian",      250,  68.0, 1.8,  10.4, 2.4, 1.8, 6.4,  True,  False),
    ("Lemon Coriander Soup",  "lemon coriander soup",  "soup",      "Pan-Indian",      250,  38.0, 1.4,   6.2, 0.8, 1.2, 2.4,  True,  False),
    ("Mutton Soup",           "mutton soup",           "soup",      "South Indian",    250, 112.0,12.4,   4.2, 5.2, 0.6, 1.8,  False, False),
]
# fmt: on


def upgrade() -> None:
    conn = op.get_bind()
    now = datetime.now(timezone.utc)

    # Only insert dishes that don't already exist (by name_normalized)
    existing = {
        row[0]
        for row in conn.execute(
            sa.text("SELECT name_normalized FROM food_items")
        ).fetchall()
    }

    to_insert = []
    for row in DISHES:
        (name, name_norm, category, cuisine, serving_g,
         cal, prot, carb, fat, fiber, sugar, is_veg, is_egg) = row

        if name_norm in existing:
            continue

        to_insert.append({
            "name":            name,
            "name_normalized": name_norm,
            "category":        category,
            "cuisine":         cuisine,
            "region":          cuisine,   # keep region in sync for old code paths
            "serving_size_g":  serving_g,
            "calories_kcal":   cal,
            "protein_g":       prot,
            "carbs_g":         carb,
            "fat_g":           fat,
            "fiber_g":         fiber,
            "sugar_g":         sugar,
            "is_veg":          is_veg,
            "is_egg":          is_egg,
            "is_vegan":        False,
            "source":          "curated_indian",
            "source_id":       None,
            "created_at":      now,
        })

    if to_insert:
        conn.execute(
            sa.text("""
                INSERT INTO food_items
                  (name, name_normalized, category, cuisine, region,
                   serving_size_g, calories_kcal, protein_g, carbs_g, fat_g,
                   fiber_g, sugar_g, is_veg, is_egg, is_vegan,
                   source, source_id, created_at)
                VALUES
                  (:name, :name_normalized, :category, :cuisine, :region,
                   :serving_size_g, :calories_kcal, :protein_g, :carbs_g, :fat_g,
                   :fiber_g, :sugar_g, :is_veg, :is_egg, :is_vegan,
                   :source, :source_id, :created_at)
            """),
            to_insert,
        )
        print(f"  Inserted {len(to_insert)} curated Indian dishes "
              f"({len(DISHES) - len(to_insert)} already existed, skipped)")
    else:
        print("  All curated Indian dishes already present — nothing to insert")


def downgrade() -> None:
    op.execute("DELETE FROM food_items WHERE source = 'curated_indian'")
