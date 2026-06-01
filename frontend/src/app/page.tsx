"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import api from "@/lib/api";
import Spinner from "@/components/ui/Spinner";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  // Only fetch once Clerk is ready and user is signed in.
  // Passing null as key prevents SWR from firing prematurely.
  const { data, error } = useSWR(
    isLoaded && isSignedIn ? "/api/v1/me" : null,
    fetcher
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }
    if (data) {
      router.replace(data.is_admin ? "/admin" : "/dashboard");
    }
    if (error) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, data, error, router]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <Spinner className="w-8 h-8" />
    </div>
  );
}
