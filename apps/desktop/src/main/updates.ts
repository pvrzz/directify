// Checks GitHub Releases for a newer portable build than the one currently
// running. directify ships as a single portable .exe with no installer or
// auto-updater — settings/library cache live in %APPDATA%, so "updating" is
// just swapping the .exe for a newer one — this only tells the user one exists.
import { net } from "electron";

const REPO = "pvrzz/directify";

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseUrl?: string;
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => Number(n) || 0);
  const pb = b.split(".").map((n) => Number(n) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export async function checkForUpdate(currentVersion: string): Promise<UpdateCheckResult> {
  try {
    const res = await net.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return { hasUpdate: false, currentVersion };

    const data = (await res.json()) as { tag_name?: string; html_url?: string };
    const latestVersion = (data.tag_name ?? "").replace(/^v/, "");
    if (!latestVersion) return { hasUpdate: false, currentVersion };

    return {
      hasUpdate: compareVersions(latestVersion, currentVersion) > 0,
      currentVersion,
      latestVersion,
      releaseUrl: data.html_url ?? `https://github.com/${REPO}/releases`,
    };
  } catch {
    return { hasUpdate: false, currentVersion };
  }
}
