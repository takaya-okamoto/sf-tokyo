import { InterviewTracker } from "./tracker";
import type { HearingSDKConfig } from "./types";

export type { HearingSDKConfig, SdkEvent } from "./types";
export { InterviewTracker } from "./tracker";

let currentTracker: InterviewTracker | null = null;

export interface HearingSDKInterface {
  init(config: HearingSDKConfig): Promise<boolean>;
  destroy(): void;
  flush(): Promise<void>;
}

const HearingSDK: HearingSDKInterface = {
  async init(config: HearingSDKConfig): Promise<boolean> {
    if (currentTracker) {
      console.warn("[HearingSDK] Already initialized. Call destroy() first.");
      return false;
    }

    currentTracker = new InterviewTracker(config);
    return currentTracker.init();
  },

  destroy(): void {
    if (currentTracker) {
      currentTracker.destroy();
      currentTracker = null;
    }
  },

  async flush(): Promise<void> {
    if (currentTracker) {
      await currentTracker.flush();
    }
  },
};

// グローバルに公開
if (typeof window !== "undefined") {
  (window as unknown as { HearingSDK: HearingSDKInterface }).HearingSDK = HearingSDK;
}

export { HearingSDK };
