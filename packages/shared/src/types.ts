export type OsuMode = "osu" | "taiko" | "fruits" | "mania";

export type RankedStatus =
  | "graveyard"
  | "wip"
  | "pending"
  | "ranked"
  | "approved"
  | "qualified"
  | "loved"
  /** Status can't be determined from a local scan alone (no online lookup performed). */
  | "unknown";

/** A single difficulty within a beatmapset. */
export interface Beatmap {
  id: number;
  beatmapsetId: number;
  version: string;
  mode: OsuMode;
  difficultyRating: number;
  bpm: number;
  totalLength: number;
  /** Circle size — also doubles as the key count for mania difficulties. */
  cs: number;
  ar: number;
  od: number;
  hp: number;
  /** MD5 of the .osu file, used as the key in osu!stable's collection.db. */
  checksum: string;
}

/** A beatmapset as indexed from a source mirror. */
export interface BeatmapSet {
  id: number;
  title: string;
  artist: string;
  creator: string;
  status: RankedStatus;
  coverUrl?: string;
  previewUrl?: string;
  tags: string[];
  genre?: string;
  language?: string;
  submittedAt: string;
  updatedAt: string;
  beatmaps: Beatmap[];
  /** Which source mirror this record was resolved from, or "local" for an installed scan. */
  source: string;
  /** Present for beatmapsets found on disk; the Songs subfolder name, used for file operations. */
  folderName?: string;
}

/** osu!'s own genre enum (matches the IDs osu!/mirrors report; "any" omitted since it means "no filter"). */
export const GENRES: Record<number, string> = {
  1: "Unspecified",
  2: "Video Game",
  3: "Anime",
  4: "Rock",
  5: "Pop",
  6: "Other",
  7: "Novelty",
  9: "Hip Hop",
  10: "Electronic",
  11: "Metal",
  12: "Classical",
  13: "Folk",
  14: "Jazz",
};

/** osu!'s own language enum. */
export const LANGUAGES: Record<number, string> = {
  1: "Unspecified",
  2: "English",
  3: "Japanese",
  4: "Chinese",
  5: "Instrumental",
  6: "Korean",
  7: "French",
  8: "German",
  9: "Swedish",
  10: "Spanish",
  11: "Italian",
  12: "Russian",
  13: "Polish",
  14: "Other",
};

export interface BeatmapSearchQuery {
  query?: string;
  mode?: OsuMode;
  status?: RankedStatus;
  minStars?: number;
  maxStars?: number;
  /** Numeric genre id — see GENRES. */
  genre?: number;
  /** Numeric language id — see LANGUAGES. */
  language?: number;
  /** Mania key count (4, 7, ...) — matched against difficulty CS. Ignored unless mode is "mania". */
  keys?: number;
  page?: number;
  pageSize?: number;
}

export interface BeatmapSearchResult {
  results: BeatmapSet[];
  page: number;
  pageSize: number;
  total: number;
}

/** In-memory representation of an osu!stable collection. */
export interface Collection {
  name: string;
  /** Beatmap (.osu) MD5 checksums belonging to this collection. */
  beatmapChecksums: string[];
}

export interface CollectionDatabase {
  version: number;
  collections: Collection[];
}

export interface BeatmapSourceConfig {
  id: string;
  name: string;
  baseUrl: string;
  builtIn?: boolean;
  enabled: boolean;
}

export type ThemeMode = "dark" | "light" | "system";

export type ProxyType = "none" | "http" | "https" | "socks4" | "socks5";

export interface ProxyConfig {
  type: ProxyType;
  host: string;
  port: string;
}
