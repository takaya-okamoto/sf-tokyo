"use client";

import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface HearingSDKInterface {
  init: (config: {
    sessionId: string;
    supabaseUrl: string;
    debug?: boolean;
  }) => Promise<boolean>;
  destroy: () => void;
}

declare global {
  interface Window {
    HearingSDK?: HearingSDKInterface | { HearingSDK: HearingSDKInterface };
  }
}

function getSDK(): HearingSDKInterface | null {
  if (!window.HearingSDK) return null;

  // Viteビルドの場合、window.HearingSDK.HearingSDKにある
  if ("HearingSDK" in window.HearingSDK && typeof (window.HearingSDK as { HearingSDK: HearingSDKInterface }).HearingSDK.init === "function") {
    return (window.HearingSDK as { HearingSDK: HearingSDKInterface }).HearingSDK;
  }

  // 直接アクセス可能な場合
  if (typeof (window.HearingSDK as HearingSDKInterface).init === "function") {
    return window.HearingSDK as HearingSDKInterface;
  }

  return null;
}

export function HearingSdkLoader() {
  const searchParams = useSearchParams();
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const sessionId = searchParams.get("hSessionId");

  useEffect(() => {
    if (sdkLoaded && sessionId) {
      const sdk = getSDK();
      if (sdk) {
        sdk.init({
          sessionId: sessionId,
          supabaseUrl: "http://127.0.0.1:54321",
          debug: true,
        });
      }
    }

    return () => {
      const sdk = getSDK();
      if (sdk && typeof sdk.destroy === "function") {
        sdk.destroy();
      }
    };
  }, [sdkLoaded, sessionId]);

  // sessionIdがない場合はSDKを読み込まない
  if (!sessionId) {
    return null;
  }

  return (
    <Script
      src="/sdk/hearing-sdk.iife.js"
      strategy="afterInteractive"
      onLoad={() => setSdkLoaded(true)}
    />
  );
}
