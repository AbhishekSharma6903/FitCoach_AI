#!/usr/bin/env python3
"""
qa/evaluate_edit_sync.py — Evaluates edit-sync and intensity-removal screenshots.
Usage (from project root):
  python3 qa/evaluate_edit_sync.py <screenshot_dir>
"""
import base64, json, os, sys
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")
import anthropic

RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

STATE_META = {
  "01-no-intensity-picker":      "No intensity (Light/Moderate/Vigorous) control in modal",
  "02-preview-driven-by-weight": "Calorie preview changes with weight (no intensity needed)",
  "03-before-edit":              "Card baseline: 3 sets × 8 reps @ 20 kg logged",
  "04-after-edit-set1":          "After editing Set 1 weight to 8 kg — metrics must update",
  "05-mixed-weights":            "After all 3 sets edited to 8/12/15 kg — volume reflects mixed weights",
}

PROMPT = """
You are evaluating two specific fixes in a workout app (dark theme, #0A0A0A bg, green brand).

FIX A — Intensity picker removed
FIX B — Edit updates volume + calories immediately

Check each state:

STATE 01 (No intensity picker):
  PASS if: The modal for a strength exercise shows ONLY Sets, Reps/set, Weight fields.
           NO segmented control labelled "Intensity" / "Light" / "Moderate" / "Vigorous".
  FAIL if: Any intensity-related UI is visible.

STATE 02 (Preview driven by weight):
  PASS if: Calorie estimate shown is noticeably higher than ~5 kcal bodyweight baseline.
           For 3×10 push-ups @ 40 kg the estimate should be 8+ kcal.
           The hint below kcal should say something like "3 sets × 10 reps @ 40 kg" (no intensity).
  FAIL if: Estimate stuck at ~4-5 kcal or hint still mentions intensity.

STATE 03 (Baseline card):
  Note the Volume label and Calories value shown. They should read roughly:
  "3 sets × 8 reps @ 20 kg" and some kcal > 0.
  This is the BEFORE state — just record what you see.

STATE 04 (After editing Set 1 weight to 8 kg):
  PASS if: The Volume label changed (now shows a different weight like "@ 8 kg" or mixed-weight display)
           AND the Calories value changed from state 03's value.
           The set row itself must show "8 kg" not "20 kg".
  FAIL if: Volume and Calories are identical to state 03 (metrics not updated after edit).

STATE 05 (Mixed weights 8/12/15 kg):
  PASS if: Set 1 shows 8 kg, Set 2 shows 12 kg, Set 3 shows 15 kg (or the card acknowledges mixed).
           Volume does NOT show a single "@ 20 kg" (the original weight).
           Total lifted or per-set weight reflects the variation.
  FAIL if: All rows still show 20 kg (edits didn't persist visually).

Score 1-10. Return ONLY JSON (no markdown):
[{"state_id":"01-no-intensity-picker","score":9,"pass":true,"evidence":"exact text/elements you see"}]
""".strip()

def evaluate(client, vp_id, shot_dir):
    shots = sorted(shot_dir.glob("*.png"))
    if not shots:
        return []
    content = []
    for shot in shots:
        sid = shot.stem
        content.append({"type": "text", "text": f"\n--- {sid}: {STATE_META.get(sid, sid)} ---"})
        content.append({"type": "image", "source": {
            "type": "base64", "media_type": "image/png",
            "data": base64.b64encode(shot.read_bytes()).decode(),
        }})
    content.append({"type": "text", "text": PROMPT})
    resp = client.messages.create(model="claude-sonnet-4-6", max_tokens=2000,
                                   messages=[{"role": "user", "content": content}])
    raw = resp.content[0].text.strip()
    if "```" in raw: raw = raw.replace("```json","").replace("```","").strip()
    s, e = raw.find("["), raw.rfind("]")
    try: return json.loads(raw[s:e+1] if s != -1 else raw)
    except: return [{"error": raw[:200]}]

def main():
    shot_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if not shot_dir or not shot_dir.exists():
        dirs = sorted((Path(__file__).parent / "screenshots").glob("workout-edit-sync-*"), reverse=True)
        if not dirs: print("No workout-edit-sync screenshot dirs found."); sys.exit(1)
        shot_dir = dirs[0]
        print(f"Using: {shot_dir.name}")

    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key: print("ANTHROPIC_API_KEY not set"); sys.exit(1)
    base = os.environ.get("ANTHROPIC_BASE_URL")
    client = anthropic.Anthropic(api_key=key, **({"base_url": base} if base else {}))

    all_results = {}
    all_scores = []
    passed = failed = 0

    for vp_dir in sorted(d for d in shot_dir.iterdir() if d.is_dir()):
        vp_id = vp_dir.name
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Evaluating [{vp_id}]...", flush=True)
        results = evaluate(client, vp_id, vp_dir)
        all_results[vp_id] = results

    G,Y,R,B,X = "\033[92m","\033[93m","\033[91m","\033[1m","\033[0m"
    print(f"\n{'═'*54}")
    print(f"  WORKOUT EDIT-SYNC + INTENSITY REMOVAL — RESULTS")
    print(f"{'═'*54}\n")

    for vp_id, results in all_results.items():
        if isinstance(results, list) and results and "error" in results[0]:
            print(f"[{vp_id}] ERROR: {results[0]['error']}")
            continue
        print(f"[{vp_id}]")
        for r in results:
            sc = r.get("score", 0)
            bar = "█"*round(sc) + "░"*(10-round(sc))
            tag = f"  ✅ PASS" if r.get("pass") is True else (f"  ❌ FAIL" if r.get("pass") is False else "")
            print(f"  {r['state_id']}  {bar}  {sc:.1f}/10{tag}")
            ev = r.get("evidence","")
            if ev: print(f"    → {ev[:120]}")
            if r.get("pass") is True: passed += 1
            elif r.get("pass") is False: failed += 1
            if sc: all_scores.append(sc)
        print()

    avg = sum(all_scores)/len(all_scores) if all_scores else 0
    col = G if avg >= 8 else Y if avg >= 7 else R
    print(f"{'─'*54}")
    print(f"  {col}Average: {avg:.2f}/10{X}   {G}Passed: {passed}{X}   {R}Failed: {failed}{X}")
    print(f"{'─'*54}")

    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    rp = RESULTS_DIR / f"workout-edit-sync-{ts}.json"
    rp.write_text(json.dumps({"avg": round(avg,2), "passed": passed, "failed": failed, "results": all_results}, indent=2))
    print(f"\nReport: {rp}")

if __name__ == "__main__":
    main()
