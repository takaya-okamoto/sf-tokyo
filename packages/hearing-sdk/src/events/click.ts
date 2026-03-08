import type { SdkEvent } from "../types";

export function createClickHandler(
  addEvent: (event: SdkEvent) => void,
  getElapsedMs: () => number
) {
  return function handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target) return;

    // セレクタを生成
    let selector = target.tagName.toLowerCase();
    if (target.id) {
      selector = `#${target.id}`;
    } else if (target.className && typeof target.className === "string") {
      const classes = target.className.trim().split(/\s+/).slice(0, 3).join(".");
      if (classes) {
        selector = `${selector}.${classes}`;
      }
    }

    const event: SdkEvent = {
      eventType: "click",
      targetSelector: selector,
      pageUrl: window.location.href,
      pageTitle: document.title,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      xPosition: Math.round(e.clientX),
      yPosition: Math.round(e.clientY),
      elapsedMs: getElapsedMs(),
      timestamp: new Date().toISOString(),
      metadata: {
        tagName: target.tagName,
        innerText: target.innerText?.slice(0, 100),
        href: target instanceof HTMLAnchorElement ? target.href : undefined,
      },
    };

    addEvent(event);
  };
}
