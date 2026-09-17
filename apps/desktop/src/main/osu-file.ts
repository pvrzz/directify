// Minimal reader for the [General]/[Metadata]/[Difficulty] sections of a
// .osu beatmap file (plain-text key: value format, not the binary osu!.db).
// Ignores hitobjects/timing points — only enough to display/organize a map,
// not play it. checksum is the MD5 of the raw file bytes, the same value
// osu!stable stores in collection.db.
import type { OsuMode } from "@directify/shared";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export interface ParsedOsuFile {
  title: string;
  artist: string;
  creator: string;
  version: string;
  source: string;
  tags: string[];
  beatmapId: number;
  beatmapSetId: number;
  mode: OsuMode;
  cs: number;
  ar: number;
  od: number;
  hp: number;
  checksum: string;
}

const MODE_BY_NUMBER: Record<string, OsuMode> = {
  "0": "osu",
  "1": "taiko",
  "2": "fruits",
  "3": "mania",
};

export function parseOsuFile(filePath: string): ParsedOsuFile | null {
  const buffer = readFileSync(filePath);
  const text = buffer.toString("utf8");

  const fields: Record<string, string> = {};
  let section = "";
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) continue;

    const sectionMatch = line.match(/^\[(\w+)\]$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      if (section === "Events" || section === "TimingPoints" || section === "HitObjects") break;
      continue;
    }

    if (section !== "General" && section !== "Metadata" && section !== "Difficulty") continue;

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    fields[key] = value;
  }

  if (!fields.Title && !fields.Artist) return null;

  return {
    title: fields.TitleUnicode || fields.Title || "Unknown title",
    artist: fields.ArtistUnicode || fields.Artist || "Unknown artist",
    creator: fields.Creator || "Unknown creator",
    version: fields.Version || "Normal",
    source: fields.Source || "",
    tags: fields.Tags ? fields.Tags.split(/\s+/).filter(Boolean) : [],
    beatmapId: Number(fields.BeatmapID) || 0,
    beatmapSetId: Number(fields.BeatmapSetID) || 0,
    mode: MODE_BY_NUMBER[fields.Mode ?? "0"] ?? "osu",
    cs: Number(fields.CircleSize) || 0,
    ar: Number(fields.ApproachRate ?? fields.OverallDifficulty) || 0,
    od: Number(fields.OverallDifficulty) || 0,
    hp: Number(fields.HPDrainRate) || 0,
    checksum: createHash("md5").update(buffer).digest("hex"),
  };
}
