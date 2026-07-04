import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FitCoach AI",
  description: "Your personalised AI fitness coach",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Always wrap with ClerkProvider so Clerk components (SignIn, UserButton etc.) work.
  // In DEV_MODE, the middleware skips auth and api.ts sends a dummy token —
  // ClerkProvider itself is harmless without real keys.
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} dark`}>
        <body className="font-sans bg-[#0d0d0d] text-gray-100 min-h-screen">
          <AuthProvider>{children}</AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
