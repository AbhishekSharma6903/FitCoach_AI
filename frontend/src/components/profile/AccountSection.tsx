"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LogOut, RotateCcw, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    if (DEV_MODE) {
      router.push("/sign-in");
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useClerk } = require("@clerk/nextjs");
    } catch {
      router.push("/sign-in");
    }
  }

  if (!DEV_MODE) return <ClerkSignOutInner />;

  return (
    <button
      onClick={handleSignOut}
      className={cn(
        "flex items-center justify-between w-full h-11 px-4 rounded-xl",
        "bg-[#111111] border border-[#2A2A2A]",
        "hover:bg-red-500/5 hover:border-red-500/20 transition-colors",
      )}
    >
      <span className="text-sm text-red-400">Sign Out</span>
      <LogOut size={15} className="text-red-400/50" aria-hidden="true" />
    </button>
  );
}

function ClerkSignOutInner() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useClerk } = require("@clerk/nextjs");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { signOut } = useClerk();

  return (
    <button
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      className={cn(
        "flex items-center justify-between w-full h-11 px-4 rounded-xl",
        "bg-[#111111] border border-[#2A2A2A]",
        "hover:bg-red-500/5 hover:border-red-500/20 transition-colors",
      )}
    >
      <span className="text-sm text-red-400">Sign Out</span>
      <LogOut size={15} className="text-red-400/50" aria-hidden="true" />
    </button>
  );
}

export default function AccountSection() {
  const { isAdmin } = useAdminCheck();

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2">
        Account
      </p>

      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            "flex items-center justify-between h-11 px-4 rounded-xl",
            "bg-[#111111] border border-orange-500/20",
            "hover:bg-orange-500/5 transition-colors",
          )}
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert size={14} className="text-orange-400 shrink-0" aria-hidden="true" />
            <span className="text-sm text-orange-400">Admin Panel</span>
          </div>
          <ChevronRight size={15} className="text-orange-400/40 shrink-0" aria-hidden="true" />
        </Link>
      )}

      <Link
        href="/onboarding"
        className={cn(
          "flex items-center justify-between h-11 px-4 rounded-xl",
          "bg-[#111111] border border-[#2A2A2A]",
          "hover:bg-[#1A1A1A] transition-colors",
        )}
      >
        <div className="flex items-center gap-2.5">
          <RotateCcw size={14} className="text-muted-foreground/50 shrink-0" aria-hidden="true" />
          <div>
            <span className="text-sm text-foreground">Re-do Onboarding</span>
            <p className="text-[10px] text-muted-foreground/50">
              Change name, age, height, experience
            </p>
          </div>
        </div>
        <ChevronRight size={15} className="text-muted-foreground/30 shrink-0" aria-hidden="true" />
      </Link>

      <SignOutButton />
    </div>
  );
}
