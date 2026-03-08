import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Button } from "@repo/ui";
import { Plus, Settings } from "lucide-react";

type HearingRow = {
  id: string;
  title: string;
  status: "draft" | "active" | "paused" | "completed" | "archived";
  reward_per_user: number | null;
  total_budget_cap: number | null;
  created_at: string;
};

type SessionRow = {
  id: string;
  status: string;
  hearing_request_id: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  completed: "Closed",
  archived: "Archived",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  archived: "bg-gray-100 text-gray-500",
};

const FEE_RATE = 0.25;

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerClient();

  // Get project
  const { data: projectData } = await (supabase
    .from("projects") as ReturnType<typeof supabase.from>)
    .select("*")
    .eq("id", projectId)
    .single();

  const project = projectData as {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
  } | null;

  if (!project) {
    notFound();
  }

  // Get all hearing requests for this project
  const { data: hearingsData } = await (supabase
    .from("hearing_requests") as ReturnType<typeof supabase.from>)
    .select("id, title, status, reward_per_user, total_budget_cap, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const hearings = (hearingsData as HearingRow[] | null) ?? [];

  // Get all sessions for these hearings
  const hearingIds = hearings.map((h) => h.id);
  let sessions: SessionRow[] = [];
  if (hearingIds.length > 0) {
    const { data: sessionsData } = await (supabase
      .from("interview_sessions") as ReturnType<typeof supabase.from>)
      .select("id, status, hearing_request_id")
      .in("hearing_request_id", hearingIds);
    sessions = (sessionsData as SessionRow[] | null) ?? [];
  }

  // Group sessions by hearing_request_id
  const sessionsByHearing: Record<string, SessionRow[]> = {};
  for (const s of sessions) {
    if (!sessionsByHearing[s.hearing_request_id]) {
      sessionsByHearing[s.hearing_request_id] = [];
    }
    sessionsByHearing[s.hearing_request_id]!.push(s);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.description || "Project dashboard"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${projectId}/settings`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          {hearings.length > 0 && (
            <Link href={`/projects/${projectId}/hearings/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Interview
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Interview List Table */}
      <div>
        <h2 className="text-xl font-bold mb-4">Interviews</h2>

        {hearings.length === 0 ? (
          <div className="border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No interviews created yet.
            </p>
            <Link href={`/projects/${projectId}/hearings/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Interview
              </Button>
            </Link>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 text-sm font-semibold">
                    Title
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">
                    PV
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">
                    Completed
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold">
                    Cost
                  </th>
                  <th className="w-[40px]" />
                </tr>
              </thead>
              <tbody>
                {hearings.map((hearing) => {
                  const hSessions = sessionsByHearing[hearing.id] ?? [];
                  const totalPV = hSessions.length;
                  const completedCount = hSessions.filter(
                    (s) => s.status === "completed"
                  ).length;

                  const reward = hearing.reward_per_user ?? 0;
                  const fee = Math.ceil(reward * FEE_RATE);
                  const costPerUser = reward + fee;
                  const totalCap = hearing.total_budget_cap ?? 0;
                  const spent = completedCount * costPerUser;
                  const remaining = Math.max(totalCap - spent, 0);

                  return (
                    <tr
                      key={hearing.id}
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      {/* Title */}
                      <td className="px-4 py-4">
                        <Link
                          href={`/projects/${projectId}/hearings/${hearing.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {hearing.title}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(hearing.created_at).toLocaleDateString("ja-JP")}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[hearing.status] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {STATUS_LABELS[hearing.status] ?? hearing.status}
                        </span>
                      </td>

                      {/* PV (total sessions) */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-lg font-bold">{totalPV}</span>
                      </td>

                      {/* Completed */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-lg font-bold">{completedCount}</span>
                        {totalPV > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({Math.round((completedCount / totalPV) * 100)}%)
                          </span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="text-xs text-muted-foreground">
                            Remaining
                          </div>
                          <div className="text-sm font-bold">
                            {remaining > 0 ? (
                              <>{remaining.toLocaleString()}<span className="text-xs font-normal ml-0.5">JPY</span></>
                            ) : totalCap > 0 ? (
                              <span className="text-destructive">0 JPY</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                          <div className="border-t border-border w-full my-0.5" />
                          <div className="text-[11px] text-muted-foreground">
                            {reward > 0 ? (
                              <>{reward.toLocaleString()} JPY / user</>
                            ) : (
                              <>-</>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Link */}
                      <td className="px-2 py-4 text-center">
                        <Link href={`/projects/${projectId}/hearings/${hearing.id}`}>
                          <Button variant="ghost" size="sm">
                            &rarr;
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
