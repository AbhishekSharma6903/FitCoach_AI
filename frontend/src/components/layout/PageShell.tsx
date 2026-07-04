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
 * Handles:
 *  - Full-height dark background
 *  - Centered max-w container
 *  - Consistent header with optional back arrow
 *  - Bottom padding to clear the mobile BottomNav (hidden on md+)
 *  - iOS safe-area support
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
          "mx-auto w-full max-w-2xl",
          // Bottom padding clears the mobile nav bar (64px) on small screens
          // On md+ there is no bottom nav so normal padding applies
          "pb-24 md:pb-8",
          // Horizontal padding (unless noPadding)
          !noPadding && "px-4",
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
