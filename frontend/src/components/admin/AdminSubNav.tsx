"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin",       label: "Stats" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/food",  label: "Food"  },
] as const;

export default function AdminSubNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="flex items-center gap-1.5">
      {LINKS.map(({ href, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold transition-colors",
              isActive
                ? "bg-[#1A1A1A] text-foreground border border-[#2A2A2A]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
