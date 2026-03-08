import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@repo/ui";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Todo App",
  description: "A simple todo application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="/sdk/hearing-sdk.iife.js"
          strategy="beforeInteractive"
        />
        <Script id="hearing-sdk-init" strategy="afterInteractive">
          {`
            (function() {
              var urlParams = new URLSearchParams(window.location.search);
              var sessionId = urlParams.get('hSessionId');

              if (!sessionId || !window.HearingSDK) return;

              // Viteビルドの場合、window.HearingSDK.HearingSDKにネストされている
              var sdk = window.HearingSDK;
              if (sdk.HearingSDK && typeof sdk.HearingSDK.init === 'function') {
                sdk = sdk.HearingSDK;
              }

              if (typeof sdk.init === 'function') {
                sdk.init({
                  sessionId: sessionId,
                  supabaseUrl: 'http://127.0.0.1:54321',
                  debug: true
                });
              }
            })();
          `}
        </Script>
      </head>
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
