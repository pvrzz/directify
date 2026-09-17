// Shared app settings loaded once and kept in sync across every page/component that reads or writes them.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppSettings } from "../../ipc-types";

interface SettingsContextValue {
  settings: AppSettings | null;
  update: (patch: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    window.directify.getSettings().then(setSettings);
  }, []);

  async function update(patch: Partial<AppSettings>) {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      window.directify.saveSettings(next);
      return next;
    });
  }

  return (
    <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
