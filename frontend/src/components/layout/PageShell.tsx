import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  /** Text shown in the header */
  title?: string;
  /** If set, shows a back arrow linking to this href */
  backHref?: string;
  /** Custom content to render on the right side of the header */
  headerRight?: React.ReactNode;
  /** Skip horizontal padding (for full-bleed pages) */
  noPadding?: boolean;
  /** Skip the header entirely */
  noHeader?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared page wrapper used by every page (except onboarding / auth).
 *
 * Mobile  (< md):  max-w-2xl centred, bottom padding clears BottomNav
 * Desktop (≥ md):  ml-16 (clears SideNav), full remaining width, px-8
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
      <div
        className={cn(
          // ── Mobile: centred column ──────────────────────────────────────
          "mx-auto w-full max-w-2xl",
          "pb-24",                    // clears BottomNav (64px + safe-area)
          !noPadding && "px-4",
          // ── Desktop: full width offset by sidebar ───────────────────────
          "md:ml-16 md:mr-0 md:w-auto md:max-w-none md:pb-8",
          !noPadding && "md:px-8",
          className,
        )}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        {!noHeader && (
          <header className="flex h-14 items-center gap-3">
            {backHref && (
              <Link
                href={backHref}
                aria-label="Go back"
                className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-[#1A1A1A] hover:text-foreground"
              >
                <ChevronLeft size={22} />
              </Link>
            )}

            {title && (
              <h1 className="flex-1 text-xl font-bold text-foreground">
                {title}
              </h1>
            )}

            {/* Spacer when there is no title but there is a right slot */}
            {!title && <div className="flex-1" />}

            {headerRight && (
              <div className="flex items-center gap-2">{headerRight}</div>
            )}
          </header>
        )}

        {/* ── Page content ─────────────────────────────────────────────── */}
        {children}
      </div>
    </div>
  );
}
