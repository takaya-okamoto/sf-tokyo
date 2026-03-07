"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@repo/ui";
import { createBrowserClient } from "@/lib/supabase/client";

export default function NewHearingPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const supabase = createBrowserClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Login required");
      setLoading(false);
      return;
    }

    // Get company
    const { data: companyMemberData } = await (supabase
      .from("company_members") as ReturnType<typeof supabase.from>)
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    const companyMember = companyMemberData as { company_id: string } | null;

    if (!companyMember) {
      setError("Company information not found");
      setLoading(false);
      return;
    }

    const { error: insertError } = await (supabase
      .from("hearing_requests") as ReturnType<typeof supabase.from>)
      .insert({
        company_id: companyMember.company_id,
        project_id: projectId,
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        target_url: formData.get("targetUrl") as string,
        instructions: formData.get("instructions") as string,
        status: "draft",
      } as never);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/projects/${projectId}/hearings`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Hearing</CardTitle>
          <CardDescription>
            Enter information about the service you want users to try
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., New Feature Usability Test"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter the purpose and overview of this hearing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target Service URL</Label>
              <Input
                id="targetUrl"
                name="targetUrl"
                type="url"
                placeholder="https://example.com"
                required
              />
              <p className="text-sm text-muted-foreground">
                Enter the URL of the service you want users to try
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <textarea
                id="instructions"
                name="instructions"
                className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter the tasks and steps you want users to perform"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
