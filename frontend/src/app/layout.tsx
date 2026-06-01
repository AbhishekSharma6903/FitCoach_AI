import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitCoach AI",
  description: "Your personalised AI fitness coach",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-[#0d0d0d] text-gray-100 min-h-screen`}>
            <AuthProvider>{children}</AuthProvider>
          </body>
      </html>
    </ClerkProvider>
  );
}
