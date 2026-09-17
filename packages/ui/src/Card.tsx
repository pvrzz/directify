// Beatmapset-style card: soft resting shadow, lifts on hover/selection; the cover is a real <img> (not a CSS background string) so a failed/missing cover degrades to the plain surface color instead of rendering nothing; keyboard-operable when clickable.
import { motion } from "framer-motion";
import { useState, type KeyboardEvent, type ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  onClick?: () => void;
  coverUrl?: string;
  selected?: boolean;
  label?: string;
}

export function Card({ children, onClick, coverUrl, selected, label }: CardProps) {
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = !!coverUrl && !coverFailed;

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <motion.div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? selected : undefined}
      aria-label={label}
      initial={false}
      animate={{
        boxShadow: selected ? "var(--df-glow-pink)" : "var(--df-shadow-sm)",
      }}
      whileHover={onClick ? { y: -3, boxShadow: "var(--df-shadow-md)" } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      style={{
        position: "relative",
        borderRadius: "var(--df-radius-md)",
        overflow: "hidden",
        background: "var(--df-surface-1)",
        border: `1px solid ${selected ? "var(--df-pink)" : "var(--df-border)"}`,
        cursor: onClick ? "pointer" : "default",
        minHeight: 140,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 24,
      }}
    >
      {showCover && (
        <>
          <img
            src={coverUrl}
            alt=""
            aria-hidden
            onError={() => setCoverFailed(true)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(23,26,28,0.15) 0%, rgba(23,26,28,0.95) 85%)",
              zIndex: 0,
            }}
          />
        </>
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}
