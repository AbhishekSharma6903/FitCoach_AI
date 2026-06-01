import { redirect } from "next/navigation";

// Middleware already redirects unauthenticated users to /sign-in.
// For authenticated users, always go to /dashboard — the dashboard
// handles the onboarding check client-side (avoids server-side auth() issues
// with Clerk's dev-mode handshake clearing the session cookie on first load).
export default function Home() {
  redirect("/dashboard");
}

