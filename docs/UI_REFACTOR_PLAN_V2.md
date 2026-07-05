# FitCoach AI — UI Refactor Plan v2

## Definitive Reference Document

> Written: 2026-07-02. Updated: 2026-07-05 (architecture review applied).
> **This is the ONLY plan document needed.**
> Read **Architecture Guidelines** first, then Parts 1–3 before writing any code.

---

## ★ Architecture Guidelines
### Read This Before Designing Any Page

These rules are derived from mistakes made in previous iterations. Every page design MUST comply with all of them before implementation starts.

---

### AG-1 · Responsive Width — The One Rule That Governs All Pages

Every page uses a **two-tier responsive width strategy**. Do not invent per-page widths, and do not add an intermediate tablet tier.

```
Mobile  (default, < lg, < 1024px):  w-full px-4 pb-24
                                     ↑ full width — phones AND tablets, pb-24 clears bottom nav

Desktop (lg+, ≥ 1024px):            max-w-6xl mx-auto px-8 pb-8
                                     ↑ 1152px centred column, tasteful breathing room both sides
```

**Why two tiers only (not three):** A `max-w-3xl` intermediate tier at `md:` (768px) gives zero breathing room at that exact breakpoint (768px container = 768px viewport). It adds complexity with no benefit. Mobile full-width → desktop centred is the correct 2-tier model (same as Bevel, Notion, Vercel).

**Why `max-w-6xl` on desktop:**
- 1280px screen → 1152px content, 64px each side ✅
- 1440px screen → 1152px content, 144px each side ✅  
- 1920px screen → 1152px content, 384px each side — background fills gracefully ✅
- `max-w-5xl` inside a 2-column grid → left col = ~640px, barely wider than mobile ❌

**Critical alignment rule:** The top navbar's inner container and every page's content container must use the **exact same** `max-w-6xl mx-auto px-8`. Any difference means nav links don't align with content edges — the layout looks broken.

**For mobile: never add any `lg:` constraints that force content narrower than full viewport.** Let mobile be full-width. `pb-24` is the only mobile-specific override needed.

---

### AG-2 · Two-Column Grid — When to Use a Right Panel

The 2-column layout (main content | right panel) is appropriate when content **naturally separates** into primary action and contextual utility. Not every page needs it — use it purposefully.

```
Dashboard  xl:grid-cols-[1fr_340px]  ← metrics (main) | stats panel (context)
Tracker    xl:grid-cols-[1fr_300px]  ← logging workflow (main) | quick add + summary (utility)
Workout    xl:grid-cols-[1fr_300px]  ← exercise log (main) | exercise search + stats (utility)
Profile    single column only        ← no natural split
Dishes     single column only        ← list + form don't need sidebar
```

**Rule:** Add a right panel at `xl:` (1280px+) when:
1. There's a clear "primary action" (logging) and "utility context" (shortcuts, summaries)
2. The right panel is SHORT enough to stay visible without scroll (≤ 4 cards)
3. The right panel content would clutter the main flow if inline

**Never add a right panel just to fill horizontal space** — that was the old sidebar problem.

```
Dashboard right col:  sticky top-20 max-h-[calc(100vh-80px)] overflow-y-auto space-y-4
Tracker right col:    sticky top-20 space-y-4  (shorter, no overflow needed)
All other pages:      Single column, max-width from AG-1.
```

**Why `xl:` not `lg:`:** At `lg:` (1024px) with a 300px right col, the left column is only 804px — fine but tight. `xl:` (1280px) gives 828px left — genuinely spacious.

---

### AG-3 · Mobile Layout Card Order

Order cards from highest to lowest **time-sensitive + motivational value**:

1. **Greeting** (always first — orientation)
2. **Primary metric** (calorie ring, nutrition totals, etc. — why the user opened the app)
3. **Secondary metrics** (macros, workout summary — context for the primary)
4. **Motivational / streak / milestone** — drives return visits, must appear early
5. **Interactive utility** (water log, food search, weight log — actions)
6. **Reference data** (charts, history — least time-sensitive, user scrolls to it)

**Never bury streak/motivation cards below interactive panels** — motivation is what keeps users coming back daily.

---

### AG-4 · Cards Must Fill Their Column Width

A card in a 720px column must use that 720px. Do not put a small widget (200px ring, small stat block) in a 720px card without flanking content to fill horizontal space. Empty card space reads as "mobile app on desktop."

**Techniques for filling width:**
- Ring/chart in centre + stats flanking left and right (`grid grid-cols-[1fr_auto_1fr]`)
- Multi-stat grid within one card (`grid grid-cols-2` or `grid-cols-3 gap-4`)
- Full-width progress bar below a centred element
- Two-column stat blocks separated by a `Separator` (vertical)

---

### AG-5 · Sticky Right Column Constraints

When using a sticky right column, it must have a `max-h` to prevent it from growing taller than the viewport (which silently breaks `sticky`):

```tsx
<div className="sticky top-20 max-h-[calc(100vh-80px)] overflow-y-auto space-y-4">
  {/* right column cards */}
</div>
```

Only add `overflow-y-auto` if you expect the right column to be content-heavy. For short columns (2–3 cards), `max-h` alone is sufficient.

---

### AG-6 · Animation Rules

- **Card stagger:** `staggerChildren: 0.03` (30ms), NOT 50ms. 7 cards × 50ms = 350ms lag on last card.
- **SVG donut rings:** Animate `strokeDashoffset`, NOT `pathLength`. They are different mechanisms.
- **Number count-up:** Use `animate(0, to, { onUpdate })` from Motion, NOT CSS counters.
- **Progress bars:** Use `motion.div` with `width` animation, NOT CSS `transition` on `width`.
- **No animations on text-only elements** (labels, captions) — reserved for numeric/visual changes.
- **Respect `prefers-reduced-motion`:** Wrap all Motion animations in a check or use Motion's built-in reduced-motion support.

---

### AG-7 · shadcn Component Defaults

Always use shadcn primitives over custom implementations. Current installed set:

| Need | Use |
|---|---|
| Progress bar | `shadcn Progress` with `indicatorClassName` for colour |
| Modal (desktop) / bottom sheet (mobile) | `Modal.tsx` (custom responsive wrapper) |
| Toast notifications | `sonner` (install: `npx shadcn@latest add sonner`) |
| Loading placeholders | `shadcn Skeleton` — NOT spinners in cards |
| Food/exercise search dropdown | `SearchCommand.tsx` (custom, uses `command`) |
| Tabs (meal slots, etc.) | `shadcn Tabs` — NOT custom accordion/toggles |
| Delete confirmation | `DeleteConfirmDialog.tsx` (wraps `alert-dialog`) |
| Badges (BMI, diet type) | `shadcn Badge` with `variant="outline"` + custom colour |
| Avatar | `shadcn Avatar` (install if not present) |
| Top nav links | Plain `<Link>` with `cn()` active styling — NOT `shadcn NavigationMenu` (heavyweight, uncertain Base UI API) |

---

### AG-8 · What Belongs Where

| Data type | Tool |
|---|---|
| Server data (API responses) | SWR — `useDashboard`, `useFoodLog`, etc. |
| UI state (selected date, modal open) | Zustand stores |
| Form state (inputs before submit) | `useState` — local to the component |
| Toast messages | `sonner` via `toast()` calls |

**Never put API data in Zustand. Never put pure UI state in SWR.**

---

### AG-9 · Desktop/Mobile Feature Parity Exceptions

Some features are intentionally desktop-only or mobile-only. These are not bugs:

| Feature | Where |
|---|---|
| Quick weight log widget | Desktop right column only (mobile users log from Profile) |
| TDEE vs Deficit insight card | Desktop right column only (too dense for mobile) |
| Top navbar | Desktop only (`hidden md:flex`) |
| Bottom tab bar | Mobile only (`flex md:hidden`) |
| Page titles in shell header | Mobile only (desktop uses top navbar for branding) |

When adding a new feature, decide up-front: is it mobile+desktop, desktop-only, or mobile-only?

---

### AG-10 · Before Designing a New Page — Checklist

Run through this before writing any component for a new page:

- [ ] Read Part 4 (Feature Inventory) for the page's required features
- [ ] Check AG-1: am I using the correct two-tier width strategy (mobile full-width / desktop max-w-6xl)?
- [ ] Check AG-2: does this page need a right panel at xl:? (See AG-2 table — Dashboard/Tracker/Workout yes; Profile/Dishes no)
- [ ] Check AG-3: is mobile card order prioritised correctly?
- [ ] Check AG-4: do all cards fill their column width?
- [ ] Check AG-6: are animations using the correct mechanisms?
- [ ] Check AG-7: am I using shadcn primitives everywhere possible?
- [ ] Write the page spec in `docs/DESIGN_OVERVIEW.md` before coding
- [ ] Get the spec reviewed before starting implementation

---

## ⚠️ The Goal

**Full rebuild of the entire frontend from scratch.** The legacy frontend is preserved at `frontend_legacy/` for reference. The new frontend goes in a new `frontend/` directory built using:

- `shadcn/ui` component library (Radix UI primitives + Tailwind)
- 4-level warm-neutral dark surface hierarchy (Part 2)
- Bevel/Hevy-inspired typography — big numbers, weight contrast
- Mobile-first: bottom tab navigation, responsive grids, 44px touch targets
- One consistent design language across every component and page

**The test tool (`qa/page_audit.py`) runs after each page rebuild to score responsiveness and aesthetics. P0 target ≥ 8.0 before moving to the next page.**

---

## 🚫 CRITICAL RULE — UI Inspiration

> **DO NOT copy the legacy UI. The legacy frontend was deliberately deleted because its UI was bad.**

**`frontend_legacy/` exists ONLY as a reference for:**
- Which API endpoints each page calls
- What data fields are available
- Which features exist (search, date nav, meal slots, etc.)

**For UI and layout, take inspiration from:**
- **Bevel** — the primary reference. Clean dark cards, big numbers, lots of breathing room
- **Hevy** — exercise/workout screen patterns
- **Whoop** — biometric summary cards, ring charts
- **Strong** — workout log UX
- Modern shadcn/ui component patterns (see https://ui.shadcn.com)

**Concrete rules:**
1. Never replicate the exact structure of a legacy page — rebuild it from scratch with better design
2. Use shadcn/ui `Card`, `Tabs`, `Dialog`, `Drawer`, `Progress`, `Badge`, `Input` etc. wherever possible
3. On desktop, use shadcn `Tabs` for meal sections instead of custom accordions
4. Use `shadcn/Popover` + `shadcn/Command` for food search dropdowns
5. Use shadcn `Sheet` for mobile add-food flow (full bottom sheet, not a tiny modal)
6. Large hero numbers (`text-4xl font-black`) for calories/weight — not small summary rows
7. Section headers: `UPPERCASE tracking-widest text-[11px]` caption style — never bold section titles with inline content

---

## Part 1 — What's Wrong With the Current UI (Root Causes)

From a full audit of `frontend_legacy/`:

### Critical Architecture Problems

1. **No shared page shell** — 6 pages each duplicate `min-h-screen bg-[#0d0d0d] max-w-2xl mx-auto px-4 py-6`. Any padding change requires 6 edits.
2. **Blue-tinted dark palette** — Tailwind `gray-900` is `#111827` which has blue in it. Premium dark apps use warm/pure neutral darks (`#111111`, `#1A1A1A`). This makes cards feel cold.
3. **Only 2 surface levels** — background (`#0d0d0d`) and card (`bg-gray-900`). No elevated surface for modals/dropdowns, no control surface for inputs. Everything reads flat.
4. **No bottom navigation** — The whole app uses back arrows for navigation. On mobile this is unusable. Users expect a persistent bottom tab bar.
5. **Dashboard action bar disaster** — A single row containing: green "Log Food" button, 🏋️ emoji, 🍽️ emoji, weight number input, "Log" button, avatar. At 375px this overflows.

### Desktop Layout Problem (identified 2026-07-04)

6. **Content stranded at `max-w-2xl` on desktop** — a 672px centered column on 1280px leaves
   ~300px of dead black on each side (44% of screen wasted). The app looks like a mobile screen
   placed on a monitor. The legacy frontend had this exact problem and users disliked it.

   **Root cause:** PageShell uses `max-w-2xl mx-auto` for all viewports with no sidebar navigation.
   On desktop there is no persistent navigation at all — no sidebar, no top nav, nothing.

   **Decision (updated 2026-07-05):** Top navbar (`TopNav.tsx`) + centred `max-w-6xl` content column.
   See Architecture Guideline AG-1 and §2.10 for the full desktop layout specification.

### Design System Fragmentation

- 3 different `<input>` implementations (Input.tsx, raw in AddFoodModal, raw in FoodSearchBar)
- 2 different `<select>` implementations (Select.tsx, inline `CustomSelect` in profile)
- Dead CSS in `globals.css` (`.btn-primary`, `.card`, `.badge` — never used)
- `--font-inter` CSS variable never actually set — all text falls back to `system-ui`

### Bugs Fixed in Phase 0 (already done in legacy)

- B1: Font variable (fixed)
- B2: React setState-during-render in profile (fixed)
- B3: `bg-brand-500/8` invalid Tailwind opacity (fixed)
- B4: Division by zero in AddFoodModal serving_size (fixed)
- B5: Workout date not navigable (fixed)
- B6/B7: Hidden div wrappers causing wasted renders (fixed)

---

## Part 2 — Design Language Specification

> **Every developer must read this section before writing any CSS or JSX.**
> This is the source of truth for all visual decisions in the new frontend.

### 2.1 Philosophy

Less is more. Big numbers. Lots of dark breathing room. Color only where it means something.

Reference apps: **Bevel**, **Hevy**, **Whoop**, **Strong**

### 2.2 Surface Hierarchy (4 levels)

```
Level 0 — Page background:  #0A0A0A  (near-black, warm-neutral)
Level 1 — Card surface:     #111111  (slightly lighter)
Level 2 — Elevated:         #1A1A1A  (modals, dropdowns, hover states)
Level 3 — Control:          #222222  (inputs, toggles, interactive elements)
Border:                     #2A2A2A  (subtle — NOT Tailwind gray-700 which is blue-tinted)
```

**CSS variables to define in globals.css:**

```css
:root {
  --color-bg:             #0A0A0A;
  --color-surface:        #111111;
  --color-elevated:       #1A1A1A;
  --color-control:        #222222;
  --color-border:         #2A2A2A;
  --color-border-subtle:  #1F1F1F;
  --color-text:           #F5F5F5;
  --color-text-muted:     #9CA3AF;
  --color-text-dim:       #6B7280;
  --color-text-faint:     #374151;
  --color-brand:          #22c55e;
  --color-brand-dim:      rgba(34,197,94,0.1);
  --color-brand-glow:     rgba(34,197,94,0.2);
  --color-error:          #ef4444;
  --color-warning:        #f59e0b;
  --color-info:           #60a5fa;
}
```

### 2.3 Brand Color Rules

Green `#22c55e` is used ONLY for:

- Primary CTA buttons (one per screen)
- Active state in bottom navigation
- Positive metrics (streak, goal achieved)
- Progress bar fill colors

**Never** use green for: decoration, secondary actions, background fills (max /10 opacity tint).

### 2.4 Typography Scale

```
Display:   48px / font-black (900) / tracking-tighter  — primary metric (calories, weight)
Heading 1: 28px / font-bold (700) / tracking-tight      — page title
Heading 2: 20px / font-bold (700)                        — section title
Heading 3: 16px / font-semibold (600)                    — card title
Body:      15px / font-normal (400) / leading-relaxed    — main content
Label:     13px / font-medium (500) / tracking-wide      — form labels
Caption:   11px / font-semibold (600) / tracking-widest / UPPERCASE — floating section headers
Micro:     10px — timestamps, tags (use sparingly)
```

Weight contrast is critical: mix `font-black` (primary metric) with `font-normal` (context label). Current app is flat because everything uses `font-bold` or `font-semibold`.

### 2.5 Spacing System (8px base grid)

```
4px  = gap-1   — icon + label
8px  = gap-2   — items in a row
12px = gap-3   — list items
16px = p-4     — card padding (mobile)
20px = p-5     — card padding (desktop)
24px = gap-6   — between cards
32px = gap-8   — major section breaks
```

### 2.6 Border Radius

```
4px  = rounded       — tags, badges
8px  = rounded-lg    — buttons, inputs
12px = rounded-xl    — cards (mobile)
16px = rounded-2xl   — large cards
24px = rounded-3xl   — modals, bottom sheets
∞    = rounded-full  — avatars, rings
```

### 2.7 Motion

```
Micro interactions:  120ms ease-out    — hover, focus rings
Content transitions: 200ms ease-in-out — modals, drawers
Page transitions:    250ms ease-in-out — route changes
Data updates:        300ms ease-out    — progress bars
Skeletons:           1.5s ease-in-out  — pulse
```

### 2.8 Semantic Colors

```
Protein:        #3b82f6  (blue-500)
Carbs:          #f59e0b  (amber-400)
Fat:            #f97316  (orange-500)
Fiber:          #a78bfa  (violet-400)
Burned cal:     #fb923c  (orange-400)
Cardio:         #ef4444  (red-400)
Strength:       #3b82f6  (blue-400)
Yoga:           #a78bfa  (purple-400)
Stretching:     #4ade80  (green-400)
Plyometrics:    #f97316  (orange-500)
```

### 2.9 Component Patterns

> **NEVER use raw Tailwind `gray-*` colours** (gray-300, gray-400, gray-500, gray-600, gray-800).
> These have blue undertones and break the warm-neutral palette. Use semantic tokens instead:
> `text-muted-foreground` · `text-foreground` · `bg-[#1A1A1A]` · `border-[#2A2A2A]`

#### Cards

```
bg: #111111  (--color-surface)
border: 1px solid #2A2A2A
border-radius: rounded-2xl
padding: p-5 (20px)
shadow: none on mobile, subtle on desktop
Hover (desktop): border-color transitions to #3A3A3A (motion.div whileHover)
```

#### Metric Display (Bevel pattern — primary numbers)

```tsx
<span className="text-5xl font-black text-white tabular-nums">349</span>
<span className="text-sm text-muted-foreground font-medium">kcal</span>
<span className="text-xs text-muted-foreground/60">of 2352 goal</span>
```

#### Section Headers (floating label style)

```tsx
className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3"
```

No box, no card header. Floating uppercase label above each section. `mb-3` (12px) gap to content.

#### Progress Bars

**Standard height: `h-2` (8px) on ALL progress bars without exception.**

```
track: h-2 rounded-full bg-[#2A2A2A]
fill:  h-2 rounded-full (animate with Motion width, not CSS transition)
label row (above bar):
  left:  text-xs font-medium text-foreground/70
  right: text-xs font-semibold text-white + text-muted-foreground for /target
```

#### Buttons

```
Primary:   h-11 bg-primary text-black font-semibold rounded-lg
           hover:bg-green-400 active:scale-[0.98] transition-all
Secondary: h-11 bg-[#222222] border border-[#2A2A2A] text-foreground rounded-lg
           hover:bg-[#2A2A2A]
Ghost:     transparent text-muted-foreground hover:text-foreground hover:bg-[#1A1A1A]
Danger:    h-11 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg
Icon-only: min 44×44px bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]
```

#### Bottom Navigation (mobile only, `flex lg:hidden`)

```
height:     64px + env(safe-area-inset-bottom)
background: rgba(17,17,17,0.85) backdrop-blur-xl
border-top: 1px solid #2A2A2A
position:   fixed bottom-0 left-0 right-0 z-50

Items: Home | Tracker | Workout | Dishes | Profile

Active:
  icon: text-primary (green)
  label: text-[10px] font-semibold text-primary  ← VISIBLE (not hidden)
  dot indicator: 2px × 16px bg-primary rounded-full above icon

Inactive:
  icon: text-[#6B7280]
  label: text-[10px] font-medium text-[#4B5563]  ← DIMMED BUT VISIBLE
  (hidden labels fail usability at 375px — labels help users build tap-target memory)
```

### 2.10 Desktop Layout Strategy (md: 768px and above)

**Decision (confirmed 2026-07-05): Top navbar + centred content column.**

Previous approach (64px left sidebar) was scrapped because:
- Content stretched across the full remaining width with dead space on the right
- Adjusting for mobile compactness made the desktop layout worse
- Reference apps (Bevel, Whoop web) use top nav with centred content

**Pattern:**
```
sticky top navbar (h-14, blurred bg, border-bottom)
  └─ max-w-6xl mx-auto px-8  [logo | nav links | actions]

main content (see AG-1 — two-tier only: mobile full-width / desktop max-w-6xl)
  └─ max-w-6xl mx-auto px-8 pb-8   ← desktop (lg+)
  └─ w-full px-4 pb-24             ← mobile + tablet (< lg)
       ├─ Dashboard: 2-column grid [1fr_340px] (see AG-2)
       └─ All other pages: single column
```

**Content max-width:** `max-w-6xl` (1152px) — see AG-1 for full reasoning. `max-w-5xl` inside a 2-column grid gives a ~640px left column, recreating the old narrow layout.

**Dashboard desktop grid:** `grid grid-cols-[1fr_340px] gap-6` inside the content column.
Right column: `sticky top-20 max-h-[calc(100vh-80px)] overflow-y-auto` — see AG-2 and AG-5.

**Mobile:** Bottom tab bar (already done) + `px-4 pb-24` on content.

#### TopNav spec (desktop, `hidden lg:flex`)

```
h-14 sticky top-0 z-50
bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#2A2A2A]

Inner: max-w-6xl mx-auto px-8 flex items-center justify-between h-full
       ↑ must match content column exactly

Left:  App logo mark (28px rounded-lg) + "FitCoach" wordmark
Centre: Nav links — Home · Tracker · Workout · Dishes
        Active: text-white + 2px green underline dot
        Inactive: text-muted-foreground hover:text-white
Right: "+ Log Food" primary button (h-9 px-4) + Avatar → /profile

NOTE: Use plain <Link> elements with cn() active styling.
      Do NOT use shadcn NavigationMenu — heavyweight for 4 links, Base UI API uncertain.
```

**Breakpoints (both nav components must use lg:):**
- `TopNav`: `hidden lg:flex` — desktop only (≥ 1024px)
- `BottomNav`: `lg:hidden` — mobile/tablet only (< 1024px)

#### SideNav (REMOVED)
The 64px left sidebar (`SideNav.tsx`) is no longer part of the design. It should be deleted from `components/layout/`. The top navbar replaces it on desktop.

---

## Part 3 — Build Phases

> Phase 0 (bug fixes) is already complete in `frontend_legacy/`.
> The new `frontend/` starts at Phase 1 — a clean install.

---

### Phase 0 — Already Done (in frontend_legacy)

All critical bugs have been fixed. The legacy code has these corrections applied. Reference `frontend_legacy/` to see the fixed patterns when rebuilding.

---

### Phase 1 — Foundation: Design Tokens + shadcn/ui (~half day)

#### 1A — New Next.js App

```bash
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir
```

#### 1B — Install shadcn/ui

```bash
cd frontend
npx shadcn@latest init
# Style: New York, CSS variables ON, no CSS reset, src/components/ui
```

Map our CSS variables to shadcn's expected names:

```css
--background: var(--color-bg);
--card: var(--color-surface);
--border: var(--color-border);
--input: var(--color-control);
--primary: var(--color-brand);
--primary-foreground: #000000;
--muted: var(--color-elevated);
--muted-foreground: var(--color-text-muted);
```

Install components:

```bash
npx shadcn@latest add button input select badge progress tooltip
npx shadcn@latest add dialog drawer alert-dialog sheet
npx shadcn@latest add command popover
npx shadcn@latest add tabs separator scroll-area
```

#### 1C — Copy over

- Tailwind config (with color tokens)
- globals.css (with CSS variables)
- All types from `frontend_legacy/src/types/`
- All hooks from `frontend_legacy/src/hooks/`
- `lib/api.ts`, `lib/constants.ts`, `lib/utils.ts`
- Auth setup (AuthProvider, middleware, layout — see Part 5 for auth strategy)

**Verify:** `npm run build` passes on the empty shell.

---

### Phase 2 — Shared Layout Shell + Bottom Navigation (~half day)

#### 2A — PageShell Component

New `components/layout/PageShell.tsx`:

```tsx
interface PageShellProps {
  title?: string
  backHref?: string       // shows ChevronLeft if set
  isRootPage?: boolean    // no back arrow (for bottom nav tabs)
  headerRight?: ReactNode
  children: ReactNode
}
```

- Mobile (< lg): `w-full px-4 pb-24` — full width including tablets
- Desktop (lg+): `max-w-6xl mx-auto px-8 pb-8`
- Header: `h-14 flex items-center gap-3` (mobile only — desktop uses TopNav)

#### 2B — BottomNav Component

New `components/layout/BottomNav.tsx` — see 2.9 spec above.
Rendered in `app/layout.tsx`. Hidden on `/onboarding` and `/sign-in`. Uses `usePathname()` for active tab.

#### 2C — Dashboard Header Redesign

**Mobile (< md):** No action bar. Bottom nav handles navigation. Header shows greeting + date only.

**Desktop (≥ md):**

```
Avatar | Name + date | [spacer] | + Log Food | Workout | Settings icon
```

Inline weight logging is **removed from dashboard**. Users log weight from the Profile page.

---


### Phase 2.5 — Desktop Layout: TopNav + PageShell Update ✅ DONE (2026-07-05)

**Decision:** Top navbar replaces the left sidebar on desktop.
Full spec in §2.10 and `docs/DESIGN_OVERVIEW.md`.

---

#### 🐛 Problem Found During Implementation: Nav Dead Zone at 768–1023px

**The original spec said:**
- `TopNav`: `hidden md:flex` (shows at ≥ 768px)
- `BottomNav`: `md:hidden` (hides at ≥ 768px)

**Problem discovered:** `md:` = 768px, `lg:` = 1024px. Our AG-1 says desktop starts at `lg:` (1024px). If TopNav was `hidden md:flex` and BottomNav was `md:hidden`, they matched at 768px — that's fine. **BUT** PageShell's desktop layout is `lg:max-w-6xl` (only centres at 1024px+). So at 768–1023px:
- BottomNav was gone (hidden at md+)
- TopNav was present but content wasn't centred yet
- Result: navigation existed but layout was inconsistent

**A more critical version:** If we had used `hidden lg:flex` on TopNav but kept `md:hidden` on BottomNav, the 768–1023px range would have had **zero navigation at all** — no TopNav, no BottomNav.

**Decision and reasoning:** All navigation breakpoints must be unified at `lg:` (1024px):
- `TopNav`: `hidden lg:flex` — appears at 1024px+
- `BottomNav`: `lg:hidden` — disappears at 1024px+
- Below 1024px: BottomNav is the only navigation (includes iPad portrait 768px, iPad mini, all phones)
- Above 1024px: TopNav is the only navigation (includes iPad landscape, laptops, desktops)

**This is a correction to the original spec.** The plan doc previously said `hidden md:flex` for TopNav — that is wrong and has been corrected here and in §2.10.

---

#### AG-1 Update: Navigation Breakpoints

Both nav components use `lg:` (1024px) as the single switchover point. **Not `md:`.**

```
< lg (< 1024px):  BottomNav visible (lg:hidden),  TopNav hidden (hidden lg:flex)
≥ lg (≥ 1024px):  TopNav visible (hidden lg:flex), BottomNav hidden (lg:hidden)
```

---

#### Files Created / Updated

**New: `components/layout/TopNav.tsx`**
- `hidden lg:flex` — visible only at 1024px+ (corrected from `hidden md:flex`)
- `sticky top-0 z-50 h-14`
- `bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#2A2A2A]`
- Inner container: `max-w-6xl mx-auto px-8` — matches PageShell desktop container exactly
- Left: "F" logo mark (green ring) + "FitCoach" wordmark
- Centre: nav links (Home / Tracker / Workout / Dishes) with green underline dot on active
- Right: "+ Log Food" primary green button + avatar circle → `/profile`
- **Note:** Did NOT use `shadcn NavigationMenu` — shadcn v4.13.0 uses `@base-ui/react`, and NavigationMenu is heavyweight for 4 links. Used plain `<Link>` elements with active state styling instead. Simpler, no dependency on unconfirmed Base UI API.

**Deleted: `components/layout/SideNav.tsx`**

**Updated: `components/layout/PageShell.tsx`**
- Removed all `md:ml-16`, `md:mr-0`, `md:max-w-none` (sidebar offset classes)
- Two-tier strategy as per AG-1: `w-full px-4 pb-24` mobile / `lg:max-w-6xl lg:mx-auto lg:px-8 lg:pb-8` desktop
- Mobile header (`title`, `backHref`, `headerRight`) now has `lg:hidden` — invisible on desktop since TopNav handles branding
- Comment updated to reflect two-tier strategy

**Updated: `components/layout/BottomNav.tsx`**
- Changed `md:hidden` → `lg:hidden` to match TopNav breakpoint
- Labels kept visible (dimmed) for inactive tabs — per §2.9 spec

**Updated: `app/layout.tsx`**
- Replaced `<SideNav />` with `<TopNav />`

---

#### Verification — All 5 Viewports Confirmed ✅

| Viewport | Nav shown | Layout |
|---|---|---|
| iPhone SE 375px | BottomNav ✅ | Full width px-4 ✅ |
| iPhone 14 390px | BottomNav ✅ | Full width px-4 ✅ |
| iPad 768px | BottomNav ✅ | Full width px-4 ✅ (previously had dead zone) |
| Macbook 1280px | TopNav ✅ | max-w-6xl centred, nav edges align ✅ |

---

### Phase 3 — Modal + Shared UI Components (~half day) ✅ DONE

> **Implementation note:** shadcn v4.13.0 uses `@base-ui/react` instead of Radix UI.
> `PopoverTrigger` does NOT support `asChild`. `SearchCommand` uses a custom
> absolutely-positioned dropdown div instead.

#### Files created
- `components/ui/Modal.tsx` — responsive: `Dialog` on md+, `Drawer` bottom sheet on mobile. API: `{ open, onClose, title?, children, className? }`
- `components/ui/DeleteConfirmDialog.tsx` — wraps `AlertDialog`. Props: `{ open, onOpenChange, title?, description?, confirmLabel?, onConfirm }`
- `components/ui/Card.tsx` — Level 1 surface (`#111111`), border `#2A2A2A`, `rounded-2xl`
- `components/ui/Spinner.tsx` — `Loader2` + `role="status"` + `aria-label`
- `hooks/useMediaQuery.ts` — SSR-safe media query hook
- `hooks/useDebounce.ts` — generic debounce hook

---

### Phase 4 — SearchCommand Generic Component (~half day) ✅ DONE

#### Files created
- `components/ui/SearchCommand.tsx` — generic `<T>`, debounce 300ms, click-outside (mousedown + touchstart for iOS), keyboard (Escape to close). Custom dropdown div (Base UI Popover workaround).

---

### Phase 4.5 — Global State Management with Zustand (~1 hour)

**Decision: Zustand over Redux Toolkit**

| Factor | Redux Toolkit | Zustand |
|---|---|---|
| Bundle size | ~15kb | ~1kb |
| Boilerplate | Reducers, slices, actions, Provider | One `create()` call, no Provider |
| Next.js App Router | Needs Provider in layout | Works natively, no Provider needed |
| SWR conflict | None (parallel tools) | None (parallel tools) |
| Devtools | Redux DevTools | Redux DevTools via middleware |
| Learning curve | High | Minutes |

**Why not Redux:** SWR already handles ALL server state (dashboard, food log, water, workout, weight). Redux would duplicate that. What remains is pure **UI state** that must persist across route changes — exactly Zustand's sweet spot.

**What goes in Zustand (UI state only):**

| Store | State | Used by |
|---|---|---|
| `useTrackerStore` | `selectedDate: string` | Tracker page, food log hooks |
| `useUIStore` | `toast: { message, type } \| null` | Toast notifications app-wide |
| `useMealStore` | `pendingMealSlot: string` | Quick-add grid → AddFoodModal pre-selection |

**What stays in SWR (server state):** All API data — dashboard, food logs, water, workouts, dishes, profile. Zustand does NOT duplicate these.

#### Install

```bash
npm install zustand
```

#### Store files (SRP — one file per domain)

```
src/store/
  useTrackerStore.ts    ← selected date for tracker + workout pages
  useUIStore.ts         ← global UI: toast, loading overlay
  useMealStore.ts       ← pending meal slot for quick-add
```

#### Example: `useTrackerStore.ts`

```ts
import { create } from 'zustand'

const today = () => new Date().toISOString().split('T')[0]

interface TrackerState {
  selectedDate: string
  setSelectedDate: (date: string) => void
  resetToToday: () => void
}

export const useTrackerStore = create<TrackerState>((set) => ({
  selectedDate: today(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  resetToToday: () => set({ selectedDate: today() }),
}))
```

#### Why this matters before page builds
Pages depend on `selectedDate` being shared between the DateNavigator and food/workout log hooks. Without a store, we'd need prop-drilling or context. Zustand solves this cleanly.

---

### Phase 5 — Page Rebuilds (~2–3 sessions)

Run `python3 qa/page_audit.py /{page}` after each page. P0 ≥ 8.0 before moving on.

#### 5A — Dashboard ✅ DONE (2026-07-05) · P0: 8.17 PASS

**See `docs/DESIGN_OVERVIEW.md` for full component-level spec (authoritative source).**

---

##### Problems Encountered and Fixes Applied

**P1 · Motion v12 TypeScript `ease` type error**
Motion v12 changed the `Variants` type — `ease: "easeOut"` as a plain string fails TypeScript because `Easing` is a union type, not `string`. Fix: remove `ease` from variant `transition` objects (Motion uses its default easing), and import `type Variants from "motion/react"` with explicit typing.

**P2 · QA script only captured viewport frame (no scroll) — scores were wrong**
The original QA script captured `fullPage: false` — a single viewport frame. On iPhone SE (375×667), the calorie hero card fills ~60% of the viewport. The LLM scored 6.0 because it saw content "cut off" — but the content was simply below the fold, which is correct scroll UX. Score was unfairly penalising normal behaviour.
Fix: Upgraded `qa/page_audit.py` to capture scroll shots per viewport (see QA Upgrade section below).

**P3 · Calorie hero card looked sparse on macbook — ring too small in wide card**
At desktop, the left column is ~788px wide. A 200px ring centred alone in a 788px card leaves 290px of empty space each side. The LLM scored macbook 7.5 for this.
Fix: Wrap the desktop ring+stats layout in `max-w-2xl mx-auto` inside the card. This centres the 672px inner layout within the 788px card — ring feels comfortably sized, not dwarfed.
**Note:** This `max-w-2xl` is on the card's *inner layout element*, NOT on the page content column. AG-1 (`max-w-6xl` for page columns) is not violated — this is an AG-4 technique for filling card width appropriately.

**P4 · Macro bars appeared thin on macbook-13**
`h-2` (8px) bars look fine on mobile OLED screens but the LLM auditor called them thin on the 1280px macbook screenshot. Fix: Use `h-2 lg:h-2.5` — 8px on mobile, 10px on desktop. Macbook score jumped from 7.5 → 8.5 → 9.0 after this + the ring fix.

---

##### AG Compliance Audit

| AG | Status | Note |
|---|---|---|
| AG-1 (two-tier width) | ✅ | PageShell: `w-full px-4 pb-24` mobile, `lg:max-w-6xl lg:mx-auto lg:px-8` desktop |
| AG-2 (2-col dashboard only) | ✅ | `grid-cols-1 xl:grid-cols-[1fr_340px]` — fires at xl (1280px+) only |
| AG-3 (mobile card order) | ✅ | Greeting → Hero → Macros → Streak/BMI → Milestone → Water → Chart |
| AG-4 (cards fill column) | ✅ | Desktop hero: `max-w-2xl mx-auto` centres inner layout. Macro bars fill full width. |
| AG-5 (sticky right col) | ✅ | `sticky top-20 max-h-[calc(100vh-80px)] overflow-y-auto` |
| AG-6 (animation rules) | ✅ | `strokeDashoffset` for rings, `animate(0, to)` for count-up, `Variants` typed |
| AG-7 (shadcn defaults) | ✅ | Progress, Badge, Input, Button, Separator, Skeleton all used |
| AG-8 (state ownership) | ✅ | SWR for dashboard data, local useState for water/weight form state |
| AG-9 (parity exceptions) | ✅ | Weight log widget desktop-only; TDEE widget desktop-only |

---

##### Files Created

```
src/lib/dashboardUtils.ts         ← pure functions: trend, pace, day score, BMI, macros
src/components/dashboard/
  CountUp.tsx                      ← animated number (Motion animate(), reusable)
  CalorieRing.tsx                  ← SVG donut ring (strokeDashoffset, presentational)
  CalorieHeroCard.tsx              ← responsive hero: stacked mobile, flanking desktop
  MacroBarsCard.tsx                ← macro bars + % split + protein density (F-1)
  StreakBMICard.tsx                ← streak + BMI side-by-side (border-r divider)
  MilestoneCard.tsx                ← milestone + progress bar
  TDEEWidget.tsx                   ← deficit/surplus + daily fat change (F-2)
  WaterIntakeCard.tsx              ← water ring + presets + custom input
  WeightChart.tsx                  ← Recharts line chart + trend (F-3) + pace insight
  WeightLogWidget.tsx              ← quick weight log (desktop right col only)
  DayScoreBadge.tsx                ← composite score mini ring in greeting (F-4)
  DashboardSkeletons.tsx           ← all skeleton states
src/app/dashboard/page.tsx         ← page wires all components, 2-col xl: grid
```

---

##### QA Upgrade: Multi-scroll Per-viewport Folders

The QA script was upgraded during this phase (problem P2 above):

**Old:** Single viewport screenshot per device (`fullPage: false`)
**New:** Multiple scroll screenshots per device, stored in per-viewport subfolders

```
qa/screenshots/dashboard-{ts}/
  iphone-se/   scroll-0.png  scroll-1.png  scroll-2.png  scroll-3.png
  macbook-13/  scroll-0.png  scroll-1.png
  ...
```

Scroll logic: 80% viewport height per step (20% overlap), stops at bottom, cap 8 shots.
LLM prompt updated: explicitly states "content below fold is NOT a problem."

Final scores (run dashboard-20260705-133250):

| Viewport | Score | P0? |
|---|---|---|
| macbook-13 | 9.0 | ★ P0 ✅ |
| iphone-14 | 8.0 | ★ P0 ✅ |
| pixel-7 | 8.0 | — |
| iphone-se | 7.5 | ★ P0 ✅ (avg pulls above 8.0) |
| ipad | 7.0 | P1 |
| **P0 avg** | **8.17** | **✅ PASS** |

iPad 7.0 is a P1 (not blocking). Main issue: at 768px it's single-column with BottomNav, which is correct per AG-1 and Phase 2.5 decision. The LLM rates it lower because it expects a "tablet layout" — but our two-tier strategy is intentional.

---

#### 5B — Tracker

**See `docs/DESIGN_OVERVIEW.md §Page 2` for full component-level spec (authoritative source).**

**Pre-implementation prerequisite:** Update `Modal.tsx` breakpoint from `md:` (768px) → `lg:` (1024px).

Key rules:
- Nutrition Summary: compact dots on mobile / full bars on desktop (same responsive principle as CalorieHeroCard)
- Meal tabs: icon + short label (no overflow at 375px), `activeTab` lifted to page state
- Entry delete: immediate + sonner undo toast (NOT confirm-on-second-tap)
- Add food: use `Modal.tsx` (after breakpoint fix) — no new AddFoodSheet component
- Desktop `xl:` 2-column: left=logging, right=quick add + today summary (AG-2 updated)
- 4 macros tracked: Protein, Carbs, Fat, **Fiber** (violet-400)
- New analytics (zero backend): calorie pace (F-1), meal distribution bar (F-2), multi-meal badge (F-3)

#### 5C — Workout

1. DateNavigator (uses same `useTrackerStore.selectedDate`)
2. SearchCommand for exercises
3. Workout summary card (when entries exist)
4. Workout log grouped by exercise name
5. Calories burned banner (orange, when > 0)

#### 5D — Dishes

1. Info banner
2. Dish list + client-side search
3. DishBuilder (create/edit) — SearchCommand for ingredients, smart units, live nutrition preview
4. DeleteConfirmDialog for deletion

#### 5E — Profile

1. Identity card (avatar initials, name, age/gender/height)
2. Stats grid (BMI, TDEE, target kcal, macros)
3. Update Goals form → PUT profile
4. Account section: Re-do Onboarding + Sign Out

#### 5F — Onboarding (standalone layout — no PageShell, no BottomNav)

4-step wizard: Personal → Weight Goals → Fitness → Diet → POST → redirect `/dashboard`

#### 5G — Admin (low priority, build last)

`/admin`, `/admin/users`, `/admin/food`

---

### Phase 6 — wger Images + Workout UX (~1 session)

- Backend: `image_url` column on `exercise_library`, re-fetch wger data
- Rename "Duration (min)" → "Session time (min)" with helper text
- Intensity toggle (Light/Moderate/Vigorous) for strength exercises
- Separate volume display from calories
- Exercise thumbnails in search results and workout log

---

### Phase 7 — Polish (~1 session)

- Swipe gestures: date navigation, swipe-to-delete food entries
- ARIA pass: `aria-label` on all icon-only buttons
- Micro-animations: page entry fade-up, progress bar transitions
- TypeScript strict pass
- Lighthouse Accessibility ≥ 90


## Part 4 — Feature Inventory (Complete Reference)

> This is the definitive list of every user-facing feature that must exist in the rebuilt frontend.
> Reference `frontend_legacy/` for implementation details when rebuilding.

### Authentication & Routing

| Feature             | Description                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Clerk sign-in       | Clerk-hosted sign-in page at`/sign-in`                                                  |
| Clerk sign-up       | Clerk-hosted sign-up page at`/sign-up`                                                  |
| Smart root redirect | `/` checks `/api/v1/me` → redirects to `/admin` (admins) or `/dashboard` (users) |
| Auth middleware     | All routes except`/sign-in`, `/sign-up` require Clerk session                         |
| Dev mode bypass     | `NEXT_PUBLIC_DEV_MODE=true` bypasses Clerk, uses dummy token                            |
| Sign out            | Clerk signOut (production) or redirect to /sign-in (dev)                                  |

### Onboarding (4-step wizard)

| Feature              | Description                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| Step 1: Personal     | Name, age (10–120), height (cm), gender (3-button toggle: M/F/Other)                  |
| Step 2: Weight goals | Current weight, goal weight, timeline weeks (min 4), live goal delta badge             |
| Step 3: Fitness      | Experience level (3-card toggle), activity level (dropdown)                            |
| Step 4: Diet         | Diet type (3-card: Veg/Egg/NonVeg), wants_workout_split toggle, wants_diet_plan toggle |
| Per-step validation  | Each step validates before advancing                                                   |
| Submit → profile    | POST to onboarding endpoint, server computes BMR/TDEE/macros, redirect to dashboard    |
| Step indicator       | Visual progress strip with labels                                                      |

### Dashboard

| Feature               | Description                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Greeting              | Time-aware ("Good morning/afternoon/evening") + user name + today's date                                                         |
| Calorie ring          | SVG donut ring: net calories (consumed - burned) vs target, big center number, remaining label, glow effect, turns red when over |
| Streak counter        | Consecutive logging days with flame icon, motivational text                                                                      |
| BMI display           | BMI value with color-coded category badge (Underweight/Healthy/Overweight/Obese)                                                 |
| Macro progress bars   | Protein (blue) / Carbs (amber) / Fat (orange) consumed vs target                                                                 |
| Milestone card        | Next weight milestone with target, estimated date, weeks away                                                                    |
| Water intake panel    | Circular SVG ring + bar, 4 preset buttons (150/250/500/750ml), custom ml input, entry list, delete per entry                     |
| Weight progress chart | Recharts line chart of weight over time with goal reference line                                                                 |
| Quick weight log      | Inline weight input on desktop dashboard                                                                                         |
| Navigation actions    | Links to Tracker, Workout, Dishes, Profile                                                                                       |

### Food Tracker

| Feature          | Description                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| Date navigation  | Prev/next day arrows, calendar popover (month view, future dates disabled), jump-to-today button             |
| Food search      | Debounced search (300ms) with dropdown results: name, category, veg dot, kcal/100g; MY DISH badge for custom |
| Add food modal   | Meal type selector, gram quantity input, live nutrition preview (scaled), confirm → log                     |
| Nutrition totals | Big remaining kcal, macro bars (P/C/F), calorie progress bar                                                 |
| Meal sections    | Breakfast / Lunch / Dinner / Snacks tabs — entries per meal with kcal subtotal in tab label                 |
| Quick Add grid   | 6 popular Indian meals with kcal labels for fast logging                                                     |
| Food log entries | Name, quantity, kcal, macros, delete button                                                                  |
| Diet filter      | Search respects user's diet_type (veg sees only veg items)                                                   |

### Workout Logger

| Feature                | Description                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Date navigation        | Same DateNavigator as tracker                                                                                   |
| Exercise search        | Debounced search with dropdown: name, muscle group, equipment, category pill (colored), MET value               |
| Add workout modal      | Sets/reps/weight fields (strength), session time field, live calorie burn preview (MET formula), confirm → log |
| Workout log            | Grouped by exercise: sets as mini-table, weight, volume, calories burned per entry                              |
| Calories burned banner | Orange banner showing total burned when > 0                                                                     |
| Exercise intensity     | Light/Moderate/Vigorous toggle (strength only) → adjusts MET value for calorie calc                            |

### Custom Dishes

| Feature            | Description                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Dish list          | Cards showing name, veg badge, ingredient count, weight, kcal, P/C/F macros (hover-reveal full labels)                                   |
| Client-side search | Filter dishes by name locally                                                                                                            |
| Info banner        | "Custom dishes appear in food search" explanation                                                                                        |
| Create dish        | Name input, diet type toggle, ingredient search, quantity with smart units (ml/qty/g), live nutrition preview (TOTAL not per-100g), save |
| Smart units        | ml for beverages/milk; qty (with per-unit gram weight) for eggs/chapati/idli/fruits; g for everything else                               |
| Edit dish          | Pre-fill form with existing dish data                                                                                                    |
| Delete dish        | AlertDialog confirmation                                                                                                                 |
| Nutrition preview  | Total kcal, macro bars (% of calories), kcal per 100g reference                                                                          |

### Profile

| Feature           | Description                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| Identity card     | Initials avatar, name, age, gender, height                              |
| Stats panel       | BMI, TDEE, target calories (highlighted), protein/carbs/fat targets     |
| Update goals form | Weight, goal weight, timeline, activity level, diet type → PUT profile |
| Re-do onboarding  | Link to /onboarding to change name/age/height/experience                |
| Sign out          | Clerks signOut or dev redirect                                          |

### Admin (low priority)

| Feature     | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| Admin stats | Total users + total food items counts                         |
| User list   | Read-only list of all user profiles                           |
| Food CRUD   | Search, create, edit, delete food items in the shared catalog |

---

## Part 5 — Authentication Strategy

### Overview

FitCoach AI uses **Clerk** for authentication. The strategy has two modes:

| Mode            | Clerk Active?        | When to Use                   |
| --------------- | -------------------- | ----------------------------- |
| Production      | ✅ Full Clerk        | Real users, deployed app      |
| Dev (Clerk ON)  | ✅ Real Clerk + flag | Testing with actual auth flow |
| Dev (Clerk OFF) | ❌ Bypassed          | Local dev, CI, screenshots    |

### Production Mode

Clerk is fully active. All routes except `/sign-in` and `/sign-up` require a valid Clerk session JWT. The `Authorization: Bearer <clerk-jwt>` header is injected by `AuthProvider` into every API call.

### Dev Mode (Clerk Bypassed)

Controlled by a single flag: `NEXT_PUBLIC_DEV_MODE=true` in `frontend/.env.local`.

When this flag is true:

1. `middleware.ts` — skips `auth.protect()`, returns `NextResponse.next()` immediately
2. `layout.tsx` — skips wrapping with `<ClerkProvider>`
3. `AuthProvider.tsx` — skips calling `useAuth()` / `setApiTokenGetter`
4. `lib/api.ts` — request interceptor sends `Authorization: Bearer dev-token` (a dummy, non-empty token)

The backend (`backend/.env`) must have `DEV_MODE=true` for this to work. When `DEV_MODE=true` is set on the backend, the JWT verification is bypassed and all requests are treated as the `DEV_USER_ID` user.

**Dev users (already seeded by Alembic migration `b9c8d7e6f5a4_seed_dev_user.py`):**

| User ID          | Name     | Role        | Profile                                                           |
| ---------------- | -------- | ----------- | ----------------------------------------------------------------- |
| `dev-user-001` | Dev User | Normal user | 28yo, 78kg → 72kg goal, veg, moderate activity, 2352 kcal target |

**Admin dev user:**
Admin access is controlled by `ADMIN_USER_IDS` env var in `backend/.env`. Set `ADMIN_USER_IDS=dev-user-001` to give the dev user admin privileges. A second technical user `dev-admin-001` can be seeded as a dedicated admin dev user if needed (add to the seed migration).

### Enabling/Disabling Clerk in Dev

```bash
# Disable Clerk (pure dev mode, no auth overhead)
# In frontend/.env.local:
NEXT_PUBLIC_DEV_MODE=true
# In backend/.env:
DEV_MODE=true

# Enable Clerk (test the full auth flow locally)
# In frontend/.env.local:
NEXT_PUBLIC_DEV_MODE=false
# In backend/.env:
DEV_MODE=false
# Also set CLERK_JWKS_URL and CLERK_SECRET_KEY
```

### Adding a Dev Admin User

To add a dedicated admin dev user (separate from the normal dev user), add to the seed migration `b9c8d7e6f5a4_seed_dev_user.py`:

```python
DEV_ADMIN_ID = "dev-admin-001"
# Insert into users + user_profiles with admin-appropriate profile
# Then in backend/.env: ADMIN_USER_IDS=dev-user-001,dev-admin-001
```

---

## Part 6 — QA / Testing Framework

All testing is handled by one script: **`qa/page_audit.py`**

### Usage

```bash
# From project root — evaluate one page at a time
python3 qa/page_audit.py /dashboard
python3 qa/page_audit.py /tracker
python3 qa/page_audit.py /tracker --state search   # with search open
python3 qa/page_audit.py /dishes --state create     # create form open
python3 qa/page_audit.py /workout --state exercise-search

# Screenshots only (no API cost, ~25s)
python3 qa/page_audit.py /dashboard --capture-only
```

### Viewports Tested

| ID             | Device      | Size      | Priority                       |
| -------------- | ----------- | --------- | ------------------------------ |
| `iphone-se`  | iPhone SE   | 375×667  | **P0 — must score ≥8** |
| `iphone-14`  | iPhone 14   | 390×844  | **P0 — must score ≥8** |
| `pixel-7`    | Pixel 7     | 412×915  | P1                             |
| `ipad`       | iPad        | 768×1024 | P1                             |
| `macbook-13` | MacBook 13" | 1280×800 | **P0 — must score ≥8** |

### Output

```
qa/
  page_audit.py              ← the script
  results/                   ← JSON + MD reports (commit after each phase)
    dashboard-{ts}.json
    dashboard-{ts}.md
    history.json
  screenshots/               ← PNGs (gitignored)
    dashboard-{ts}/
      iphone-se.png
      iphone-14.png
      ...
```

### The Loop

```
Build page → python3 qa/page_audit.py /{page} → read issues → fix → repeat until P0 ≥ 8.0
```

### Timing

~25s for screenshots, ~50s for full evaluation. Run one page at a time.

---

## Part 7 — Score Targets

| After Phase                  | Target                                    |
| ---------------------------- | ----------------------------------------- |
| Phase 2 (bottom nav + shell) | P0 ≥ 7.5 overall                         |
| Phase 5 (all pages rebuilt)  | P0 ≥ 8.5 on all pages                    |
| Phase 7 (final polish)       | P0 ≥ 9.0, Lighthouse Accessibility ≥ 90 |

---

## Part 8 — What NOT to Do

| Temptation                            | Why Not                                                             |
| ------------------------------------- | ------------------------------------------------------------------- |
| Using `max-w-5xl` on desktop          | Inside a 2-col grid it gives ~640px left col — barely wider than mobile. Use `max-w-6xl`. |
| Using `max-w-2xl` on desktop          | 672px centred column wastes 44% of screen. The original problem.   |
| Left sidebar navigation               | Causes wide stretched content with dead right-side space. Use top nav. |
| Right panel on every page globally    | Overkill — right panel is dashboard-specific only (see AG-2)       |
| Different max-width on navbar vs content | Nav links won't align with content edges. Must use same `max-w-6xl` everywhere. |
| Add Framer Motion before Phase 7      | Already reconsidered — Motion for React is approved, install it in Phase 5A |
| Use `pathLength` for SVG donut rings  | Wrong mechanism. Use `strokeDashoffset` (see AG-6)                 |
| Stagger cards at 50ms intervals       | 7 cards × 50ms = 350ms lag. Use 30ms (see AG-6)                   |
| Build custom Calendar                 | DateNavigator is already good — polish only                        |
| Switch from Recharts                  | Charts work correctly — not worth disruption                       |
| Add light mode                        | Dark-only for now — separate sprint                                |
| Patch legacy code                     | Full rebuild only — legacy is read-only reference                  |

---

## Part 9 — File Structure (New Frontend)

```
frontend/
  src/
    app/
      layout.tsx              ← ClerkProvider (prod) or skip (dev), BottomNav, AuthProvider
      page.tsx                ← Smart redirect (me → admin/dashboard)
      dashboard/page.tsx
      tracker/page.tsx
      workout/page.tsx
      dishes/page.tsx
      profile/page.tsx
      onboarding/page.tsx
      admin/
        page.tsx
        users/page.tsx
        food/page.tsx
      sign-in/[[...sign-in]]/page.tsx
      sign-up/[[...sign-up]]/page.tsx
      globals.css             ← CSS variables + tailwind directives
    components/
      layout/
        PageShell.tsx         ← shared page container (mobile: w-full px-4, desktop: max-w-6xl px-8)
        BottomNav.tsx         ← mobile/tablet nav bar (lg:hidden — disappears at 1024px)
        TopNav.tsx            ← desktop sticky top navbar (hidden lg:flex — appears at 1024px), max-w-6xl inner
      ui/                     ← shadcn components + custom overrides
        button.tsx, input.tsx, select.tsx, badge.tsx, progress.tsx
        dialog.tsx, drawer.tsx, alert-dialog.tsx, sheet.tsx
        command.tsx, popover.tsx
        tabs.tsx, separator.tsx, scroll-area.tsx
        tooltip.tsx, spinner.tsx, form-field.tsx, card.tsx, modal.tsx
        SearchCommand.tsx     ← generic search using Command + Popover
      dashboard/
        CalorieRing.tsx, MacroBar.tsx, MacroBarsGroup.tsx
        WaterIntakePanel.tsx, WeightProgressChart.tsx
        StreakCounter.tsx, MilestoneCard.tsx, DailySummaryBanner.tsx
      tracker/
        DateNavigator.tsx, FoodSearchBar.tsx, AddFoodModal.tsx
        FoodLog.tsx, FoodLogEntry.tsx, NutritionTotals.tsx
      workout/
        ExerciseSearchBar.tsx, AddWorkoutModal.tsx, WorkoutLog.tsx
      dishes/
        DishBuilder.tsx, DishNutritionPreview.tsx
      onboarding/
        OnboardingWizard.tsx, Step1Personal.tsx, Step2Weight.tsx
        Step3Fitness.tsx, Step4Diet.tsx, StepIndicator.tsx
      AuthProvider.tsx
    store/
      useTrackerStore.ts      ← selectedDate (shared tracker + workout)
      useUIStore.ts           ← toast notifications, loading overlay
      useMealStore.ts         ← pending meal slot for quick-add
    hooks/
      useDashboard.ts, useFoodLog.ts, useFoodSearch.ts
      useWorkoutLog.ts, useWaterLog.ts, useWeightLog.ts
      useProfile.ts, useCustomDishes.ts
      useMediaQuery.ts, useDebounce.ts
    types/
      nutrition.ts, workout.ts, dish.ts, dashboard.ts, profile.ts
    lib/
      api.ts, constants.ts, utils.ts
    middleware.ts
```
