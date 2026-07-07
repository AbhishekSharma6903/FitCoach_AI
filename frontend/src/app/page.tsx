import { redirect } from "next/navigation";

/**
 * Root route: redirects to /dashboard.
 * Full smart redirect (admin vs user check) added when dashboard is built.
 */
export default function RootPage() {
  redirect("/dashboard");
}
