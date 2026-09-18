// Settings page: distinct, centered-header sections for the osu! folder, appearance, network, and beatmap search source management.
import type { BeatmapSourceConfig } from "@directify/shared";
import { Button, Icon, TextInput } from "@directify/ui";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../i18n";
import { useSettings } from "../settings-context";

function selectStyle(): React.CSSProperties {
  return {
    padding: "8px 10px",
    borderRadius: "var(--df-radius-sm)",
    border: "1px solid var(--df-border)",
    background: "var(--df-surface-2)",
    color: "var(--df-text)",
    fontSize: 14,
    fontFamily: "inherit",
  };
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--df-surface-1)",
        border: "1px solid var(--df-border)",
        borderRadius: "var(--df-radius-lg)",
        boxShadow: "var(--df-shadow-sm)",
        padding: "28px 32px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>{title}</h3>
        {description && (
          <p
            style={{
              margin: "0 auto",
              maxWidth: 460,
              fontSize: 13,
              color: "var(--df-text-muted)",
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const { settings, update } = useSettings();
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");

  async function detect() {
    setStatus(t("common.loading"));
    const dir = await window.directify.detectOsuInstall();
    if (dir) {
      await update({ osuInstallDir: dir });
      setStatus(`${dir}`);
    } else {
      setStatus(t("settings.notConfigured"));
    }
  }

  async function pick() {
    const dir = await window.directify.pickOsuInstallDir();
    if (dir) await update({ osuInstallDir: dir });
  }

  function addSource() {
    if (!settings || !newSourceName.trim() || !newSourceUrl.trim()) return;
    const source: BeatmapSourceConfig = {
      id: crypto.randomUUID(),
      name: newSourceName.trim(),
      baseUrl: newSourceUrl.trim().replace(/\/$/, ""),
      enabled: true,
    };
    update({ searchSources: [...settings.searchSources, source] });
    setNewSourceName("");
    setNewSourceUrl("");
  }

  function removeSource(id: string) {
    if (!settings) return;
    update({ searchSources: settings.searchSources.filter((s) => s.id !== id) });
  }

  function toggleSource(id: string, enabled: boolean) {
    if (!settings) return;
    update({
      searchSources: settings.searchSources.map((s) => (s.id === id ? { ...s, enabled } : s)),
    });
  }

  function moveSource(index: number, direction: -1 | 1) {
    if (!settings) return;
    const next = [...settings.searchSources];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ searchSources: next });
  }

  if (!settings) return null;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ textAlign: "center", margin: "0 0 4px" }}>{t("settings.title")}</h2>

      <SettingsSection title={t("settings.osuFolder")}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 12,
            borderRadius: "var(--df-radius-sm)",
            background: "var(--df-surface-2)",
            border: "1px solid var(--df-border)",
            fontSize: 13,
            marginBottom: 12,
            wordBreak: "break-all",
          }}
        >
          <Icon name="folder-open" size={16} />
          {settings.osuInstallDir ?? t("settings.notConfigured")}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Button variant="secondary" onClick={detect}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="refresh-cw" size={14} />
              {t("settings.autoDetect")}
            </span>
          </Button>
          <Button variant="ghost" onClick={pick}>
            {t("settings.chooseFolder")}
          </Button>
        </div>
        {status && (
          <p style={{ color: "var(--df-text-muted)", fontSize: 13, textAlign: "center" }}>{status}</p>
        )}
      </SettingsSection>

      <SettingsSection title={t("settings.appearance")} description={t("settings.appearanceDesc")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14 }}>{t("settings.theme")}</span>
            <select
              value={settings.theme}
              onChange={(e) => update({ theme: e.target.value as typeof settings.theme })}
              style={selectStyle()}
            >
              <option value="dark">{t("settings.themeDark")}</option>
              <option value="light">{t("settings.themeLight")}</option>
              <option value="system">{t("settings.themeSystem")}</option>
            </select>
          </label>

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14 }}>
              {t("settings.reduceMotion")}
              <div style={{ fontSize: 12, color: "var(--df-text-muted)" }}>
                {t("settings.reduceMotionHint")}
              </div>
            </span>
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(e) => update({ reduceMotion: e.target.checked })}
              aria-label={t("settings.reduceMotion")}
              style={{ width: 18, height: 18 }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14 }}>{t("settings.language")}</span>
            <select
              value={settings.language}
              onChange={(e) => update({ language: e.target.value })}
              style={selectStyle()}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </SettingsSection>

      <SettingsSection title={t("settings.network")} description={t("settings.networkDesc")}>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, width: 140 }}>
            <span style={{ fontSize: 14 }}>{t("settings.proxyType")}</span>
            <select
              value={settings.proxy.type}
              onChange={(e) =>
                update({ proxy: { ...settings.proxy, type: e.target.value as typeof settings.proxy.type } })
              }
              style={selectStyle()}
            >
              <option value="none">{t("settings.proxyTypeNone")}</option>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks4">SOCKS4</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </label>
          {settings.proxy.type !== "none" && (
            <>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                <span style={{ fontSize: 14 }}>{t("settings.proxyHost")}</span>
                <TextInput
                  value={settings.proxy.host}
                  onChange={(e) => update({ proxy: { ...settings.proxy, host: e.target.value } })}
                  placeholder="127.0.0.1"
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, width: 100 }}>
                <span style={{ fontSize: 14 }}>{t("settings.proxyPort")}</span>
                <TextInput
                  value={settings.proxy.port}
                  onChange={(e) => update({ proxy: { ...settings.proxy, port: e.target.value } })}
                  placeholder="8080"
                />
              </label>
            </>
          )}
        </div>
      </SettingsSection>

      <SettingsSection title={t("settings.sources")} description={t("settings.sourcesHint")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {settings.searchSources.map((source, index) => (
            <div
              key={source.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: "var(--df-radius-sm)",
                background: "var(--df-surface-2)",
                border: `1px solid ${source.enabled ? "var(--df-border)" : "var(--df-surface-3)"}`,
                opacity: source.enabled ? 1 : 0.55,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "var(--df-radius-sm)",
                  overflow: "hidden",
                  border: "1px solid var(--df-border)",
                  flexShrink: 0,
                }}
              >
                <button
                  aria-label={t("settings.moveUp")}
                  disabled={index === 0}
                  onClick={() => moveSource(index, -1)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 18,
                    background: "var(--df-surface-1)",
                    border: "none",
                    borderBottom: "1px solid var(--df-border)",
                    cursor: index === 0 ? "not-allowed" : "pointer",
                    opacity: index === 0 ? 0.35 : 1,
                  }}
                >
                  <Icon name="chevron-up" size={12} />
                </button>
                <button
                  aria-label={t("settings.moveDown")}
                  disabled={index === settings.searchSources.length - 1}
                  onClick={() => moveSource(index, 1)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 18,
                    background: "var(--df-surface-1)",
                    border: "none",
                    cursor: index === settings.searchSources.length - 1 ? "not-allowed" : "pointer",
                    opacity: index === settings.searchSources.length - 1 ? 0.35 : 1,
                  }}
                >
                  <Icon name="chevron-down" size={12} />
                </button>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {source.name}{" "}
                  {source.builtIn && (
                    <span style={{ fontSize: 11, color: "var(--df-text-muted)" }}>
                      ({t("settings.builtIn")})
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--df-text-muted)", wordBreak: "break-all" }}>
                  {source.baseUrl}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <label
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                  title={t("settings.enabled")}
                >
                  {t("settings.enabled")}
                  <input
                    type="checkbox"
                    checked={source.enabled}
                    onChange={(e) => toggleSource(source.id, e.target.checked)}
                    aria-label={`${t("settings.enabled")}: ${source.name}`}
                  />
                </label>
                {!source.builtIn && (
                  <Button
                    variant="ghost"
                    aria-label={`${t("common.remove")} ${source.name}`}
                    onClick={() => removeSource(source.id)}
                    style={{ padding: "6px 8px" }}
                  >
                    <Icon name="trash-2" size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <TextInput
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            placeholder={t("settings.sourceNamePlaceholder")}
            style={{ width: 140 }}
          />
          <TextInput
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
            placeholder={t("settings.sourceUrlPlaceholder")}
            style={{ flex: 1 }}
          />
          <Button variant="secondary" onClick={addSource}>
            {t("settings.addSource")}
          </Button>
        </div>
        <p style={{ fontSize: 11, color: "var(--df-text-muted)", margin: 0, textAlign: "center" }}>
          {t("settings.sourceFormatHint", { baseUrl: newSourceUrl.trim() || t("settings.sourceUrlPlaceholder") })}
        </p>
      </SettingsSection>
    </div>
  );
}
