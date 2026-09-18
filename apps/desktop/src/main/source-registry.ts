// Tries enabled beatmap sources in the user's configured order, falling
// through to the next one on failure, and throttles per-source requests so
// rapid filter changes (typing, dragging the star slider) can't hammer a
// mirror faster than a search reasonably should. Downloads prefer the
// mirror a search result actually came from (freshest data), but fall back
// to any other enabled mirror on failure — beatmapset ids are the same
// across mirrors (they all index the same osu.ppy.sh catalog), so a mirror
// having a transient outage or its own rate limit doesn't need to fail the
// whole install.
import type {
  BeatmapSearchQuery,
  BeatmapSearchResult,
  BeatmapSet,
  BeatmapSourceConfig,
} from "@directify/shared";
import { MirrorSource } from "./sources/mirror-source.js";

const MIN_REQUEST_INTERVAL_MS = 350;
const lastRequestAt = new Map<string, number>();

async function throttle(sourceId: string): Promise<void> {
  const last = lastRequestAt.get(sourceId) ?? 0;
  const wait = last + MIN_REQUEST_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt.set(sourceId, Date.now());
}

function enabledInOrder(sources: BeatmapSourceConfig[]): BeatmapSourceConfig[] {
  return sources.filter((s) => s.enabled);
}

export async function searchWithFallback(
  sources: BeatmapSourceConfig[],
  query: BeatmapSearchQuery
): Promise<BeatmapSearchResult> {
  const candidates = enabledInOrder(sources);
  if (candidates.length === 0) {
    throw new Error("No beatmap search sources are enabled.");
  }

  let lastError: unknown;
  for (const config of candidates) {
    try {
      await throttle(config.id);
      return await new MirrorSource(config).search(query);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All beatmap sources failed.");
}

export async function getBeatmapSetByIdWithFallback(
  sources: BeatmapSourceConfig[],
  beatmapSetId: number
): Promise<BeatmapSet | null> {
  const candidates = enabledInOrder(sources);
  if (candidates.length === 0) {
    throw new Error("No beatmap search sources are enabled.");
  }

  let lastError: unknown;
  for (const config of candidates) {
    try {
      await throttle(config.id);
      const set = await new MirrorSource(config).getBeatmapSet(beatmapSetId);
      if (set) return set;
    } catch (err) {
      lastError = err;
    }
  }
  if (lastError) throw lastError instanceof Error ? lastError : new Error("All beatmap sources failed.");
  return null;
}

export async function installBeatmapSetWithFallback(
  sources: BeatmapSourceConfig[],
  preferredSourceName: string,
  beatmapSetId: number,
  install: (downloadUrl: string) => Promise<void>
): Promise<void> {
  const candidates = enabledInOrder(sources);
  if (candidates.length === 0) {
    throw new Error("No beatmap search sources are enabled.");
  }

  const ordered = [
    ...candidates.filter((c) => c.name === preferredSourceName),
    ...candidates.filter((c) => c.name !== preferredSourceName),
  ];

  let lastError: unknown;
  for (const config of ordered) {
    try {
      await throttle(config.id);
      const url = await new MirrorSource(config).resolveDownloadUrl(beatmapSetId);
      if (!url) continue;
      await install(url);
      return;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("No source could download this beatmapset.");
}
