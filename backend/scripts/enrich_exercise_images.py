#!/usr/bin/env python3
"""
scripts/enrich_exercise_images.py

Enriches exercise_library with wger image URLs and muscle IDs.

- Paginates wger API: GET /api/v2/exerciseinfo/?format=json&language=2
- Matches our exercises to wger by name_normalized (exact, then fuzzy)
- Updates: image_url, image_url_thumb, wger_id, primary_muscle_ids, secondary_muscle_ids

Idempotent: safe to re-run — only updates rows where new data is found.
Existing non-null image_url values are NOT cleared by a non-match.

Usage (from backend/):
    python3 scripts/enrich_exercise_images.py
    python3 scripts/enrich_exercise_images.py --dry-run   # show matches, no DB writes
    python3 scripts/enrich_exercise_images.py --verbose   # log all matches + skips
"""

import argparse
import sys
import time
from difflib import SequenceMatcher
from pathlib import Path

import requests

# Add project root to path so app imports work
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.config import settings

WGER_API   = "https://wger.de/api/v2/exerciseinfo/"
PAGE_SIZE  = 100
LANGUAGE   = 2      # English
FUZZY_THRESHOLD = 0.85
REQUEST_DELAY   = 0.3   # seconds between API pages (polite crawling)


def fetch_wger_page(offset: int, session: requests.Session, retries: int = 3) -> dict:
    for attempt in range(retries):
        try:
            resp = session.get(WGER_API, params={
                "format":   "json",
                "language": LANGUAGE,
                "limit":    PAGE_SIZE,
                "offset":   offset,
            }, timeout=20)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.HTTPError as e:
            if attempt < retries - 1:
                wait = 2 ** attempt
                print(f" [retry {attempt+1}/{retries} in {wait}s]", end="", flush=True)
                time.sleep(wait)
            else:
                raise


def extract_exercise_data(wger_ex: dict) -> dict | None:
    """Pull the fields we need from a wger exerciseinfo entry."""
    # English translation
    translations = wger_ex.get("translations", [])
    en = next((t for t in translations if t.get("language") == LANGUAGE), None)
    if not en:
        return None

    name = en.get("name", "").strip()
    if not name:
        return None

    # Main image (is_main=True preferred, otherwise first)
    images = wger_ex.get("images", [])
    main_img = next((img for img in images if img.get("is_main")), None) or (images[0] if images else None)

    image_url       = main_img["image"] if main_img else None
    thumbnails      = (main_img.get("thumbnails") or {}) if main_img else {}
    image_url_thumb = thumbnails.get("medium") or image_url

    # Muscle IDs (primary and secondary)
    primary_ids   = [m["id"] for m in wger_ex.get("muscles", []) if m.get("id")]
    secondary_ids = [m["id"] for m in wger_ex.get("muscles_secondary", []) if m.get("id")]

    return {
        "wger_id":              wger_ex["id"],
        "name":                 name,
        "name_normalized":      name.lower().strip(),
        "image_url":            image_url,
        "image_url_thumb":      image_url_thumb,
        "primary_muscle_ids":   ";".join(str(i) for i in primary_ids) or None,
        "secondary_muscle_ids": ";".join(str(i) for i in secondary_ids) or None,
    }


def fuzzy_match(name_norm: str, candidates: dict[str, dict]) -> tuple[str | None, float]:
    """Return (best_name_normalized, score) or (None, 0.0)."""
    best_key, best_score = None, 0.0
    for key in candidates:
        score = SequenceMatcher(None, name_norm, key).ratio()
        if score > best_score:
            best_key, best_score = key, score
    return (best_key, best_score) if best_score >= FUZZY_THRESHOLD else (None, 0.0)


def run(dry_run: bool, verbose: bool) -> None:
    engine = create_engine(settings.DATABASE_URL)

    # Load our exercise library into memory (name_normalized → row id)
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT id, name, name_normalized FROM exercise_library WHERE is_custom = false"
        )).fetchall()

    our_exercises: dict[str, dict] = {
        r.name_normalized: {"id": r.id, "name": r.name}
        for r in rows
    }
    print(f"Our library: {len(our_exercises)} exercises")

    # Fetch all wger exercises
    http = requests.Session()
    http.headers.update({"User-Agent": "FitCoach-AI/1.0 (educational project)"})

    wger_data: list[dict] = []
    offset = 0
    total  = None

    while total is None or offset < total:
        print(f"  Fetching wger offset={offset}...", end=" ", flush=True)
        page = fetch_wger_page(offset, http)
        total = page["count"]
        results = page["results"]
        print(f"got {len(results)} (total={total})")

        for ex in results:
            data = extract_exercise_data(ex)
            if data:
                wger_data.append(data)

        offset += PAGE_SIZE
        if offset < total:
            time.sleep(REQUEST_DELAY)

    print(f"\nwger exercises with English name: {len(wger_data)}")

    # Build wger lookup by name_normalized
    wger_by_name: dict[str, dict] = {ex["name_normalized"]: ex for ex in wger_data}

    # Match
    matched, fuzzy_matched, unmatched = [], [], []

    for name_norm, our in our_exercises.items():
        if name_norm in wger_by_name:
            matched.append((name_norm, wger_by_name[name_norm], "exact"))
        else:
            best_key, score = fuzzy_match(name_norm, wger_by_name)
            if best_key:
                fuzzy_matched.append((name_norm, wger_by_name[best_key], f"fuzzy {score:.2f}"))
            else:
                unmatched.append(name_norm)

    all_matched = matched + fuzzy_matched
    with_images = sum(1 for _, wg, _ in all_matched if wg.get("image_url"))

    print(f"\nMatch results:")
    print(f"  Exact match:  {len(matched)}")
    print(f"  Fuzzy match:  {len(fuzzy_matched)}")
    print(f"  No match:     {len(unmatched)}")
    print(f"  With images:  {with_images} / {len(all_matched)}")

    if verbose:
        print("\n-- Unmatched exercises --")
        for name in sorted(unmatched):
            print(f"  {name}")

    if dry_run:
        print("\n[DRY RUN] No DB writes performed.")
        return

    # Write to DB
    updated = 0
    with Session(engine) as session:
        for name_norm, wg, match_type in all_matched:
            our = our_exercises[name_norm]
            session.execute(text("""
                UPDATE exercise_library SET
                    wger_id              = :wger_id,
                    image_url            = COALESCE(:image_url, image_url),
                    image_url_thumb      = COALESCE(:image_url_thumb, image_url_thumb),
                    primary_muscle_ids   = COALESCE(:primary_muscle_ids, primary_muscle_ids),
                    secondary_muscle_ids = COALESCE(:secondary_muscle_ids, secondary_muscle_ids)
                WHERE id = :id
            """), {
                "id":                   our["id"],
                "wger_id":              wg["wger_id"],
                "image_url":            wg.get("image_url"),
                "image_url_thumb":      wg.get("image_url_thumb"),
                "primary_muscle_ids":   wg.get("primary_muscle_ids"),
                "secondary_muscle_ids": wg.get("secondary_muscle_ids"),
            })
            updated += 1
            if verbose:
                print(f"  [{match_type}] {our['name']} → wger_id={wg['wger_id']} img={bool(wg.get('image_url'))}")

        session.commit()

    print(f"\nUpdated {updated} exercises in DB.")
    print("Done. Run again any time to pick up new wger images.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enrich exercise_library with wger images")
    parser.add_argument("--dry-run",  action="store_true", help="Show matches, no DB writes")
    parser.add_argument("--verbose",  action="store_true", help="Log all matches and unmatched")
    args = parser.parse_args()

    run(dry_run=args.dry_run, verbose=args.verbose)
