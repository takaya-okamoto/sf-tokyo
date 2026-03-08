export const FLOATING_BUTTON_STYLES = `
.hearing-sdk-recording-indicator {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999999;
  padding: 8px 16px;
  background: rgba(239, 68, 68, 0.95);
  color: white;
  border: none;
  border-radius: 50px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  pointer-events: none;
}

.hearing-sdk-recording-indicator__dot {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  animation: hearing-sdk-recording-blink 1s infinite;
}

@keyframes hearing-sdk-recording-blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.hearing-sdk-floating-button {
  position: fixed;
  z-index: 999999;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hearing-sdk-floating-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(99, 102, 241, 0.5);
}

.hearing-sdk-floating-button:active {
  transform: translateY(0);
}

.hearing-sdk-floating-button.bottom-right {
  bottom: 24px;
  right: 24px;
}

.hearing-sdk-floating-button.bottom-left {
  bottom: 24px;
  left: 24px;
}

.hearing-sdk-floating-button svg {
  width: 16px;
  height: 16px;
}

.hearing-sdk-floating-button--pulse {
  animation: hearing-sdk-pulse 2s infinite;
}

@keyframes hearing-sdk-pulse {
  0% {
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  }
  50% {
    box-shadow: 0 4px 30px rgba(99, 102, 241, 0.6);
  }
  100% {
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  }
}
`;

export function injectStyles() {
  if (document.getElementById("hearing-sdk-styles")) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = "hearing-sdk-styles";
  styleElement.textContent = FLOATING_BUTTON_STYLES;
  document.head.appendChild(styleElement);
}
