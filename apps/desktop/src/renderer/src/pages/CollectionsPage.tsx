// Collections page: reads/writes osu!stable's collection.db directly.
import type { CollectionDatabase } from "@directify/shared";
import { Button, Icon, TextInput } from "@directify/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function CollectionsPage() {
  const { t } = useTranslation();
  const [db, setDb] = useState<CollectionDatabase | null>(null);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    window.directify.readCollections().then(setDb);
  }, []);

  async function persist(next: CollectionDatabase) {
    setDb(next);
    await window.directify.writeCollections(next);
  }

  function addCollection() {
    if (!db || !newName.trim()) return;
    persist({ ...db, collections: [...db.collections, { name: newName.trim(), beatmapChecksums: [] }] });
    setNewName("");
  }

  function removeCollection(name: string) {
    if (!db) return;
    persist({ ...db, collections: db.collections.filter((c) => c.name !== name) });
  }

  if (!db) return null;

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ margin: 0 }}>{t("collections.title")}</h2>
      <p style={{ color: "var(--df-text-muted)", fontSize: 13, margin: 0 }}>
        {t("collections.description")}
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <TextInput
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCollection()}
          placeholder={t("collections.newNamePlaceholder")}
          aria-label={t("collections.newNamePlaceholder")}
          style={{ flex: 1 }}
        />
        <Button onClick={addCollection}>{t("common.add")}</Button>
      </div>

      {db.collections.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--df-text-muted)",
            border: "1px dashed var(--df-border)",
            borderRadius: "var(--df-radius-lg)",
          }}
        >
          {t("collections.emptyState")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {db.collections.map((collection) => (
            <div
              key={collection.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderRadius: "var(--df-radius-sm)",
                background: "var(--df-surface-1)",
                border: "1px solid var(--df-border)",
                boxShadow: "var(--df-shadow-sm)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="star" tone="pink" size={16} />
                {collection.name}{" "}
                <span style={{ color: "var(--df-text-muted)", fontSize: 12 }}>
                  ({t("collections.maps", { count: collection.beatmapChecksums.length })})
                </span>
              </span>
              <Button
                variant="ghost"
                onClick={() => removeCollection(collection.name)}
                aria-label={`${t("common.remove")} ${collection.name}`}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="trash-2" size={14} />
                  {t("common.remove")}
                </span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
