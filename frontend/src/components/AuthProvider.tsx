"use client";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setApiTokenGetter } from "@/lib/api";

/**
 * Mounts at app root (inside ClerkProvider).
 * Registers Clerk's getToken() with the axios instance so every
 * API call automatically includes Authorization: Bearer <session_token>.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setApiTokenGetter(getToken);
  }, [getToken]);

  return <>{children}</>;
}
