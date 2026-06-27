"use client";
import { setApiTokenGetter } from "@/lib/api";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

/**
 * In production: mounts inside ClerkProvider and registers Clerk's getToken()
 * with the axios instance so every API call has Authorization: Bearer <token>.
 *
 * In dev mode (NEXT_PUBLIC_DEV_MODE=true): Clerk is bypassed entirely.
 * The axios interceptor sends a dummy "dev-token" and the backend's dev bypass
 * (triggered when CLERK_JWKS_URL is unset) treats all requests as DEV_USER_ID.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!DEV_MODE) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useAuth } = require("@clerk/nextjs");
    // This is a conditional hook call — safe because DEV_MODE never changes at runtime
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { getToken } = useAuth();
    setApiTokenGetter(getToken);
  }

  return <>{children}</>;
}
