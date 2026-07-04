#!/usr/bin/env python3
"""
qa/page_audit.py — Single-page responsive screenshot + LLM evaluation
=======================================================================
All output goes under qa/:
  qa/screenshots/{page}-{timestamp}/   ← PNG files
  qa/results/{page}-{timestamp}.json   ← scores
  qa/results/{page}-{timestamp}.md     ← summary
  qa/results/history.json              ← history

Usage (from project root):
  python3 qa/page_audit.py /dashboard
  python3 qa/page_audit.py /tracker --state search
  python3 qa/page_audit.py /dashboard --capture-only
"""

import argparse
import base64
import json
import os
import subprocess
import sys
import textwrap
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

QA_DIR   = Path(__file__).parent
ROOT     = QA_DIR.parent
load_dotenv(ROOT / ".env")

import anthropic

FRONTEND_DIR    = ROOT / "frontend"
SCREENSHOTS_DIR = QA_DIR / "screenshots"
RESULTS_DIR     = QA_DIR / "results"
APP_BASE        = "http://localhost:3001"
CLAUDE_MODEL    = "claude-sonnet-4-6"

VIEWPORTS = [
    {"id": "iphone-se",  "w": 375,  "h": 667,  "dpr": 2, "mobile": True,  "label": "iPhone SE (375px)"},
    {"id": "iphone-14",  "w": 390,  "h": 844,  "dpr": 3, "mobile": True,  "label": "iPhone 14 (390px)"},
    {"id": "pixel-7",    "w": 412,  "h": 915,  "dpr": 2, "mobile": True,  "label": "Pixel 7 (412px)"},
    {"id": "ipad",       "w": 768,  "h": 1024, "dpr": 2, "mobile": False, "label": "iPad (768px)"},
    {"id": "macbook-13", "w": 1280, "h": 800,  "dpr": 2, "mobile": False, "label": "MacBook 13 (1280px)"},
]
P0_IDS = {"iphone-se", "iphone-14", "macbook-13"}

G="\033[92m";Y="\033[93m";R="\033[91m";C="\033[96m";B="\033[1m";D="\033[2m";X="\033[0m"
def log(m, c=""): print(f"{c}[{datetime.now().strftime('%H:%M:%S')}] {m}{X}", flush=True)


def capture(page_path, state, run_dir):
    log(f"Capturing {page_path} at {len(VIEWPORTS)} viewports...", B)
    script = f"""
const {{ chromium }} = require('playwright');
const VIEWPORTS = {json.dumps(VIEWPORTS)};
const PAGE_URL  = '{APP_BASE}{page_path}';
const RUN_DIR   = '{run_dir.as_posix()}';
const STATE     = '{state}';
async function captureState(page, state) {{
  if (state === 'search') {{
    const inp = page.locator('input[placeholder*="Search food"]').first();
    if (await inp.isVisible()) {{ await inp.click(); await inp.fill('paneer'); await page.waitForTimeout(600); }}
  }} else if (state === 'exercise-search') {{
    const inp = page.locator('input[placeholder*="Search exercises"]').first();
    if (await inp.isVisible()) {{ await inp.click(); await inp.fill('push up'); await page.waitForTimeout(600); }}
  }} else if (state === 'create') {{
    const btn = page.locator('button:has-text("New Dish")').first();
    if (await btn.isVisible()) {{ await btn.click(); await page.waitForTimeout(400); }}
  }} else if (state === 'calendar') {{
    const btn = page.locator('[data-testid="date-display"]').first();
    if (await btn.isVisible()) {{ await btn.click(); await page.waitForTimeout(300); }}
  }}
}}
(async () => {{
  const browser = await chromium.launch({{ headless: true }});
  for (const vp of VIEWPORTS) {{
    const ctx = await browser.newContext({{
      viewport: {{ width: vp.w, height: vp.h }},
      deviceScaleFactor: vp.dpr,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    }});
    const page = await ctx.newPage();
    await page.addStyleTag({{ content: '*, *::before, *::after {{ animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }}' }});
    await page.goto(PAGE_URL, {{ waitUntil: 'networkidle', timeout: 15000 }});
    if (STATE !== 'default') await captureState(page, STATE);
    await page.waitForTimeout(200);
    await page.screenshot({{ path: RUN_DIR + '/' + vp.id + '.png', fullPage: false, animations: 'disabled' }});
    console.log('  + ' + vp.id);
    await ctx.close();
  }}
  await browser.close();
}})();
"""
    run_dir.mkdir(parents=True, exist_ok=True)
    js = FRONTEND_DIR / "_qa_capture_tmp.js"
    js.write_text(script)
    r = subprocess.run(f"node {js.as_posix()}", shell=True, cwd=FRONTEND_DIR,
                       capture_output=True, text=True, timeout=120)
    js.unlink(missing_ok=True)
    for line in r.stdout.strip().splitlines(): log(line, C)
    if r.returncode != 0 and r.stderr: log(r.stderr[:200], R)
    shots = [{"viewport": vp, "path": run_dir / f"{vp['id']}.png"}
             for vp in VIEWPORTS if (run_dir / f"{vp['id']}.png").exists()]
    log(f"{len(shots)}/{len(VIEWPORTS)} screenshots -> qa/screenshots/{run_dir.name}/", G)
    return shots


def evaluate(client, page_path, shots):
    log(f"\nEvaluating with Claude...", B)
    content = []
    for s in shots:
        vp = s["viewport"]
        content.append({"type": "image", "source": {"type": "base64", "media_type": "image/png",
                        "data": base64.standard_b64encode(s["path"].read_bytes()).decode()}})
        content.append({"type": "text",
                        "text": f"Screenshot: {vp['id']} — {vp['label']} ({vp['w']}x{vp['h']}px, {'mobile' if vp['mobile'] else 'desktop'})"})
    content.append({"type": "text", "text": textwrap.dedent(f"""
        Evaluate the "{page_path}" page of FitCoach AI (dark fitness app, #0d0d0d bg, green #22c55e brand).

        Score EACH screenshot 1-10:
        9-10 = Premium mobile app quality  7-8 = Good  5-6 = Functional but basic  3-4 = Layout broken  1-2 = Unusable

        Mobile (<=430px): check overflow, 44px touch targets, single-column layout, readable text.
        Desktop (>=1024px): check centered layout with max-width, good use of horizontal space.

        Return ONLY a JSON array:
        [{{"viewport_id":"iphone-se","score":6.5,"overflow":false,"touch_targets_ok":true,
          "good":["specific good thing"],"issues":["specific problem"],"fixes":["specific CSS fix"]}}]
    """)})
    print(f"\n{D}", end="", flush=True)
    text = ""
    with client.messages.stream(model=CLAUDE_MODEL, max_tokens=3000,
                                messages=[{"role": "user", "content": content}]) as s:
        for chunk in s.text_stream:
            print(chunk, end="", flush=True)
            text += chunk
    print(f"{X}\n", flush=True)
    raw = text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    start = raw.find("["); end = raw.rfind("]") + 1
    return json.loads(raw[start:end])


def write_reports(page_path, state, scores, run_dir, run_id):
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    slug  = page_path.strip("/").replace("/", "-") or "home"
    stag  = f"-{state}" if state != "default" else ""
    base  = f"{slug}{stag}-{run_id}"
    p0s   = [s["score"] for s in scores if s["viewport_id"] in P0_IDS]
    p0avg = round(sum(p0s) / len(p0s), 2) if p0s else 0
    avg   = round(sum(s["score"] for s in scores) / len(scores), 2) if scores else 0

    result = {"run_id": run_id, "page": page_path, "state": state,
              "timestamp": datetime.now().isoformat(), "p0_score": p0avg,
              "avg_score": avg, "p0_pass": p0avg >= 8.0, "scores": scores,
              "screenshots": f"qa/screenshots/{run_dir.name}"}

    out_json = RESULTS_DIR / f"{base}.json"
    out_json.write_text(json.dumps(result, indent=2))

    table = "| Viewport | Score | Overflow | Touch | Top Issue |\n|---|---|---|---|---|\n"
    for s in scores:
        issue = s["issues"][0][:55] if s.get("issues") else "—"
        table += f"| `{s['viewport_id']}` | {s['score']}/10 | {'⚠️' if s.get('overflow') else '✅'} | {'✅' if s.get('touch_targets_ok') else '❌'} | {issue} |\n"

    fixes  = [f for s in scores for f in s.get("fixes", []) if f not in [x for t in scores for x in t.get("fixes", [])[:scores.index(s)]]]
    issues = [i for s in scores for i in s.get("issues", []) if i not in [x for t in scores for x in t.get("issues", [])[:scores.index(s)]]]

    out_md = RESULTS_DIR / f"{base}.md"
    out_md.write_text(f"""# Audit: `{page_path}` {f'[{state}]' if state != 'default' else ''}

> Run: `{run_id}` · {datetime.now().strftime('%Y-%m-%d %H:%M')}
> P0: **{p0avg}/10** {'✅' if p0avg >= 8 else '❌ need ≥8.0'}  |  Avg: {avg}/10
> Screenshots: `qa/screenshots/{run_dir.name}/`

{table}

## Issues
{chr(10).join(f'- {i}' for i in issues) or '- None'}

## Fixes
{chr(10).join(f'{i+1}. {f}' for i,f in enumerate(fixes)) or '- None'}
""")

    hist_path = RESULTS_DIR / "history.json"
    hist = json.loads(hist_path.read_text()) if hist_path.exists() else {"runs": []}
    hist["runs"].append({"run_id": run_id, "page": page_path, "state": state,
                         "p0_score": p0avg, "avg_score": avg, "p0_pass": p0avg >= 8.0,
                         "timestamp": result["timestamp"]})
    hist["runs"] = hist["runs"][-200:]
    hist_path.write_text(json.dumps(hist, indent=2))

    return out_json, out_md, result


def print_summary(result, out_json, out_md):
    print(f"\n{'='*56}", flush=True)
    p0c = G if result["p0_score"] >= 8 else Y if result["p0_score"] >= 6 else R
    log(f"  P0: {p0c}{result['p0_score']}/10{X} {'PASS' if result['p0_pass'] else 'FAIL (need >=8.0)'}  |  Avg: {result['avg_score']}/10", B)
    print("", flush=True)
    for s in result["scores"]:
        bar = "█"*int(s["score"]) + "░"*(10-int(s["score"]))
        c = G if s["score"] >= 7 else Y if s["score"] >= 5 else R
        star = " ★ P0" if s["viewport_id"] in P0_IDS else ""
        log(f"  {s['viewport_id']:15} {c}{bar}{X} {s['score']}/10{star}", "")
    print("", flush=True)
    log(f"  JSON:        qa/results/{out_json.name}", G)
    log(f"  Summary:     qa/results/{out_md.name}", G)
    log(f"  Screenshots: {result['screenshots']}/", G)
    print(f"{'='*56}", flush=True)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("page")
    p.add_argument("--state", default="default",
                   choices=["default","search","exercise-search","create","calendar"])
    p.add_argument("--capture-only", action="store_true")
    args = p.parse_args()

    page_path = args.page if args.page.startswith("/") else f"/{args.page}"

    import urllib.request, urllib.error
    try: urllib.request.urlopen(APP_BASE, timeout=3)
    except: log(f"App not running at {APP_BASE} — run ./dev.sh start", R); sys.exit(1)

    run_id    = datetime.now().strftime("%Y%m%d-%H%M%S")
    slug      = page_path.strip("/").replace("/", "-") or "home"
    stag      = f"-{args.state}" if args.state != "default" else ""
    run_dir   = SCREENSHOTS_DIR / f"{slug}{stag}-{run_id}"

    shots = capture(page_path, args.state, run_dir)
    if not shots: log("No screenshots captured", R); sys.exit(1)

    if args.capture_only:
        log(f"Screenshots saved: qa/screenshots/{run_dir.name}/", G); return

    api_key  = os.environ.get("ANTHROPIC_API_KEY","")
    base_url = os.environ.get("ANTHROPIC_BASE_URL","")
    if not api_key: log("ANTHROPIC_API_KEY not set in .env", R); sys.exit(1)

    kwargs = {"api_key": api_key}
    if base_url: kwargs["base_url"] = base_url
    client = anthropic.Anthropic(**kwargs)

    scores = evaluate(client, page_path, shots)
    out_json, out_md, result = write_reports(page_path, args.state, scores, run_dir, run_id)
    print_summary(result, out_json, out_md)

if __name__ == "__main__":
    main()
