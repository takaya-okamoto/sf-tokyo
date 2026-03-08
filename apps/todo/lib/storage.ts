import type { Todo } from "./types";

const STORAGE_KEY = "todos";

export function loadTodos(): Todo[] {
  if (typeof window === "undefined") {
    return [];
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored) as Todo[];
  } catch {
    return [];
  }
}

export function saveTodos(todos: Todo[]): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function generateId(): string {
  return crypto.randomUUID();
}
