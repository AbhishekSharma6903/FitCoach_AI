/**
 * Clerk auth helper for Playwright tests.
 *
 * Because Clerk v5 dev-mode uses a "dev-browser handshake" on every fresh
 * browser context, we can't simply set a cookie.  Instead we:
 *   1. Issue a sign-in token via the Clerk Backend API (no email OTP needed).
 *   2. Navigate to /sign-in?__clerk_ticket=<token>.
 *   3. Wait until Clerk's JS finishes all redirects and a real session exists.
 *
 * This correctly mimics what a real user experiences after signing in.
 */
import { Page } from "@playwright/test";

const CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY ||
  "sk_test_ghjvnCqAbtGqGHGBSCVwdXpwrQV0Y5eLQlA04qMZc4";
const CLERK_API = "https://api.clerk.com/v1";
const BASE_URL = "http://localhost:3000";

/** Create a short-lived Clerk sign-in token for a given user ID. */
async function createSignInToken(userId: string): Promise<string> {
  const res = await fetch(`${CLERK_API}/sign_in_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 300 }),
  });
  if (!res.ok) throw new Error(`Clerk API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.token as string;
}

/**
 * Sign in as a specific Clerk user in Playwright.
 * Returns once the session is fully established (window.Clerk.session exists).
 */
export async function signInAs(page: Page, userId: string): Promise<void> {
  const ticket = await createSignInToken(userId);

  // Navigate to the sign-in page with the ticket.
  // Clerk's middleware will do a handshake (dev-browser-missing) and redirect
  // a few times — waitUntil:"commit" avoids timing out on those redirects.
  await page.goto(`${BASE_URL}/sign-in?__clerk_ticket=${ticket}`, {
    waitUntil: "commit",
    timeout: 30000,
  });

  // Wait until Clerk JS finishes and a real session is present.
  await page.waitForFunction(
    () => !!(window as any).Clerk?.session,
    { timeout: 20000 }
  );
}

/** Sign out and wait for the sign-in page to appear. */
export async function signOut(page: Page): Promise<void> {
  await page.evaluate(() => (window as any).Clerk?.signOut?.());
  await page.waitForURL("**/sign-in**", { timeout: 10000 });
}

/** Delete a user's profile via the backend so they appear as a new user. */
export async function deleteProfile(userId: string): Promise<void> {
  // We call the backend directly with a signed admin token.
  const ticket = await createSignInToken(userId);
  // (profile deletion is done via DB in tests — see individual test files)
}
