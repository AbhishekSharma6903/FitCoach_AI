"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LogOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    if (DEV_MODE) {
      router.push("/sign-in");
      return;
    }
    try {
      // Dynamically import to avoid crash when ClerkProvider not mounted (dev mode)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useClerk } = require("@clerk/nextjs");
      // This is called from ClerkSignOutInner — safe here
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
      <LogOut size={15} className="text-red-400/50" />
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
      <LogOut size={15} className="text-red-400/50" />
    </button>
  );
}

export default function AccountSection() {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-2">
        Account
      </p>

      {/* Re-do Onboarding */}
      <Link
        href="/onboarding"
        className={cn(
          "flex items-center justify-between h-11 px-4 rounded-xl",
          "bg-[#111111] border border-[#2A2A2A]",
          "hover:bg-[#1A1A1A] transition-colors",
        )}
      >
        <div className="flex items-center gap-2.5">
          <RotateCcw size={14} className="text-muted-foreground/50 shrink-0" />
          <div>
            <span className="text-sm text-foreground">Re-do Onboarding</span>
            <p className="text-[10px] text-muted-foreground/50">
              Change name, age, height, experience
            </p>
          </div>
        </div>
        <ChevronRight size={15} className="text-muted-foreground/30 shrink-0" />
      </Link>

      <SignOutButton />
    </div>
  );
}
