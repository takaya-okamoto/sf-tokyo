import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@repo/ui";
import { ArrowLeft, Code, Settings } from "lucide-react";
import { SdkCodeBlock } from "./_components/sdk-code-block";
import { GeneralSettingsForm } from "./_components/general-settings-form";

export default async function ProjectSettingsPage({
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
    purpose: string | null;
    target_user: string | null;
  } | null;

  if (!project) {
    notFound();
  }

  // SDK設定用の環境変数（実際のデプロイ時に設定）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
  const sdkCdnUrl = process.env.SDK_CDN_URL || "https://cdn.example.com/sdk";

  const sdkEmbedCode = `<!-- Hearing SDK -->
<script src="${sdkCdnUrl}/hearing-sdk.iife.js"></script>
<script>
  (function() {
    var urlParams = new URLSearchParams(window.location.search);
    var sessionId = urlParams.get('hSessionId');

    if (sessionId && window.HearingSDK) {
      window.HearingSDK.init({
        sessionId: sessionId,
        supabaseUrl: '${supabaseUrl}',
        debug: false
      });
    }
  })();
</script>`;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold">{project.name} - Settings</h1>
        </div>
        <p className="text-muted-foreground ml-9">
          Configure your project settings and SDK integration
        </p>
      </div>

      <Tabs defaultValue="sdk" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sdk" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            SDK Integration
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sdk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SDK Integration</CardTitle>
              <CardDescription>
                Add this code to your website to track user behavior during hearing sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">How it works</h3>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>User starts a hearing session and visits your website</li>
                  <li>The URL will contain a <code className="bg-muted px-1 rounded">hSessionId</code> parameter</li>
                  <li>The SDK automatically tracks clicks, scrolls, and page views</li>
                  <li>A floating button allows users to return to the interview</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Installation</h3>
                <p className="text-sm text-muted-foreground">
                  Add the following code to your website, preferably just before the closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag:
                </p>
                <SdkCodeBlock code={sdkEmbedCode} />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Configuration Options</h3>
                <div className="text-sm text-muted-foreground">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Option</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-left p-2 font-medium">Default</th>
                        <th className="text-left p-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2"><code className="bg-muted px-1 rounded">sessionId</code></td>
                        <td className="p-2">string</td>
                        <td className="p-2">-</td>
                        <td className="p-2">Required. Session ID from URL parameter</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2"><code className="bg-muted px-1 rounded">supabaseUrl</code></td>
                        <td className="p-2">string</td>
                        <td className="p-2">-</td>
                        <td className="p-2">Required. Supabase project URL</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2"><code className="bg-muted px-1 rounded">debug</code></td>
                        <td className="p-2">boolean</td>
                        <td className="p-2">false</td>
                        <td className="p-2">Enable console logging</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2"><code className="bg-muted px-1 rounded">buttonText</code></td>
                        <td className="p-2">string</td>
                        <td className="p-2">&quot;Return to Interview&quot;</td>
                        <td className="p-2">Floating button text</td>
                      </tr>
                      <tr>
                        <td className="p-2"><code className="bg-muted px-1 rounded">buttonPosition</code></td>
                        <td className="p-2">string</td>
                        <td className="p-2">&quot;bottom-right&quot;</td>
                        <td className="p-2">&quot;bottom-right&quot; or &quot;bottom-left&quot;</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <GeneralSettingsForm
            projectId={projectId}
            initialName={project.name}
            initialPurpose={project.purpose ?? ""}
            initialTargetUser={project.target_user ?? ""}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
