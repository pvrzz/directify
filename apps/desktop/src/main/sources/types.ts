import type { BeatmapSearchQuery, BeatmapSearchResult, BeatmapSet } from "@directify/shared";

/**
 * A source adapter resolves beatmap metadata and download links from one
 * upstream provider (an existing public osu! mirror), called directly from
 * the Electron main process. directify never stores or serves .osz files
 * itself — `resolveDownloadUrl` returns the upstream's own URL, which the
 * main process downloads straight into the user's Songs folder.
 */
export interface BeatmapSource {
  readonly name: string;
  search(query: BeatmapSearchQuery): Promise<BeatmapSearchResult>;
  getBeatmapSet(id: number): Promise<BeatmapSet | null>;
  resolveDownloadUrl(beatmapSetId: number): Promise<string | null>;
}
