import { contextBridge, ipcRenderer } from "electron";
import type { DirectifyIpcApi } from "../ipc-types.js";

const api: DirectifyIpcApi = {
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings) => ipcRenderer.invoke("settings:save", settings),

  detectOsuInstall: () => ipcRenderer.invoke("osu:detectInstall"),
  pickOsuInstallDir: () => ipcRenderer.invoke("osu:pickInstallDir"),

  listInstalledBeatmapFolders: () => ipcRenderer.invoke("library:listFolders"),
  scanLibrary: () => ipcRenderer.invoke("library:scan"),
  deleteBeatmapSet: (folderName) => ipcRenderer.invoke("library:delete", folderName),

  pickBackupDestination: () => ipcRenderer.invoke("backup:pickDestination"),
  backupLibrary: (destZipPath, folderNames) =>
    ipcRenderer.invoke("backup:create", destZipPath, folderNames),
  pickBackupToRestore: () => ipcRenderer.invoke("backup:pickToRestore"),
  restoreBackup: (zipPath) => ipcRenderer.invoke("backup:restore", zipPath),

  searchBeatmaps: (query) => ipcRenderer.invoke("beatmaps:search", query),
  installBeatmapSet: (set) => ipcRenderer.invoke("beatmaps:install", set),

  readCollections: () => ipcRenderer.invoke("collections:read"),
  writeCollections: (db) => ipcRenderer.invoke("collections:write", db),

  checkForUpdate: () => ipcRenderer.invoke("app:checkForUpdate"),
  openExternal: (url) => ipcRenderer.invoke("app:openExternal", url),

  setTitleBarOverlay: (colors) => ipcRenderer.invoke("window:setTitleBarOverlay", colors),
};

contextBridge.exposeInMainWorld("directify", api);
