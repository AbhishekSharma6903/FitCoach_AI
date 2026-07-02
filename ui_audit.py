#!/usr/bin/env python3
"""
FitCoach AI — UI Audit Script
==============================
Runs Playwright screenshots, scores each page using Claude,
applies UI fixes, re-screenshots, re-scores, then writes:
  - audit/scores_round_N.json   per-round scores
  - audit/fixes_round_N.json    fixes applied per round (metadata only)
  - audit/UI_AUDIT_REPORT.md    final markdown summary
  - audit/audit_history.json    full history JSON

Usage:
  cd /path/to/FitCoach_AI
  python3 ui_audit.py

Setup:
  1. Create a .env file in the project root with:
       ANTHROPIC_API_KEY=sk-ant-...
       ANTHROPIC_BASE_URL=http://localhost:6655/anthropic/   # proxy (optional)
  2. Make sure the app is running: ./dev.sh start
  3. pip install anthropic python-dotenv

The script streams Claude output live so you see what's happening in real time.
"""

import base64
import json
import os
import subprocess
import sys
import textwrap
import time
from datetime import datetime
from pathlib import Path

# Load .env from project root before importing anthropic
from dotenv import load_dotenv

ROOT         = Path(__file__).parent
load_dotenv(ROOT / ".env")

import anthropic  # noqa: E402 — must come after load_dotenv

# ── Config ────────────────────────────────────────────────────────────────────
FRONTEND_DIR = ROOT / "frontend"
AUDIT_DIR    = ROOT / "audit"
SHOTS_DIR    = FRONTEND_DIR / "tests" / "screenshots"
MAX_ROUNDS   = 3
TARGET_SCORE = 8.0
CLAUDE_MODEL = "claude-sonnet-4-6"

PAGES = [
    ("01-dashboard",     "Main dashboard — calorie ring, macros, water, weight chart"),
    ("02-tracker-today", "Food tracker — date navigator, food search, nutrition totals"),
    ("05-profile",       "Profile page — identity card, stats badges, goals form, sign out"),
    ("08-dishes-empty",  "My Dishes — empty state (no dishes created yet)"),
    ("09-dishes-create", "My Dishes — create form open"),
]

# ── ANSI colors ───────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"

def log(msg: str, c: str = ""):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"{c}[{ts}] {msg}{RESET}", flush=True)

def hr(char: str = "─", n: int = 62):
    print(f"{DIM}{char * n}{RESET}", flush=True)

# ── Screenshots ───────────────────────────────────────────────────────────────
def take_screenshots() -> bool:
    log("📸  Running Playwright tests…", BOLD)
    result = subprocess.run(
        "node_modules/.bin/playwright test tests/ui-screenshots.spec.ts --reporter=list",
        shell=True, cwd=FRONTEND_DIR, text=True,
    )
    shots = list(SHOTS_DIR.glob("*.png"))
    log(f"    {len(shots)} screenshots in {SHOTS_DIR.relative_to(ROOT)}", GREEN)
    return len(shots) > 0

# ── Claude client ─────────────────────────────────────────────────────────────
def make_client() -> anthropic.Anthropic:
    api_key  = os.environ.get("ANTHROPIC_API_KEY", "")
    base_url = os.environ.get("ANTHROPIC_BASE_URL", "")
    if not api_key:
        log("❌  ANTHROPIC_API_KEY not found. Add it to .env in project root.", RED)
        sys.exit(1)
    kwargs: dict = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
        log(f"   Using proxy: {base_url}", CYAN)
    return anthropic.Anthropic(**kwargs)

# ── Scoring ───────────────────────────────────────────────────────────────────
def score_pages(client: anthropic.Anthropic, round_n: int) -> dict:
    log(f"\n🔍  Scoring pages (round {round_n})…", BOLD)

    content: list = []
    available: list[tuple[str, str]] = []

    for slug, desc in PAGES:
        path = SHOTS_DIR / f"{slug}.png"
        if not path.exists():
            log(f"   skip {slug}.png — not found", YELLOW)
            continue
        log(f"   ➕  {slug}.png  ({path.stat().st_size // 1024}KB)", CYAN)
        available.append((slug, desc))
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": base64.standard_b64encode(path.read_bytes()).decode(),
            }
        })
        content.append({"type": "text", "text": f"↑ Screenshot: {slug} — {desc}"})

    content.append({"type": "text", "text": textwrap.dedent(f"""
        You are a senior UI/UX designer. Evaluate FitCoach AI — a dark fitness app
        (bg #0d0d0d, cards bg-gray-900, brand green #22c55e, targeting Indian users).

        Pages to score (one entry per image above):
        {chr(10).join(f"  • {s}: {d}" for s, d in available)}

        Scoring 1–10:
        • 9–10 = Premium (Notion/Linear/Vercel level)
        • 7–8  = Good, polished, minor issues
        • 5–6  = Functional but basic
        • 3–4  = Obvious visual problems
        • 1–2  = Broken

        Score each page on: visual hierarchy, spacing, typography, empty states,
        modern feel, purposeful color usage.

        Return ONLY valid JSON (no markdown fences):
        {{
          "pages": [
            {{
              "name": "slug-name",
              "score": 6.5,
              "good": ["specific thing that works well"],
              "bad": ["specific problem with enough detail to fix"],
              "improvements": ["concrete actionable fix, e.g. increase calorie value to text-3xl font-bold"]
            }}
          ],
          "overall": 6.3,
          "top_fixes": ["highest impact fix 1", "fix 2", "fix 3", "fix 4", "fix 5"]
        }}
    """)})

    log("   → Streaming Claude response…", CYAN)
    print(f"\n{DIM}", end="", flush=True)

    full_text = ""
    with client.messages.stream(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": content}]
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)
            full_text += text

    print(f"{RESET}\n", flush=True)

    raw = full_text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        # Try to find JSON in response
        start = raw.find("{")
        end   = raw.rfind("}") + 1
        result = json.loads(raw[start:end])

    result["round"] = round_n
    result["timestamp"] = datetime.now().isoformat()

    AUDIT_DIR.mkdir(exist_ok=True)
    (AUDIT_DIR / f"scores_round_{round_n}.json").write_text(json.dumps(result, indent=2))

    # Print table
    hr()
    log(f"  ROUND {round_n} RESULTS", BOLD)
    hr()
    for p in result["pages"]:
        filled = "█" * int(p["score"])
        empty  = "░" * (10 - int(p["score"]))
        c = GREEN if p["score"] >= 7 else (YELLOW if p["score"] >= 5 else RED)
        log(f"  {p['name']:28} {c}{filled}{empty}{RESET}  {c}{p['score']}/10{RESET}")
    hr()
    log(f"  OVERALL: {GREEN if result['overall'] >= 7 else YELLOW}{result['overall']:.1f}/10{RESET}", BOLD)
    hr()
    log("  Top fixes:", YELLOW)
    for i, fix in enumerate(result.get("top_fixes", [])[:5], 1):
        log(f"    {i}. {fix}", YELLOW)

    return result


# ── Fix application ────────────────────────────────────────────────────────────
def apply_fixes(client: anthropic.Anthropic, scores: dict, round_n: int) -> dict:
    """Fix one file at a time to avoid token limit issues with large JSON responses."""
    log(f"\n🔧  Applying UI fixes (round {round_n})…", BOLD)

    # Collect per-page issues
    issues_by_page: dict[str, list[str]] = {}
    for p in scores.get("pages", []):
        if p.get("improvements"):
            issues_by_page[p["name"]] = p["improvements"][:4]

    top_fixes = scores.get("top_fixes", [])[:5]

    # Map page → files most likely to contain the fix
    PAGE_FILES: dict[str, list[str]] = {
        "01-dashboard": [
            "frontend/src/app/dashboard/page.tsx",
            "frontend/src/components/dashboard/CalorieRing.tsx",
            "frontend/src/components/dashboard/MacroBar.tsx",
            "frontend/src/components/dashboard/MacroBarsGroup.tsx",
        ],
        "02-tracker-today": [
            "frontend/src/app/tracker/page.tsx",
            "frontend/src/components/tracker/NutritionTotals.tsx",
            "frontend/src/components/tracker/FoodLog.tsx",
        ],
        "05-profile": [
            "frontend/src/app/profile/page.tsx",
        ],
        "08-dishes-empty": [
            "frontend/src/app/dishes/page.tsx",
        ],
        "09-dishes-create": [
            "frontend/src/components/dishes/DishBuilder.tsx",
            "frontend/src/components/dishes/DishNutritionPreview.tsx",
        ],
    }

    applied = []
    skipped = []

    for page_slug, improvements in issues_by_page.items():
        files_for_page = PAGE_FILES.get(page_slug, [])
        if not files_for_page:
            continue

        for rel in files_for_page:
            fpath = ROOT / rel
            if not fpath.exists():
                skipped.append(rel)
                continue

            current = fpath.read_text()
            issues_str = "\n".join(f"- {i}" for i in improvements)

            log(f"   🔄  Improving {rel} for {page_slug}…", CYAN)

            prompt = textwrap.dedent(f"""
                You are improving a single React/Tailwind file for FitCoach AI (dark theme app).
                Palette: bg-[#0d0d0d], bg-gray-900 cards, border-gray-800,
                         text-gray-100/200/400/500/600, brand-500=#22c55e.

                File to improve: {rel}
                Page score: {next((p['score'] for p in scores['pages'] if p['name'] == page_slug), '?')}/10

                Issues to fix for this page:
                {issues_str}

                Also consider these top-level app improvements if relevant to this file:
                {chr(10).join(f'- {f}' for f in top_fixes[:3])}

                CURRENT FILE:
                {current}

                Return ONLY the complete improved file content — no explanation, no markdown fences,
                no JSON wrapper. Just the raw TSX/TypeScript file content starting with the first import
                or "use client" directive.

                Rules:
                - Preserve ALL imports, hooks, API calls, types, component props exactly
                - Only change: Tailwind classes, JSX structure/layout, text copy for empty states
                - Do NOT add new imports unless adding a lucide-react icon (it's already installed)
                - Keep functionality 100% identical
            """)

            print(f"\n{DIM}", end="", flush=True)
            full_text = ""
            try:
                with client.messages.stream(
                    model=CLAUDE_MODEL,
                    max_tokens=8192,
                    messages=[{"role": "user", "content": prompt}]
                ) as stream:
                    for text in stream.text_stream:
                        print(text, end="", flush=True)
                        full_text += text
                print(f"{RESET}\n", flush=True)
            except Exception as e:
                log(f"   ❌  Stream error for {rel}: {e}", RED)
                skipped.append(rel)
                continue

            content = full_text.strip()
            # Strip markdown fences if present
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:])
                if content.endswith("```"):
                    content = content[:-3].strip()
                # Handle ```tsx or ```typescript
                if content.startswith("tsx\n") or content.startswith("typescript\n"):
                    content = content.split("\n", 1)[1]

            if len(content) < 50:
                log(f"   ⚠️  Response too short for {rel} — skipping", YELLOW)
                skipped.append(rel)
                continue

            fpath.write_text(content)
            log(f"   ✏️  Updated: {rel}", GREEN)
            applied.append(rel)

    meta = {
        "round": round_n,
        "summary": f"Round {round_n}: improved {len(applied)} files targeting top issues",
        "fixes": [{"file": f, "description": "UI improvements applied"} for f in applied],
        "applied": applied,
        "skipped": skipped,
        "timestamp": datetime.now().isoformat(),
    }
    (AUDIT_DIR / f"fixes_round_{round_n}.json").write_text(json.dumps(meta, indent=2))
    log(f"\n   ✅  {len(applied)} files updated → audit/fixes_round_{round_n}.json", GREEN)
    if skipped:
        log(f"   ⏭️  Skipped: {', '.join(skipped)}", YELLOW)
    return meta


# ── Final report ──────────────────────────────────────────────────────────────
def write_report(all_rounds: list[dict], all_fixes: list[dict]):
    log("\n📄  Writing final report…", BOLD)

    r1 = all_rounds[0]
    rN = all_rounds[-1]
    delta = rN["overall"] - r1["overall"]

    table = "| Page | Round 1 | Final | Δ |\n|---|---|---|---|\n"
    r1_map = {p["name"]: p["score"] for p in r1.get("pages", [])}
    for p in rN.get("pages", []):
        r1s = r1_map.get(p["name"], 0)
        d = f"+{p['score'] - r1s:.1f}" if r1s else "n/a"
        table += f"| `{p['name']}` | {r1s:.1f} | {p['score']:.1f} | {d} |\n"

    fixes_md = "\n".join(
        f"### Round {fx['round']}\n{fx.get('summary','')}\n\n" +
        "\n".join(f"- `{f['file']}`: {f['description']}" for f in fx.get("fixes", []))
        for fx in all_fixes
    )

    still_needed = "\n".join(f"- {f}" for f in rN.get("top_fixes", []))

    per_page_detail = ""
    for r in all_rounds:
        per_page_detail += f"\n### Round {r['round']} — Overall {r['overall']:.1f}/10\n\n"
        for p in r.get("pages", []):
            bar = "▓" * int(p["score"]) + "░" * (10 - int(p["score"]))
            per_page_detail += f"**`{p['name']}`** `{bar}` {p['score']}/10\n"
            if p.get("good"):
                per_page_detail += "- ✅ " + "\n- ✅ ".join(p["good"][:2]) + "\n"
            if p.get("bad"):
                per_page_detail += "- ❌ " + "\n- ❌ ".join(p["bad"][:3]) + "\n"
            per_page_detail += "\n"

    report = f"""# FitCoach AI — UI Audit Report

> Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}
> Rounds completed: {len(all_rounds)} | Score: {r1["overall"]:.1f} → {rN["overall"]:.1f} ({delta:+.1f})

---

## Score Summary

{table}

**Overall trajectory: {r1["overall"]:.1f}/10 → {rN["overall"]:.1f}/10**

---

## Improvements Applied

{fixes_md}

---

## Still Needed (to reach 9+/10)

{still_needed}

---

## Per-Page Details by Round

{per_page_detail}
"""

    (AUDIT_DIR / "UI_AUDIT_REPORT.md").write_text(report)

    history = {
        "generated": datetime.now().isoformat(),
        "rounds": all_rounds,
        "fixes": all_fixes,
        "final_score": rN["overall"],
        "score_delta": delta,
    }
    (AUDIT_DIR / "audit_history.json").write_text(json.dumps(history, indent=2))

    log(f"   📝  audit/UI_AUDIT_REPORT.md", GREEN)
    log(f"   📊  audit/audit_history.json", GREEN)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    hr("═")
    log("  FitCoach AI — UI Audit", BOLD)
    log(f"  Target score: {TARGET_SCORE}/10  |  Max rounds: {MAX_ROUNDS}", DIM)
    hr("═")

    # Check app
    import urllib.request, urllib.error
    try:
        urllib.request.urlopen("http://localhost:3000", timeout=3)
        log("✅  App running at http://localhost:3000", GREEN)
    except (urllib.error.URLError, OSError):
        log("❌  http://localhost:3000 not responding — run ./dev.sh start", RED)
        sys.exit(1)

    client    = make_client()
    all_rounds: list[dict] = []
    all_fixes:  list[dict] = []

    for round_n in range(1, MAX_ROUNDS + 1):
        hr("═")
        log(f"  ROUND {round_n} / {MAX_ROUNDS}", BOLD)
        hr("═")

        take_screenshots()
        time.sleep(1)

        scores = score_pages(client, round_n)
        all_rounds.append(scores)

        if scores["overall"] >= TARGET_SCORE:
            log(f"\n🎉  Target {TARGET_SCORE}/10 reached! Score = {scores['overall']:.1f}", GREEN)
            break

        if round_n < MAX_ROUNDS:
            fixes = apply_fixes(client, scores, round_n)
            all_fixes.append(fixes)
            log(f"\n⏳  Waiting 4s for Next.js hot-reload…", CYAN)
            time.sleep(4)
        else:
            log(f"\n⚠️   Max rounds reached. Final: {scores['overall']:.1f}/10", YELLOW)

    write_report(all_rounds, all_fixes)

    hr("═")
    log("  AUDIT COMPLETE", BOLD)
    log(f"  Final score : {all_rounds[-1]['overall']:.1f} / 10", GREEN)
    log(f"  Output files: {AUDIT_DIR.relative_to(ROOT)}/", GREEN)
    hr("═")


if __name__ == "__main__":
    main()
