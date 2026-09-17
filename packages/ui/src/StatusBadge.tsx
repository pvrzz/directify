import type { RankedStatus } from "@directify/shared";

// Mirrors osu!'s own status colors (extracted live from osu.ppy.sh — see
// /.tastemaker/style-lock.md) rather than inventing a new status palette.
const STATUS_COLOR: Record<RankedStatus, string> = {
  ranked: "var(--df-lime)",
  approved: "var(--df-lime)",
  qualified: "var(--df-blue)",
  pending: "var(--df-blue)",
  loved: "var(--df-pink)",
  wip: "var(--df-text-muted)",
  graveyard: "var(--df-text-muted)",
  unknown: "var(--df-text-muted)",
};

export function StatusBadge({ status }: { status: RankedStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
        textTransform: "uppercase",
        color: "var(--df-on-fill)",
        background: color,
      }}
    >
      {status}
    </span>
  );
}
