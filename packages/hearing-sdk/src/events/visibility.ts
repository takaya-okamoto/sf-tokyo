import type { SdkEvent } from "../types";

export function createVisibilityHandler(
  addEvent: (event: SdkEvent) => void,
  getElapsedMs: () => number
) {
  return function handleVisibilityChange() {
    const event: SdkEvent = {
      eventType: "visibility_change",
      pageUrl: window.location.href,
      pageTitle: document.title,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      elapsedMs: getElapsedMs(),
      timestamp: new Date().toISOString(),
      metadata: {
        visibilityState: document.visibilityState,
        hidden: document.hidden,
      },
    };

    addEvent(event);
  };
}
