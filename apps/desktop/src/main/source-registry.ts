// Tries enabled beatmap sources in the user's configured order, falling
// through to the next one on failure, and throttles per-source requests so
// rapid filter changes (typing, dragging the star slider) can't hammer a
// mirror faster than a search reasonably should. Install/download always
// goes back to the specific mirror a result came from — each mirror has its
// own independent id space, so a numeric id from one can't be assumed to
// exist, let alone mean the same thing, on another.
import type { BeatmapSearchQuery, BeatmapSearchResult, BeatmapSourceConfig } from "@directify/shared";
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

export async function resolveDownloadUrlForResult(
  sources: BeatmapSourceConfig[],
  sourceName: string,
  beatmapSetId: number
): Promise<string | null> {
  const config =
    sources.find((s) => s.name === sourceName && s.enabled) ?? enabledInOrder(sources)[0];
  if (!config) return null;
  await throttle(config.id);
  return new MirrorSource(config).resolveDownloadUrl(beatmapSetId);
}
