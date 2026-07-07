#!/usr/bin/env python3
"""
qa/page_audit.py — Multi-scroll responsive screenshot + LLM evaluation
=======================================================================
All output goes under qa/:
  qa/screenshots/{page}-{timestamp}/{viewport}/scroll-N.png  ← per-viewport folders
  qa/results/{page}-{timestamp}.json                          ← scores
  qa/results/{page}-{timestamp}.md                            ← summary
  qa/results/history.json                                     ← history

Scroll logic (architect decision):
  - Scroll 80% of viewport height per step (20% overlap keeps context between shots)
  - Stop when scrollY + viewportHeight >= scrollHeight (reached bottom)
  - Cap at MAX_SCROLL_SHOTS per viewport to prevent runaway on infinite-scroll pages
  - At bottom: snap to exact bottom for final shot so nothing is cut off

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
MAX_SCROLL_SHOTS = 8   # max screenshots per viewport (prevents runaway on very long pages)
SCROLL_OVERLAP   = 0.8 # scroll 80% of viewport height per step — 20% overlap for context

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
    """
    Captures each viewport into its own subfolder with multiple scroll screenshots.
    Scroll logic: 80% viewport height per step, stop at bottom, cap at MAX_SCROLL_SHOTS.
    """
    log(f"Capturing {page_path} at {len(VIEWPORTS)} viewports (with scroll)...", B)

    script = f"""
const {{ chromium }} = require('playwright');
const path = require('path');
const fs   = require('fs');

const VIEWPORTS       = {json.dumps(VIEWPORTS)};
const PAGE_URL        = '{APP_BASE}{page_path}';
const RUN_DIR         = '{run_dir.as_posix()}';
const STATE           = '{state}';
const MAX_SHOTS       = {MAX_SCROLL_SHOTS};
const SCROLL_OVERLAP  = {SCROLL_OVERLAP};

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

async function scrollAndCapture(page, vpDir, vpH) {{
  const shots = [];
  const scrollStep = Math.floor(vpH * SCROLL_OVERLAP);
  let scrollY = 0;
  let shotIdx = 0;

  // Reset to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);

  while (shotIdx < MAX_SHOTS) {{
    const shotPath = path.join(vpDir, `scroll-${{shotIdx}}.png`);
    await page.screenshot({{ path: shotPath, fullPage: false, animations: 'disabled' }});
    shots.push(shotPath);
    shotIdx++;

    // Check if we are at/near the bottom
    const {{ scrollHeight, clientHeight }} = await page.evaluate(() => ({{
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }}));
    const atBottom = (scrollY + clientHeight) >= (scrollHeight - 5);
    if (atBottom) break;

    // Compute next scroll position
    const nextY = scrollY + scrollStep;
    // Snap to exact bottom for last shot so nothing is cut off
    const finalY = Math.min(nextY, scrollHeight - clientHeight);
    await page.evaluate((y) => window.scrollTo(0, y), finalY);
    await page.waitForTimeout(150);  // allow lazy content to render
    scrollY = finalY;
  }}

  return shots;
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
    // Disable animations so content is stable
    await page.addStyleTag({{ content: '*, *::before, *::after {{ animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }}' }});
    await page.goto(PAGE_URL, {{ waitUntil: 'networkidle', timeout: 15000 }});
    if (STATE !== 'default') await captureState(page, STATE);
    await page.waitForTimeout(300);

    // Create per-viewport subfolder
    const vpDir = path.join(RUN_DIR, vp.id);
    fs.mkdirSync(vpDir, {{ recursive: true }});

    const shots = await scrollAndCapture(page, vpDir, vp.h);
    console.log(`  + ${{vp.id}} (${{shots.length}} shots)`);
    await ctx.close();
  }}
  await browser.close();
}})();
"""
    run_dir.mkdir(parents=True, exist_ok=True)
    js = FRONTEND_DIR / "_qa_capture_tmp.js"
    js.write_text(script)
    r = subprocess.run(f"node {js.as_posix()}", shell=True, cwd=FRONTEND_DIR,
                       capture_output=True, text=True, timeout=180)
    js.unlink(missing_ok=True)
    for line in r.stdout.strip().splitlines(): log(line, C)
    if r.returncode != 0 and r.stderr: log(r.stderr[:300], R)

    # Build shots list: one entry per viewport, with list of scroll image paths
    shots = []
    for vp in VIEWPORTS:
        vp_dir = run_dir / vp["id"]
        scroll_files = sorted(vp_dir.glob("scroll-*.png")) if vp_dir.exists() else []
        if scroll_files:
            shots.append({"viewport": vp, "paths": scroll_files})

    total_imgs = sum(len(s["paths"]) for s in shots)
    log(f"{len(shots)}/{len(VIEWPORTS)} viewports, {total_imgs} total screenshots -> qa/screenshots/{run_dir.name}/", G)
    return shots


def evaluate(client, page_path, shots):
    """
    Evaluates each viewport using ALL its scroll screenshots.
    Groups images by viewport so the LLM sees the full page for each device.
    """
    log(f"\nEvaluating with Claude ({sum(len(s['paths']) for s in shots)} images)...", B)

    content = []

    for s in shots:
        vp = s["viewport"]
        scroll_paths = s["paths"]

        # Section header for this viewport
        content.append({"type": "text", "text":
            f"\n--- VIEWPORT: {vp['id']} — {vp['label']} ({vp['w']}x{vp['h']}px, "
            f"{'mobile' if vp['mobile'] else 'desktop'}) "
            f"[{len(scroll_paths)} scroll shot{'s' if len(scroll_paths) > 1 else ''}] ---"
        })

        for i, img_path in enumerate(scroll_paths):
            content.append({"type": "image", "source": {"type": "base64", "media_type": "image/png",
                            "data": base64.standard_b64encode(img_path.read_bytes()).decode()}})
            content.append({"type": "text",
                            "text": f"↑ {vp['id']} scroll-{i} ({'top' if i == 0 else 'scrolled'}, {vp['w']}x{vp['h']}px)"})

    content.append({"type": "text", "text": textwrap.dedent(f"""
        Evaluate the "{page_path}" page of FitCoach AI (dark fitness app, #0A0A0A bg, green #22c55e brand).

        For each VIEWPORT you have been given MULTIPLE scroll screenshots showing the COMPLETE page
        from top to bottom. Evaluate the FULL page experience, not just the first screenshot.

        Score EACH viewport 1-10:
        9-10 = Premium quality — great layout, good use of space, visual hierarchy, all content accessible
        7-8  = Good — functional, mostly well designed, minor issues
        5-6  = Functional but basic — layout issues, poor use of space, or content problems
        3-4  = Layout broken or major UX issues
        1-2  = Unusable

        Judge: layout quality, visual hierarchy, content density, use of space, typography, navigation,
               empty states, card design, responsiveness across the FULL scrollable page.

        IMPORTANT: Content below the fold that requires scrolling is NOT a problem — that is normal.
        Only penalise if content is MISSING, BROKEN, or INACCESSIBLE even after scrolling.

        Mobile (<=430px): single-column, 44px+ touch targets, readable text, clean scroll.
        Tablet (768px): single-column with full width, bottom nav present.
        Desktop (>=1024px): centred max-width column, top nav present, good horizontal use of space.

        Return ONLY a JSON array (no markdown fences):
        [{{"viewport_id":"iphone-se","score":8.0,"overflow":false,"touch_targets_ok":true,
          "good":["specific positive"],"issues":["specific real problem"],"fixes":["specific fix"]}}]
    """)})

    print(f"\n{D}", end="", flush=True)
    text = ""
    with client.messages.stream(model=CLAUDE_MODEL, max_tokens=4000,
                                messages=[{"role": "user", "content": content}]) as stream:
        for chunk in stream.text_stream:
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

    seen_issues = set(); seen_fixes = set()
    issues = []
    fixes = []
    for s in scores:
        for i in s.get("issues", []):
            if i not in seen_issues: seen_issues.add(i); issues.append(i)
        for f in s.get("fixes", []):
            if f not in seen_fixes: seen_fixes.add(f); fixes.append(f)

    out_md = RESULTS_DIR / f"{base}.md"
    out_md.write_text(f"""# Audit: `{page_path}` {f'[{state}]' if state != 'default' else ''}

> Run: `{run_id}` · {datetime.now().strftime('%Y-%m-%d %H:%M')}
> P0: **{p0avg}/10** {'✅' if p0avg >= 8 else '❌ need ≥8.0'}  |  Avg: {avg}/10
> Screenshots: `qa/screenshots/{run_dir.name}/` (per-viewport folders with scroll shots)

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
    log(f"  Screenshots: {result['screenshots']}/{{viewport}}/scroll-N.png", G)
    print(f"{'='*56}", flush=True)


def main():
    p = argparse.ArgumentParser(description="FitCoach AI page audit — multi-scroll per viewport")
    p.add_argument("page")
    p.add_argument("--state", default="default",
                   choices=["default","search","exercise-search","create","calendar"])
    p.add_argument("--capture-only", action="store_true",
                   help="Take screenshots only, skip LLM evaluation")
    args = p.parse_args()

    page_path = args.page if args.page.startswith("/") else f"/{args.page}"

    import urllib.request
    try: urllib.request.urlopen(APP_BASE, timeout=3)
    except: log(f"App not running at {APP_BASE} — run ./dev.sh start", R); sys.exit(1)

    run_id  = datetime.now().strftime("%Y%m%d-%H%M%S")
    slug    = page_path.strip("/").replace("/", "-") or "home"
    stag    = f"-{args.state}" if args.state != "default" else ""
    run_dir = SCREENSHOTS_DIR / f"{slug}{stag}-{run_id}"

    shots = capture(page_path, args.state, run_dir)
    if not shots: log("No screenshots captured", R); sys.exit(1)

    if args.capture_only:
        log(f"Screenshots saved: qa/screenshots/{run_dir.name}/{{viewport}}/scroll-N.png", G)
        return

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
