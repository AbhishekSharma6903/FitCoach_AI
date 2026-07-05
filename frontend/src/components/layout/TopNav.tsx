"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Home",    icon: LayoutDashboard },
  { href: "/tracker",   label: "Tracker", icon: Utensils },
  { href: "/workout",   label: "Workout", icon: Dumbbell },
  { href: "/dishes",    label: "Dishes",  icon: ChefHat },
] as const;

const HIDDEN_ON_ROUTES = ["/onboarding", "/sign-in", "/sign-up"];

export default function TopNav() {
  const pathname = usePathname();

  if (HIDDEN_ON_ROUTES.some((r) => pathname.startsWith(r))) return null;

  return (
    <header
      className={cn(
        "hidden lg:flex",
        "sticky top-0 z-50 h-14 w-full",
        "border-b border-[#2A2A2A]",
        "bg-[#0A0A0A]/80 backdrop-blur-md",
      )}
    >
      {/* Inner container — max-w-6xl MUST match PageShell exactly */}
      <div className="max-w-6xl mx-auto px-8 w-full flex items-center justify-between h-full">

        {/* Left: logo + wordmark */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 shrink-0"
          aria-label="FitCoach home"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <span className="text-sm font-black text-primary select-none">F</span>
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">
            FitCoach
          </span>
        </Link>

        {/* Centre: nav links */}
        <nav aria-label="Main navigation" className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-120",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-[#1A1A1A]",
                )}
              >
                {label}
                {/* Active dot indicator below label */}
                {isActive && (
                  <span
                    className="absolute -bottom-[11px] left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Log Food CTA + avatar */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/tracker"
            className={cn(
              "flex items-center gap-1.5 h-9 px-4 rounded-lg",
              "bg-primary text-black text-sm font-semibold",
              "hover:bg-green-400 active:scale-[0.98] transition-all duration-120",
            )}
          >
            <Plus size={14} aria-hidden="true" />
            Log Food
          </Link>

          <Link
            href="/profile"
            aria-label="Profile"
            aria-current={pathname === "/profile" ? "page" : undefined}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
              "bg-primary/10 text-primary ring-1 ring-primary/20",
              "hover:bg-primary/20 transition-colors duration-120",
              pathname === "/profile" && "ring-2 ring-primary/40",
            )}
          >
            D
          </Link>
        </div>

      </div>
    </header>
  );
}
