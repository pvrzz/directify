// osu!stable install-folder detection: checks the default per-user install
// path first, then falls back to the Windows uninstall registry for a
// portable/custom location.
import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function detectOsuInstallDir(): Promise<string | null> {
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    const defaultPath = join(localAppData, "osu!");
    if (existsSync(join(defaultPath, "osu!.exe"))) {
      return defaultPath;
    }
  }

  return findViaUninstallRegistry();
}

async function findViaUninstallRegistry(): Promise<string | null> {
  if (process.platform !== "win32") return null;

  const uninstallRoot = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall";
  try {
    const { stdout } = await execAsync(`reg query "${uninstallRoot}" /s /f "osu!" /d`, {
      windowsHide: true,
    });

    const installLocationMatch = stdout.match(/InstallLocation\s+REG_SZ\s+(.+)/i);
    if (installLocationMatch) {
      const path = installLocationMatch[1].trim();
      if (existsSync(join(path, "osu!.exe"))) return path;
    }
  } catch {
    /* empty */
  }

  return null;
}

export function isValidOsuInstallDir(dir: string): boolean {
  return existsSync(join(dir, "osu!.exe")) && existsSync(join(dir, "Songs"));
}

export function songsDir(installDir: string): string {
  return join(installDir, "Songs");
}

export function collectionDbPath(installDir: string): string {
  return join(installDir, "collection.db");
}
