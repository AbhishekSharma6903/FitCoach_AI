"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import api from "@/lib/api";
import Spinner from "@/components/ui/Spinner";

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const fetcher = (url: string) => api.get(url).then((r) => r.data);

function HomeWithClerk() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuth } = require("@clerk/nextjs");
  const router = useRouter();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isLoaded, isSignedIn } = useAuth();
  const { data, error } = useSWR(
    isLoaded && isSignedIn ? "/api/v1/me" : null,
    fetcher
  );
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/sign-in"); return; }
    if (data) router.replace(data.is_admin ? "/admin" : "/dashboard");
    if (error) router.replace("/dashboard");
  }, [isLoaded, isSignedIn, data, error, router]);
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <Spinner className="w-8 h-8" />
    </div>
  );
}

function HomeDevMode() {
  const router = useRouter();
  const { data, error } = useSWR("/api/v1/me", fetcher);
  useEffect(() => {
    if (data) router.replace(data.is_admin ? "/admin" : "/dashboard");
    if (error) router.replace("/dashboard");
  }, [data, error, router]);
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <Spinner className="w-8 h-8" />
    </div>
  );
}

export default function Home() {
  return DEV_MODE ? <HomeDevMode /> : <HomeWithClerk />;
}
