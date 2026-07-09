import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // DEV_MODE: skip Clerk entirely in local dev.
  // Use NEXT_PUBLIC_DEV_MODE (available in edge runtime via process.env in Next.js 16)
  // OR the plain DEV_MODE server-side variable as fallback.
  if (
    process.env.NEXT_PUBLIC_DEV_MODE === "true" ||
    process.env.DEV_MODE === "true"
  ) {
    return NextResponse.next();
  }
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
