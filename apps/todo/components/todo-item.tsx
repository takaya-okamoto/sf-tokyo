"use client";

import { Trash2 } from "lucide-react";
import { Button, Card, CardContent } from "@repo/ui";
import type { Todo } from "@/lib/types";

interface TodoItemProps {
  todo: Todo;
  onDelete: (id: string) => void;
}

const urgencyStyles = {
  high: "border-l-4 border-l-red-500",
  medium: "border-l-4 border-l-yellow-500",
  low: "border-l-4 border-l-green-500",
};

const urgencyLabels = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const urgencyBadgeStyles = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

export function TodoItem({ todo, onDelete }: TodoItemProps) {
  const formattedDeadline = todo.deadline
    ? new Date(todo.deadline).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Card className={urgencyStyles[todo.urgency]}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-medium">{todo.title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${urgencyBadgeStyles[todo.urgency]}`}
            >
              {urgencyLabels[todo.urgency]}
            </span>
          </div>
          {formattedDeadline && (
            <p className="text-sm text-muted-foreground mt-1">
              Due: {formattedDeadline}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(todo.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
