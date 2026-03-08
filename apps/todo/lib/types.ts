export type Urgency = "low" | "medium" | "high";

export interface Todo {
  id: string;
  title: string;
  urgency: Urgency;
  deadline: string | null; // ISO date string
  createdAt: string; // ISO date string
}
