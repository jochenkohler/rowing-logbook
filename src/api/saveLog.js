import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "jochenkohler";
  const REPO_NAME = "rowing-logbook";
  const FILE_PATH = "Data/rowing-logbook.json";
  const BRANCH = "main";

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
      if (fetchErr.status === 404) {
        // File not found: initialize empty logbook
        sha = undefined;
        logbook = [];
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
    const newContent = Buffer.from(JSON.stringify(updated, null, 2)).toString("base64");
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: `Add ${newEntries.length} tour(s): ${newEntries.map(t => t.boatName).join(", ")}`,
      content: newContent,
      sha,
      branch: BRANCH,
    });

    return res.status(200).json({ success: true, totalTours: updated.length });
  } catch (err) {
    console.error("saveLog handler error:", err);
    // Return error message to client
    return res.status(500).json({ error: err.message });
  }
}
