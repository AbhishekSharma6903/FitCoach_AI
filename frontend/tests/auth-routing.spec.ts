/**
 * Auth & routing tests
 *
 * Cases covered:
 *  1. Unauthenticated user → redirected to /sign-in
 *  2. Admin user (profile exists) → / redirects to /admin
 *  3. Admin user → /dashboard loads without redirecting
 *  4. New user (no profile) → lands on /onboarding, then /dashboard after submit
 */
import { test, expect, Page } from "@playwright/test";
import { signInAs } from "./helpers/auth";
import { execSync } from "child_process";

const RETURNING_USER_ID = "user_3CwmhuNCIh6XqiEnSsjAC8lUmTf";

function psql(sql: string) {
  return execSync(
    `docker exec fitcoach_postgres psql -U fitcoach -d fitcoach -c "${sql}"`,
    { encoding: "utf8" }
  );
}

function restoreProfile() {
  psql(`
    INSERT INTO user_profiles (
      user_id, name, age, gender, height_cm, current_weight_kg,
      goal_weight_kg, time_to_reach_goal_weeks, experience_level,
      activity_level, diet_type, wants_workout_split, wants_diet_plan,
      bmr_kcal, tdee_kcal, target_calories_kcal, bmi, protein_g, carbs_g, fat_g,
      created_at, updated_at
    ) VALUES (
      '${RETURNING_USER_ID}', 'Arjun', 22, 'male', 175, 76, 84, 24,
      'beginner', 'moderate', 'egg', false, false,
      1800, 2790, 2990, 24.8, 224, 299, 99,
      NOW(), NOW()
    ) ON CONFLICT (user_id) DO NOTHING;
  `);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. UNAUTHENTICATED USER
// ─────────────────────────────────────────────────────────────────────────────
test("unauthenticated: / redirects to /sign-in", async ({ page }) => {
  await page.goto("http://localhost:3000/", { waitUntil: "commit" });
  await page.waitForURL("**/sign-in**", { timeout: 15000 });
  expect(page.url()).toContain("/sign-in");
  await expect(page.locator("text=Sign in to Fitness_App")).toBeVisible({ timeout: 10000 });
});

test("unauthenticated: /dashboard redirects to /sign-in", async ({ page }) => {
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "commit" });
  await page.waitForURL("**/sign-in**", { timeout: 15000 });
  expect(page.url()).toContain("/sign-in");
});

test("unauthenticated: /admin redirects to /sign-in", async ({ page }) => {
  await page.goto("http://localhost:3000/admin", { waitUntil: "commit" });
  await page.waitForURL("**/sign-in**", { timeout: 15000 });
  expect(page.url()).toContain("/sign-in");
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. ADMIN USER (RETURNING_USER_ID is the configured admin)
// ─────────────────────────────────────────────────────────────────────────────
test("admin user: / redirects to /admin", async ({ page }) => {
  restoreProfile();
  await signInAs(page, RETURNING_USER_ID);

  await page.goto("http://localhost:3000/", { waitUntil: "commit" });
  await page.waitForURL("**/admin**", { timeout: 15000 });

  await page.waitForTimeout(2000);
  expect(page.url()).toContain("/admin");
  expect(page.url()).not.toContain("/dashboard");
});

test("admin user: /dashboard loads without redirecting to /onboarding", async ({ page }) => {
  restoreProfile();
  await signInAs(page, RETURNING_USER_ID);

  await page.goto("http://localhost:3000/dashboard", { waitUntil: "commit" });
  await page.waitForTimeout(3000);

  expect(page.url()).not.toContain("/onboarding");
  expect(page.url()).not.toContain("/sign-in");

  const body = await page.locator("body").innerText();
  expect(body).not.toContain("Sign in to Fitness_App");
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. NEW USER (no profile)
// ─────────────────────────────────────────────────────────────────────────────
test("new user: /dashboard redirects to /onboarding when no profile", async ({ page }) => {
  psql(`DELETE FROM user_profiles WHERE user_id = '${RETURNING_USER_ID}';`);

  try {
    await signInAs(page, RETURNING_USER_ID);
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "commit" });

    // Dashboard detects no profile → redirects to /onboarding
    await page.waitForURL("**/onboarding**", { timeout: 15000 });
    expect(page.url()).toContain("/onboarding");

    // Onboarding page should render the wizard
    await expect(page.locator("input").first()).toBeVisible({ timeout: 10000 });
  } finally {
    restoreProfile();
  }
});

test("new user: completing onboarding wizard lands on /dashboard", async ({ page }) => {
  psql(`DELETE FROM user_profiles WHERE user_id = '${RETURNING_USER_ID}';`);

  try {
    await signInAs(page, RETURNING_USER_ID);
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "commit" });
    await page.waitForURL("**/onboarding**", { timeout: 15000 });

    await fillOnboardingWizard(page);

    await page.waitForURL("**/dashboard**", { timeout: 20000 });
    expect(page.url()).toContain("/dashboard");
  } finally {
    // Profile was created by the wizard — ensure it exists for other tests
    restoreProfile();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding wizard automation
// ─────────────────────────────────────────────────────────────────────────────
async function fillOnboardingWizard(page: Page) {
  // Step 1 — Personal info
  await page.waitForSelector('input[placeholder*="Arjun"]', { timeout: 10000 });
  await page.locator('input[placeholder*="Arjun"]').fill("Arjun");
  await page.locator('input[placeholder*="28"]').fill("22");
  await page.locator('input[placeholder*="175"]').fill("175");
  // Select Male gender radio/button
  await page.locator('text=Male').first().click({ force: true });
  await clickNext(page);

  // Step 2 — Weight
  await page.waitForSelector('input[placeholder*="82"]', { timeout: 10000 });
  await page.locator('input[placeholder*="82"]').fill("76");
  await page.locator('input[placeholder*="72"]').fill("84");
  await page.locator('input[placeholder*="20"]').fill("24");
  await clickNext(page);

  // Step 3 — Fitness: click Beginner button, then select Moderate from dropdown
  await page.waitForSelector('text=Beginner', { timeout: 10000 });
  await page.locator('text=Beginner').first().click({ force: true });
  await page.locator('select').selectOption('moderate');
  await clickNext(page);

  // Step 4 — Diet: click Eggetarian, leave checkboxes as default
  await page.waitForSelector('text=Eggetarian', { timeout: 10000 });
  await page.locator('text=Eggetarian').first().click({ force: true });
  // Submit
  await page.locator('button:has-text("Start my journey")').click({ force: true });
}

async function clickNext(page: Page) {
  await page.waitForTimeout(300);
  const btn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
  await btn.waitFor({ state: "visible", timeout: 5000 });
  await btn.click({ force: true });
  await page.waitForTimeout(300);
}
