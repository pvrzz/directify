// App shell: sidebar nav + routed pages. Applies the current theme, reduced-motion, and language settings to the document root.
import { Icon } from "@directify/ui";
import { motion, MotionConfig } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import wordmark from "./assets/brand/wordmark.png";
import { BackupPage } from "./pages/BackupPage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { LibraryPage } from "./pages/LibraryPage";
import { SearchPage } from "./pages/SearchPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useSettings } from "./settings-context";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { UpdateBanner } from "./UpdateBanner";
import { WindowControls } from "./WindowControls";
import type { UpdateCheckResult } from "../../main/updates";

const SHORTCUT_ROUTES = ["/", "/search", "/collections", "/backup", "/settings"];

export function App() {
  const { settings } = useSettings();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);

  useEffect(() => {
    window.directify.checkForUpdate().then(setUpdateInfo);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);

      if (e.key === "Escape") {
        setShowShortcuts(false);
        return;
      }
      if (typing) return;

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
      } else if (e.altKey && /^[1-5]$/.test(e.key)) {
        e.preventDefault();
        navigate(SHORTCUT_ROUTES[Number(e.key) - 1]);
      } else if (e.key === "/") {
        e.preventDefault();
        document.getElementById("primary-search-input")?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;

    function applyTheme(resolved: "dark" | "light") {
      root.dataset.theme = resolved;
    }

    if (settings.theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () => applyTheme(media.matches ? "dark" : "light");
      apply();
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
    applyTheme(settings.theme);
  }, [settings?.theme]);

  useEffect(() => {
    if (!settings) return;
    document.documentElement.dataset.reduceMotion = String(settings.reduceMotion);
  }, [settings?.reduceMotion]);

  useEffect(() => {
    if (settings?.language) i18n.changeLanguage(settings.language);
  }, [settings?.language, i18n]);

  const navItems = [
    { to: "/", label: t("nav.library"), icon: "disc-3", end: true },
    { to: "/search", label: t("nav.findMaps"), icon: "search" },
    { to: "/collections", label: t("nav.collections"), icon: "star" },
    { to: "/backup", label: t("nav.backup"), icon: "archive" },
    { to: "/settings", label: t("nav.settings"), icon: "settings" },
  ];

  return (
    <MotionConfig reducedMotion={settings?.reduceMotion ? "always" : "user"}>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <div
          style={
            {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: 32,
              zIndex: 90,
              WebkitAppRegion: "drag",
            } as React.CSSProperties
          }
        />
        <WindowControls />
        {updateInfo?.hasUpdate && updateInfo.latestVersion && updateInfo.releaseUrl && (
          <UpdateBanner
            latestVersion={updateInfo.latestVersion}
            releaseUrl={updateInfo.releaseUrl}
            onDismiss={() => setUpdateInfo(null)}
          />
        )}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <nav
          aria-label="Primary"
          style={{
            width: 220,
            padding: "36px 12px 24px",
            borderRight: "1px solid var(--df-border)",
            background: "var(--df-glass-bg)",
            backdropFilter: "var(--df-glass-blur)",
            boxShadow: "var(--df-shadow-lg)",
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <motion.img
            src={wordmark}
            alt="directify"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              height: 22,
              width: "auto",
              alignSelf: "flex-start",
              objectFit: "contain",
              margin: "0 0 24px",
              padding: "0 12px",
              display: "block",
            }}
          />

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: "var(--df-radius-sm)",
                textDecoration: "none",
                color: isActive ? "var(--df-text)" : "var(--df-text-muted)",
                background: isActive ? "var(--df-surface-2)" : "transparent",
                boxShadow: isActive ? "var(--df-shadow-sm)" : "none",
                borderLeft: `2px solid ${isActive ? "var(--df-pink)" : "transparent"}`,
                fontWeight: 600,
                fontSize: 14,
                transition:
                  "background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} tone={isActive ? "pink" : "muted"} size={16} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => setShowShortcuts(true)}
            style={{
              marginTop: "auto",
              background: "none",
              border: "none",
              color: "var(--df-text-muted)",
              fontSize: 12,
              cursor: "pointer",
              textAlign: "left",
              padding: "9px 12px",
            }}
          >
            {t("shortcuts.title")} <kbd style={{ fontFamily: "inherit" }}>?</kbd>
          </button>
        </nav>

        <main style={{ flex: 1, overflow: "auto", padding: 32 }}>
          {/* Remount-on-key-change enter transition rather than
              AnimatePresence — AnimatePresence's exit-then-enter sequencing
              can permanently stall (confirmed: navigation got stuck showing
              the previous page) when combined with React 18 StrictMode's
              double-invoked effects. A plain remount always completes. */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Routes location={location}>
              <Route path="/" element={<LibraryPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/backup" element={<BackupPage />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </motion.div>
        </main>
      </div>
      </div>
      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
    </MotionConfig>
  );
}
