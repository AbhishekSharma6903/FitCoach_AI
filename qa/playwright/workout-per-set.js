/**
 * qa/playwright/workout-per-set.js
 *
 * Validates the per-set model and related fixes:
 *   - sets=3 creates 3 separate rows
 *   - calorie preview changes when weight is entered
 *   - volume label reads "N sets × reps @ W kg"
 *   - session summary shows sets/reps, not tonnage
 *   - each set row is individually editable
 *
 * Usage (from project root):
 *   node qa/playwright/workout-per-set.js
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
  `workout-per-set-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-")}`,
);

const VIEWPORTS = [
  { id: "iphone-14",  w: 390,  h: 844,  dpr: 3, mobile: true  },
  { id: "macbook-13", w: 1280, h: 800,  dpr: 2, mobile: false },
];

async function openModal(page) {
  const btn = page.locator("button", { hasText: "Log Exercise" }).first();
  if (await btn.isVisible()) { await btn.click(); await page.waitForTimeout(700); return true; }
  return false;
}

async function selectExercise(page, query) {
  const input = page.locator("input[placeholder*='Search']").first();
  if (!await input.isVisible()) return false;
  await input.fill(query);
  await page.waitForTimeout(1400);
  const result = page.locator("[role='option'], [data-slot='command-item']").first();
  if (await result.isVisible()) { await result.click(); await page.waitForTimeout(500); return true; }
  return false;
}

const STATES = [
  // ── 01: Modal shows "Will log N sets" hint ───────────────────────────────
  {
    id: "01-modal-set-hint",
    label: "Modal shows set count hint (Will log 3 sets of 10 reps bodyweight)",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      await selectExercise(page, "push up");
    },
  },

  // ── 02: Calorie preview changes when weight added ────────────────────────
  {
    id: "02-calorie-with-weight",
    label: "Calorie preview increases when barbell weight is entered",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      await selectExercise(page, "push up");
      // Enter weight — calorie should go up vs bodyweight
      const weightInput = page.locator("input[placeholder='body']").first();
      if (await weightInput.isVisible()) {
        await weightInput.fill("60");
        await page.waitForTimeout(400);
      }
    },
  },

  // ── 03: Button reads "Log 3 Sets" ───────────────────────────────────────
  {
    id: "03-log-button-label",
    label: "Log button says 'Log 3 Sets' (not generic 'Log Exercise')",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      await selectExercise(page, "squat");
    },
  },

  // ── 04: After logging sets=3 → 3 rows in the card ────────────────────────
  {
    id: "04-three-set-rows",
    label: "After logging sets=3 reps=10 → 3 separate set rows appear",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      await selectExercise(page, "push up");
      // sets=3 already default. Add weight.
      const weightInput = page.locator("input[placeholder='body']").first();
      if (await weightInput.isVisible()) await weightInput.fill("20");
      await page.waitForTimeout(300);
      // Click Log button
      const logBtn = page.locator("button").filter({ hasText: /Log \d+ Sets?/ }).first();
      if (await logBtn.isVisible()) {
        await logBtn.click();
        await page.waitForTimeout(2000); // 3 API calls in sequence
      }
    },
  },

  // ── 05: Volume label format ──────────────────────────────────────────────
  {
    id: "05-volume-label-format",
    label: "Volume shows '3 sets × 10 reps @ 20 kg' (not raw numbers)",
    setup: async (page) => {
      await page.waitForTimeout(800);
      // Log first if no entries
      await openModal(page);
      await selectExercise(page, "push up");
      const weightInput = page.locator("input[placeholder='body']").first();
      if (await weightInput.isVisible()) await weightInput.fill("20");
      await page.waitForTimeout(300);
      const logBtn = page.locator("button").filter({ hasText: /Log \d+ Sets?/ }).first();
      if (await logBtn.isVisible()) { await logBtn.click(); await page.waitForTimeout(2000); }
    },
  },

  // ── 06: Session summary shows sets count, not tonnage ────────────────────
  {
    id: "06-session-summary-sets",
    label: "Session Summary shows 'N sets · M reps' (not '558 kg lifted')",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      await selectExercise(page, "push up");
      const weightInput = page.locator("input[placeholder='body']").first();
      if (await weightInput.isVisible()) await weightInput.fill("20");
      await page.waitForTimeout(300);
      const logBtn = page.locator("button").filter({ hasText: /Log \d+ Sets?/ }).first();
      if (await logBtn.isVisible()) { await logBtn.click(); await page.waitForTimeout(2000); }
      // Scroll to top to see summary on macbook
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
    },
  },

  // ── 07: Each set row individually editable ───────────────────────────────
  {
    id: "07-individual-set-edit",
    label: "Each set row has its own edit button (set 2 can differ from set 1)",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      await selectExercise(page, "push up");
      const weightInput = page.locator("input[placeholder='body']").first();
      if (await weightInput.isVisible()) await weightInput.fill("20");
      await page.waitForTimeout(300);
      const logBtn = page.locator("button").filter({ hasText: /Log \d+ Sets?/ }).first();
      if (await logBtn.isVisible()) { await logBtn.click(); await page.waitForTimeout(2000); }
      // Hover the second set row to reveal edit button
      const setRows = page.locator("text=Set 2");
      if (await setRows.first().isVisible()) {
        await setRows.first().hover();
        await page.waitForTimeout(400);
      }
    },
  },

  // ── 08: Calorie preview bodyweight vs loaded comparison ──────────────────
  {
    id: "08-bodyweight-vs-loaded-preview",
    label: "Preview shows higher calories at 60kg weight than bodyweight (same sets/reps)",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      await selectExercise(page, "squat");
      // Start with bodyweight — take screenshot showing base
      // Then enter weight to show increase
      const weightInput = page.locator("input[placeholder='body']").first();
      if (await weightInput.isVisible()) {
        await weightInput.fill("80");
        await page.waitForTimeout(400);
      }
    },
  },
];

async function captureStates() {
  console.log(`\nCapturing workout per-set validation states...`);
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
      content.push({ type: "text", text: `\n--- ${shot.stateId}: ${shot.label} ---` });
      content.push({
        type: "image",
        source: { type: "base64", media_type: "image/png",
          data: fs.readFileSync(shot.path).toString("base64") },
      });
    }
    content.push({ type: "text", text: `
You are evaluating specific fixes to a workout logging app. Each state tests one behaviour.
Dark fitness app, #0A0A0A bg, green #22c55e brand.

CHECK EACH STATE SPECIFICALLY:

01 (Modal hint): Confirm a line below the Sets/Reps/Weight fields that reads something like
   "Will log 3 separate sets of 10 reps (bodyweight)" — this explains what will happen.
   PASS if that hint text is visible. FAIL if missing.

02 (Calorie with weight): The calorie preview should be HIGHER than the bodyweight estimate.
   Bodyweight estimate for 3×10 push-ups is roughly 4-8 kcal.
   With 60 kg barbell the estimate should be noticeably higher (15+ kcal).
   PASS if the estimate shown is > 10 kcal. FAIL if it's in the 4-8 range (unchanged).

03 (Button label): The Log button must say "Log 3 Sets" (or "Log 1 Set" etc.), NOT "Log Exercise".
   PASS if button text shows a number. FAIL if it still says "Log Exercise".

04 (Three rows): After logging with sets=3, the exercise card must show 3 separate rows:
   "Set 1", "Set 2", "Set 3". PASS if 3 rows visible. FAIL if only 1 row.

05 (Volume format): The Volume stat on the card must read like "3 sets × 10 reps @ 20 kg"
   NOT like "1 sets · 10 reps · 200 kg" or raw numbers.
   PASS if the × and @ symbols appear in the format. FAIL if it's the old format.

06 (Session summary): The Session Summary sidebar (desktop) or stats area must show
   "N sets · M reps" as a secondary stat, NOT "558 kg lifted (sets×reps×kg)".
   PASS if sets/reps count visible without tonnage label. FAIL if tonnage shown.

07 (Edit per set): After hovering Set 2, a small pencil icon must be visible.
   PASS if pencil icon or edit affordance visible. FAIL if only delete shown.

08 (Load factor): The calorie estimate with 80 kg must be significantly higher than bodyweight.
   80 kg barbell on a 70 kg person = ~34% higher. If base is 6 kcal, loaded should be ~8+.
   PASS if estimate > 8 kcal. FAIL if stuck at ~4-6 kcal.

Score each state 1-10. Return ONLY JSON (no markdown):
[{"state_id":"01-modal-set-hint","score":9,"pass":true,"issues":["..."],"evidence":"what you actually see"}]
`.trim() });

    const resp = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content }],
    });
    let raw = resp.content[0].text.trim();
    if (raw.includes("```")) raw = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const s = raw.indexOf("["), e = raw.lastIndexOf("]");
    try { results[vpId] = JSON.parse(s !== -1 ? raw.slice(s, e + 1) : raw); }
    catch { results[vpId] = [{ error: "parse failed", raw: raw.slice(0, 300) }]; }
  }

  // Report
  console.log("\n════════════════════════════════════════════════");
  console.log("  WORKOUT PER-SET MODEL — VALIDATION REPORT");
  console.log("════════════════════════════════════════════════\n");

  let total = 0, count = 0, passed = 0, failed = 0;
  for (const [vpId, stateResults] of Object.entries(results)) {
    if (stateResults[0]?.error) { console.log(`[${vpId}] ERROR`); continue; }
    console.log(`[${vpId}]`);
    for (const r of stateResults) {
      const score = r.score ?? 0;
      const bar = "█".repeat(Math.round(score)) + "░".repeat(10 - Math.round(score));
      const passStr = r.pass === true ? "  ✅ PASS" : r.pass === false ? "  ❌ FAIL" : "";
      console.log(`  ${r.state_id}  ${bar}  ${score.toFixed(1)}/10${passStr}`);
      if (r.evidence) console.log(`    → ${r.evidence}`);
      if (r.issues?.length) r.issues.slice(0, 1).forEach(i => console.log(`    ✗ ${i}`));
      if (r.pass === true) passed++; else if (r.pass === false) failed++;
      total += score; count++;
    }
    console.log();
  }

  const avg = count ? (total / count).toFixed(2) : "N/A";
  const G = "\033[92m", Y = "\033[93m", R = "\033[91m", X = "\033[0m";
  const col = parseFloat(avg) >= 8 ? G : parseFloat(avg) >= 7 ? Y : R;
  console.log(`────────────────────────────────────────────────`);
  console.log(`  ${col}Average: ${avg}/10${X}   Passed: ${passed}   Failed: ${failed}`);
  console.log(`────────────────────────────────────────────────\n`);

  const reportPath = path.join(OUT_DIR, "evaluation.json");
  fs.writeFileSync(reportPath, JSON.stringify({ avg, passed, failed, results }, null, 2));
  console.log(`Report: ${reportPath}`);
}

(async () => {
  const http = require("http");
  await new Promise((resolve, reject) => {
    http.get("http://localhost:3001", resolve).on("error", () =>
      reject(new Error("App not running at http://localhost:3001"))
    );
  }).catch(e => { console.error(e.message); process.exit(1); });

  const shots = await captureStates();
  if (!shots.length) { console.error("No screenshots captured"); process.exit(1); }
  await evaluateWithClaude(shots);
})();
