import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "jochenkohler";
  const REPO_NAME  = "rowing-logbook";
  const FILE_PATH  = "Data/rowing-logbook.json";
  const BRANCH     = "main";

  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  if (req.method !== "POST") {
    return res.status(405).end();
  }
  // 1) Fetch the current file from GitHub
  const { data: getData } = await octokit.repos.getContent({
    owner: jochenkohler,
    repo: rowing-logbook,
    path: /Data/rowing-logbook.json,
    ref: main,
  });
  const sha     = getData.sha;
  const content = Buffer.from(getData.content, "base64").toString();
  const logbook = JSON.parse(content);

  // 2) Append new tours from the request
  const newEntries = req.body.newTours; // send just the new ones
  const updated   = logbook.concat(newEntries);

  // 3) Commit the updated JSON back to GitHub
  const newContent = Buffer.from(JSON.stringify(updated, null, 2)).toString("base64");
  await octokit.repos.createOrUpdateFileContents({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: FILE_PATH,
    message: `Add ${newEntries.length} tour(s) (${newEntries.map(t => t.boatName).join(", ")})`,
    content: newContent,
    sha,
    branch: BRANCH,
  });

  res.status(200).json({ success: true, totalTours: updated.length });
}
