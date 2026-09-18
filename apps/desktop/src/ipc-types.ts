// Typed contract between the main process (implementation) and the preload
// bridge/renderer (consumers) — see src/main/index.ts for handlers and
// src/preload/index.ts for the exposed window.directify implementation.
import type { BackupManifest } from "./main/library.js";
import type { UpdateCheckResult } from "./main/updates.js";
import type {
  BeatmapSearchQuery,
  BeatmapSearchResult,
  BeatmapSet,
  BeatmapSourceConfig,
  CollectionDatabase,
  ProxyConfig,
  ThemeMode,
} from "@directify/shared";

export interface AppSettings {
  osuInstallDir: string | null;
  theme: ThemeMode;
  reduceMotion: boolean;
  language: string;
  proxy: ProxyConfig;
  /** Ordered fallback chain: tried top to bottom, skipping disabled entries. */
  searchSources: BeatmapSourceConfig[];
}

export interface DirectifyIpcApi {
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  detectOsuInstall(): Promise<string | null>;
  pickOsuInstallDir(): Promise<string | null>;

  listInstalledBeatmapFolders(): Promise<string[]>;
  scanLibrary(): Promise<BeatmapSet[]>;
  deleteBeatmapSet(folderName: string): Promise<void>;

  pickBackupDestination(): Promise<string | null>;
  backupLibrary(destZipPath: string, folderNames?: string[]): Promise<BackupManifest>;
  pickBackupToRestore(): Promise<string | null>;
  restoreBackup(zipPath: string): Promise<void>;

  searchBeatmaps(query: BeatmapSearchQuery): Promise<BeatmapSearchResult>;
  getBeatmapSetById(beatmapSetId: number): Promise<BeatmapSet | null>;
  installBeatmapSet(set: BeatmapSet): Promise<void>;

  readCollections(): Promise<CollectionDatabase>;
  writeCollections(db: CollectionDatabase): Promise<void>;

  checkForUpdate(): Promise<UpdateCheckResult>;
  openExternal(url: string): Promise<void>;

  minimizeWindow(): Promise<void>;
  toggleMaximizeWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  isWindowMaximized(): Promise<boolean>;
  onWindowMaximizedChange(callback: (maximized: boolean) => void): () => void;
}
