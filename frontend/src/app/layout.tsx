import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";

export const metadata: Metadata = {
  title: "FitCoach AI",
  description: "Your personalised AI fitness coach",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0d0d0d] text-gray-100 min-h-screen`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );

  if (DEV_MODE) {
    // Skip ClerkProvider entirely in dev mode — avoids network calls to Clerk
    return content;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ClerkProvider } = require("@clerk/nextjs");
  return <ClerkProvider>{content}</ClerkProvider>;
}
