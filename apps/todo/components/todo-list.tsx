"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent, Card, CardContent } from "@repo/ui";
import type { Todo, Urgency } from "@/lib/types";
import { loadTodos, saveTodos } from "@/lib/storage";
import { AddTodoForm } from "./add-todo-form";
import { TodoItem } from "./todo-item";

type FilterTab = "all" | Urgency;

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTodos(loadTodos());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveTodos(todos);
    }
  }, [todos, isLoaded]);

  function handleAddTodo(todo: Todo) {
    setTodos((prev) => [todo, ...prev]);
  }

  function handleDeleteTodo(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  const sortedTodos = todos.sort((a, b) => {
    const urgencyOrder = { high: 3, medium: 2, low: 1 };
    return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
  });

  const filteredTodos =
    activeTab === "all"
      ? sortedTodos
      : sortedTodos.filter((todo) => todo.urgency === activeTab);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <AddTodoForm onAdd={handleAddTodo} />
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilterTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({todos.length})</TabsTrigger>
          <TabsTrigger value="high">
            High ({todos.filter((t) => t.urgency === "high").length})
          </TabsTrigger>
          <TabsTrigger value="medium">
            Medium ({todos.filter((t) => t.urgency === "medium").length})
          </TabsTrigger>
          <TabsTrigger value="low">
            Low ({todos.filter((t) => t.urgency === "low").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredTodos.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">
                  {activeTab === "all"
                    ? "No todos yet. Add one above!"
                    : `No ${activeTab} urgency todos.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onDelete={handleDeleteTodo}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
