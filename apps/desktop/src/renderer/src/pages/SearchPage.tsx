// Find-maps page: osu!lazer-style search — free text plus mode, key count, genre, language, and star-rating filters — against the active (fallback-chain) beatmap source.
import { GENRES, LANGUAGES, type BeatmapSet, type OsuMode } from "@directify/shared";
import { Button, Card, DualRangeSlider, Icon, StatusBadge, TextInput } from "@directify/ui";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const MODES: { value: OsuMode | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "osu", label: "Standard" },
  { value: "taiko", label: "Taiko" },
  { value: "fruits", label: "Catch" },
  { value: "mania", label: "Mania" },
];

const MANIA_KEY_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: `1px solid ${active ? "var(--df-pink)" : "var(--df-border)"}`,
    background: active ? "var(--df-pink)" : "var(--df-surface-2)",
    color: active ? "var(--df-on-fill)" : "var(--df-text)",
  };
}

function selectStyle(): React.CSSProperties {
  return {
    padding: "8px 10px",
    borderRadius: "var(--df-radius-sm)",
    border: "1px solid var(--df-border)",
    background: "var(--df-surface-2)",
    color: "var(--df-text)",
    fontSize: 13,
    fontFamily: "inherit",
  };
}

export function SearchPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<OsuMode | "">("");
  const [keys, setKeys] = useState<number | null>(null);
  const [genre, setGenre] = useState<number | "">("");
  const [language, setLanguage] = useState<number | "">("");
  const [starRange, setStarRange] = useState<[number, number]>([0, 10]);

  const [results, setResults] = useState<BeatmapSet[]>([]);
  const [status, setStatus] = useState("");
  const [installing, setInstalling] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  async function search() {
    setStatus(t("common.loading"));
    try {
      const res = await window.directify.searchBeatmaps({
        query,
        mode: mode || undefined,
        keys: mode === "mania" && keys ? keys : undefined,
        genre: genre === "" ? undefined : genre,
        language: language === "" ? undefined : language,
        minStars: starRange[0] > 0 ? starRange[0] : undefined,
        maxStars: starRange[1] < 10 ? starRange[1] : undefined,
        page: 1,
        pageSize: 30,
      });
      setResults(res.results);
      setStatus(t("search.resultCount", { count: res.total }));
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  // Debounced auto-search: every filter change re-searches after a short
  // pause instead of on every keystroke/slider tick, so dragging the star
  // slider or flipping through modes can't hammer the active mirror.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(search, 450);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mode, keys, genre, language, starRange[0], starRange[1]]);

  async function install(set: BeatmapSet) {
    setInstalling(set.id);
    setStatus(`${t("common.installing")} ${set.artist} - ${set.title}`);
    try {
      await window.directify.installBeatmapSet(set);
      setStatus(`${set.artist} - ${set.title}`);
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setInstalling(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
          <Icon name="search" size={16} />
        </div>
        <TextInput
          id="primary-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          style={{ width: "100%", paddingLeft: 38 }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: 16,
          borderRadius: "var(--df-radius-lg)",
          background: "var(--df-surface-1)",
          border: "1px solid var(--df-border)",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MODES.map((m) => (
            <button key={m.value} style={chipStyle(mode === m.value)} onClick={() => setMode(m.value)}>
              {m.label}
            </button>
          ))}
        </div>

        {mode === "mania" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MANIA_KEY_COUNTS.map((k) => (
              <button
                key={k}
                style={chipStyle(keys === k)}
                onClick={() => setKeys(keys === k ? null : k)}
              >
                {k}K
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--df-text-muted)" }}>{t("search.genre")}</span>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value === "" ? "" : Number(e.target.value))}
              style={selectStyle()}
            >
              <option value="">{t("search.any")}</option>
              {Object.entries(GENRES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--df-text-muted)" }}>{t("search.language")}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value === "" ? "" : Number(e.target.value))}
              style={selectStyle()}
            >
              <option value="">{t("search.any")}</option>
              {Object.entries(LANGUAGES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <DualRangeSlider
          label={t("search.starRating")}
          min={0}
          max={10}
          step={0.1}
          valueMin={starRange[0]}
          valueMax={starRange[1]}
          onChange={(lo, hi) => setStarRange([lo, hi])}
        />
      </div>

      {status && (
        <p role="status" style={{ color: "var(--df-text-muted)", fontSize: 13 }}>
          {status}
        </p>
      )}

      {results.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "var(--df-text-muted)",
            border: "1px dashed var(--df-border)",
            borderRadius: "var(--df-radius-lg)",
          }}
        >
          {t("search.emptyPrompt")}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {results.map((set) => (
            <Card key={set.id} coverUrl={set.coverUrl} label={`${set.title} — ${set.artist}`}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{set.title}</div>
                <StatusBadge status={set.status} />
              </div>
              <div style={{ fontSize: 13, color: "var(--df-text-muted)", margin: "4px 0 10px" }}>
                {set.artist} · {set.creator}
              </div>
              <Button
                variant="secondary"
                onClick={() => install(set)}
                disabled={installing === set.id}
                aria-label={`${t("common.install")} ${set.title}`}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="download" size={14} />
                  {installing === set.id ? t("common.installing") : t("common.install")}
                </span>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
