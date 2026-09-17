// Keyboard-shortcuts cheat sheet, opened with "?".
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();

  const rows: [string, string][] = [
    ["Alt+1 … Alt+5", t("shortcuts.jumpToTab")],
    ["/", t("shortcuts.focusSearch")],
    ["Enter", t("shortcuts.activateSelection")],
    ["Esc", t("shortcuts.closeOrDeselect")],
    ["?", t("shortcuts.toggleHelp")],
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("shortcuts.title")}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--df-surface-1)",
          border: "1px solid var(--df-border)",
          borderRadius: "var(--df-radius-lg)",
          boxShadow: "var(--df-shadow-lg)",
          padding: 28,
          width: 360,
        }}
      >
        <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>{t("shortcuts.title")}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map(([keys, desc]) => (
            <div
              key={keys}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <span style={{ fontSize: 13, color: "var(--df-text-muted)" }}>{desc}</span>
              <kbd
                style={{
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: "var(--df-radius-sm)",
                  background: "var(--df-surface-2)",
                  border: "1px solid var(--df-border)",
                }}
              >
                {keys}
              </kbd>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
