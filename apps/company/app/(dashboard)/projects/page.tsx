import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@repo/ui";
import { Plus, FolderKanban, FileText } from "lucide-react";

export default async function ProjectsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get company for the current user
  const { data: companyMemberData } = await (supabase
    .from("company_members") as ReturnType<typeof supabase.from>)
    .select("company_id")
    .eq("user_id", user?.id ?? "")
    .single();

  const companyMember = companyMemberData as { company_id: string } | null;
  const companyId = companyMember?.company_id;

  // Get projects for the company
  const { data: projectsData } = await (supabase
    .from("projects") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("company_id", companyId ?? "")
    .order("created_at", { ascending: false });

  const projects = projectsData as Array<{
    id: string;
    name: string;
    description: string | null;
    created_at: string;
  }> | null;

  // Get hearing counts per project
  const { data: hearingCountsData } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select("project_id")
    .eq("company_id", companyId ?? "")
    .not("project_id", "is", null);

  const hearingCounts = hearingCountsData as Array<{ project_id: string }> | null;

  const countByProject = hearingCounts?.reduce((acc, h) => {
    acc[h.project_id] = (acc[h.project_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your hearing projects
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <FolderKanban className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {project.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{countByProject[project.id] || 0} hearings</span>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString("en-US")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No projects yet
              </p>
              <Link href="/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
