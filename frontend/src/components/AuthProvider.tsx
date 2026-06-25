"use client";
import { useAuth } from "@clerk/nextjs";
import { setApiTokenGetter } from "@/lib/api";

/**
 * Mounts at app root (inside ClerkProvider).
 * Registers Clerk's getToken() with the axios instance so every
 * API call automatically includes Authorization: Bearer <session_token>.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  // Register synchronously on every render so the token getter is available
  // before SWR fires its first fetch (useEffect would be too late).
  setApiTokenGetter(getToken);

  return <>{children}</>;
}
