// Songs-folder operations: scanning installed beatmapsets (parsing .osu files
// rather than the binary osu!.db, since that format shifts between osu!
// versions and text parsing is immune to it), zip backup/restore, and
// installing a beatmapset (downloading its .osz plus caching its cover image
// locally so the Library still shows artwork offline).
import type { Beatmap, BeatmapSet } from "@directify/shared";
import archiver from "archiver";
import { net } from "electron";
import extractZip from "extract-zip";
import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { parseOsuFile } from "./osu-file.js";
import { songsDir } from "./osu-install.js";

export interface BackupManifest {
  createdAt: string;
  osuInstallDir: string;
  beatmapFolders: string[];
}

const CACHED_COVER_BASENAME = "directify-cover";

function findCachedCover(folderPath: string): string | null {
  for (const ext of [".jpg", ".jpeg", ".png"]) {
    const path = join(folderPath, `${CACHED_COVER_BASENAME}${ext}`);
    if (existsSync(path)) return path;
  }
  return null;
}

async function coverToDataUrl(coverPath: string): Promise<string> {
  const buffer = await readFile(coverPath);
  const ext = extname(coverPath).slice(1);
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function remoteCoverUrl(beatmapSetId: number): string {
  return `https://assets.ppy.sh/beatmaps/${beatmapSetId}/covers/cover.jpg`;
}

async function cacheCoverInBackground(folderPath: string, beatmapSetId: number): Promise<void> {
  try {
    const res = await net.fetch(remoteCoverUrl(beatmapSetId));
    if (!res.ok) return;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (!findCachedCover(folderPath)) {
      await writeFile(join(folderPath, `${CACHED_COVER_BASENAME}.jpg`), buffer);
    }
  } catch {
    /* empty */
  }
}

export function listInstalledBeatmapFolders(installDir: string): string[] {
  const dir = songsDir(installDir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((entry) => statSync(join(dir, entry)).isDirectory());
}

export async function scanInstalledBeatmapSets(installDir: string): Promise<BeatmapSet[]> {
  const dir = songsDir(installDir);
  if (!existsSync(dir)) return [];

  const sets: BeatmapSet[] = [];

  for (const folderName of listInstalledBeatmapFolders(installDir)) {
    const folderPath = join(dir, folderName);
    const osuFiles = readdirSync(folderPath).filter((f) => f.toLowerCase().endsWith(".osu"));
    if (osuFiles.length === 0) continue;

    const beatmaps: Beatmap[] = [];
    let beatmapSetId = 0;

    for (const osuFile of osuFiles) {
      const parsed = parseOsuFile(join(folderPath, osuFile));
      if (!parsed) continue;
      if (parsed.beatmapSetId > 0) beatmapSetId = parsed.beatmapSetId;
      beatmaps.push({
        id: parsed.beatmapId,
        beatmapsetId: parsed.beatmapSetId,
        version: parsed.version,
        mode: parsed.mode,
        difficultyRating: 0,
        bpm: 0,
        totalLength: 0,
        cs: parsed.cs,
        ar: parsed.ar,
        od: parsed.od,
        hp: parsed.hp,
        checksum: parsed.checksum,
      });
    }

    if (beatmaps.length === 0) continue;
    const first = parseOsuFile(join(folderPath, osuFiles[0]));
    if (!first) continue;

    const cachedCover = findCachedCover(folderPath);
    let coverUrl: string | undefined;
    if (cachedCover) {
      coverUrl = await coverToDataUrl(cachedCover);
    } else if (beatmapSetId > 0) {
      coverUrl = remoteCoverUrl(beatmapSetId);
      void cacheCoverInBackground(folderPath, beatmapSetId);
    }

    sets.push({
      id: beatmapSetId || hashFolderNameToId(folderName),
      title: first.title,
      artist: first.artist,
      creator: first.creator,
      status: "unknown",
      coverUrl,
      tags: first.tags,
      submittedAt: "",
      updatedAt: "",
      beatmaps,
      source: "local",
      folderName,
    });
  }

  return sets;
}

function hashFolderNameToId(folderName: string): number {
  let hash = 0;
  for (let i = 0; i < folderName.length; i++) {
    hash = (hash * 31 + folderName.charCodeAt(i)) | 0;
  }
  return -Math.abs(hash) - 1;
}

export async function deleteBeatmapSet(installDir: string, folderName: string): Promise<void> {
  const target = join(songsDir(installDir), folderName);
  if (!existsSync(target)) return;
  await rm(target, { recursive: true, force: true });
}

export async function backupLibrary(
  installDir: string,
  destZipPath: string,
  folderNames?: string[]
): Promise<BackupManifest> {
  const songs = songsDir(installDir);
  const foldersToBackup = folderNames ?? listInstalledBeatmapFolders(installDir);

  const manifest: BackupManifest = {
    createdAt: new Date().toISOString(),
    osuInstallDir: installDir,
    beatmapFolders: foldersToBackup,
  };

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(destZipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);

    for (const folder of foldersToBackup) {
      const folderPath = join(songs, folder);
      if (existsSync(folderPath)) {
        archive.directory(folderPath, `Songs/${folder}`);
      }
    }

    archive.append(JSON.stringify(manifest, null, 2), { name: "directify-manifest.json" });
    archive.finalize();
  });

  return manifest;
}

export async function restoreBackup(zipPath: string, installDir: string): Promise<void> {
  const tempDir = await mkdtemp(join(tmpdir(), "directify-restore-"));
  try {
    await extractZip(zipPath, { dir: tempDir });
    const extractedSongs = join(tempDir, "Songs");
    if (!existsSync(extractedSongs)) return;

    const destSongs = songsDir(installDir);
    mkdirSync(destSongs, { recursive: true });

    for (const folder of readdirSync(extractedSongs)) {
      const src = join(extractedSongs, folder);
      const dest = join(destSongs, folder);
      if (!existsSync(dest)) {
        await copyDir(src, dest);
      }
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function copyDir(src: string, dest: string): Promise<void> {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await writeFile(destPath, await readFile(srcPath));
    }
  }
}

export async function installBeatmapSet(
  installDir: string,
  downloadUrl: string,
  folderName: string,
  coverUrl?: string
): Promise<void> {
  const res = await net.fetch(downloadUrl);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);

  const tempDir = await mkdtemp(join(tmpdir(), "directify-install-"));
  const oszPath = join(tempDir, `${basename(folderName)}.osz`);
  try {
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(oszPath, buffer);

    const destDir = join(songsDir(installDir), folderName);
    mkdirSync(destDir, { recursive: true });
    await extractZip(oszPath, { dir: destDir });

    if (coverUrl) {
      try {
        const coverRes = await net.fetch(coverUrl);
        if (coverRes.ok) {
          const coverBuffer = Buffer.from(await coverRes.arrayBuffer());
          await writeFile(join(destDir, `${CACHED_COVER_BASENAME}.jpg`), coverBuffer);
        }
      } catch {
        /* empty */
      }
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
