/**
 * qa/playwright/workout-edit-sync.js
 *
 * Validates:
 *  1. Editing a set's reps/weight updates volume + calories in the card immediately
 *  2. Intensity picker is gone from the modal
 *  3. Calorie preview still works (driven by reps + weight, not intensity)
 */
const { chromium } = require("../../frontend/node_modules/playwright");
const path = require("path");
const fs = require("fs");
try { require("../../frontend/node_modules/dotenv").config({ path: path.join(__dirname, "../../.env") }); } catch {}

const apiKey = process.env.ANTHROPIC_API_KEY;
const BASE_URL = "http://localhost:3001/workout";
const OUT_DIR = path.join(__dirname, "../screenshots",
  `workout-edit-sync-${new Date().toISOString().slice(0,16).replace(/[T:]/g,"-")}`);

const VIEWPORTS = [
  { id: "iphone-14",  w: 390,  h: 844,  dpr: 3, mobile: true  },
  { id: "macbook-13", w: 1280, h: 800,  dpr: 2, mobile: false },
];

async function openModal(page) {
  const btn = page.locator("button", { hasText: "Log Exercise" }).first();
  if (await btn.isVisible()) { await btn.click(); await page.waitForTimeout(700); return true; }
  return false;
}
async function selectExercise(page, q) {
  const input = page.locator("input[placeholder*='Search']").first();
  if (!await input.isVisible()) return false;
  await input.fill(q);
  await page.waitForTimeout(1400);
  const r = page.locator("[role='option'], [data-slot='command-item']").first();
  if (await r.isVisible()) { await r.click(); await page.waitForTimeout(500); return true; }
  return false;
}

const STATES = [
  // ── 01: No intensity picker in the modal ────────────────────────────────
  {
    id: "01-no-intensity-picker",
    label: "Modal has NO intensity/Light/Moderate/Vigorous segmented control",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      await selectExercise(page, "push up");
    },
  },

  // ── 02: Calorie preview driven by weight ────────────────────────────────
  {
    id: "02-preview-driven-by-weight",
    label: "Calorie preview changes when weight changes (no intensity needed)",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      await selectExercise(page, "push up");
      const weightInput = page.locator("input[placeholder='body']").first();
      if (await weightInput.isVisible()) {
        await weightInput.fill("40");
        await page.waitForTimeout(400);
      }
    },
  },

  // ── 03: Log 3 sets, screenshot before editing ────────────────────────────
  {
    id: "03-before-edit",
    label: "Card after logging 3 sets × 8 reps @ 20 kg (baseline state)",
    setup: async (page) => {
      await page.waitForTimeout(800);
      await openModal(page);
      await selectExercise(page, "single arm row");
      // 3 sets, 8 reps, 20 kg
      const repsInput = page.locator("input[placeholder='10']").first();
      if (await repsInput.isVisible()) await repsInput.fill("8");
      const weightInput = page.locator("input[placeholder='body']").first();
      if (await weightInput.isVisible()) await weightInput.fill("20");
      await page.waitForTimeout(300);
      const logBtn = page.locator("button").filter({ hasText: /Log \d+ Sets?/ }).first();
      if (await logBtn.isVisible()) { await logBtn.click(); await page.waitForTimeout(2500); }
    },
  },

  // ── 04: Edit Set 1 weight from 20 → 8 kg, check metrics update ──────────
  {
    id: "04-after-edit-set1",
    label: "After editing Set 1 weight to 8 kg — volume + calories must update",
    setup: async (page) => {
      await page.waitForTimeout(800);
      // Log baseline
      await openModal(page);
      await selectExercise(page, "single arm row");
      const repsInput = page.locator("input[placeholder='10']").first();
      if (await repsInput.isVisible()) await repsInput.fill("8");
      const weightInput = page.locator("input[placeholder='body']").first();
      if (await weightInput.isVisible()) await weightInput.fill("20");
      await page.waitForTimeout(300);
      const logBtn = page.locator("button").filter({ hasText: /Log \d+ Sets?/ }).first();
      if (await logBtn.isVisible()) { await logBtn.click(); await page.waitForTimeout(2500); }

      // Now edit Set 1 — hover → pencil → click → change weight to 8 → save
      const set1 = page.locator("text=Set 1").first();
      if (await set1.isVisible()) {
        await set1.hover();
        await page.waitForTimeout(400);
        const pencil = page.locator("button[aria-label='Edit set']").first();
        if (await pencil.isVisible()) {
          await pencil.click();
          await page.waitForTimeout(300);
          // Change weight to 8 kg
          const weightField = page.locator("input[placeholder='kg']").first();
          if (await weightField.isVisible()) {
            await weightField.triple_click?.() || await weightField.click({ clickCount: 3 });
            await weightField.fill("8");
          }
          const saveBtn = page.locator("button[aria-label='Save']").first();
          if (await saveBtn.isVisible()) {
            await saveBtn.click();
            await page.waitForTimeout(1500); // wait for PATCH + SWR revalidation
          }
        }
      }
    },
  },

  // ── 05: Edit all 3 sets to different weights, check final state ──────────
  {
    id: "05-mixed-weights",
    label: "After editing all 3 sets to 8/12/15 kg — volume reflects sum not average",
    setup: async (page) => {
      await page.waitForTimeout(800);
      // Log 3 sets
      await openModal(page);
      await selectExercise(page, "single arm row");
      const repsInput = page.locator("input[placeholder='10']").first();
      if (await repsInput.isVisible()) await repsInput.fill("8");
      const weightInput = page.locator("input[placeholder='body']").first();
      if (await weightInput.isVisible()) await weightInput.fill("20");
      await page.waitForTimeout(300);
      const logBtn = page.locator("button").filter({ hasText: /Log \d+ Sets?/ }).first();
      if (await logBtn.isVisible()) { await logBtn.click(); await page.waitForTimeout(2500); }

      // Edit each set to a different weight
      const targetWeights = ["8", "12", "15"];
      for (let i = 0; i < targetWeights.length; i++) {
        const setLabel = page.locator(`text=Set ${i + 1}`).first();
        if (await setLabel.isVisible()) {
          await setLabel.hover();
          await page.waitForTimeout(300);
          const pencils = page.locator("button[aria-label='Edit set']");
          const pencil = pencils.nth(i);
          if (await pencil.isVisible()) {
            await pencil.click();
            await page.waitForTimeout(300);
            const weightFields = page.locator("input[placeholder='kg']");
            const wf = weightFields.first();
            if (await wf.isVisible()) {
              await wf.click({ clickCount: 3 });
              await wf.fill(targetWeights[i]);
            }
            const saveBtn = page.locator("button[aria-label='Save']").first();
            if (await saveBtn.isVisible()) {
              await saveBtn.click();
              await page.waitForTimeout(1200);
            }
          }
        }
      }
    },
  },
];

async function captureStates() {
  console.log(`\nCapturing edit-sync validation states...`);
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
        isMobile: vp.mobile, hasTouch: vp.mobile,
      });
      const page = await ctx.newPage();
      await page.addStyleTag({ content: "*,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important}" });
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

async function evaluateWithPython(shots) {
  // Write shots manifest for Python evaluator
  const manifest = path.join(OUT_DIR, "manifest.json");
  fs.writeFileSync(manifest, JSON.stringify(shots, null, 2));
  console.log(`\nScreenshots saved (${shots.length} total). Manifest: ${manifest}`);
  console.log(`Run: python3 qa/evaluate_workout_states.py ${OUT_DIR}`);
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
  await evaluateWithPython(shots);
})();
