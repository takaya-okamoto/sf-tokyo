import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@repo/ui";
import { Building2, Users } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Using type assertion to bypass RLS-induced type restrictions
  const { data: companyMemberData } = await (supabase
    .from("company_members") as ReturnType<typeof supabase.from>)
    .select("company:companies(*)")
    .eq("user_id", user?.id ?? "")
    .single();

  const companyMember = companyMemberData as {
    company: { name: string; website: string | null; description: string | null } | null;
  } | null;

  const company = companyMember?.company ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Company information and account settings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Company Information</CardTitle>
            </div>
            <CardDescription>
              Manage company basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {company && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Company Name</p>
                  <p className="font-medium">{company.name}</p>
                </div>
                {company.website && (
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <p className="font-medium">{company.website}</p>
                  </div>
                )}
                {company.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{company.description}</p>
                  </div>
                )}
              </>
            )}
            <Button variant="outline">Edit</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Team Members</CardTitle>
            </div>
            <CardDescription>
              Manage and invite team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/team">
              <Button variant="outline">Manage Members</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
