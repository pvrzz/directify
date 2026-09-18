// BeatmapSource for any catboy.best-compatible mirror API (the open-source
// server software several community osu! mirrors run) — search, metadata,
// and .osz download, parametrized by base URL so users can add their own
// compatible mirror alongside the built-in catboy.best entry. Verified live
// against the real catboy.best API on 2026-09-17: GET /api/search,
// GET /api/v2/s/:id, GET /d/:id. Requests go through electron.net.fetch
// (Chromium's network stack) rather than Node's fetch, which some hosts
// behind Cloudflare-style bot protection 403 outright.
import type {
  Beatmap,
  BeatmapSearchQuery,
  BeatmapSearchResult,
  BeatmapSet,
  BeatmapSortOption,
  OsuMode,
  RankedStatus,
} from "@directify/shared";
import { net } from "electron";
import type { BeatmapSource } from "./types.js";

const STATUS_BY_CODE: Record<number, RankedStatus> = {
  [-2]: "graveyard",
  [-1]: "wip",
  0: "pending",
  1: "ranked",
  2: "approved",
  3: "qualified",
  4: "loved",
};

const STATUS_TO_CODE: Record<RankedStatus, number> = {
  graveyard: -2,
  wip: -1,
  pending: 0,
  ranked: 1,
  approved: 2,
  qualified: 3,
  loved: 4,
  unknown: 0,
};

const MODE_BY_NUMBER: Record<number, OsuMode> = {
  0: "osu",
  1: "taiko",
  2: "fruits",
  3: "mania",
};

interface MirrorSearchBeatmap {
  BeatmapID: number;
  ParentSetID: number;
  DiffName: string;
  Mode: number;
  DifficultyRating: number;
  BPM: number;
  TotalLength: number;
  CS: number;
  AR: number;
  OD: number;
  HP: number;
  FileMD5: string;
  Playcount?: number;
}

interface MirrorSearchResult {
  SetID: number;
  RankedStatus: number;
  Artist: string;
  Title: string;
  Creator: string;
  Tags: string;
  LastUpdate: string;
  Genre?: { ID: number; Name: string };
  Language?: { ID: number; Name: string };
  ChildrenBeatmaps: MirrorSearchBeatmap[];
  Favourites?: number;
}

function coverUrl(setId: number): string {
  return `https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg`;
}

function previewUrl(setId: number): string {
  return `https://b.ppy.sh/preview/${setId}.mp3`;
}

function maxDifficulty(set: BeatmapSet): number {
  return set.beatmaps.reduce((max, b) => Math.max(max, b.difficultyRating), 0);
}

// The search API returns results in the mirror's own relevance order, which
// is left untouched unless the user explicitly asked for something else.
function sortResults(results: BeatmapSet[], sort: BeatmapSortOption | undefined): void {
  switch (sort) {
    case "favourites":
      results.sort((a, b) => (b.favouriteCount ?? 0) - (a.favouriteCount ?? 0));
      break;
    case "plays":
      results.sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));
      break;
    case "difficulty-desc":
      results.sort((a, b) => maxDifficulty(b) - maxDifficulty(a));
      break;
    case "difficulty-asc":
      results.sort((a, b) => maxDifficulty(a) - maxDifficulty(b));
      break;
    case "newest":
      results.sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
      break;
    case "oldest":
      results.sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt));
      break;
  }
}

export class MirrorSource implements BeatmapSource {
  readonly id: string;
  readonly name: string;
  private readonly baseUrl: string;

  constructor(config: { id: string; name: string; baseUrl: string }) {
    this.id = config.id;
    this.name = config.name;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
  }

  private toBeatmapSet(raw: MirrorSearchResult): BeatmapSet {
    const beatmaps: Beatmap[] = raw.ChildrenBeatmaps.map((b) => ({
      id: b.BeatmapID,
      beatmapsetId: b.ParentSetID,
      version: b.DiffName,
      mode: MODE_BY_NUMBER[b.Mode] ?? "osu",
      difficultyRating: b.DifficultyRating,
      bpm: b.BPM,
      totalLength: b.TotalLength,
      cs: b.CS,
      ar: b.AR,
      od: b.OD,
      hp: b.HP,
      checksum: b.FileMD5,
    }));

    return {
      id: raw.SetID,
      title: raw.Title,
      artist: raw.Artist,
      creator: raw.Creator,
      status: STATUS_BY_CODE[raw.RankedStatus] ?? "unknown",
      coverUrl: coverUrl(raw.SetID),
      previewUrl: previewUrl(raw.SetID),
      tags: raw.Tags ? raw.Tags.split(/\s+/).filter(Boolean) : [],
      genre: raw.Genre?.Name,
      language: raw.Language?.Name,
      submittedAt: raw.LastUpdate,
      updatedAt: raw.LastUpdate,
      beatmaps,
      source: this.name,
      favouriteCount: raw.Favourites,
      playCount: raw.ChildrenBeatmaps.reduce((sum, b) => sum + (b.Playcount ?? 0), 0),
    };
  }

  async search(query: BeatmapSearchQuery): Promise<BeatmapSearchResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 30;

    const params = new URLSearchParams();
    if (query.query) params.set("query", query.query);
    params.set("limit", String(pageSize));
    params.set("offset", String((page - 1) * pageSize));
    if (query.mode) {
      const modeNumber = Object.entries(MODE_BY_NUMBER).find(([, m]) => m === query.mode)?.[0];
      if (modeNumber) params.set("mode", modeNumber);
    }
    if (query.status) params.set("status", String(STATUS_TO_CODE[query.status]));

    const res = await net.fetch(`${this.baseUrl}/api/search?${params}`);
    if (!res.ok) throw new Error(`${this.name} search failed: ${res.status} ${res.statusText}`);

    // Everything below is applied client-side rather than as extra query
    // params: mode/status are the only fields verified across mirrors, and a
    // custom user-added endpoint's exact param support is unknown — filtering
    // the (documented, required) response shape after the fact works
    // identically on every compatible mirror without risking a query it
    // doesn't understand.
    const raw = (await res.json()) as MirrorSearchResult[];
    const filteredRaw = raw.filter((r) => {
      if (query.genre !== undefined && r.Genre?.ID !== query.genre) return false;
      if (query.language !== undefined && r.Language?.ID !== query.language) return false;
      if (
        query.mode === "mania" &&
        query.keys !== undefined &&
        !r.ChildrenBeatmaps.some((b) => b.Mode === 3 && Math.round(b.CS) === query.keys)
      ) {
        return false;
      }
      return true;
    });

    const results = filteredRaw.map((r) => this.toBeatmapSet(r)).filter((set) => {
      if (query.minStars !== undefined && !set.beatmaps.some((b) => b.difficultyRating >= query.minStars!)) {
        return false;
      }
      if (query.maxStars !== undefined && !set.beatmaps.some((b) => b.difficultyRating <= query.maxStars!)) {
        return false;
      }
      return true;
    });

    sortResults(results, query.sort);

    return { results, page, pageSize, total: results.length };
  }

  async getBeatmapSet(id: number): Promise<BeatmapSet | null> {
    const res = await net.fetch(`${this.baseUrl}/api/v2/s/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${this.name} lookup failed: ${res.status} ${res.statusText}`);

    const raw = (await res.json()) as any;
    const beatmaps: Beatmap[] = (raw.beatmaps ?? []).map((b: any) => ({
      id: b.id,
      beatmapsetId: id,
      version: b.version,
      mode: (b.mode as OsuMode) ?? "osu",
      difficultyRating: b.difficulty_rating ?? 0,
      bpm: b.bpm ?? 0,
      totalLength: b.total_length ?? 0,
      cs: b.cs ?? 0,
      ar: b.ar ?? 0,
      od: b.accuracy ?? 0,
      hp: b.drain ?? 0,
      checksum: b.checksum ?? "",
    }));

    return {
      id,
      title: raw.title,
      artist: raw.artist,
      creator: raw.creator,
      status: (raw.status as RankedStatus) ?? "unknown",
      coverUrl: raw.covers?.cover ?? coverUrl(id),
      previewUrl: previewUrl(id),
      tags: raw.tags ? String(raw.tags).split(/\s+/).filter(Boolean) : [],
      submittedAt: raw.ranked_date ?? "",
      updatedAt: raw.last_updated ?? "",
      beatmaps,
      source: this.name,
      favouriteCount: raw.favourite_count,
      playCount: raw.play_count,
    };
  }

  async resolveDownloadUrl(beatmapSetId: number): Promise<string | null> {
    return `${this.baseUrl}/d/${beatmapSetId}`;
  }
}
