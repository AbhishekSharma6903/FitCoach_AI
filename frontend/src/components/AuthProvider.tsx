"use client";

import { setApiTokenGetter } from "@/lib/api";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

/**
 * Wires the Clerk session token into every API call.
 * In DEV_MODE: skipped — api.ts sends a static "dev-token" instead.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!DEV_MODE) {
    // Dynamically import Clerk hook to avoid errors when ClerkProvider is absent
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuth } = require("@clerk/nextjs");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { getToken } = useAuth();
    setApiTokenGetter(getToken);
  }

  return <>{children}</>;
}
