import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  /** Title shown in mobile header (hidden on desktop — TopNav handles branding) */
  title?: string;
  /** Back arrow href — shows ChevronLeft when set */
  backHref?: string;
  /** Custom content for right side of mobile header */
  headerRight?: React.ReactNode;
  /** Skip horizontal padding (for full-bleed sections) */
  noPadding?: boolean;
  /** Skip mobile header entirely (dashboard uses its own greeting row) */
  noHeader?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared page wrapper — two-tier responsive width strategy (AG-1):
 *
 * Mobile  (< lg, < 1024px):  w-full px-4 pb-24  — full width, clears BottomNav
 * Desktop (lg+, ≥ 1024px):   max-w-6xl mx-auto px-8 pb-8  — centred column
 *
 * TopNav is rendered in layout.tsx (desktop). Mobile header is rendered here.
 * Never add intermediate tablet widths — see AG-1 in UI_REFACTOR_PLAN_V2.md.
 */
export default function PageShell({
  title,
  backHref,
  headerRight,
  noPadding = false,
  noHeader = false,
  children,
  className,
}: PageShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <main
        className={cn(
          // ── Mobile (< lg): full width ────────────────────────────────────
          "w-full pb-24",
          !noPadding && "px-4",
          // ── Desktop (lg+): centred column, max-w-6xl matches TopNav inner ─
          "lg:max-w-6xl lg:mx-auto lg:px-8 lg:pb-8",
          className,
        )}
      >
        {/* ── Mobile-only header ────────────────────────────────────────── */}
        {/* Hidden on desktop — TopNav handles navigation there            */}
        {!noHeader && (
          <header className="flex h-14 items-center gap-3 lg:hidden">
            {backHref && (
              <Link
                href={backHref}
                aria-label="Go back"
                className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-[#1A1A1A] hover:text-foreground"
              >
                <ChevronLeft size={22} aria-hidden="true" />
              </Link>
            )}

            {title && (
              <h1 className="flex-1 text-xl font-bold text-foreground">
                {title}
              </h1>
            )}

            {!title && <div className="flex-1" />}

            {headerRight && (
              <div className="flex items-center gap-2">{headerRight}</div>
            )}
          </header>
        )}

        {children}
      </main>
    </div>
  );
}
