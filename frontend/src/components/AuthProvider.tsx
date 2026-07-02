"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setApiTokenGetter } from "@/lib/api";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

/**
 * Always mounts inside ClerkProvider.
 * In dev mode (NEXT_PUBLIC_DEV_MODE=true): registers a no-op token getter
 * since api.ts already sends "Bearer dev-token" via its interceptor.
 * In production: registers Clerk's getToken() so every request gets a real JWT.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    if (!DEV_MODE) {
      setApiTokenGetter(getToken);
    }
  }, [getToken]);

  return <>{children}</>;
}
