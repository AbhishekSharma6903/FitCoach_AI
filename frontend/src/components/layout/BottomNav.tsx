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
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/tracker",   icon: Utensils,        label: "Tracker" },
  { href: "/workout",   icon: Dumbbell,        label: "Workout" },
  { href: "/dishes",    icon: ChefHat,         label: "Dishes" },
  { href: "/profile",   icon: User,            label: "Profile" },
] as const;

const HIDDEN_ON_ROUTES = ["/onboarding", "/sign-in", "/sign-up"];

/**
 * Persistent mobile bottom navigation bar.
 * Hidden at lg+ (1024px) — TopNav takes over on desktop.
 * Uses lg:hidden (NOT md:hidden) to match TopNav's hidden lg:flex,
 * preventing a dead zone at 768-1023px with no navigation.
 */
export default function BottomNav() {
  const pathname = usePathname();

  // Hide on auth / onboarding pages
  if (HIDDEN_ON_ROUTES.some((r) => pathname.startsWith(r))) return null;

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "h-16 border-t border-[#2A2A2A] bg-[rgba(17,17,17,0.92)] backdrop-blur-xl",
        // iOS safe area
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="flex h-full items-stretch">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 transition-colors",
                  isActive
                    ? "text-[#22c55e]"
                    : "text-[#9CA3AF] hover:text-[#9CA3AF]",
                )}
              >
                {/* Active indicator dot */}
                <span
                  className={cn(
                    "mb-0.5 h-0.5 w-4 rounded-full transition-all duration-200",
                    isActive ? "bg-[#22c55e]" : "bg-transparent",
                  )}
                />
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-wide transition-colors",
                    isActive ? "text-[#22c55e]" : "text-[#9CA3AF]",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
