// Dismissible banner shown when a newer GitHub release exists than the running build.
import { Button } from "@directify/ui";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function UpdateBanner({
  latestVersion,
  releaseUrl,
  onDismiss,
}: {
  latestVersion: string;
  releaseUrl: string;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        // Below the app's fixed title/window-controls strip (32px), so this
        // banner's own buttons don't collide with it.
        marginTop: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 20px",
        background: "var(--df-blue)",
        color: "var(--df-on-fill)",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span>{t("update.available", { version: latestVersion })}</span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Button
          variant="secondary"
          style={{ padding: "6px 14px", fontSize: 12 }}
          onClick={() => window.directify.openExternal(releaseUrl)}
        >
          {t("update.download")}
        </Button>
        <button
          onClick={onDismiss}
          aria-label={t("update.dismiss")}
          style={{
            background: "none",
            border: "none",
            color: "var(--df-on-fill)",
            fontSize: 16,
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}
