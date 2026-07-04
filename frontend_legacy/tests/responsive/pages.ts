// frontend/tests/responsive/pages.ts
// Defines every page + interaction state to capture during responsive testing.
// The `setup` function runs AFTER page navigation to put the page in a specific state.

import type { Page } from "@playwright/test";

export interface PageState {
  id: string;
  name: string;
  fullPage?: boolean;
  setup?: (page: Page) => Promise<void>;
}

export interface PageDef {
  id: string;
  name: string;
  url: string;
  states: PageState[];
}

/** Runs the state setup function and waits for animations to settle. */
export async function setupPageState(
  page: Page,
  fn: (page: Page) => Promise<void>
): Promise<void> {
  await fn(page);
  // Let CSS transitions and SWR data fetches settle
  await page.waitForTimeout(500);
}

export const PAGES: PageDef[] = [
  // ── Dashboard ─────────────────────────────────────────────────────────────
  {
    id: "dashboard",
    name: "Dashboard",
    url: "/dashboard",
    states: [
      {
        id: "default",
        name: "Default — empty state",
        fullPage: true,
      },
    ],
  },

  // ── Food Tracker ──────────────────────────────────────────────────────────
  {
    id: "tracker",
    name: "Food Tracker",
    url: "/tracker",
    states: [
      {
        id: "empty",
        name: "Empty food log",
        fullPage: true,
      },
      {
        id: "search-typing",
        name: "Food search — typing query",
        fullPage: false,
        setup: async (page) => {
          const input = page.locator('input[placeholder*="Search food"]').first();
          await input.click();
          await input.fill("paneer");
          await page.waitForTimeout(700); // debounce + API call
        },
      },
      {
        id: "date-nav-open",
        name: "Calendar date picker open",
        fullPage: false,
        setup: async (page) => {
          // Click the date display button in DateNavigator
          const dateBtn = page.locator('[data-testid="date-display"]').first();
          if (await dateBtn.isVisible()) {
            await dateBtn.click();
          } else {
            // Fallback: click the calendar icon
            const calBtn = page.getByRole("button", { name: /calendar/i }).first();
            if (await calBtn.isVisible()) await calBtn.click();
          }
        },
      },
    ],
  },

  // ── Workout ───────────────────────────────────────────────────────────────
  {
    id: "workout",
    name: "Workout",
    url: "/workout",
    states: [
      {
        id: "empty",
        name: "Empty workout log",
        fullPage: true,
      },
      {
        id: "search-typing",
        name: "Exercise search — typing query",
        fullPage: false,
        setup: async (page) => {
          const input = page.locator('input[placeholder*="Search exercises"]').first();
          await input.click();
          await input.fill("push up");
          await page.waitForTimeout(700);
        },
      },
    ],
  },

  // ── Custom Dishes ─────────────────────────────────────────────────────────
  {
    id: "dishes",
    name: "My Dishes",
    url: "/dishes",
    states: [
      {
        id: "empty-list",
        name: "Empty dishes list",
        fullPage: true,
      },
      {
        id: "create-form-open",
        name: "Create dish form",
        fullPage: true,
        setup: async (page) => {
          const btn = page.locator('button:has-text("New Dish")').first();
          if (await btn.isVisible()) await btn.click();
        },
      },
    ],
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  {
    id: "profile",
    name: "Profile",
    url: "/profile",
    states: [
      {
        id: "default",
        name: "Default profile view",
        fullPage: true,
      },
    ],
  },

  // ── Onboarding ────────────────────────────────────────────────────────────
  {
    id: "onboarding",
    name: "Onboarding",
    url: "/onboarding",
    states: [
      {
        id: "step-1",
        name: "Step 1 — Personal details",
        fullPage: false,
      },
    ],
  },
];
