import { NextRequest, NextResponse } from "next/server";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import OpenAI from "openai";

type RequestBody = {
  taskId: string;
  taskContent: string;
  taskReason: string;
  hearingId: string;
};

type FileChange = {
  path: string;
  content: string;
};

type AIResponse = {
  files: FileChange[];
  summary: string;
};

// Files to fetch from the Todo App
const TODO_APP_FILES = [
  "apps/todo/lib/types.ts",
  "apps/todo/lib/storage.ts",
  "apps/todo/components/todo-list.tsx",
  "apps/todo/components/todo-item.tsx",
  "apps/todo/components/add-todo-form.tsx",
];

// Fetch Todo App source code from GitHub
async function fetchTodoAppSource(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<Record<string, string>> {
  const sources: Record<string, string> = {};

  for (const file of TODO_APP_FILES) {
    try {
      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner,
          repo,
          path: file,
          ref: branch,
        }
      );

      if ("content" in data && typeof data.content === "string") {
        sources[file] = Buffer.from(data.content, "base64").toString("utf-8");
      }
    } catch (error) {
      console.warn(`Failed to fetch ${file}:`, error);
    }
  }

  return sources;
}

// Generate code changes using OpenAI
async function generateCodeChanges(
  taskContent: string,
  taskReason: string,
  sources: Record<string, string>
): Promise<AIResponse> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `You are a senior software engineer improving a Todo App.
Your task is to implement the following improvement by modifying the existing source code.

## Improvement Task
${taskContent}

## Why This Matters
${taskReason}

## Current Source Code
${Object.entries(sources)
  .map(
    ([path, code]) => `
### ${path}
\`\`\`typescript
${code}
\`\`\`
`
  )
  .join("\n")}

## Instructions
1. Analyze the improvement task and determine which file(s) need to be modified
2. Implement the changes to fulfill the task requirements
3. Return the COMPLETE modified file content (not just the diff)

## Output Format
Return a valid JSON object with the following structure:

{
  "files": [
    {
      "path": "apps/todo/components/todo-item.tsx",
      "content": "// Complete file content with your changes applied"
    }
  ],
  "summary": "Brief description of what was changed"
}

## Important Rules
- You MUST include at least one file in the "files" array
- The "path" must be one of the existing files provided above
- The "content" must be the COMPLETE file content, not a partial diff
- Keep the existing code structure and only add/modify what's necessary
- Maintain TypeScript types and existing imports
- Do NOT create new files

Now implement the improvement task by modifying the appropriate file(s).`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty response");
  }

  const parsed = JSON.parse(content) as AIResponse;

  // Log for debugging
  console.log("AI Response:", JSON.stringify(parsed, null, 2));

  return parsed;
}

// Validate that all file paths are within apps/todo/
function validateFilePaths(files: FileChange[]): void {
  for (const file of files) {
    if (!file.path.startsWith("apps/todo/")) {
      throw new Error(`Invalid file path: ${file.path}. Only apps/todo/ paths are allowed.`);
    }
    // Check that the path is one of the allowed files
    if (!TODO_APP_FILES.includes(file.path)) {
      throw new Error(`File path not allowed: ${file.path}`);
    }
  }
}

// Commit multiple files using git trees
async function commitMultipleFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  baseSha: string,
  files: FileChange[],
  message: string
): Promise<string> {
  // 1. Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data } = await octokit.request(
        "POST /repos/{owner}/{repo}/git/blobs",
        {
          owner,
          repo,
          content: file.content,
          encoding: "utf-8",
        }
      );
      return { path: file.path, sha: data.sha };
    })
  );

  // 2. Get the base tree
  const { data: baseCommit } = await octokit.request(
    "GET /repos/{owner}/{repo}/git/commits/{commit_sha}",
    {
      owner,
      repo,
      commit_sha: baseSha,
    }
  );

  // 3. Create new tree
  const { data: tree } = await octokit.request(
    "POST /repos/{owner}/{repo}/git/trees",
    {
      owner,
      repo,
      base_tree: baseCommit.tree.sha,
      tree: blobs.map((blob) => ({
        path: blob.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      })),
    }
  );

  // 4. Create commit
  const { data: commit } = await octokit.request(
    "POST /repos/{owner}/{repo}/git/commits",
    {
      owner,
      repo,
      message,
      tree: tree.sha,
      parents: [baseSha],
    }
  );

  // 5. Update branch reference
  await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commit.sha,
  });

  return commit.sha;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { taskId, taskContent, taskReason, hearingId } = body;

    // Validate environment variables
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
    const repoOwner = process.env.GITHUB_REPO_OWNER;
    const repoName = process.env.GITHUB_REPO_NAME;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!appId || !privateKey || !installationId || !repoOwner || !repoName) {
      return NextResponse.json(
        { error: "GitHub configuration is incomplete" },
        { status: 500 }
      );
    }

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    // Create Octokit instance with GitHub App authentication
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey,
        installationId: Number(installationId),
      },
    });

    // Get the default branch
    const { data: repo } = await octokit.request("GET /repos/{owner}/{repo}", {
      owner: repoOwner,
      repo: repoName,
    });
    const defaultBranch = repo.default_branch;

    // Get the latest commit SHA from the default branch
    const { data: ref } = await octokit.request(
      "GET /repos/{owner}/{repo}/git/ref/{ref}",
      {
        owner: repoOwner,
        repo: repoName,
        ref: `heads/${defaultBranch}`,
      }
    );
    const baseSha = ref.object.sha;

    // Create a new branch name
    const timestamp = Date.now();
    const sanitizedTaskId = taskId.replace(/[^a-zA-Z0-9-]/g, "-");
    const branchName = `fix/${sanitizedTaskId}-${timestamp}`;

    // Create the new branch
    await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
      owner: repoOwner,
      repo: repoName,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Fetch Todo App source code
    const sources = await fetchTodoAppSource(
      octokit,
      repoOwner,
      repoName,
      defaultBranch
    );

    if (Object.keys(sources).length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch Todo App source code" },
        { status: 500 }
      );
    }

    // Generate code changes using AI
    const aiResponse = await generateCodeChanges(taskContent, taskReason, sources);

    if (!aiResponse.files || aiResponse.files.length === 0) {
      return NextResponse.json(
        { error: "AI could not generate any code changes" },
        { status: 400 }
      );
    }

    // Validate file paths
    validateFilePaths(aiResponse.files);

    // Commit the changes
    await commitMultipleFiles(
      octokit,
      repoOwner,
      repoName,
      branchName,
      baseSha,
      aiResponse.files,
      `fix: ${taskContent.slice(0, 50)}${taskContent.length > 50 ? "..." : ""}`
    );

    // Create the PR
    const prTitle = `[AI Fix] ${taskContent.slice(0, 60)}${taskContent.length > 60 ? "..." : ""}`;
    const prBody = `## Overview
This PR implements code changes to the Todo App based on user feedback.

## Task Details
**${taskContent}**

### Why this matters
${taskReason}

## Changes Made
${aiResponse.summary}

## Modified Files
${aiResponse.files.map((f) => `- \`${f.path}\``).join("\n")}

## Source
- Hearing ID: \`${hearingId}\`
- Task ID: \`${taskId}\`

---
*Auto-generated by AI Code Assistant*
`;

    const { data: pr } = await octokit.request("POST /repos/{owner}/{repo}/pulls", {
      owner: repoOwner,
      repo: repoName,
      title: prTitle,
      body: prBody,
      head: branchName,
      base: defaultBranch,
    });

    return NextResponse.json({
      success: true,
      prUrl: pr.html_url,
      prNumber: pr.number,
    });
  } catch (error) {
    console.error("Error creating PR:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create PR",
      },
      { status: 500 }
    );
  }
}
