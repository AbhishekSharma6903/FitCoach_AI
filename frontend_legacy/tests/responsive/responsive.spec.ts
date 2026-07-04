// frontend/tests/responsive/responsive.spec.ts
// Multi-viewport screenshot capture for responsive UI testing.
// Does NOT use assertions — pure screenshot capture for visual evaluation.
// Screenshots are evaluated by responsive_audit.py using Claude Vision.
//
// Usage (via responsive_audit.py — sets RESPONSIVE_RUN_ID automatically):
//   python3 responsive_audit.py --capture-only
//
// Manual usage:
//   RESPONSIVE_RUN_ID=run-20260703-1200 node_modules/.bin/playwright test tests/responsive/responsive.spec.ts

import { test } from "@playwright/test";
import path from "path";
import fs from "fs";
import { VIEWPORTS } from "./viewports";
import { PAGES, setupPageState } from "./pages";

// ── Run ID: inherited from env var set by responsive_audit.py ────────────────
// All Playwright workers inherit process.env from the parent process, so this
// is consistent across all workers in the same run.
function buildRunId(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `run-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

const RUN_ID = process.env.RESPONSIVE_RUN_ID || buildRunId();
const SCREENSHOTS_BASE = path.join(__dirname, "screenshots");
const RUN_DIR = path.join(SCREENSHOTS_BASE, RUN_ID);

test.beforeAll(() => {
  fs.mkdirSync(RUN_DIR, { recursive: true });
  console.log(`\n📸  Run ID: ${RUN_ID}\n    Output: ${RUN_DIR}\n`);
});

test.afterAll(() => {
  // Write run metadata (idempotent — safe to run multiple times across workers)
  try {
    fs.writeFileSync(
      path.join(RUN_DIR, "run-meta.json"),
      JSON.stringify({
        run_id: RUN_ID,
        timestamp: new Date().toISOString(),
        viewports: VIEWPORTS.map(v => ({
          id: v.id, label: v.label, width: v.width, height: v.height, priority: v.priority,
        })),
        pages: PAGES.map(p => ({
          id: p.id, name: p.name, states: p.states.map(s => s.id),
        })),
      }, null, 2)
    );
  } catch { /* ignore race conditions between workers */ }
});

// ── Generate one test per viewport × page × state ────────────────────────────
for (const viewport of VIEWPORTS) {
  for (const pageDef of PAGES) {
    for (const state of pageDef.states) {

      test(`[${viewport.id}] ${pageDef.name} — ${state.name}`, async ({ browser }) => {
        const context = await browser.newContext({
          viewport:          { width: viewport.width, height: viewport.height },
          deviceScaleFactor: viewport.dpr,
          isMobile:          viewport.isMobile,
          hasTouch:          viewport.hasTouch,
          serviceWorkers:    "block",
        });

        const page = await context.newPage();

        // Freeze all CSS animations for stable screenshots
        await page.addStyleTag({
          content: `
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          `,
        });

        await page.goto(pageDef.url, { waitUntil: "networkidle", timeout: 20000 });

        if (state.setup) {
          await setupPageState(page, state.setup);
        }

        await page.waitForTimeout(200);

        // Save screenshot to the shared run folder
        const viewportDir = path.join(RUN_DIR, viewport.id);
        fs.mkdirSync(viewportDir, { recursive: true });

        await page.screenshot({
          path:      path.join(viewportDir, `${pageDef.id}--${state.id}.png`),
          fullPage:  state.fullPage ?? false,
          animations: "disabled",
          caret:     "hide",
        });

        await context.close();
      });
    }
  }
}
