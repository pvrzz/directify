// Library page: shows installed beatmapsets (auto-scanned from Songs by LibraryProvider), lets the user filter, select, add to a collection, or delete.
import type { BeatmapSet, CollectionDatabase } from "@directify/shared";
import { Button, Card, Icon, TextInput } from "@directify/ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLibrary } from "../library-context";

export function LibraryPage() {
  const { t } = useTranslation();
  const { sets, refresh } = useLibrary();
  const [collections, setCollections] = useState<CollectionDatabase | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collectionName, setCollectionName] = useState("");
  const [status, setStatus] = useState("");

  async function rescan() {
    setStatus(t("library.scanning"));
    try {
      const [, db] = await Promise.all([refresh(), window.directify.readCollections()]);
      setCollections(db);
      setSelected(new Set());
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  useEffect(() => {
    window.directify.readCollections().then(setCollections);
  }, []);

  useEffect(() => {
    if (sets) setStatus(t("library.foundCount", { count: sets.length }));
  }, [sets, t]);

  const filtered = useMemo(() => {
    if (!sets) return [];
    const q = query.trim().toLowerCase();
    if (!q) return sets;
    return sets.filter((s) =>
      `${s.title} ${s.artist} ${s.creator} ${s.tags.join(" ")}`.toLowerCase().includes(q)
    );
  }, [sets, query]);

  function toggle(folderName: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(folderName)) next.delete(folderName);
      else next.add(folderName);
      return next;
    });
  }

  function selectedSets(): BeatmapSet[] {
    return (sets ?? []).filter((s) => s.folderName && selected.has(s.folderName));
  }

  async function addSelectedToCollection() {
    if (!collections || !collectionName.trim() || selected.size === 0) return;
    const name = collectionName.trim();
    const checksums = selectedSets().flatMap((s) => s.beatmaps.map((b) => b.checksum));

    const existing = collections.collections.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    const nextCollections = existing
      ? collections.collections.map((c) =>
          c === existing
            ? { ...c, beatmapChecksums: Array.from(new Set([...c.beatmapChecksums, ...checksums])) }
            : c
        )
      : [...collections.collections, { name, beatmapChecksums: checksums }];

    const next = { ...collections, collections: nextCollections };
    setCollections(next);
    await window.directify.writeCollections(next);
    setCollectionName("");
    setSelected(new Set());
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      `Permanently delete ${selected.size} beatmapset(s) from your Songs folder? This cannot be undone.`
    );
    if (!confirmed) return;

    for (const folderName of selected) {
      await window.directify.deleteBeatmapSet(folderName);
    }
    await rescan();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>{t("library.title")}</h2>
        <Button variant="secondary" onClick={rescan}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name="refresh-cw" size={14} />
            {t("common.rescan")}
          </span>
        </Button>
      </div>

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
          <Icon name="search" size={16} />
        </div>
        <TextInput
          id="primary-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("library.filterPlaceholder")}
          aria-label={t("library.filterPlaceholder")}
          style={{ width: "100%", paddingLeft: 38 }}
        />
      </div>

      {status && (
        <p role="status" style={{ color: "var(--df-text-muted)", fontSize: 13 }}>
          {status}
        </p>
      )}

      {selected.size > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: 12,
            borderRadius: "var(--df-radius-sm)",
            background: "var(--df-glass-bg)",
            backdropFilter: "var(--df-glass-blur)",
            border: "1px solid var(--df-border)",
            boxShadow: "var(--df-shadow-md)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, color: "var(--df-text-muted)" }}>
            {t("library.selectedCount", { count: selected.size })}
          </span>
          <TextInput
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            placeholder={t("library.collectionNamePlaceholder")}
            aria-label={t("library.collectionNamePlaceholder")}
            list="collection-names"
            style={{ flex: 1, minWidth: 160 }}
          />
          <datalist id="collection-names">
            {collections?.collections.map((c) => <option key={c.name} value={c.name} />)}
          </datalist>
          <Button variant="secondary" onClick={addSelectedToCollection}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="star" size={14} />
              {t("library.addToCollection")}
            </span>
          </Button>
          <Button variant="ghost" onClick={deleteSelected} style={{ color: "var(--df-pink)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="trash-2" tone="pink" size={14} />
              {t("common.delete")}
            </span>
          </Button>
        </div>
      )}

      {sets === null ? (
        <p style={{ color: "var(--df-text-muted)" }}>{t("common.loading")}</p>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--df-text-muted)",
            border: "1px dashed var(--df-border)",
            borderRadius: "var(--df-radius-lg)",
          }}
        >
          {sets.length === 0 ? t("library.emptyNoMaps") : t("library.emptyNoMatch")}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((set) => {
            const isSelected = !!set.folderName && selected.has(set.folderName);
            return (
              <Card
                key={set.folderName ?? set.id}
                selected={isSelected}
                label={`${set.title} — ${set.artist}`}
                coverUrl={set.coverUrl}
                onClick={() => set.folderName && toggle(set.folderName)}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: isSelected ? "var(--df-pink)" : "var(--df-text)",
                  }}
                >
                  {set.title}
                </div>
                <div style={{ fontSize: 13, color: "var(--df-text-muted)", marginBottom: 6 }}>
                  {set.artist} · {set.creator}
                </div>
                <div style={{ fontSize: 12, color: "var(--df-text-muted)" }}>
                  {t("library.difficulty", { count: set.beatmaps.length })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
