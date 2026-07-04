// frontend/tests/responsive/viewports.ts
// Device viewport matrix for responsive testing.
// P0 = must score >=8/10 before any phase is complete.
// P1 = tracked but not blocking. P2 = informational.

export interface Viewport {
  id: string;
  label: string;
  width: number;
  height: number;
  dpr: number;
  type: "mobile" | "tablet" | "desktop";
  priority: "p0" | "p1" | "p2";
  isMobile: boolean;
  hasTouch: boolean;
}

export const VIEWPORTS: Viewport[] = [
  // ── P0 — Must pass (blocking) ─────────────────────────────────────────────
  {
    id: "iphone-se",
    label: "iPhone SE — 375px (smallest common iPhone)",
    width: 375, height: 667, dpr: 2,
    type: "mobile", priority: "p0", isMobile: true, hasTouch: true,
  },
  {
    id: "iphone-14",
    label: "iPhone 14 — 390px",
    width: 390, height: 844, dpr: 3,
    type: "mobile", priority: "p0", isMobile: true, hasTouch: true,
  },
  {
    id: "macbook-13",
    label: "MacBook 13\" — 1280px",
    width: 1280, height: 800, dpr: 2,
    type: "desktop", priority: "p0", isMobile: false, hasTouch: false,
  },
  // ── P1 — Tracked ──────────────────────────────────────────────────────────
  {
    id: "iphone-14-pro-max",
    label: "iPhone 14 Pro Max — 430px",
    width: 430, height: 932, dpr: 3,
    type: "mobile", priority: "p1", isMobile: true, hasTouch: true,
  },
  {
    id: "pixel-7",
    label: "Google Pixel 7 — 412px (Android)",
    width: 412, height: 915, dpr: 2,
    type: "mobile", priority: "p1", isMobile: true, hasTouch: true,
  },
  {
    id: "ipad-mini",
    label: "iPad Mini — 768px",
    width: 768, height: 1024, dpr: 2,
    type: "tablet", priority: "p1", isMobile: false, hasTouch: true,
  },
  {
    id: "macbook-16",
    label: "MacBook 16\" — 1440px",
    width: 1440, height: 900, dpr: 2,
    type: "desktop", priority: "p1", isMobile: false, hasTouch: false,
  },
  // ── P2 — Informational only ───────────────────────────────────────────────
  {
    id: "ipad-pro",
    label: "iPad Pro 12.9\" — 1024px",
    width: 1024, height: 1366, dpr: 2,
    type: "tablet", priority: "p2", isMobile: false, hasTouch: true,
  },
  {
    id: "4k",
    label: "4K display — 2560px",
    width: 2560, height: 1440, dpr: 1,
    type: "desktop", priority: "p2", isMobile: false, hasTouch: false,
  },
];

export const P0_VIEWPORTS = VIEWPORTS.filter(v => v.priority === "p0");
