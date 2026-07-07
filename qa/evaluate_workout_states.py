#!/usr/bin/env python3
"""
qa/evaluate_workout_states.py — Evaluates captured workout interactive state screenshots.
Uses the already-captured screenshots from workout-states.js (which captured but couldn't evaluate).

Usage (from project root):
  python3 qa/evaluate_workout_states.py <screenshot_dir>
  python3 qa/evaluate_workout_states.py qa/screenshots/workout-interactive-2026-07-05-17-28
"""

import base64
import json
import os
import sys
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

import anthropic

QA_DIR = Path(__file__).parent
RESULTS_DIR = QA_DIR / "results"
RESULTS_DIR.mkdir(exist_ok=True)

CLAUDE_MODEL = "claude-sonnet-4-6"

STATE_METADATA = {
    "01-empty-state":            {"label": "Default empty page", "bug_fix": None},
    "02-modal-open":             {"label": "Log Exercise modal open", "bug_fix": None},
    "03-modal-prefilled":        {"label": "Sets=3, Reps=10 pre-filled after selecting Push Up", "bug_fix": "Bug 2"},
    "04-calorie-preview":        {"label": "Calorie preview with sets × reps formula", "bug_fix": "Bug 3"},
    "05-intensity-vigorous":     {"label": "Vigorous intensity — calorie increases", "bug_fix": None},
    "06-modal-closes-after-log": {"label": "Modal closed after Log Exercise", "bug_fix": "Bug 1"},
    "07-workout-logged":         {"label": "Workout log card visible", "bug_fix": None},
    "08-volume-label":           {"label": "Volume shows sets×reps×kg subtitle", "bug_fix": "Bug 5"},
    "09-inline-edit":            {"label": "Inline edit mode for a set row", "bug_fix": "Bug 4"},
    "10-session-summary-bars":   {"label": "Session Summary breakdown bars coloured", "bug_fix": "Bug 6"},
}

G="\033[92m"; Y="\033[93m"; R="\033[91m"; C="\033[96m"; B="\033[1m"; D="\033[2m"; X="\033[0m"
def log(m, c=""): print(f"{c}[{datetime.now().strftime('%H:%M:%S')}] {m}{X}", flush=True)


def evaluate_viewport(client, vp_id, shot_dir):
    shots = sorted(shot_dir.glob("*.png"))
    if not shots:
        log(f"No screenshots found in {shot_dir}", Y)
        return []

    content = []
    for shot in shots:
        state_id = shot.stem
        meta = STATE_METADATA.get(state_id, {"label": state_id, "bug_fix": None})
        bug_tag = f" [VALIDATES: {meta['bug_fix']}]" if meta['bug_fix'] else ""
        content.append({"type": "text", "text": f"\n--- STATE: {state_id} — {meta['label']}{bug_tag} ---"})
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": base64.b64encode(shot.read_bytes()).decode(),
            },
        })

    content.append({
        "type": "text",
        "text": """
You are evaluating the Workout page of FitCoach AI — a dark fitness tracking app.
Design system: #0A0A0A background, #22c55e green brand, warm-neutral palette.

CRITICAL BUG FIX VALIDATION — check each tagged state:

Bug 1 (state 06): Modal must be CLOSED/absent after clicking Log Exercise.
  PASS if: modal overlay is not visible, workout log card IS visible.
  FAIL if: modal is still open.

Bug 2 (state 03): Sets and Reps inputs must be PRE-FILLED with 3 and 10.
  PASS if: input fields show "3" and "10" as actual values (not empty/grey placeholder text).
  FAIL if: inputs are empty or show only placeholder styling.

Bug 3 (state 04): Calorie preview must reference sets × reps, label should say "Estimated burn".
  PASS if: preview card shows "Estimated burn" heading and/or "sets × reps" explanation text.
  FAIL if: preview is missing or only says "Calorie preview" with no sets/reps context.

Bug 4 (state 09): Inline edit mode showing reps + weight input fields within a set row.
  PASS if: small input fields are visible inside a set row (edit mode triggered).
  FAIL if: no edit inputs visible, only the read-only row.

Bug 5 (state 08): Volume stat must show a "sets × reps × kg" subtitle below the main value.
  PASS if: there is small grey text explaining the volume metric.
  FAIL if: volume shows only the number with no explanation.

Bug 6 (state 10): Breakdown progress bars must be COLOURED (blue for Strength, red for Cardio).
  PASS if: the horizontal fill bars show a distinct colour (blue/red/purple etc.).
  FAIL if: all bars appear uniformly grey.

GENERAL QUALITY (all states):
- Dark theme consistency (#0A0A0A bg, green CTAs)
- Modal/drawer renders without overflow or clipping
- Log cards have clean hierarchy (icon → name → stats → sets table)
- Session Summary widget visible on macbook-13 right column
- Touch targets adequate on iphone-14 (44px+)

Score each state 1-10. Return ONLY valid JSON (no markdown fences):
[
  {
    "state_id": "01-empty-state",
    "score": 8.5,
    "bug_fix_tag": null,
    "bug_fix_validated": null,
    "issues": ["specific visible problem"],
    "good": ["what works well"]
  }
]

For bug fix states: set bug_fix_tag to the bug name ("Bug 1" etc.) and bug_fix_validated to true or false.
For non-bug states: set both to null.
""".strip()
    })

    resp = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=3000,
        messages=[{"role": "user", "content": content}],
    )
    raw = resp.content[0].text.strip()
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw[raw.index("["):raw.rindex("]") + 1]
    return json.loads(raw)


def main():
    screenshot_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if not screenshot_dir or not screenshot_dir.exists():
        # Auto-find latest
        dirs = sorted((QA_DIR / "screenshots").glob("workout-interactive-*"), reverse=True)
        if not dirs:
            print("No workout-interactive screenshot dirs found. Run workout-states.js first.")
            sys.exit(1)
        screenshot_dir = dirs[0]
        log(f"Using latest: {screenshot_dir.name}", C)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ANTHROPIC_API_KEY not set")
        sys.exit(1)

    base_url = os.environ.get("ANTHROPIC_BASE_URL")
    kwargs = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    client = anthropic.Anthropic(**kwargs)

    viewports = [d for d in screenshot_dir.iterdir() if d.is_dir()]
    all_results = {}
    all_scores = []
    bug_validation = {}

    for vp_dir in sorted(viewports):
        vp_id = vp_dir.name
        log(f"Evaluating [{vp_id}] ({len(list(vp_dir.glob('*.png')))} states)...", B)
        results = evaluate_viewport(client, vp_id, vp_dir)
        all_results[vp_id] = results

        for r in results:
            if r.get("score"):
                all_scores.append(r["score"])
            if r.get("bug_fix_tag"):
                key = f"{r['bug_fix_tag']}@{vp_id}"
                bug_validation[key] = r.get("bug_fix_validated")

    # ── Print report ──────────────────────────────────────────────────────────
    print(f"\n{'═'*52}")
    print(f"  WORKOUT PAGE — INTERACTIVE STATE EVALUATION")
    print(f"  {screenshot_dir.name}")
    print(f"{'═'*52}\n")

    for vp_id, results in all_results.items():
        if isinstance(results, list) and results and "error" in results[0]:
            print(f"[{vp_id}] ERROR: {results[0]}")
            continue
        print(f"[{vp_id}]")
        for r in results:
            score = r.get("score", 0)
            bar = "█" * round(score) + "░" * (10 - round(score))
            fix_tag = r.get("bug_fix_tag")
            validated = r.get("bug_fix_validated")
            fix_str = ""
            if fix_tag:
                fix_str = f"  ✅ {fix_tag} FIXED" if validated else f"  ❌ {fix_tag} NOT FIXED"
            print(f"  {r['state_id']}  {bar}  {score:.1f}/10{fix_str}")
            for issue in (r.get("issues") or [])[:2]:
                print(f"    ✗ {issue}")
            for good in (r.get("good") or [])[:1]:
                print(f"    ✓ {good}")
        print()

    avg = sum(all_scores) / len(all_scores) if all_scores else 0
    fixed = sum(1 for v in bug_validation.values() if v is True)
    total_bugs = len(bug_validation)
    color = G if avg >= 8.0 else Y if avg >= 7.0 else R

    print(f"{'─'*52}")
    print(f"  {color}Average score: {avg:.2f}/10{X}")
    print(f"  Bug fixes validated: {fixed}/{total_bugs}")
    print(f"{'─'*52}\n")

    # Save report
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    report_path = RESULTS_DIR / f"workout-interactive-{ts}.json"
    report_path.write_text(json.dumps({
        "screenshot_dir": str(screenshot_dir),
        "average_score": round(avg, 2),
        "bug_validation": bug_validation,
        "results": all_results,
    }, indent=2))
    log(f"Report: {report_path}", G)


if __name__ == "__main__":
    main()
