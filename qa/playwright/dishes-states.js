/**
 * qa/playwright/dishes-states.js
 *
 * Validates all Dishes page interactive states across mobile + desktop:
 *   - List view: empty state, with dishes, search filtering
 *   - Builder: empty form, ingredient search, multi-ingredient with different units
 *   - Nutrition preview updating live
 *   - Edit pre-filled
 *   - Delete dialog
 */

const { chromium } = require("../../frontend/node_modules/playwright");
const path = require("path");
const fs   = require("fs");
try { require("../../frontend/node_modules/dotenv").config({ path: path.join(__dirname, "../../.env") }); } catch {}

const apiKey  = process.env.ANTHROPIC_API_KEY;
const BASE    = "http://localhost:3001/dishes";
const OUT_DIR = path.join(__dirname, "../screenshots",
  `dishes-interactive-${new Date().toISOString().slice(0,16).replace(/[T:]/g,"-")}`);

const VIEWPORTS = [
  { id: "iphone-14",  w: 390,  h: 844,  dpr: 3, mobile: true  },
  { id: "ipad",       w: 768,  h: 1024, dpr: 2, mobile: false },
  { id: "macbook-13", w: 1280, h: 800,  dpr: 2, mobile: false },
];

const STATES = [
  {
    id: "01-list-with-dishes",
    label: "List view with multiple dishes",
    setup: async (page) => {
      await page.waitForTimeout(1500); // wait for SWR fetch
    },
  },
  {
    id: "02-list-search",
    label: "Search filtering dishes",
    setup: async (page) => {
      await page.waitForTimeout(1200);
      const search = page.locator("input[placeholder*='Search']").first();
      if (await search.isVisible()) {
        await search.fill("dal");
        await page.waitForTimeout(400);
      }
    },
  },
  {
    id: "03-list-search-no-results",
    label: "Search with no results",
    setup: async (page) => {
      await page.waitForTimeout(1200);
      const search = page.locator("input[placeholder*='Search']").first();
      if (await search.isVisible()) {
        await search.fill("xyznotexist");
        await page.waitForTimeout(400);
      }
    },
  },
  {
    id: "04-builder-empty",
    label: "Builder opened — empty form",
    setup: async (page) => {
      await page.waitForTimeout(1200);
      const newBtn = page.locator("button", { hasText: /New Dish|New/ }).first();
      if (await newBtn.isVisible()) {
        await newBtn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: "05-builder-name-typed",
    label: "Builder with dish name filled",
    setup: async (page) => {
      await page.waitForTimeout(1200);
      const newBtn = page.locator("button", { hasText: /New Dish|New/ }).first();
      if (await newBtn.isVisible()) {
        await newBtn.click();
        await page.waitForTimeout(400);
        const nameInput = page.locator("input[placeholder*='dal']").first();
        if (await nameInput.isVisible()) {
          await nameInput.fill("My Dal Tadka");
          await page.waitForTimeout(300);
        }
      }
    },
  },
  {
    id: "06-builder-ingredient-search",
    label: "Builder — ingredient search dropdown open",
    setup: async (page) => {
      await page.waitForTimeout(1200);
      const newBtn = page.locator("button", { hasText: /New Dish|New/ }).first();
      if (await newBtn.isVisible()) {
        await newBtn.click();
        await page.waitForTimeout(400);
        const nameInput = page.locator("input[placeholder*='dal']").first();
        if (await nameInput.isVisible()) await nameInput.fill("My Dal");
        // Open ingredient search
        const ingSearch = page.locator("input[placeholder*='rice'], input[placeholder*='Search'], input[placeholder*='paneer']").nth(1);
        if (await ingSearch.isVisible()) {
          await ingSearch.fill("toor dal");
          await page.waitForTimeout(1400);
        }
      }
    },
  },
  {
    id: "07-builder-with-ingredients",
    label: "Builder — 3 ingredients added with live nutrition preview",
    setup: async (page) => {
      await page.waitForTimeout(1200);
      const newBtn = page.locator("button", { hasText: /New Dish|New/ }).first();
      if (await newBtn.isVisible()) {
        await newBtn.click();
        await page.waitForTimeout(400);
        // Fill dish name
        const nameInput = page.locator("input[placeholder*='dal']").first();
        if (await nameInput.isVisible()) await nameInput.fill("My Dal Tadka");
        // Add ingredient 1: toor dal
        const ingSearch = page.locator("input[placeholder*='rice'], input[placeholder*='paneer'], input[placeholder*='Search']").nth(1);
        if (await ingSearch.isVisible()) {
          await ingSearch.fill("toor dal");
          await page.waitForTimeout(1400);
          const result = page.locator("[role='option'], [data-slot='command-item']").first();
          if (await result.isVisible()) { await result.click(); await page.waitForTimeout(300); }
          // Add ingredient 2
          await ingSearch.fill("onion");
          await page.waitForTimeout(1400);
          const r2 = page.locator("[role='option'], [data-slot='command-item']").first();
          if (await r2.isVisible()) { await r2.click(); await page.waitForTimeout(300); }
          // Add ingredient 3
          await ingSearch.fill("mustard oil");
          await page.waitForTimeout(1400);
          const r3 = page.locator("[role='option'], [data-slot='command-item']").first();
          if (await r3.isVisible()) { await r3.click(); await page.waitForTimeout(300); }
        }
      }
    },
  },
  {
    id: "08-builder-validation-error",
    label: "Builder — validation error on save without name",
    setup: async (page) => {
      await page.waitForTimeout(1200);
      const newBtn = page.locator("button", { hasText: /New Dish|New/ }).first();
      if (await newBtn.isVisible()) {
        await newBtn.click();
        await page.waitForTimeout(400);
        // Click Save without filling name
        const saveBtn = page.locator("button", { hasText: "Save Dish" }).first();
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await page.waitForTimeout(400);
        }
      }
    },
  },
  {
    id: "09-delete-dialog",
    label: "Delete confirmation dialog open",
    setup: async (page) => {
      await page.waitForTimeout(1500);
      // Click delete on first dish
      const deleteBtn = page.locator("button[aria-label*='Delete']").first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await page.waitForTimeout(500);
      }
    },
  },
  {
    id: "10-back-to-list",
    label: "Back to list after navigating to builder",
    setup: async (page) => {
      await page.waitForTimeout(1200);
      const newBtn = page.locator("button", { hasText: /New Dish|New/ }).first();
      if (await newBtn.isVisible()) {
        await newBtn.click();
        await page.waitForTimeout(400);
        // Click back button
        const backBtn = page.locator("button[aria-label='Back to dishes']").first();
        if (await backBtn.isVisible()) {
          await backBtn.click();
          await page.waitForTimeout(600);
        }
      }
    },
  },
];

async function captureStates() {
  console.log(`\nCapturing dishes interactive states...`);
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
      await page.goto(BASE, { waitUntil: "networkidle", timeout: 20000 });
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

(async () => {
  const http = require("http");
  await new Promise((resolve, reject) => {
    http.get("http://localhost:3001", resolve).on("error", () =>
      reject(new Error("App not running at http://localhost:3001"))
    );
  }).catch(e => { console.error(e.message); process.exit(1); });

  const shots = await captureStates();
  console.log(`\nTotal screenshots: ${shots.length}`);
  console.log(`Run evaluator: /Users/i750332/.langflow/.langflow-venv/bin/python3 qa/evaluate_dishes.py ${OUT_DIR}`);
})();
