import { injectStyles } from "./styles";

const ARROW_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>`;

export interface FloatingButtonOptions {
  text: string;
  position: "bottom-right" | "bottom-left";
  onClick: () => void;
}

export function createFloatingButton(options: FloatingButtonOptions): HTMLButtonElement {
  injectStyles();

  const button = document.createElement("button");
  button.className = `hearing-sdk-floating-button ${options.position} hearing-sdk-floating-button--pulse`;
  button.innerHTML = `${ARROW_ICON}<span>${options.text}</span>`;
  button.setAttribute("aria-label", options.text);

  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    options.onClick();
  });

  return button;
}

export function removeFloatingButton() {
  const existingButton = document.querySelector(".hearing-sdk-floating-button");
  if (existingButton) {
    existingButton.remove();
  }
}
