// Stand-in for the real window.directify IPC bridge, used only when the
// renderer is opened directly in a browser (outside Electron) for a quick
// visual preview. The real preload script always installs the genuine API
// before app code runs, so this never activates inside the actual app.
import type { BeatmapSet, CollectionDatabase } from "@directify/shared";
import type { AppSettings, DirectifyIpcApi } from "../../ipc-types";

export function installMockDirectifyIfNeeded(): void {
  if (typeof window === "undefined" || window.directify) return;

  let settings: AppSettings = {
    osuInstallDir: "C:\\Users\\preview\\AppData\\Local\\osu!",
    theme: "dark",
    reduceMotion: false,
    language: "en",
    proxy: { type: "none", host: "", port: "" },
    searchSources: [
      {
        id: "catboy-best",
        name: "catboy.best",
        baseUrl: "https://catboy.best",
        builtIn: true,
        enabled: true,
      },
      {
        id: "osu-direct",
        name: "osu.direct",
        baseUrl: "https://osu.direct",
        builtIn: true,
        enabled: true,
      },
    ],
  };

  let collections: CollectionDatabase = {
    version: 20240101,
    collections: [
      { name: "Favorites", beatmapChecksums: ["a".repeat(32), "b".repeat(32)] },
      { name: "Farm maps", beatmapChecksums: ["c".repeat(32)] },
    ],
  };

  let installedSets: BeatmapSet[] = [
    {
      id: 1,
      title: "sample beatmapset",
      artist: "Sample Artist",
      creator: "sample_mapper",
      status: "unknown",
      tags: ["sample"],
      submittedAt: "",
      updatedAt: "",
      source: "local",
      folderName: "1 Sample Artist - sample beatmapset",
      beatmaps: [
        {
          id: 1,
          beatmapsetId: 1,
          version: "Normal",
          mode: "osu",
          difficultyRating: 0,
          bpm: 0,
          totalLength: 0,
          cs: 3,
          ar: 7,
          od: 6,
          hp: 5,
          checksum: "a".repeat(32),
        },
      ],
    },
    {
      id: 2,
      title: "another set",
      artist: "Another Artist",
      creator: "another_mapper",
      status: "unknown",
      tags: [],
      submittedAt: "",
      updatedAt: "",
      source: "local",
      folderName: "2 Another Artist - another set",
      beatmaps: [
        {
          id: 2,
          beatmapsetId: 2,
          version: "Hard",
          mode: "osu",
          difficultyRating: 0,
          bpm: 0,
          totalLength: 0,
          cs: 4,
          ar: 8,
          od: 7,
          hp: 5,
          checksum: "b".repeat(32),
        },
      ],
    },
    {
      id: 3,
      title: "PANDORA PALLADIUM",
      artist: "Camellia",
      creator: "preview_mapper",
      status: "unknown",
      tags: ["speedcore"],
      submittedAt: "",
      updatedAt: "",
      source: "local",
      folderName: "3 Camellia - PANDORA PALLADIUM",
      beatmaps: [
        {
          id: 3,
          beatmapsetId: 3,
          version: "Wildberry Everything",
          mode: "osu",
          difficultyRating: 0,
          bpm: 0,
          totalLength: 0,
          cs: 4,
          ar: 9.8,
          od: 9,
          hp: 6,
          checksum: "c".repeat(32),
        },
      ],
    },
  ];

  const mock: DirectifyIpcApi = {
    getSettings: async () => settings,
    saveSettings: async (next) => {
      settings = next;
    },
    detectOsuInstall: async () => "C:\\Users\\preview\\AppData\\Local\\osu!",
    pickOsuInstallDir: async () => "C:\\Users\\preview\\AppData\\Local\\osu!",

    listInstalledBeatmapFolders: async () => installedSets.map((s) => s.folderName!),
    scanLibrary: async () => installedSets,
    deleteBeatmapSet: async (folderName) => {
      installedSets = installedSets.filter((s) => s.folderName !== folderName);
    },

    pickBackupDestination: async () => "C:\\Users\\preview\\Desktop\\directify-backup.zip",
    backupLibrary: async (_dest, folderNames) => ({
      createdAt: new Date().toISOString(),
      osuInstallDir: "C:\\Users\\preview\\AppData\\Local\\osu!",
      beatmapFolders: folderNames ?? ["1 Sample Artist - sample beatmapset"],
    }),
    pickBackupToRestore: async () => "C:\\Users\\preview\\Desktop\\directify-backup.zip",
    restoreBackup: async () => {},

    searchBeatmaps: async (query) => ({
      results: [
        {
          id: 2234472,
          title: "White Peak",
          artist: "xi",
          creator: "Shurelia",
          status: "ranked" as const,
          coverUrl: "https://assets.ppy.sh/beatmaps/2234472/covers/cover.jpg",
          tags: ["instrumental", "electronic"],
          submittedAt: "2026-09-10T19:05:42Z",
          updatedAt: "2026-09-10T19:05:42Z",
          source: "catboy.best",
          beatmaps: [],
        },
        {
          id: 30872,
          title: "scarlet heaven of Delays",
          artist: "camellia",
          creator: "Shino",
          status: "graveyard" as const,
          coverUrl: "https://assets.ppy.sh/beatmaps/30872/covers/cover.jpg",
          tags: ["touhou", "dubstep"],
          submittedAt: "2012-09-07T22:44:00Z",
          updatedAt: "2012-09-07T22:44:00Z",
          source: "catboy.best",
          beatmaps: [],
        },
      ].filter((set) =>
        query.query ? `${set.title} ${set.artist}`.toLowerCase().includes(query.query.toLowerCase()) : true
      ),
      page: 1,
      pageSize: 30,
      total: 2,
    }),
    installBeatmapSet: async () => {},

    readCollections: async () => collections,
    writeCollections: async (db) => {
      collections = db;
    },

    checkForUpdate: async () => ({ hasUpdate: false, currentVersion: "0.1.0" }),
    openExternal: async (url) => {
      window.open(url, "_blank");
    },

    setTitleBarOverlay: async () => {},
  };

  window.directify = mock;
}
