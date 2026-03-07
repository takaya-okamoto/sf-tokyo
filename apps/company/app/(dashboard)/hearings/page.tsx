import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@repo/ui";
import { Plus, ExternalLink } from "lucide-react";

export default async function HearingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Using type assertion to bypass RLS-induced type restrictions
  const { data: companyMemberData } = await (supabase
    .from("company_members") as ReturnType<typeof supabase.from>)
    .select("company_id")
    .eq("user_id", user?.id ?? "")
    .single();

  const companyMember = companyMemberData as { company_id: string } | null;

  const { data: hearingsData } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("company_id", companyMember?.company_id ?? "")
    .order("created_at", { ascending: false });

  const hearings = hearingsData as Array<{
    id: string;
    title: string;
    description: string | null;
    target_url: string;
    status: string;
    created_at: string;
  }> | null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hearing Management</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage hearing requests
          </p>
        </div>
        <Link href="/hearings/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        </Link>
      </div>

      {hearings && hearings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hearings.map((hearing) => (
            <Card key={hearing.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{hearing.title}</CardTitle>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      hearing.status === "active"
                        ? "bg-green-100 text-green-700"
                        : hearing.status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : hearing.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {hearing.status === "active"
                      ? "Active"
                      : hearing.status === "draft"
                        ? "Draft"
                        : hearing.status === "completed"
                          ? "Completed"
                          : hearing.status === "paused"
                            ? "Paused"
                            : "Archived"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {hearing.description || "No description"}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ExternalLink className="h-4 w-4" />
                  <span className="truncate">{hearing.target_url}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {new Date(hearing.created_at).toLocaleDateString("en-US")}
                  </span>
                  <div className="flex gap-2">
                    <Link href={`/hearings/${hearing.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/hearings/${hearing.id}/results`}>
                      <Button variant="secondary" size="sm">
                        Results
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                No hearings yet
              </p>
              <Link href="/hearings/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Hearing
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
