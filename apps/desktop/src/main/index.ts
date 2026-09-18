// Electron main process entry point: window creation, IPC handler
// registration, and startup tasks (osu! install auto-detect, proxy config).
import {
  readCollectionDb,
  writeCollectionDb,
  type BeatmapSearchQuery,
  type BeatmapSet,
  type CollectionDatabase,
} from "@directify/shared";
import { app, BrowserWindow, dialog, ipcMain, shell, Menu } from "electron";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  backupLibrary,
  deleteBeatmapSet,
  installBeatmapSet,
  listInstalledBeatmapFolders,
  restoreBackup,
  scanInstalledBeatmapSets,
} from "./library.js";
import { applyProxySettings } from "./network.js";
import { collectionDbPath, detectOsuInstallDir, isValidOsuInstallDir } from "./osu-install.js";
import { loadSettings, saveSettings, type AppSettings } from "./settings.js";
import { resolveDownloadUrlForResult, searchWithFallback } from "./source-registry.js";
import { checkForUpdate } from "./updates.js";

const ALLOWED_EXTERNAL_HOSTS = ["github.com", "www.github.com"];

let mainWindow: BrowserWindow | null = null;

function requireInstallDir(): string {
  const { osuInstallDir } = loadSettings();
  if (!osuInstallDir) throw new Error("osu! install directory is not configured yet.");
  return osuInstallDir;
}

function registerIpcHandlers(): void {
  ipcMain.handle("settings:get", () => loadSettings());
  ipcMain.handle("settings:save", async (_e, settings: AppSettings) => {
    saveSettings(settings);
    await applyProxySettings(settings.proxy);
  });

  ipcMain.handle("osu:detectInstall", () => detectOsuInstallDir());
  ipcMain.handle("osu:pickInstallDir", async () => {
    const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (result.canceled || result.filePaths.length === 0) return null;
    const dir = result.filePaths[0];
    return isValidOsuInstallDir(dir) ? dir : null;
  });

  ipcMain.handle("library:listFolders", () => listInstalledBeatmapFolders(requireInstallDir()));
  ipcMain.handle("library:scan", () => scanInstalledBeatmapSets(requireInstallDir()));
  ipcMain.handle("library:delete", (_e, folderName: string) =>
    deleteBeatmapSet(requireInstallDir(), folderName)
  );

  ipcMain.handle("backup:pickDestination", async () => {
    const result = await dialog.showSaveDialog({
      defaultPath: `directify-backup-${Date.now()}.zip`,
      filters: [{ name: "Directify backup", extensions: ["zip"] }],
    });
    return result.canceled ? null : (result.filePath ?? null);
  });
  ipcMain.handle(
    "backup:create",
    (_e, destZipPath: string, folderNames?: string[]) =>
      backupLibrary(requireInstallDir(), destZipPath, folderNames)
  );
  ipcMain.handle("backup:pickToRestore", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Directify backup", extensions: ["zip"] }],
    });
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
  });
  ipcMain.handle("backup:restore", (_e, zipPath: string) =>
    restoreBackup(zipPath, requireInstallDir())
  );

  ipcMain.handle("beatmaps:search", (_e, query: BeatmapSearchQuery) =>
    searchWithFallback(loadSettings().searchSources, query)
  );
  ipcMain.handle("beatmaps:install", async (_e, set: BeatmapSet) => {
    const downloadUrl = await resolveDownloadUrlForResult(
      loadSettings().searchSources,
      set.source,
      set.id
    );
    if (!downloadUrl) {
      throw new Error(`No download available for "${set.artist} - ${set.title}" yet.`);
    }
    await installBeatmapSet(
      requireInstallDir(),
      downloadUrl,
      `${set.id} ${set.artist} - ${set.title}`,
      set.coverUrl
    );
  });

  ipcMain.handle("collections:read", async () => {
    const path = collectionDbPath(requireInstallDir());
    if (!existsSync(path)) {
      return { version: 20240101, collections: [] } satisfies CollectionDatabase;
    }
    return readCollectionDb(await readFile(path));
  });
  ipcMain.handle("collections:write", async (_e, db: CollectionDatabase) => {
    const path = collectionDbPath(requireInstallDir());
    await writeFile(path, writeCollectionDb(db));
  });

  ipcMain.handle("window:setTitleBarOverlay", (_e, colors: { color: string; symbolColor: string }) => {
    mainWindow?.setTitleBarOverlay({ ...colors, height: 40 });
  });

  ipcMain.handle("app:checkForUpdate", () => checkForUpdate(app.getVersion()));
  ipcMain.handle("app:openExternal", (_e, url: string) => {
    const host = new URL(url).hostname;
    if (!ALLOWED_EXTERNAL_HOSTS.includes(host)) {
      throw new Error(`Refusing to open untrusted external URL host: ${host}`);
    }
    return shell.openExternal(url);
  });
}

function resolveIconPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, "icon.png")
    : join(__dirname, "../../resources/icon.png");
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#171a1c",
    icon: resolveIconPath(),
    // Hides the default titlebar/menu chrome but keeps real, natively-drawn
    // minimize/maximize/close buttons (Windows' Window Controls Overlay) —
    // the renderer supplies its own draggable title strip and re-colors the
    // overlay to match the active theme via window:setTitleBarOverlay.
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#171a1c",
      symbolColor: "#f4f2f7",
      height: 40,
    },
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = win;
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

Menu.setApplicationMenu(null);

app.whenReady().then(async () => {
  const settings = loadSettings();
  await applyProxySettings(settings.proxy);

  if (!settings.osuInstallDir) {
    const detected = await detectOsuInstallDir();
    if (detected) saveSettings({ ...settings, osuInstallDir: detected });
  }

  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
