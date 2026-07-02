import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS_DIR = path.join(__dirname, "screenshots");

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
});

async function shot(page: import("@playwright/test").Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${name}.png`),
    fullPage: true,
  });
}

// In DEV_MODE the app skips Clerk — all routes are accessible directly
test("dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  await shot(page, "01-dashboard");
});

test("tracker — today", async ({ page }) => {
  await page.goto("/tracker");
  await page.waitForLoadState("networkidle");
  await shot(page, "02-tracker-today");
});

test("tracker — date navigation", async ({ page }) => {
  await page.goto("/tracker");
  await page.waitForLoadState("networkidle");
  // Click previous day arrow
  await page.click('[aria-label="Previous day"]');
  await page.waitForTimeout(400);
  await shot(page, "03-tracker-yesterday");
  // Click back to today — forward arrow
  await page.click('[aria-label="Next day"]');
  await page.waitForTimeout(400);
  await shot(page, "04-tracker-back-today");
});

test("profile edit page", async ({ page }) => {
  await page.goto("/profile");
  await page.waitForLoadState("networkidle");
  await shot(page, "05-profile");
});

test("settings page", async ({ page }) => {
  await page.goto("/settings");
  await page.waitForLoadState("networkidle");
  await shot(page, "06-settings");
});

test("food search — type query", async ({ page }) => {
  await page.goto("/tracker");
  await page.waitForLoadState("networkidle");
  await page.fill('input[placeholder*="Search food"]', "paneer");
  await page.waitForTimeout(500);
  await shot(page, "07-food-search-paneer");
});

test("workout page", async ({ page }) => {
  await page.goto("/workout");
  await page.waitForLoadState("networkidle");
  await shot(page, "11-workout");
});

test("dishes — create form with ingredients", async ({ page }) => {
  await page.goto("/dishes");
  await page.waitForLoadState("networkidle");
  await page.click('button:has-text("New Dish")');
  await page.waitForTimeout(300);
  // Type dish name
  await page.fill('input[placeholder*="My Poha"]', "Egg & Milk Breakfast");
  // Search for egg
  await page.fill('input[placeholder*="Search food"]', "egg whole");
  await page.waitForTimeout(600);
  await shot(page, "10-dishes-with-search");
});
