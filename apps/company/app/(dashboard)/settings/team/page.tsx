import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@repo/ui";
import { ArrowLeft, UserPlus } from "lucide-react";

export default async function TeamSettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Using type assertion to bypass RLS-induced type restrictions
  const { data: currentMemberData } = await (supabase
    .from("company_members") as ReturnType<typeof supabase.from>)
    .select("company_id")
    .eq("user_id", user?.id ?? "")
    .single();

  const currentMember = currentMemberData as { company_id: string } | null;

  const { data: membersData } = await (supabase
    .from("company_members") as ReturnType<typeof supabase.from>)
    .select(`
      *,
      profile:profiles(display_name, email)
    `)
    .eq("company_id", currentMember?.company_id ?? "");

  const members = membersData as Array<{
    id: string;
    role: string;
    profile: { display_name: string | null; email: string } | null;
  }> | null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">
            Manage and invite team members
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member List</CardTitle>
          <CardDescription>
            Current team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members && members.length > 0 ? (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {member.profile && typeof member.profile === 'object' && 'display_name' in member.profile
                        ? member.profile.display_name || member.profile.email
                        : "Unknown User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.profile && typeof member.profile === 'object' && 'email' in member.profile
                        ? member.profile.email
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      member.role === "owner"
                        ? "bg-purple-100 text-purple-700"
                        : member.role === "admin"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {member.role === "owner"
                      ? "Owner"
                      : member.role === "admin"
                        ? "Admin"
                        : "Member"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No members
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
