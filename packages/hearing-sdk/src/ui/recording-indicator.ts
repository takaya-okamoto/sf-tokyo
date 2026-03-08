import { injectStyles } from "./styles";

export function createRecordingIndicator(): HTMLDivElement {
  injectStyles();

  const indicator = document.createElement("div");
  indicator.className = "hearing-sdk-recording-indicator";
  indicator.id = "hearing-sdk-recording-indicator";

  const dot = document.createElement("div");
  dot.className = "hearing-sdk-recording-indicator__dot";

  const text = document.createElement("span");
  text.textContent = "REC";

  indicator.appendChild(dot);
  indicator.appendChild(text);

  return indicator;
}

export function showRecordingIndicator() {
  if (document.getElementById("hearing-sdk-recording-indicator")) {
    return;
  }

  const indicator = createRecordingIndicator();
  document.body.appendChild(indicator);
}

export function removeRecordingIndicator() {
  const indicator = document.getElementById("hearing-sdk-recording-indicator");
  if (indicator) {
    indicator.remove();
  }
}
