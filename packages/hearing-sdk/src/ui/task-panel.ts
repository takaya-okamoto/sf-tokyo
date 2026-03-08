import type { TodoItem } from "../types";
import { injectStyles } from "./styles";

const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;

export interface TaskPanelOptions {
  todos: TodoItem[];
  position: "bottom-right" | "bottom-left";
}

export function createTaskPanel(options: TaskPanelOptions): HTMLDivElement {
  injectStyles();

  const panel = document.createElement("div");
  panel.className = `hearing-sdk-task-panel ${options.position}`;

  if (options.todos.length === 0) {
    return panel;
  }

  const header = document.createElement("div");
  header.className = "hearing-sdk-task-panel-header";
  header.textContent = "Tasks to Complete";
  panel.appendChild(header);

  const list = document.createElement("ul");
  list.className = "hearing-sdk-task-panel-list";

  options.todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = "hearing-sdk-task-panel-item";
    item.innerHTML = `
      <span class="hearing-sdk-task-panel-checkbox">${CHECK_ICON}</span>
      <span class="hearing-sdk-task-panel-content">${todo.content}</span>
    `;
    item.addEventListener("click", () => {
      item.classList.toggle("completed");
    });
    list.appendChild(item);
  });

  panel.appendChild(list);

  return panel;
}

export function removeTaskPanel() {
  const existingPanel = document.querySelector(".hearing-sdk-task-panel");
  if (existingPanel) {
    existingPanel.remove();
  }
}
