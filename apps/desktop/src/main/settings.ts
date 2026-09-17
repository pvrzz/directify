// Reads/writes the persisted AppSettings JSON file in Electron's userData dir.
import { app } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AppSettings } from "../ipc-types.js";

export type { AppSettings };

const DEFAULT_SETTINGS: AppSettings = {
  osuInstallDir: null,
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

function settingsPath(): string {
  return join(app.getPath("userData"), "settings.json");
}

export function loadSettings(): AppSettings {
  const path = settingsPath();
  if (!existsSync(path)) return structuredClone(DEFAULT_SETTINGS);
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    return { ...structuredClone(DEFAULT_SETTINGS), ...raw };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings: AppSettings): void {
  const path = settingsPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(settings, null, 2), "utf8");
}
