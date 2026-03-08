import { TodoList } from "@/components/todo-list";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Todo App</h1>
          <p className="text-muted-foreground mt-2">
            Manage your tasks with urgency levels and deadlines.
          </p>
        </div>
        <TodoList />
      </div>
    </main>
  );
}
