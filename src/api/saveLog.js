export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { logbook } = req.body;

  const GITHUB_TOKEN = process.env.VITE_GITHUB_TOKEN;
  const REPO = "jochenkohler/rowing-logbook";
  const FILE_PATH = "Data/rowing-logbook.json";
  const BRANCH = "main";

  const latestTour = logbook[logbook.length - 1];
  const date = latestTour?.date || "Unknown Date";
  const boat = latestTour?.boatName || "Unknown Boat";
  const crew = latestTour?.crew?.join(", ") || "Unknown Crew";

  const commitMessage = `Tour completed: ${boat} on ${date} with ${crew}`;

  const base64Content = Buffer.from(JSON.stringify(logbook, null, 2)).toString('base64');

  try {
    // Check if file already exists (to get sha)
    const resGet = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    });

    const getData = await resGet.json();
    const sha = getData.sha || undefined;

    // Now update or create the file
    const resPut = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch: BRANCH,
        sha: sha,
      }),
    });

    if (!resPut.ok) {
      throw new Error("GitHub save failed.");
    }

    return res.status(200).json({ message: "Saved to GitHub successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Saving to GitHub failed." });
  }
}
