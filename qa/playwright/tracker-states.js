/**
 * qa/playwright/tracker-states.js
 *
 * Captures screenshots of interactive states on the Tracker page that
 * the static QA audit cannot reach (modals open, date navigation, quick add).
 *
 * Usage (from project root):
 *   node qa/playwright/tracker-states.js
 *
 * Output: qa/screenshots/tracker-interactive-{ts}/{viewport}/{state}.png
 * Evaluation: reads all images with Claude Vision and scores them.
 */

const { chromium } = require("../../frontend/node_modules/playwright");
const path = require("path");
const fs = require("fs");
try { require("../../frontend/node_modules/dotenv").config({ path: path.join(__dirname, "../../.env") }); } catch {}


const BASE_URL = "http://localhost:3001/tracker";
const OUT_DIR = path.join(
  __dirname,
  "../screenshots",
  `tracker-interactive-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-")}`,
);

const VIEWPORTS = [
  { id: "iphone-14", w: 390,  h: 844,  dpr: 3, mobile: true  },
  { id: "macbook-13",w: 1280, h: 800,  dpr: 2, mobile: false },
];

const STATES = [
  {
    id: "01-default",
    label: "Default page load",
    setup: async (page) => {
      await page.waitForTimeout(800);
    },
  },
  {
    id: "02-modal-open",
    label: "Add food modal open",
    setup: async (page) => {
      await page.waitForTimeout(800);
      // Try "Add food" (empty state) first, then "Add more" (entries exist)
      let addBtn = page.locator("button", { hasText: "Add food" }).first();
      if (!await addBtn.isVisible()) {
        addBtn = page.locator("button", { hasText: "Add more" }).first();
      }
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(1000); // drawer animation = 200ms + buffer
      }
    },
  },
  {
    id: "03-modal-search",
    label: "Add food modal with search text typed",
    setup: async (page) => {
      await page.waitForTimeout(800);
      let addBtn = page.locator("button", { hasText: "Add food" }).first();
      if (!await addBtn.isVisible()) {
        addBtn = page.locator("button", { hasText: "Add more" }).first();
      }
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.waitForTimeout(700);
        const input = page.locator("input[placeholder*='Search']").first();
        if (await input.isVisible()) {
          await input.fill("paneer");
          await page.waitForTimeout(1000);
        }
      }
    },
  },
  {
    id: "04-quick-add-modal",
    label: "Quick Add tile clicked (Dal Tadka) — modal pre-filled",
    setup: async (page) => {
      await page.waitForTimeout(800);
      const tile = page.locator("button", { hasText: "Dal Tadka" }).first();
      if (await tile.isVisible()) {
        await tile.click();
        await page.waitForTimeout(800); // wait for drawer + search debounce
      }
    },
  },
  {
    id: "05-date-prev",
    label: "Navigated to yesterday",
    setup: async (page) => {
      await page.waitForTimeout(600);
      const prevBtn = page.locator("button[aria-label='Previous day']").first();
      if (await prevBtn.isVisible()) {
        await prevBtn.click();
        await page.waitForTimeout(400);
      }
    },
  },
  {
    id: "06-date-back-to-today",
    label: "Back to today via Today badge",
    setup: async (page) => {
      await page.waitForTimeout(600);
      // Go to yesterday first
      const prevBtn = page.locator("button[aria-label='Previous day']").first();
      if (await prevBtn.isVisible()) await prevBtn.click();
      await page.waitForTimeout(300);
      // Then click Today badge
      const todayBadge = page.locator("text=Today").first();
      if (await todayBadge.isVisible()) {
        await todayBadge.click();
        await page.waitForTimeout(400);
      }
    },
  },
  {
    id: "07-next-from-past",
    label: "Forward navigation from yesterday",
    setup: async (page) => {
      await page.waitForTimeout(600);
      const prevBtn = page.locator("button[aria-label='Previous day']").first();
      if (await prevBtn.isVisible()) await prevBtn.click();
      await page.waitForTimeout(300);
      const nextBtn = page.locator("button[aria-label='Next day']").first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(400);
      }
    },
  },
];

async function captureStates() {
  console.log(`\nCapturing tracker interactive states...`);
  console.log(`Output: ${OUT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const allShots = []; // { viewportId, state, path, label }

  for (const vp of VIEWPORTS) {
    console.log(`[${vp.id}]`);
    const vpDir = path.join(OUT_DIR, vp.id);
    fs.mkdirSync(vpDir, { recursive: true });

    for (const state of STATES) {
      // Fresh page per state to avoid side effects
      const ctx = await browser.newContext({
        viewport: { width: vp.w, height: vp.h },
        deviceScaleFactor: vp.dpr,
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
      });
      const page = await ctx.newPage();
      await page.addStyleTag({
        content: "*, *::before, *::after { animation-duration: 0.01ms !important; }",
      });
      await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15000 });

      try {
        await state.setup(page);
        const shotPath = path.join(vpDir, `${state.id}.png`);
        await page.screenshot({ path: shotPath, fullPage: false, animations: "disabled" });
        allShots.push({ viewportId: vp.id, stateId: state.id, label: state.label, path: shotPath });
        console.log(`  ✓ ${state.id}`);
      } catch (e) {
        console.log(`  ✗ ${state.id}: ${e.message}`);
      }
      await ctx.close();
    }
  }

  await browser.close();
  return allShots;
}

async function evaluateWithClaude(shots) {
  // Lazy-load SDK — only needed when not using --capture-only
  let Anthropic;
  try { Anthropic = require("../../frontend/node_modules/@anthropic-ai/sdk").default; }
  catch { Anthropic = require("@anthropic-ai/sdk").default; }

  if (!apiKey) { console.error("ANTHROPIC_API_KEY not set"); return; }
  const baseUrl = process.env.ANTHROPIC_BASE_URL;
  const client = new Anthropic({ apiKey, ...(baseUrl ? { baseURL: baseUrl } : {}) });
  const model = "claude-sonnet-4-6";

  console.log(`\nEvaluating ${shots.length} screenshots with Claude...\n`);

  // Group by viewport
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
You are evaluating the Tracker page of FitCoach AI — a dark fitness app (#0A0A0A bg, green #22c55e brand).

Above are ${vpShots.length} screenshots of different interactive states on ${vpId}.

For EACH state, assess:
1. Is the modal/drawer rendered correctly and fully visible?
2. Is the search input visible and functional-looking?
3. Does the date navigation work as expected?
4. Is the Quick Add modal pre-filled with the food name?
5. Any visual bugs (overflow, clipping, wrong sizing)?

Score each state 1-10. Return ONLY JSON:
[{"state_id":"01-default","score":8.5,"issues":["specific issue"],"good":["what works"]}]
`.trim(),
    });

    const resp = await client.messages.create({
      model,
      max_tokens: 2000,
      messages: [{ role: "user", content }],
    });

    let raw = resp.content[0].text.trim();
    if (raw.startsWith("```")) raw = raw.split("\n", 2)[1];
    raw = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
    try {
      results[vpId] = JSON.parse(raw);
    } catch {
      results[vpId] = [{ error: "parse failed", raw }];
    }
  }

  // Print summary
  console.log("\n========================================");
  console.log("TRACKER INTERACTIVE STATE EVALUATION");
  console.log("========================================\n");
  for (const [vpId, stateResults] of Object.entries(results)) {
    console.log(`[${vpId}]`);
    for (const r of stateResults) {
      const bar = "█".repeat(Math.round(r.score)) + "░".repeat(10 - Math.round(r.score));
      console.log(`  ${r.state_id}  ${bar}  ${r.score}/10`);
      if (r.issues?.length) r.issues.forEach((i) => console.log(`    ✗ ${i}`));
      if (r.good?.length) r.good.slice(0,1).forEach((g) => console.log(`    ✓ ${g}`));
    }
    console.log();
  }

  // Save JSON report
  const reportPath = path.join(OUT_DIR, "evaluation.json");
  fs.writeFileSync(reportPath, JSON.stringify({ shots: shots.length, results }, null, 2));
  console.log(`Report: ${reportPath}`);
}

(async () => {
  // Check app is running
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
    console.log(`\nScreenshots saved (${shots.length} total). Skip evaluation with --capture-only.`);
  }
})();
