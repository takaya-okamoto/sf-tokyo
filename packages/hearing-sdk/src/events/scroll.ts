import type { SdkEvent } from "../types";

export function createScrollHandler(
  addEvent: (event: SdkEvent) => void,
  getElapsedMs: () => number
) {
  let lastDepth = 0;
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  return function handleScroll() {
    // デバウンス処理
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    scrollTimeout = setTimeout(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // スクロール深度を10%単位で計算
      const depth = Math.round(
        ((scrollTop + clientHeight) / scrollHeight) * 100 / 10
      ) * 10;

      // 10%単位で変化した場合のみイベント発火
      if (depth > lastDepth) {
        lastDepth = depth;

        const event: SdkEvent = {
          eventType: "scroll",
          pageUrl: window.location.href,
          pageTitle: document.title,
          scrollDepth: depth,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          elapsedMs: getElapsedMs(),
          timestamp: new Date().toISOString(),
        };

        addEvent(event);
      }
    }, 100);
  };
}
