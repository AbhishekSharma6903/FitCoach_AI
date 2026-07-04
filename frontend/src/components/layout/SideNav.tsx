"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  ChefHat,
  User,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/tracker",   icon: Utensils,        label: "Tracker" },
  { href: "/workout",   icon: Dumbbell,        label: "Workout" },
  { href: "/dishes",    icon: ChefHat,         label: "Dishes" },
] as const;

const HIDDEN_ON_ROUTES = ["/onboarding", "/sign-in", "/sign-up"];

/**
 * Desktop left sidebar navigation (64px wide).
 * Shown on md:+ only — mobile uses BottomNav instead.
 *
 * Design spec (from UI_REFACTOR_PLAN_V2.md §2.10):
 *   - 64px fixed width, full viewport height
 *   - Icon-only items with Tooltip labels on hover
 *   - Active: green left border + green icon + bg-elevated
 *   - Inactive: gray icon, hover lightens
 *   - Profile avatar pinned to bottom
 *
 * Note: Base UI Tooltip does not support `asChild` on Trigger.
 * We render a styled wrapper button inside TooltipTrigger and place
 * the Link inside it using pointer-events passthrough.
 */
export default function SideNav() {
  const pathname = usePathname();

  if (HIDDEN_ON_ROUTES.some((r) => pathname.startsWith(r))) return null;

  return (
    <aside
      aria-label="Sidebar navigation"
      className={cn(
        "hidden md:flex",
        "fixed left-0 top-0 z-40 h-dvh w-16",
        "flex-col items-center",
        "bg-[rgba(17,17,17,0.95)] border-r border-[#2A2A2A]",
        "backdrop-blur-xl",
      )}
    >
      {/* App logo / initial */}
      <div className="flex h-14 w-full items-center justify-center border-b border-[#2A2A2A]">
        <Link href="/dashboard" className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
          <span className="text-base font-black text-primary select-none">F</span>
        </Link>
      </div>

      {/* Main nav items */}
      <nav className="flex flex-1 flex-col items-center gap-1 py-3 w-full" role="list">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <div key={href} role="listitem" className="w-full flex justify-center">
              <Tooltip>
                <TooltipTrigger
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-xl",
                    "transition-all duration-[120ms] cursor-pointer",
                    isActive
                      ? "bg-[#1A1A1A] text-primary"
                      : "text-[#6B7280] hover:bg-[#1A1A1A] hover:text-[#D1D5DB]",
                  )}
                  render={
                    <Link
                      href={href}
                      aria-label={label}
                      aria-current={isActive ? "page" : undefined}
                    />
                  }
                >
                  {/* Active indicator — left green bar */}
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <span className="text-xs font-medium">{label}</span>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </nav>

      {/* Profile avatar (bottom) */}
      <div className="pb-4 w-full flex justify-center border-t border-[#2A2A2A] pt-3">
        <Tooltip>
          <TooltipTrigger
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              "transition-all duration-[120ms] cursor-pointer",
              pathname === "/profile"
                ? "bg-primary text-black ring-2 ring-primary/30"
                : "bg-[#1A1A1A] text-[#9CA3AF] hover:bg-[#222222] hover:text-foreground",
            )}
            render={
              <Link
                href="/profile"
                aria-label="Profile"
                aria-current={pathname === "/profile" ? "page" : undefined}
              />
            }
          >
            <User size={16} aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            <span className="text-xs font-medium">Profile</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
