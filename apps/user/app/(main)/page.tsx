import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from "@repo/ui";
import { Clock, Gift } from "lucide-react";

export default async function HomePage() {
  const supabase = await createServerClient();

  // Using type assertion to bypass RLS-induced type restrictions
  const { data: hearingsData } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select(`
      *,
      company:companies(name, logo_url)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const hearings = hearingsData as Array<{
    id: string;
    title: string;
    target_url: string;
    reward_amount: number | null;
    reward_type: string | null;
    estimated_duration: number | null;
    reward_per_user: number | null;
    company: { name: string; logo_url: string | null } | null;
  }> | null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Hearing Requests</h1>
        <p className="text-muted-foreground">
          Browse available hearings. Participate in ones that interest you and earn rewards.
        </p>
      </div>

      {hearings && hearings.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hearings.map((hearing) => (
            <Card key={hearing.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {hearing.company && typeof hearing.company === 'object' && 'name' in hearing.company
                        ? hearing.company.name
                        : "Company"}
                    </p>
                    <CardTitle className="text-lg">{hearing.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {hearing.estimated_duration
                        ? `About ${hearing.estimated_duration} min`
                        : "About 15-30 min"}
                    </span>
                  </div>
                  {(hearing.reward_per_user || hearing.reward_amount) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Gift className="h-4 w-4 text-green-600" />
                      <span className="text-green-600 font-medium">
                        {hearing.reward_per_user
                          ? `¥${hearing.reward_per_user.toLocaleString()}`
                          : hearing.reward_type === "cash"
                            ? `¥${hearing.reward_amount?.toLocaleString()}`
                            : `${hearing.reward_amount} points`}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/requests/${hearing.id}`} className="w-full">
                  <Button className="w-full">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No available hearings at the moment. Please check back later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
