// Shared installed-library state: scanned once on mount, then re-scanned
// automatically on an interval so newly-installed maps (from Find maps)
// show up in the Library without a manual rescan, and so Find maps can
// mark results that are already downloaded.
import type { BeatmapSet } from "@directify/shared";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const AUTO_SCAN_INTERVAL_MS = 5000;

interface LibraryContextValue {
  sets: BeatmapSet[] | null;
  installedIds: Set<number>;
  refresh: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [sets, setSets] = useState<BeatmapSet[] | null>(null);

  const refresh = useCallback(async () => {
    const scanned = await window.directify.scanLibrary();
    setSets(scanned);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, AUTO_SCAN_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const installedIds = useMemo(() => new Set((sets ?? []).map((s) => s.id)), [sets]);

  return (
    <LibraryContext.Provider value={{ sets, installedIds, refresh }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
