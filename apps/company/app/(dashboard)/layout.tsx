import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Button } from "@repo/ui";
import { signOut } from "../(auth)/actions";
import { Building2, Settings, LogOut } from "lucide-react";
import { ProjectSelector } from "@/components/project-selector";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Using type assertion to bypass RLS-induced type restrictions
  const { data: companyMemberData } = await (supabase
    .from("company_members") as ReturnType<typeof supabase.from>)
    .select("company:companies(name), company_id")
    .eq("user_id", user?.id ?? "")
    .single();

  const companyMember = companyMemberData as { company: { name: string } | null; company_id: string } | null;

  const companyName = companyMember?.company?.name ?? "Company";

  // Get projects for the selector
  const { data: projectsData } = await (supabase
    .from("projects") as ReturnType<typeof supabase.from>)
    .select("id, name")
    .eq("company_id", companyMember?.company_id ?? "")
    .order("created_at", { ascending: false });

  const projects = (projectsData as Array<{ id: string; name: string }>) ?? [];

  // Redirect to onboarding if no projects exist
  if (projects.length === 0) {
    redirect("/onboarding/project");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/projects" className="flex items-center gap-2 font-semibold">
              <Building2 className="h-6 w-6" />
              <span>Hearing Platform</span>
            </Link>
            <ProjectSelector projects={projects} />
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/settings"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {companyName}
            </span>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
