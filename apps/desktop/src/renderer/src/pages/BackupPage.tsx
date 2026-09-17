// Backup page: zips the whole Songs folder (or a selected subset) into a portable archive, and restores one back.
import { Button, Card, Icon } from "@directify/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function BackupPage() {
  const { t } = useTranslation();
  const [folders, setFolders] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");

  useEffect(() => {
    window.directify.listInstalledBeatmapFolders().then(setFolders);
  }, []);

  function toggle(folder: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  }

  async function runBackup() {
    const dest = await window.directify.pickBackupDestination();
    if (!dest) return;
    setStatus(t("common.loading"));
    const folderNames = selected.size > 0 ? Array.from(selected) : undefined;
    const manifest = await window.directify.backupLibrary(dest, folderNames);
    setStatus(`${manifest.beatmapFolders.length} → ${dest}`);
  }

  async function runRestore() {
    const zip = await window.directify.pickBackupToRestore();
    if (!zip) return;
    setStatus(t("common.loading"));
    await window.directify.restoreBackup(zip);
    window.directify.listInstalledBeatmapFolders().then(setFolders);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{t("backup.title")}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={runRestore}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="folder-open" size={14} />
              {t("backup.restoreFromZip")}
            </span>
          </Button>
          <Button onClick={runBackup}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="archive" tone="dark" size={14} />
              {selected.size > 0
                ? t("backup.backupSelected", { count: selected.size })
                : t("backup.backupEverything")}
            </span>
          </Button>
        </div>
      </div>

      {status && (
        <p role="status" style={{ color: "var(--df-text-muted)", fontSize: 13 }}>
          {status}
        </p>
      )}

      <p style={{ color: "var(--df-text-muted)", fontSize: 13 }}>
        {t("backup.description", { count: folders.length })}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {folders.map((folder) => (
          <Card
            key={folder}
            selected={selected.has(folder)}
            label={folder}
            onClick={() => toggle(folder)}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: selected.has(folder) ? 700 : 500,
                color: selected.has(folder) ? "var(--df-pink)" : "var(--df-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {folder}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
