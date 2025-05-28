import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "jochenkohler";
  const REPO_NAME = "rowing-logbook";
  const FILE_PATH = "Data/rowing-logbook.json";
  const BRANCH = "main";

  // Validate environment
  if (!GITHUB_TOKEN) {
    console.error("Missing GITHUB_TOKEN environment variable");
    return res.status(500).json({ error: "Server misconfiguration: missing GITHUB_TOKEN" });
  }

  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    // Try fetching existing file, fallback to empty array if not found
    let sha;
    let logbook;
    try {
      const { data: getData } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: FILE_PATH,
        ref: BRANCH,
      });
      sha = getData.sha;
      const content = Buffer.from(getData.content, "base64").toString();
      logbook = JSON.parse(content);
    } catch (fetchErr) {
      // Log fetch error details
      console.error("Error fetching file:", fetchErr);
      const status = fetchErr.status || fetchErr.response?.status;
      if (status === 404) {
        // File not found: we'll create it
        sha = undefined;
        logbook = [];
      } else if (status === 401 || status === 403) {
        return res.status(status).json({ error: "GitHub authentication/permission error" });
      } else {
        throw fetchErr;
      }
    }

    // 2) Append new entries
    const newEntries = req.body.newTours;
    if (!Array.isArray(newEntries) || newEntries.length === 0) {
      return res.status(400).json({ error: 'Body must contain non-empty newTours array' });
    }
    const updated = [...logbook, ...newEntries];

    // 3) Commit updated file
    const newContent = Buffer.from(
      JSON.stringify(updated, null, 2)
    ).toString("base64");
    const commitParams = {
      owner: jochenkohler,
      repo: rowing-logbook,
      path: /Data/rowing-logbook.json,
      message: `Add ${newEntries.length} tour(s): ${newEntries.map(t => t.boatName).join(", ")}`,
      content: newContent,
      branch: BRANCH,
    };
    if (sha) commitParams.sha = sha;
    try {
      await octokit.repos.createOrUpdateFileContents(commitParams);
    } catch (commitErr) {
      console.error("Error committing file:", commitErr);
      const status = commitErr.status || commitErr.response?.status;
      return res.status(status || 500).json({ error: commitErr.message });
    }

    return res.status(200).json({ success: true, totalTours: updated.length });
  } catch (err) {
    console.error("saveLog handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
