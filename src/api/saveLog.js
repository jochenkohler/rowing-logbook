export async function saveLogbookToGitHub(logbook) {
  const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
  const REPO = "jochenkohler/rowing-logbook";
  const FILE_PATH = "Data/rowing-logbook.json";
  const BRANCH = "main";

  const latestTour = logbook[logbook.length - 1];
  const date = latestTour?.date || "Unknown Date";
  const boat = latestTour?.boatName || "Unknown Boat";
  const crew = latestTour?.crew?.join(", ") || "Unknown Crew";

  const commitMessage = `Tour completed: ${boat} on ${date} with ${crew}`;

  const base64Content = btoa(unescape(encodeURIComponent(JSON.stringify(logbook, null, 2))));

  const resGet = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });

  const data = await resGet.json();
  const sha = data.sha || undefined;

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
    throw new Error("Failed to save logbook to GitHub");
  }
}
