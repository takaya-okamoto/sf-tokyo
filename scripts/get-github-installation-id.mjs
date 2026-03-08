import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { readFileSync } from "fs";

// Load .env.local manually
const envContent = readFileSync(".env.local", "utf-8");
const envVars = {};

let currentKey = null;
let currentValue = "";
let inMultiline = false;

for (const line of envContent.split("\n")) {
  if (!inMultiline) {
    if (line.startsWith("#") || line.trim() === "") continue;

    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (value.startsWith('"') && !value.endsWith('"')) {
        currentKey = key;
        currentValue = value.slice(1);
        inMultiline = true;
      } else if (value.startsWith('"') && value.endsWith('"')) {
        envVars[key] = value.slice(1, -1);
      } else {
        envVars[key] = value;
      }
    }
  } else {
    if (line.endsWith('"')) {
      currentValue += "\n" + line.slice(0, -1);
      envVars[currentKey] = currentValue;
      inMultiline = false;
      currentKey = null;
      currentValue = "";
    } else {
      currentValue += "\n" + line;
    }
  }
}

const privateKey = envVars.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n");

const octokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: envVars.GITHUB_APP_ID,
    privateKey: privateKey,
  },
});

async function main() {
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
