import { App } from "@octokit/app";

const app = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, "\n"),
});

async function main() {
  const octokit = await app.getOctokit();
  const { data } = await octokit.request("GET /app/installations");

  console.log("GitHub App Installations:");
  console.log("========================");

  for (const installation of data) {
    console.log({
      installationId: installation.id,
      account: installation.account?.login,
      type: installation.account?.type,
    });
  }

  if (data.length === 0) {
    console.log("No installations found. Make sure you have installed the GitHub App to a repository.");
  }
}

main().catch(console.error);
