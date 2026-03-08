"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@repo/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
} from "@repo/ui";

interface GeneralSettingsFormProps {
  projectId: string;
  initialName: string;
  initialPurpose: string;
  initialTargetUser: string;
}

export function GeneralSettingsForm({
  projectId,
  initialName,
  initialPurpose,
  initialTargetUser,
}: GeneralSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [purpose, setPurpose] = useState(initialPurpose);
  const [targetUser, setTargetUser] = useState(initialTargetUser);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createBrowserClient();
    const { error } = await (
      supabase.from("projects") as ReturnType<typeof supabase.from>
    )
      .update({
        name: name.trim(),
        purpose: purpose.trim() || null,
        target_user: targetUser.trim() || null,
      })
      .eq("id", projectId);

    if (error) {
      setMessage({ type: "error", text: "Failed to save settings." });
    } else {
      setMessage({ type: "success", text: "Settings saved." });
      router.refresh();
    }
    setSaving(false);
  }

  const textareaClass =
    "flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configure your project name, purpose, and target users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <textarea
              id="purpose"
              className={textareaClass}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="What is the goal of this project?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetUser">Target Users</Label>
            <textarea
              id="targetUser"
              className={textareaClass}
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="Who are the target users for this project?"
              rows={3}
            />
          </div>

          {message && (
            <p
              className={`text-sm ${message.type === "success" ? "text-green-600" : "text-destructive"}`}
            >
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
