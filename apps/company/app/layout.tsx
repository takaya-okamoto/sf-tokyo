import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@repo/ui";
import { Suspense } from "react";
import { HearingSdkLoader } from "@/components/hearing-sdk-loader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Hearing Platform - For Companies",
  description: "A platform for efficiently conducting and managing user hearings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster />
        <Suspense fallback={null}>
          <HearingSdkLoader />
        </Suspense>
      </body>
    </html>
  );
}
