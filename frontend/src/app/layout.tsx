import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthProvider from "@/components/AuthProvider";
import TopNav from "@/components/layout/TopNav";
import BottomNav from "@/components/layout/BottomNav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

export const metadata: Metadata = {
  title: "FitCoach AI",
  description: "Your personalised AI fitness coach",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // enables safe-area-inset on iOS
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-dvh bg-background text-foreground antialiased font-sans">
        <TooltipProvider>
          <AuthProvider>
            <TopNav />    {/* desktop lg+ only — hidden on mobile */}
            {children}
            <BottomNav /> {/* mobile/tablet < lg — hidden on desktop */}
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );

  if (DEV_MODE) return content;

  // Production: wrap with ClerkProvider
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ClerkProvider } = require("@clerk/nextjs");
  return <ClerkProvider>{content}</ClerkProvider>;
}
