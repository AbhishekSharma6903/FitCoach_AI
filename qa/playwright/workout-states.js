/**
 * qa/playwright/workout-states.js
 *
 * Dynamic Playwright validation for the Workout page.
 * Tests all interactive states including: modal open/close, prefilled defaults,
 * exercise search/select, log flow, inline edit, and session summary bars.
 *
 * Usage (from project root):
 *   node qa/playwright/workout-states.js
 *   node qa/playwright/workout-states.js --capture-only
 *
 * Output: qa/screenshots/workout-interactive-{ts}/{viewport}/{state}.png
 *         qa/screenshots/workout-interactive-{ts}/evaluation.json
 */

const { chromium } = require("../../frontend/node_modules/playwright");
const path = require("path");
const fs = require("fs");
try { require("../../frontend/node_modules/dotenv").config({ path: path.join(__dirname, "../../.env") }); } catch {}

const apiKey = process.env.ANTHROPIC_API_KEY;
const BASE_URL = "http://localhost:3001/workout";
const OUT_DIR = path.join(
  __dirname,
  "../screenshots",
  `workout-interactive-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-")}`,
);

const VIEWPORTS = [
  { id: "iphone-14",  w: 390,  h: 844,  dpr: 3, mobile: true  },
  { id: "macbook-13", w: 1280, h: 800,  dpr: 2, mobile: false },
];

// Helper: open the Log Exercise modal
async function openModal(page) {
  const btn = page.locator("button", { hasText: "Log Exercise" }).first();
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(600);
    return true;
  }
  return false;
}

const STATES = [
  // ── 01: Default empty state ───────────────────────────────────────────────
  {
    id: "01-empty-state",
    label: "Default empty page (no workout logged)",
    setup: async (page) => {
      await page.waitForTimeout(1000);
    },
  },

  // ── 02: Modal opens ───────────────────────────────────────────────────────
  {
    id: "02-modal-open",
    label: "Log Exercise modal opens cleanly",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
    },
  },

  // ── 03: Modal shows prefilled sets=3, reps=10 after selecting exercise ────
  {
    id: "03-modal-prefilled",
    label: "Sets=3, Reps=10 pre-filled after selecting Push Up",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      const input = page.locator("input[placeholder*='Search']").first();
      if (await input.isVisible()) {
        await input.fill("push up");
        await page.waitForTimeout(1200);
        // Select first result
        const result = page.locator("[role='option'], [data-slot='command-item']").first();
        if (await result.isVisible()) {
          await result.click();
          await page.waitForTimeout(400);
        }
      }
    },
  },

  // ── 04: Calorie preview appears with sets × reps formula ──────────────────
  {
    id: "04-calorie-preview",
    label: "Calorie preview updates with sets × reps (Bug 3 fix)",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      const input = page.locator("input[placeholder*='Search']").first();
      if (await input.isVisible()) {
        await input.fill("squat");
        await page.waitForTimeout(1200);
        const result = page.locator("[role='option'], [data-slot='command-item']").first();
        if (await result.isVisible()) {
          await result.click();
          await page.waitForTimeout(400);
          // Change reps to 15 — calorie preview should update
          const repsInput = page.locator("input[placeholder='10']").first();
          if (await repsInput.isVisible()) {
            await repsInput.fill("15");
            await page.waitForTimeout(300);
          }
        }
      }
    },
  },

  // ── 05: Intensity picker ──────────────────────────────────────────────────
  {
    id: "05-intensity-vigorous",
    label: "Vigorous intensity selected — calorie preview increases",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      const input = page.locator("input[placeholder*='Search']").first();
      if (await input.isVisible()) {
        await input.fill("push up");
        await page.waitForTimeout(1200);
        const result = page.locator("[role='option'], [data-slot='command-item']").first();
        if (await result.isVisible()) {
          await result.click();
          await page.waitForTimeout(400);
          // Click Vigorous
          const vigorous = page.locator("button", { hasText: "Vigorous" }).first();
          if (await vigorous.isVisible()) {
            await vigorous.click();
            await page.waitForTimeout(300);
          }
        }
      }
    },
  },

  // ── 06: Log exercise — modal closes (Bug 1 fix) ───────────────────────────
  {
    id: "06-modal-closes-after-log",
    label: "Modal closes after tapping Log Exercise (Bug 1 fix)",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      const input = page.locator("input[placeholder*='Search']").first();
      if (await input.isVisible()) {
        await input.fill("push up");
        await page.waitForTimeout(1200);
        const result = page.locator("[role='option'], [data-slot='command-item']").first();
        if (await result.isVisible()) {
          await result.click();
          await page.waitForTimeout(400);
          // Click Log Exercise
          const logBtn = page.locator("button", { hasText: "Log Exercise" }).last();
          if (await logBtn.isVisible()) {
            await logBtn.click();
            await page.waitForTimeout(1200); // wait for API + modal close animation
          }
        }
      }
    },
  },

  // ── 07: Workout log card appears ──────────────────────────────────────────
  {
    id: "07-workout-logged",
    label: "Workout log card visible with Push Up after logging",
    setup: async (page) => {
      await page.waitForTimeout(800);
      // Log a push up set
      await openModal(page);
      const input = page.locator("input[placeholder*='Search']").first();
      if (await input.isVisible()) {
        await input.fill("push up");
        await page.waitForTimeout(1200);
        const result = page.locator("[role='option'], [data-slot='command-item']").first();
        if (await result.isVisible()) {
          await result.click();
          await page.waitForTimeout(400);
          const logBtn = page.locator("button", { hasText: "Log Exercise" }).last();
          if (await logBtn.isVisible()) {
            await logBtn.click();
            await page.waitForTimeout(1500);
          }
        }
      }
    },
  },

  // ── 08: Volume label clarity (Bug 5 fix) ─────────────────────────────────
  {
    id: "08-volume-label",
    label: "Volume stat shows sets×reps×kg subtitle (Bug 5 fix)",
    setup: async (page) => {
      await page.waitForTimeout(800);
      // Log push up with weight
      await openModal(page);
      const input = page.locator("input[placeholder*='Search']").first();
      if (await input.isVisible()) {
        await input.fill("push up");
        await page.waitForTimeout(1200);
        const result = page.locator("[role='option'], [data-slot='command-item']").first();
        if (await result.isVisible()) {
          await result.click();
          await page.waitForTimeout(400);
          // Add weight
          const weightInput = page.locator("input[placeholder='body']").first();
          if (await weightInput.isVisible()) await weightInput.fill("20");
          await page.waitForTimeout(200);
          const logBtn = page.locator("button", { hasText: "Log Exercise" }).last();
          if (await logBtn.isVisible()) {
            await logBtn.click();
            await page.waitForTimeout(1500);
          }
        }
      }
    },
  },

  // ── 09: Inline edit row (Bug 4 fix) ──────────────────────────────────────
  {
    id: "09-inline-edit",
    label: "Hover set row shows pencil + edit mode (Bug 4 fix)",
    setup: async (page) => {
      await page.waitForTimeout(800);
      // Log first
      await openModal(page);
      const input = page.locator("input[placeholder*='Search']").first();
      if (await input.isVisible()) {
        await input.fill("push up");
        await page.waitForTimeout(1200);
        const result = page.locator("[role='option'], [data-slot='command-item']").first();
        if (await result.isVisible()) {
          await result.click();
          await page.waitForTimeout(400);
          const logBtn = page.locator("button", { hasText: "Log Exercise" }).last();
          if (await logBtn.isVisible()) {
            await logBtn.click();
            await page.waitForTimeout(1500);
          }
        }
      }
      // Now hover the set row to reveal pencil icon then click it
      const setRow = page.locator("text=Set 1").first();
      if (await setRow.isVisible()) {
        await setRow.hover();
        await page.waitForTimeout(400);
        // Click the pencil/edit button
        const pencilBtn = page.locator("button[aria-label='Edit set']").first();
        if (await pencilBtn.isVisible()) {
          await pencilBtn.click();
          await page.waitForTimeout(300);
        }
      }
    },
  },

  // ── 10: Session summary — coloured bars (Bug 6 fix) ──────────────────────
  {
    id: "10-session-summary-bars",
    label: "Session Summary breakdown bars are coloured (Bug 6 fix)",
    setup: async (page) => {
      await page.waitForTimeout(800);
      // Log push up (strength = blue bar) and running (cardio = red bar)
      for (const exercise of ["push up", "running"]) {
        await openModal(page);
        const input = page.locator("input[placeholder*='Search']").first();
        if (await input.isVisible()) {
          await input.fill(exercise);
          await page.waitForTimeout(1200);
          const result = page.locator("[role='option'], [data-slot='command-item']").first();
          if (await result.isVisible()) {
            await result.click();
            await page.waitForTimeout(400);
            if (exercise === "running") {
              const dur = page.locator("input[type='number']").last();
              if (await dur.isVisible()) await dur.fill("10");
            }
            const logBtn = page.locator("button", { hasText: "Log Exercise" }).last();
            if (await logBtn.isVisible()) {
              await logBtn.click();
              await page.waitForTimeout(1500);
            }
          }
        }
      }
      // Scroll to session summary on desktop (right column)
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
    },
  },
];

async function captureStates() {
  console.log(`\nCapturing workout interactive states...`);
  console.log(`Output: ${OUT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const allShots = [];

  for (const vp of VIEWPORTS) {
    console.log(`[${vp.id}]`);
    const vpDir = path.join(OUT_DIR, vp.id);
    fs.mkdirSync(vpDir, { recursive: true });

    for (const state of STATES) {
      const ctx = await browser.newContext({
        viewport: { width: vp.w, height: vp.h },
        deviceScaleFactor: vp.dpr,
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
      });
      const page = await ctx.newPage();
      // Disable animations for reliable screenshots
      await page.addStyleTag({
        content: "*, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }",
      });
      await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 20000 });

      try {
        await state.setup(page);
        const shotPath = path.join(vpDir, `${state.id}.png`);
        await page.screenshot({ path: shotPath, fullPage: false, animations: "disabled" });
        allShots.push({ viewportId: vp.id, stateId: state.id, label: state.label, path: shotPath });
        console.log(`  ✓ ${state.id}`);
      } catch (e) {
        console.log(`  ✗ ${state.id}: ${e.message.split("\n")[0]}`);
      }
      await ctx.close();
    }
  }

  await browser.close();
  return allShots;
}

async function evaluateWithClaude(shots) {
  let Anthropic;
  try { Anthropic = require("../../frontend/node_modules/@anthropic-ai/sdk").default; }
  catch { Anthropic = require("@anthropic-ai/sdk").default; }

  if (!apiKey) { console.error("ANTHROPIC_API_KEY not set"); return; }
  const baseUrl = process.env.ANTHROPIC_BASE_URL;
  const client = new Anthropic({ apiKey, ...(baseUrl ? { baseURL: baseUrl } : {}) });
  const model = "claude-sonnet-4-6";

  console.log(`\nEvaluating ${shots.length} screenshots with Claude...\n`);

  const byViewport = {};
  for (const s of shots) {
    if (!byViewport[s.viewportId]) byViewport[s.viewportId] = [];
    byViewport[s.viewportId].push(s);
  }

  const results = {};
  for (const [vpId, vpShots] of Object.entries(byViewport)) {
    console.log(`Evaluating [${vpId}]...`);
    const content = [];

    for (const shot of vpShots) {
      content.push({ type: "text", text: `\n--- STATE: ${shot.stateId} — ${shot.label} ---` });
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: fs.readFileSync(shot.path).toString("base64"),
        },
      });
    }

    content.push({
      type: "text",
      text: `
You are evaluating the Workout page of FitCoach AI — a dark fitness tracking app.
Design: #0A0A0A background, green #22c55e brand, warm-neutral dark palette.

The app recently fixed 6 bugs. For each state, verify specifically:

BUG FIXES TO VALIDATE:
- Bug 1: Modal should be CLOSED in state 06 (after clicking Log Exercise)
- Bug 2: Sets=3 and Reps=10 should be PRE-FILLED (not empty/placeholder) in state 03
- Bug 3: Calorie preview label says "Estimated burn" with "sets × reps" explanation
- Bug 4: Hover state 09 shows pencil/edit icon + inline edit inputs (reps, weight fields)
- Bug 5: Volume stat shows "sets × reps × kg" subtitle text
- Bug 6: Breakdown bars in state 10 are COLOURED (blue for Strength, red for Cardio) — NOT grey

GENERAL ASSESSMENT:
1. Is the page visually correct with clean dark theme?
2. Are modals/drawers fully visible without overflow?
3. Does the workout log card render correctly?
4. Is the Session Summary widget visible on desktop?
5. Any layout issues on mobile (375-390px) vs desktop (1280px)?

Score each state 1-10 (10 = perfect). For bug-fix states, deduct 3 points if the fix is NOT visible.

Return ONLY JSON:
[{"state_id":"01-empty-state","score":8.5,"bug_fix_validated":null,"issues":["specific issue"],"good":["what looks correct"]}]

For bug-fix states, set bug_fix_validated to true/false/null (null if not applicable).
`.trim(),
    });

    const resp = await client.messages.create({
      model,
      max_tokens: 3000,
      messages: [{ role: "user", content }],
    });

    let raw = resp.content[0].text.trim();
    // Strip code fences if present
    if (raw.includes("```")) {
      raw = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);
    try {
      results[vpId] = JSON.parse(raw);
    } catch {
      results[vpId] = [{ error: "parse failed", raw: raw.slice(0, 200) }];
    }
  }

  // ── Print report ─────────────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════");
  console.log("  WORKOUT PAGE — INTERACTIVE STATE REPORT");
  console.log("════════════════════════════════════════════\n");

  let totalScore = 0, totalCount = 0;
  const bugFixes = {};

  for (const [vpId, stateResults] of Object.entries(results)) {
    if (stateResults[0]?.error) { console.log(`[${vpId}] Parse error: ${stateResults[0].raw}`); continue; }
    console.log(`[${vpId}]`);
    for (const r of stateResults) {
      const bar = "█".repeat(Math.round(r.score ?? 0)) + "░".repeat(10 - Math.round(r.score ?? 0));
      const bugTag = r.bug_fix_validated === true ? " ✅BUG-FIXED" : r.bug_fix_validated === false ? " ❌BUG-NOT-FIXED" : "";
      console.log(`  ${r.state_id}  ${bar}  ${(r.score ?? 0).toFixed(1)}/10${bugTag}`);
      if (r.issues?.length) r.issues.slice(0, 2).forEach((i) => console.log(`    ✗ ${i}`));
      if (r.good?.length) r.good.slice(0, 1).forEach((g) => console.log(`    ✓ ${g}`));
      if (r.bug_fix_validated !== null && r.bug_fix_validated !== undefined) {
        bugFixes[r.state_id] = r.bug_fix_validated;
      }
      if (r.score) { totalScore += r.score; totalCount++; }
    }
    console.log();
  }

  const avg = totalCount > 0 ? (totalScore / totalCount).toFixed(2) : "N/A";
  const fixedCount = Object.values(bugFixes).filter(Boolean).length;
  const totalFixes = Object.keys(bugFixes).length;

  console.log(`────────────────────────────────────────────`);
  console.log(`  Average score:   ${avg}/10`);
  console.log(`  Bug fixes valid: ${fixedCount}/${totalFixes}`);
  console.log(`────────────────────────────────────────────\n`);

  const reportPath = path.join(OUT_DIR, "evaluation.json");
  fs.writeFileSync(reportPath, JSON.stringify({
    shots: shots.length,
    averageScore: avg,
    bugFixValidation: bugFixes,
    results,
  }, null, 2));
  console.log(`Report saved: ${reportPath}`);
}

(async () => {
  const http = require("http");
  await new Promise((resolve, reject) => {
    http.get("http://localhost:3001", resolve).on("error", () =>
      reject(new Error("App not running at http://localhost:3001 — run ./dev.sh start"))
    );
  }).catch((e) => { console.error(e.message); process.exit(1); });

  const shots = await captureStates();
  if (shots.length === 0) { console.error("No screenshots captured"); process.exit(1); }

  const args = process.argv.slice(2);
  if (!args.includes("--capture-only")) {
    await evaluateWithClaude(shots);
  } else {
    console.log(`\nScreenshots saved (${shots.length} total).`);
  }
})();
