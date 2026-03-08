"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  toast,
} from "@repo/ui";
import type { Todo, Urgency } from "@/lib/types";
import { generateId } from "@/lib/storage";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  urgency: z.enum(["low", "medium", "high"]),
  deadline: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTodoFormProps {
  onAdd: (todo: Todo) => void;
}

export function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      urgency: "medium",
      deadline: "",
    },
  });

  function onSubmit(values: FormValues) {
    const todo: Todo = {
      id: generateId(),
      title: values.title,
      urgency: values.urgency as Urgency,
      deadline: values.deadline || null,
      createdAt: new Date().toISOString(),
    };
    onAdd(todo);
    form.reset();
    toast({
      title: "Todo added",
      description: `"${values.title}" has been added to your list.`,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Task</FormLabel>
                <FormControl>
                  <Input placeholder="Enter task description..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="urgency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Urgency</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deadline</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">Add Todo</Button>
      </form>
    </Form>
  );
}
