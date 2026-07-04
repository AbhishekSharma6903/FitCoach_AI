import { redirect } from "next/navigation";

// /settings has been merged into /profile
export default function SettingsPage() {
  redirect("/profile");
}
